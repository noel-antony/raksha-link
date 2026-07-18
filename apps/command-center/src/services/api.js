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
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
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
};
