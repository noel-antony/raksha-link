"""
RakshaLink API - Volunteer Schemas

Request and response schemas for volunteer-related endpoints.
"""

import re
from typing import Any, Optional, List
from pydantic import BaseModel, Field, field_validator
from api.models.volunteer import Availability, Status

class VolunteerLocationSchema(BaseModel):
    """Geographic coordinates for a volunteer."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class VolunteerCreate(BaseModel):
    """Schema for creating a new volunteer."""
    fullName: str
    phone: str
    email: str
    location: VolunteerLocationSchema
    skills: List[str]
    availability: Optional[Availability] = Availability.OFFLINE

    @field_validator('skills')
    def validate_skills(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Volunteer must have at least one skill.")
        return v
        
    @field_validator('email')
    def validate_email(cls, v):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError("Invalid email format.")
        return v


class VolunteerUpdate(BaseModel):
    """Schema for partially updating an existing volunteer."""
    fullName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[VolunteerLocationSchema] = None
    skills: Optional[List[str]] = None
    availability: Optional[Availability] = None
    status: Optional[Status] = None

    @field_validator('skills')
    def validate_skills(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError("Volunteer must have at least one skill.")
        return v
        
    @field_validator('email')
    def validate_email(cls, v):
        if v is not None and not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError("Invalid email format.")
        return v


class VolunteerResponse(BaseModel):
    """Schema for returning a volunteer to the client."""
    id: str
    fullName: str
    phone: str
    email: str
    location: VolunteerLocationSchema
    skills: List[str]
    availability: Availability
    status: Status
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
