"""
RakshaLink API - Health Route

Provides a lightweight health-check endpoint for uptime monitoring.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check() -> dict:
    """Return a simple health status."""
    return {"status": "healthy"}
