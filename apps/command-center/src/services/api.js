const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail) {
        errorMessage = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : errorJson.detail[0]?.msg || 'Validation error occurred';
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const api = {
  // Dashboard
  getDashboard: () => fetchAPI('/dashboard'),
  getActivity: () => fetchAPI('/activity'),

  // Incidents
  getIncidents: () => fetchAPI('/incidents'),
  getIncidentById: (id) => fetchAPI(`/incidents/${id}`),
  createIncident: (data) => fetchAPI('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getIncidentMatches: (id) => fetchAPI(`/incidents/${id}/matches`),

  // Volunteers
  getVolunteers: () => fetchAPI('/volunteers'),
  createVolunteer: (data) => fetchAPI('/volunteers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  searchVolunteers: (lat, lon, maxDistance = 50, skills = []) => {
    const params = new URLSearchParams({ lat, lon, max_distance_km: maxDistance });
    if (skills.length > 0) params.append('skills', skills.join(','));
    return fetchAPI(`/volunteers/search?${params.toString()}`);
  },

  // Missions
  getMissions: () => fetchAPI('/missions'),
  createMission: (data) => fetchAPI('/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMissionStatus: (id, status) => fetchAPI(`/missions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Certificates
  uploadCertificate: (volunteerId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_URL}/volunteers/${volunteerId}/certificate`;
    return fetch(url, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `Upload failed: ${res.status}`);
      }
      return res.json();
    });
  },
  reviewCertificate: (volunteerId, action) => fetchAPI(`/volunteers/${volunteerId}/certificate/review`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  }),
};
