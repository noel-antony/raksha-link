# RakshaLink MVP Refactor Summary

This document summarizes the changes made to refocus the RakshaLink repository exclusively on the core MVP. The goal was to remove all non-MVP features, dead code, and bloated architecture while preserving the core disaster response AI coordination platform.

## What Was Kept
- **Frontend Command Center**: The primary web application (`apps/command-center`) including:
  - Authentication (Firebase)
  - Google Maps integration (`CrisisMap.jsx`)
  - Incident details, Dashboard, and Mission tracking pages
  - Volunteer management and assignment views
- **Backend Infrastructure**: 
  - FastAPI foundation in `backend/api/main.py`
  - Core AI capabilities powered by the Gemini API (e.g. Volunteer matching)
  - Gemma offline support integration (`edge/gemma/commander.py`)
- **Agents**: The `mission_planner.py` agent for handling mission recommendation workflows.

## What Was Modified
- **`App.jsx` & `Navbar.jsx`**: Cleaned up to remove unneeded routes (Alerts, Resilience Score) and their corresponding navigation links.
- **`CrisisMap.jsx`**: Trimmed to remove simulated drones and flood basin geometries, maintaining only crises, volunteers, and routing paths.
- **`geminiService.js`**: Refactored to remove the Groq fallback logic, making Gemini the strict single provider.
- **`prototypeService.js`**: Stripped out IoT ingestion and Federated Learning (FL) syncing endpoints, keeping only volunteer heartbeat logic.
- **`backend/api/main.py`**: Extensively cleaned. Removed endpoints for WhatsApp (Twilio), Flood API simulations, Crisis Detection fallback, Resilience Scores, IoT data, Drone feeds, FL model syncs, and Omni Flash integrations. Also fixed technical debt by removing duplicate routes.

## What Was Removed
- **Unused Frontend Apps**: `apps/citizen-app` and `apps/responder-app` (placeholder scaffolding).
- **Non-MVP Pages**: `Alerts.jsx` and `ResilienceScore.jsx`.
- **Non-MVP Services**: `groqService.js`, `whatsappService.js`, `floodService.js`.
- **Non-MVP Components**: `DroneFeedModal.jsx`.
- **Obsolete Architecture**: `backend/events/` (Event Bus) and `backend/world_model/` (World Model graph).
- **Out-of-Scope Agents**: `backend/agents/sensor_fusion.py` and `backend/agents/incident_commander.py`.
- **SDKs**: The entire `sdk/` directory (Node/Python wrapper packages) and `test_sdk.py`.
- **Smoke Tests**: `backend/test_sentinel.py` and `backend/test_gemma.py`.

## Conclusion
The repository now accurately reflects the core vision of an AI-powered disaster response coordination platform. The complexity has been vastly reduced, making it a stable, clean, and maintainable foundation ready for MVP feature development.
