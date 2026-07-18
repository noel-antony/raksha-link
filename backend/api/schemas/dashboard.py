from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DashboardStatistics(BaseModel):
    activeIncidents: int
    activeMissions: int
    availableVolunteers: int
    busyVolunteers: int
    resolvedIncidents: int

class IncidentSummary(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    status: str
    createdAt: str
    missionId: Optional[str] = None
    duplicateOf: Optional[str] = None

class MissionSummary(BaseModel):
    id: str
    title: str
    priority: str
    status: str
    incidentId: str
    assignedVolunteerCount: int
    createdAt: str

class VolunteerSummary(BaseModel):
    total: int
    available: int
    busy: int
    inactive: int
    skillsDistribution: Dict[str, int]

class DashboardResponse(BaseModel):
    statistics: DashboardStatistics
    recentIncidents: List[IncidentSummary]
    recentMissions: List[MissionSummary]
    highPriorityIncidents: List[IncidentSummary]
    volunteerSummary: VolunteerSummary

class ActivityItem(BaseModel):
    type: str # "incident", "mission", or "volunteer"
    id: str
    title: str
    timestamp: str
    status: str

class CollectionCounts(BaseModel):
    incidents: int
    missions: int
    volunteers: int

class HealthResponse(BaseModel):
    status: str
    firestore: bool
    gemini: bool
    collections: CollectionCounts
    timestamp: str
