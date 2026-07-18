"""
RakshaLink API - Incident Schemas

Request and response schemas for incident-related endpoints.
"""

from typing import Any, Optional, Dict, List
from pydantic import BaseModel, Field
from datetime import datetime


# ── Nested helpers ───────────────────────────────────────────────────────────

class LocationSchema(BaseModel):
    """Geographic coordinates included in incident payloads."""

    lat: float
    lng: float


class AIAnalysisSchema(BaseModel):
    """AI-generated analysis of an incident."""

    summary: str
    recommendedResources: list[str]
    confidence: float


# ── Request schemas ──────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    """Schema for creating a new incident report."""

    title: str
    description: str
    category: Optional[str] = "unknown"
    priority: Optional[str] = "unknown"
    severity: Optional[str] = "medium"
    location: Optional[LocationSchema] = None
    imageUrl: Optional[str] = ""


class IncidentUpdate(BaseModel):
    """Schema for partially updating an existing incident.

    Every field is optional — only the fields sent by the client will be
    written to Firestore.
    """

    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    location: Optional[LocationSchema] = None
    imageUrl: Optional[str] = None
    duplicateOf: Optional[str] = None
    duplicateConfidence: Optional[float] = None
    duplicateReason: Optional[str] = None


# ── Response schemas ─────────────────────────────────────────────────────────

class IncidentResponse(BaseModel):
    """Schema for returning an incident to the client."""

    id: str
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    status: str
    location: Optional[LocationSchema] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    imageUrl: Optional[str] = None
    aiAnalysis: Optional[AIAnalysisSchema] = None
    duplicateOf: Optional[str] = None
    duplicateConfidence: Optional[float] = None
    duplicateReason: Optional[str] = None


class MatchVolunteerSchema(BaseModel):
    """Schema for a matched volunteer."""
    volunteerId: str
    name: str
    distanceKm: float
    matchingSkills: List[str]
    score: float


class IncidentMatchResponse(BaseModel):
    """Schema for the incident matching endpoint."""
    incidentId: str
    category: str
    priority: str
    recommendedResources: List[str]
    recommendedVolunteers: List[MatchVolunteerSchema]
