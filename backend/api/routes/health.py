"""
RakshaLink API - Health Route

Provides a lightweight health-check endpoint for uptime monitoring.
"""

from fastapi import APIRouter, HTTPException
from api.services.dashboard import get_health_status
from api.schemas.dashboard import HealthResponse

router = APIRouter(tags=["System"])

@router.get("/health", response_model=HealthResponse, summary="System health check")
async def health_check() -> HealthResponse:
    """Return the health status of the API, Firestore, and Gemini."""
    try:
        return await get_health_status()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Health check failed") from exc
