"""
RakshaLink API - Mission Schemas

Request and response schemas for mission-related endpoints.
"""

from typing import Optional
from pydantic import BaseModel


class MissionCreateRequest(BaseModel):
    """Schema for dispatching a new mission."""

    crisis_id: str
    volunteer_id: str
    assigned_task: Optional[str] = None


class MissionStatusUpdateRequest(BaseModel):
    """Schema for updating a mission's status."""

    status: str


class MissionResponse(BaseModel):
    """Schema for returning mission data to the client."""

    id: str
    crisis_id: str
    volunteer_id: str
    status: str
