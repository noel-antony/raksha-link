const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function updateVolunteerHeartbeat(userId, name, lat, lng, isActive) {
  const response = await fetch(`${API_BASE_URL}/api/volunteer/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      name: name,
      lat: lat,
      lng: lng,
      is_active: isActive
    }),
  });
  if (!response.ok) throw new Error('Failed to update heartbeat');
  return response.json();
}

export async function getActiveVolunteers() {
  const response = await fetch(`${API_BASE_URL}/api/volunteers/active`);
  if (!response.ok) throw new Error('Failed to fetch active volunteers');
  return response.json();
}
