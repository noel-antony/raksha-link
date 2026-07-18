import { useEffect, useState } from 'react';
import { getBreakGlassStatus, getMissions, getVolunteers } from '../services/firebaseService';

export default function useFirebase() {
  const [volunteers, setVolunteers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [breakGlassStatus, setBreakGlassStatus] = useState({ breakGlassActive: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [volunteerData, missionData, breakGlassData] = await Promise.all([
          getVolunteers(),
          getMissions(),
          getBreakGlassStatus(),
        ]);

        if (!mounted) {
          return;
        }

        setVolunteers(volunteerData);
        setMissions(missionData);
        setBreakGlassStatus(breakGlassData);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Unable to load SentinelOS data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    volunteers,
    missions,
    breakGlassStatus,
    loading,
    error,
  };
}
