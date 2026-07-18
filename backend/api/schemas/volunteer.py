"""
RakshaLink API - Volunteer Schemas

Request and response schemas for volunteer-related endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel


class VolunteerCreateRequest(BaseModel):
    """Schema for registering a new volunteer."""

    name: str
    phone: str
    skills: List[str] = []
    assets: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None


class VolunteerResponse(BaseModel):
    """Schema for returning volunteer data to the client."""

    id: str
    name: str
    skills: List[str] = []
    is_active: bool = False
