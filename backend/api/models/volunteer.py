"""
RakshaLink API - Volunteer Model

Pydantic model representing a volunteer document in Firestore.
"""

from typing import Any, Optional, List
from pydantic import BaseModel
from enum import Enum


class Availability(str, Enum):
    AVAILABLE = "Available"
    BUSY = "Busy"
    OFFLINE = "Offline"


class Status(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"


class VolunteerLocation(BaseModel):
    """Geographic coordinates for a volunteer."""
    lat: float
    lng: float


class Volunteer(BaseModel):
    """Core volunteer data model matching the Firestore document shape."""

    id: Optional[str] = None
    fullName: str
    phone: str
    email: str
    location: VolunteerLocation
    skills: List[str]
    availability: Availability = Availability.OFFLINE
    status: Status = Status.ACTIVE
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
