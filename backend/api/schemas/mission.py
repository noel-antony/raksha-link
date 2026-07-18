from typing import List, Optional
from pydantic import BaseModel
from api.models.mission import MissionStatus, AssignmentStatus

class AssignmentSchema(BaseModel):
    volunteerId: str
    name: str
    role: str
    assignedAt: str
    status: AssignmentStatus


class MissionCreate(BaseModel):
    incidentId: str
    title: str
    description: str
    selectedVolunteerIds: List[str]


class MissionUpdate(BaseModel):
    status: Optional[MissionStatus] = None
    notes: Optional[str] = None
    assignedVolunteers: Optional[List[AssignmentSchema]] = None


class MissionResponse(BaseModel):
    id: str
    incidentId: str
    title: str
    description: str
    priority: str
    status: MissionStatus
    assignedVolunteers: List[AssignmentSchema]
    createdBy: str
    createdAt: str
    updatedAt: str
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    notes: Optional[str] = None
