"""
RakshaLink API - Incident Model

Pydantic model representing an incident document in Firestore.
"""

from typing import Any, Optional
from pydantic import BaseModel


class Location(BaseModel):
    """Geographic coordinates for an incident."""

    lat: float
    lng: float


class AIAnalysis(BaseModel):
    """AI-generated analysis of an incident."""

    summary: str
    recommendedResources: list[str]
    confidence: float


class Incident(BaseModel):
    """Core incident data model matching the Firestore document shape."""

    id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = "unknown"
    priority: Optional[str] = "unknown"
    severity: Optional[str] = "medium"
    status: Optional[str] = "pending"
    location: Optional[Location] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    imageUrl: Optional[str] = ""
    aiAnalysis: Optional[AIAnalysis] = None
    duplicateOf: Optional[str] = None
    duplicateConfidence: Optional[float] = None
    duplicateReason: Optional[str] = None
