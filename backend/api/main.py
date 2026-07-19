"""
RakshaLink API - Main Application Entry Point

FastAPI application factory with CORS, router registration, and root endpoint.
Run with: uvicorn api.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.health import router as health_router
from api.routes.incidents import router as incidents_router
from api.routes.volunteers import router as volunteers_router
from api.routes.missions import router as missions_router
from api.routes.dashboard import router as dashboard_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="RakshaLink API",
        version="1.0",
        description="AI-powered disaster response coordination platform backend.",
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ──────────────────────────────────────────────────────────
    application.include_router(health_router)
    application.include_router(incidents_router)
    application.include_router(volunteers_router)
    application.include_router(missions_router)
    application.include_router(dashboard_router)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        logging.error(f"422 Validation Error: {exc.errors()} \nBody: {exc.body}")
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors(), "body": exc.body}
        )

    return application


app = create_app()


@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint — confirms the API is running."""
    return {
        "project": "RakshaLink",
        "status": "running",
    }
