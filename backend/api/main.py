import os
import math
import time
import hashlib
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx
from google import genai
import json
# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="SentinelOS API", version="2.0.0")

@app.get("/api/health")
async def health_check():
    return {"status": "operational", "timestamp": datetime.now().isoformat()}

# Allow CORS for development if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── OSRM Public API Base URL ───────────────────────────────────────────────
OSRM_BASE = "https://router.project-osrm.org"

# ─── State for Prototype Features (Simulating DB) ───────────────────────────
active_volunteers = {}  # user_id -> dict with timestamp, coords, etc.
# ─── Kerala Flood-Prone River Basins (simulation data) ──────────────────────


# ─── Pydantic Models ────────────────────────────────────────────────────────

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float

class TranslateRequest(BaseModel):
    text: str
    target_language: str  # "ml" for Malayalam, "ta" for Tamil, "hi" for Hindi

class VolunteerHeartbeat(BaseModel):
    user_id: str
    name: str
    lat: float
    lng: float
    is_active: bool

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "operational",
        "version": "2.0.0",
        "services": {
            "whatsapp": "configured" if twilio_client else "not_configured",
            "routing": "osrm_public",
            "flood_detection": "active",
            "crisis_sensing": "active",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/route")
async def get_route(payload: RouteRequest):
    """
    Calculate real road distance and travel time between two points
    using the OSRM (Open Source Routing Machine) public API.
    Returns distance in meters and duration in seconds.
    """
    url = (
        f"{OSRM_BASE}/route/v1/driving/"
        f"{payload.origin_lng},{payload.origin_lat};"
        f"{payload.dest_lng},{payload.dest_lat}"
        f"?overview=full&geometries=geojson&steps=false"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            # Fallback to Haversine if OSRM can't find a route
            straight_distance = haversine_km(
                payload.origin_lat, payload.origin_lng,
                payload.dest_lat, payload.dest_lng
            ) * 1000
            estimated_duration = straight_distance / 8.33  # ~30 km/h average
            return {
                "distance_meters": round(straight_distance),
                "duration_seconds": round(estimated_duration),
                "duration_text": format_duration(estimated_duration),
                "source": "haversine_fallback",
                "geometry": None,
            }

        route = data["routes"][0]
        return {
            "distance_meters": round(route["distance"]),
            "duration_seconds": round(route["duration"]),
            "duration_text": format_duration(route["duration"]),
            "source": "osrm",
            "geometry": route.get("geometry"),
        }
    except httpx.HTTPError as e:
        print(f"OSRM API Error: {e}")
        # Fallback to Haversine
        straight_distance = haversine_km(
            payload.origin_lat, payload.origin_lng,
            payload.dest_lat, payload.dest_lng
        ) * 1000
        estimated_duration = straight_distance / 8.33
        return {
            "distance_meters": round(straight_distance),
            "duration_seconds": round(estimated_duration),
            "duration_text": format_duration(estimated_duration),
            "source": "haversine_fallback",
            "geometry": None,
        }


def format_duration(seconds):
    """Format seconds into human-readable duration."""
    minutes = int(seconds // 60)
    if minutes < 1:
        return "< 1 min"
    if minutes < 60:
        return f"{minutes} min"
    hours = minutes // 60
    remaining = minutes % 60
    return f"{hours}h {remaining}m"


@app.post("/api/translate")
async def translate_text(payload: TranslateRequest):
    """
    Translation endpoint.
    In production, this would use Google Translate API.
    For the prototype, Gemini handles translation on the frontend.
    This endpoint provides a fallback with common emergency phrases.
    """
    emergency_translations = {
        "ml": {  # Malayalam
            "flood": "വെള്ളപ്പൊക്കം",
            "fire": "തീപിടുത്തം",
            "help": "സഹായം",
            "emergency": "അടിയന്തരാവസ്ഥ",
            "evacuate": "ഒഴിപ്പിക്കുക",
            "rescue": "രക്ഷാപ്രവർത്തനം",
            "medical": "വൈദ്യ സഹായം",
            "safe": "സുരക്ഷിതം",
            "danger": "അപകടം",
            "boat": "ബോട്ട്",
            "shelter": "അഭയകേന്ദ്രം",
            "food": "ഭക്ഷണം",
            "water": "വെള്ളം",
        },
        "ta": {  # Tamil
            "flood": "வெள்ளம்",
            "fire": "தீ",
            "help": "உதவி",
            "emergency": "அவசரநிலை",
            "evacuate": "வெளியேற்றுங்கள்",
            "rescue": "மீட்பு",
            "medical": "மருத்துவ உதவி",
            "safe": "பாதுகாப்பு",
            "danger": "ஆபத்து",
            "boat": "படகு",
            "shelter": "தங்குமிடம்",
            "food": "உணவு",
            "water": "தண்ணீர்",
        },
        "hi": {  # Hindi
            "flood": "बाढ़",
            "fire": "आग",
            "help": "मदद",
            "emergency": "आपातकाल",
            "evacuate": "खाली करें",
            "rescue": "बचाव",
            "medical": "चिकित्सा सहायता",
            "safe": "सुरक्षित",
            "danger": "खतरा",
            "boat": "नाव",
            "shelter": "आश्रय",
            "food": "भोजन",
            "water": "पानी",
        },
    }

    lang = payload.target_language.lower()
    if lang not in emergency_translations:
        return {
            "translated_text": payload.text,
            "source_language": "en",
            "target_language": lang,
            "method": "passthrough",
            "note": "Language not supported for offline translation. Use Gemini for real-time translation.",
        }

    return {
        "translated_text": payload.text,
        "source_language": "en",
        "target_language": lang,
        "method": "dictionary_fallback",
        "emergency_vocabulary": emergency_translations[lang],
        "note": "Dictionary-based fallback. Full translation handled by Gemini on frontend.",
    }


@app.post("/api/volunteer/heartbeat")
async def update_volunteer_heartbeat(payload: VolunteerHeartbeat):
    """
    Real-Time Availability Check:
    Receives real-time GPS coords from volunteers who have toggled "Active".
    """
    if payload.is_active:
        active_volunteers[payload.user_id] = {
            "user_id": payload.user_id,
            "name": payload.name,
            "lat": payload.lat,
            "lng": payload.lng,
            "last_seen": datetime.utcnow().isoformat(),
            "timestamp": time.time()
        }
    else:
        active_volunteers.pop(payload.user_id, None)
        
    return {"status": "success", "active_count": len(active_volunteers)}

@app.get("/api/volunteers/active")
async def get_active_volunteers():
    """
    Returns volunteers who have pinged within the last 15 minutes.
    """
    now = time.time()
    # Filter out stale heartbeats (older than 15 mins)
    stale_threshold = 15 * 60 
    
    active = []
    keys_to_remove = []
    
    for uid, data in active_volunteers.items():
        if now - data["timestamp"] > stale_threshold:
            keys_to_remove.append(uid)
        else:
            active.append(data)
            
    for uid in keys_to_remove:
        del active_volunteers[uid]
        
    return {"active_volunteers": active, "count": len(active)}

