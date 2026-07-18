import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { MOCK_VOLUNTEERS } from '../config/mockData';
import { decryptData, deriveEncryptionKey } from './encryptionService';

const FIREBASE_PLACEHOLDER_VALUES = [
  'your_firebase_api_key',
  'your_project.firebaseapp.com',
  'your_project_id',
  'your_project.appspot.com',
  'your_sender_id',
  'your_app_id',
  'https://your_project-default-rtdb.firebaseio.com',
];

export const DEMO_MODE = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  import.meta.env.VITE_FIREBASE_APP_ID,
  import.meta.env.VITE_FIREBASE_DATABASE_URL,
].some((value) => !value || FIREBASE_PLACEHOLDER_VALUES.includes(value));

const storageKeys = {
  volunteers: 'na_volunteers',
  missions: 'na_missions',
  breakglass: 'na_breakglass_state',
  audit: 'na_breakglass_audit',
};

function warnDemoMode() {
  if (DEMO_MODE) {
    console.warn('Running in demo mode — Firebase not configured');
  }
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read localStorage key "${key}":`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write localStorage key "${key}":`, error);
    return false;
  }
}

function ensureDemoVolunteers() {
  const existing = readStorage(storageKeys.volunteers, null);
  if (!existing || existing.length === 0) {
    writeStorage(
      storageKeys.volunteers,
      MOCK_VOLUNTEERS.map((volunteer) => ({
        id: volunteer.id,
        encryptedPayload: null,
        profile: volunteer,
        phone: volunteer.phone,
        breakGlassLocked: volunteer.breakGlassLocked,
        createdAt: volunteer.registeredAt,
      })),
    );
  }
}

function isBreakGlassActiveRecord(record) {
  return Boolean(record?.breakGlassActive);
}

async function hydrateVolunteer(record, breakGlassActive) {
  if (!record) {
    return null;
  }

  if (breakGlassActive && record.encryptedPayload && record.phone) {
    const key = deriveEncryptionKey(record.phone);
    const decrypted = decryptData(record.encryptedPayload, key);
    if (decrypted) {
      return {
        ...record.profile,
        ...decrypted,
        id: record.id,
        phone: decrypted.phone || record.phone,
        breakGlassLocked: false,
      };
    }
  }

  return {
    ...record.profile,
    id: record.id,
    phone: breakGlassActive ? record.phone : null,
    name: breakGlassActive ? record.profile?.name || 'Protected Volunteer' : 'Protected Volunteer',
    breakGlassLocked: !breakGlassActive,
  };
}

async function getBreakGlassState() {
  if (DEMO_MODE) {
    warnDemoMode();
    return readStorage(storageKeys.breakglass, {
      breakGlassActive: false,
      crisisId: null,
      coordinatorId: null,
      activatedAt: null,
    });
  }

  try {
    const snapshot = await getDocs(query(collection(db, 'system_state'), where('type', '==', 'breakglass')));
    const first = snapshot.docs[0];
    return first ? { id: first.id, ...first.data() } : { breakGlassActive: false };
  } catch (error) {
    console.error('Failed to fetch break-glass state:', error);
    return { breakGlassActive: false };
  }
}

export async function saveVolunteer(encryptedData) {
  try {
    if (!encryptedData?.id) {
      throw new Error('Volunteer payload is missing a required id.');
    }

    if (DEMO_MODE) {
      warnDemoMode();
      ensureDemoVolunteers();
      const volunteers = readStorage(storageKeys.volunteers, []);
      const next = [...volunteers.filter((item) => item.id !== encryptedData.id), encryptedData];
      writeStorage(storageKeys.volunteers, next);
      return { id: encryptedData.id, source: 'demo' };
    }

    await setDoc(doc(db, 'volunteers', encryptedData.id), {
      ...encryptedData,
      updatedAt: serverTimestamp(),
    });
    return { id: encryptedData.id, source: 'firebase' };
  } catch (error) {
    console.error('Failed to save volunteer:', error);
    throw new Error('Unable to save volunteer registration. Please try again.');
  }
}

export async function getVolunteers() {
  try {
    const breakGlassState = await getBreakGlassState();
    const breakGlassActive = isBreakGlassActiveRecord(breakGlassState);

    if (DEMO_MODE) {
      warnDemoMode();
      ensureDemoVolunteers();
      const volunteers = readStorage(storageKeys.volunteers, []);
      const hydrated = await Promise.all(volunteers.map((item) => hydrateVolunteer(item, breakGlassActive)));
      return hydrated.filter(Boolean);
    }

    const snapshot = await getDocs(collection(db, 'volunteers'));
    const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    const hydrated = await Promise.all(records.map((item) => hydrateVolunteer(item, breakGlassActive)));
    return hydrated.filter(Boolean);
  } catch (error) {
    console.error('Failed to load volunteers:', error);
    throw new Error('Unable to load volunteers right now. Please refresh and try again.');
  }
}

export async function activateBreakGlass(crisisId, coordinatorId) {
  try {
    const payload = {
      type: 'breakglass',
      breakGlassActive: true,
      crisisId,
      coordinatorId,
      activatedAt: new Date().toISOString(),
    };

    if (DEMO_MODE) {
      warnDemoMode();
      writeStorage(storageKeys.breakglass, payload);
      return payload;
    }

    await setDoc(doc(db, 'system_state', 'breakglass'), payload);
    return payload;
  } catch (error) {
    console.error('Failed to activate break-glass:', error);
    throw new Error('Break-Glass activation failed. Please try again.');
  }
}

export async function logBreakGlassAccess(entry) {
  try {
    const auditEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    if (DEMO_MODE) {
      warnDemoMode();
      const existing = readStorage(storageKeys.audit, []);
      existing.unshift(auditEntry);
      writeStorage(storageKeys.audit, existing);
      return auditEntry;
    }

    await addDoc(collection(db, 'breakglass_audit'), auditEntry);
    return auditEntry;
  } catch (error) {
    console.error('Failed to log break-glass access:', error);
    throw new Error('Audit logging failed. Please retry.');
  }
}

export async function saveMission(missionData) {
  try {
    const mission = {
      ...missionData,
      createdAt: missionData.createdAt || new Date().toISOString(),
      updatedAt: missionData.updatedAt || new Date().toISOString(),
    };

    if (DEMO_MODE) {
      warnDemoMode();
      const missions = readStorage(storageKeys.missions, []);
      const missionId = mission.id || `m_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      const nextMission = { ...mission, id: missionId };
      const next = [...missions.filter((item) => item.id !== missionId), nextMission];
      writeStorage(storageKeys.missions, next);
      window.dispatchEvent(new CustomEvent('na-missions-updated', { detail: { crisisId: mission.crisisId } }));
      return nextMission;
    }

    if (mission.id) {
      await setDoc(doc(db, 'missions', mission.id), mission);
      return mission;
    }

    const ref = await addDoc(collection(db, 'missions'), mission);
    return { ...mission, id: ref.id };
  } catch (error) {
    console.error('Failed to save mission:', error);
    throw new Error('Unable to save mission dispatch. Please try again.');
  }
}

export async function updateMissionStatus(missionId, volunteerId, status) {
  try {
    if (!missionId) {
      throw new Error('Mission id is required.');
    }

    if (DEMO_MODE) {
      warnDemoMode();
      const missions = readStorage(storageKeys.missions, []);
      const updated = missions.map((mission) => {
        if (mission.id !== missionId) {
          return mission;
        }

        const history = Array.isArray(mission.statusHistory) ? mission.statusHistory : [];
        return {
          ...mission,
          volunteerId,
          status,
          updatedAt: new Date().toISOString(),
          statusHistory: [...history, { status, at: new Date().toISOString() }],
        };
      });
      writeStorage(storageKeys.missions, updated);
      const current = updated.find((mission) => mission.id === missionId);
      window.dispatchEvent(new CustomEvent('na-missions-updated', { detail: { crisisId: current?.crisisId } }));
      return current;
    }

    const missionRef = doc(db, 'missions', missionId);
    const existing = await getMissions();
    const current = existing.find((mission) => mission.id === missionId);
    const history = Array.isArray(current?.statusHistory) ? current.statusHistory : [];

    await updateDoc(missionRef, {
      volunteerId,
      status,
      updatedAt: serverTimestamp(),
      statusHistory: [...history, { status, at: new Date().toISOString() }],
    });

    return { missionId, volunteerId, status };
  } catch (error) {
    console.error('Failed to update mission status:', error);
    throw new Error('Unable to update mission status right now.');
  }
}

export async function getMissions(crisisId = null) {
  try {
    if (DEMO_MODE) {
      warnDemoMode();
      const missions = readStorage(storageKeys.missions, []);
      return crisisId ? missions.filter((mission) => mission.crisisId === crisisId) : missions;
    }

    const q = crisisId
      ? query(collection(db, 'missions'), where('crisisId', '==', crisisId))
      : query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('Failed to load missions:', error);
    throw new Error('Unable to load missions at the moment.');
  }
}

export function subscribeToMissions(crisisId, callback) {
  if (DEMO_MODE) {
    warnDemoMode();
    const emit = () => {
      const missions = readStorage(storageKeys.missions, []);
      callback(missions.filter((mission) => mission.crisisId === crisisId));
    };

    emit();
    const handler = (event) => {
      if (!event.detail?.crisisId || event.detail.crisisId === crisisId) {
        emit();
      }
    };
    window.addEventListener('na-missions-updated', handler);
    return () => window.removeEventListener('na-missions-updated', handler);
  }

  const q = query(collection(db, 'missions'), where('crisisId', '==', crisisId));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    (error) => {
      console.error('Mission subscription failed:', error);
      callback([]);
    },
  );
}

export async function getBreakGlassAuditLog() {
  try {
    if (DEMO_MODE) {
      warnDemoMode();
      return readStorage(storageKeys.audit, []);
    }

    const snapshot = await getDocs(query(collection(db, 'breakglass_audit'), orderBy('timestamp', 'desc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('Failed to load audit log:', error);
    throw new Error('Unable to load audit history.');
  }
}

export async function getBreakGlassStatus() {
  return getBreakGlassState();
}

// Authentication & User Management
export async function registerUser(email, password, role = 'volunteer', additionalData = {}) {
  try {
    // If in demo mode, just return a fake user
    if (DEMO_MODE) {
      warnDemoMode();
      return { uid: `demo_${Date.now()}`, email, role, ...additionalData };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email,
      role,
      createdAt: serverTimestamp(),
      ...additionalData,
    });

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    if (DEMO_MODE) {
       warnDemoMode();
       return { uid: 'demo_user', email };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    if (DEMO_MODE) return;
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Emergency Logic
export async function getNearestVolunteers(crisisLocation, maxDistanceKm = 50) {
  try {
    const volunteers = await getVolunteers();
    // In a real app, use Geo queries. For this demo, we do client-side filtering if lat/lng is available
    // Mock simple distance calculation or just return available ones if no strict coords
    
    return volunteers.filter(v => {
      if (!v.lat || !v.lng || !crisisLocation.lat || !crisisLocation.lng) return true; // fallback
      
      const R = 6371; // Radius of the earth in km
      const dLat = (v.lat - crisisLocation.lat) * Math.PI / 180;
      const dLon = (v.lng - crisisLocation.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(crisisLocation.lat * Math.PI / 180) * Math.cos(v.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; // Distance in km
      
      return d <= maxDistanceKm;
    });
  } catch (error) {
    console.error('Failed to get nearest volunteers:', error);
    return [];
  }
}

