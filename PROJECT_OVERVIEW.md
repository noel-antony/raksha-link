# Project Overview

## High-Level Summary

Rakshalink is a crisis-response prototype centered on the `apps/command-center` React app, a FastAPI backend, and a small event-driven Python agent model. The implementation is strongest in the command center workflow for responder registration, volunteer matching, mission dispatch, mission tracking, and resilience scoring. Other surfaces exist as SDKs, edge fallback logic, and two additional Vite apps, but several of those are still starter shells or demo-oriented prototypes.

The repo mixes real integrations, simulation layers, and fallback paths. Firebase, Twilio, Gemini, OSRM, and Groq all appear in the codebase, but many flows can fall back to localStorage, mock data, hard-coded demo records, or in-memory state.

## Folder Structure

```text
Rakshalink/
├── README.md
├── PROJECT_OVERVIEW.md
├── test_sdk.py
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── createAdmin.js
│   ├── agents/
│   │   ├── base.py
│   │   ├── incident_commander.py
│   │   ├── mission_planner.py
│   │   └── sensor_fusion.py
│   ├── events/
│   │   ├── bus.py
│   │   └── domain.py
│   ├── world_model/
│   │   └── graph.py
│   ├── test_sentinel.py
│   └── test_gemma.py
├── edge/
│   └── gemma/
│       └── commander.py
├── sdk/
│   ├── js/
│   │   ├── package.json
│   │   └── src/index.js
│   └── python/
│       └── sentinelos/
│           ├── __init__.py
│           └── interactions.py
└── apps/
    ├── command-center/
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── tailwind.config.js
    │   ├── playwright.config.js
    │   ├── e2e/app.spec.js
    │   └── src/
    │       ├── main.jsx
    │       ├── App.jsx
    │       ├── index.css
    │       ├── config/
    │       ├── contexts/
    │       ├── hooks/
    │       ├── components/
    │       ├── pages/
    │       ├── services/
    │       └── utils/
    ├── citizen-app/
    │   └── src/App.jsx
    └── responder-app/
        └── src/App.jsx
```

## Technologies Used

### Frontend Command Center

- React 18
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React
- Firebase SDK
- react-leaflet / leaflet
- CryptoJS
- Playwright for E2E testing
- Google Generative AI SDK
- Groq API client logic via `fetch`

### Backend and Agent Layer

- Python 3
- FastAPI
- Pydantic
- Uvicorn / Gunicorn
- httpx
- Twilio
- python-dotenv
- Google GenAI / google-genai

### SDKs and Edge Layer

- Node.js SDK wrapper with `fetch`
- Python SDK wrapper with `httpx`
- Edge fallback logic that still uses Gemini when online

## Main Entry Points

- Frontend root: [apps/command-center/src/main.jsx](apps/command-center/src/main.jsx)
- Frontend app composition and routing: [apps/command-center/src/App.jsx](apps/command-center/src/App.jsx)
- Backend API entry: [backend/api/main.py](backend/api/main.py)
- JS SDK entry: [sdk/js/src/index.js](sdk/js/src/index.js)
- Python SDK entry: [sdk/python/sentinelos/__init__.py](sdk/python/sentinelos/__init__.py)
- Edge commander entry: [edge/gemma/commander.py](edge/gemma/commander.py)
- Architecture smoke tests: [backend/test_sentinel.py](backend/test_sentinel.py) and [backend/test_gemma.py](backend/test_gemma.py)

## Authentication Flow

Authentication is implemented in the command center only.

1. Firebase config is initialized in [apps/command-center/src/config/firebase.js](apps/command-center/src/config/firebase.js).
2. `AuthProvider` in [apps/command-center/src/contexts/AuthContext.jsx](apps/command-center/src/contexts/AuthContext.jsx) listens to `onAuthStateChanged`.
3. When a user is present, it reads `users/{uid}` from Firestore and extracts `role`, defaulting to `volunteer` if the document is missing or unreadable.
4. `ProtectedRoute` in [apps/command-center/src/components/Layout/ProtectedRoute.jsx](apps/command-center/src/components/Layout/ProtectedRoute.jsx) gates routes by `requireAdmin` and `requireVolunteer`.
5. `Login.jsx` redirects authenticated users to either `/dashboard`, `/profile`, or the originally requested path in [apps/command-center/src/pages/Login.jsx](apps/command-center/src/pages/Login.jsx).
6. `Register.jsx` creates the auth user, stores a role, and writes the encrypted volunteer profile through the Firebase service layer in [apps/command-center/src/pages/Register.jsx](apps/command-center/src/pages/Register.jsx).

Important detail: the app has a demo mode path when Firebase env values are missing or placeholder-like, so auth and persistence can degrade into local-only behavior.

## Routing

### Frontend Routes

Declared in [apps/command-center/src/App.jsx](apps/command-center/src/App.jsx):

- Public: `/`, `/register`, `/login`, `/setup-admin`
- Admin-only: `/dashboard`, `/manage-admins`
- Authenticated shared routes: `/matching`, `/missions`, `/resilience`
- Volunteer-only: `/profile`, `/alerts`

The layout is wrapped in `BrowserRouter`, `ToastProvider`, and `AuthProvider`. The navbar in [apps/command-center/src/components/Layout/Navbar.jsx](apps/command-center/src/components/Layout/Navbar.jsx) adapts links based on auth role.

### Backend Routes

Defined in [backend/api/main.py](backend/api/main.py):

- `/api/health`
- `/api/whatsapp`
- `/api/route`
- `/api/flood-data`
- `/api/detect-crisis`
- `/api/translate`
- `/api/resilience-score`
- `/api/volunteer/heartbeat`
- `/api/volunteers/active`
- `/api/iot/ingest`
- `/api/drones/active`
- `/api/fl/sync-weights`
- `/api/fl/global-model`
- `/api/analyze-video-stream`

Note: `main.py` contains duplicated endpoint blocks later in the file, which is a maintenance smell even though the file parses cleanly.

## Firebase Collections

The command center uses a mix of Firestore and localStorage fallback state.

### Firestore Collections

- `users` - auth profile records and role lookup in [apps/command-center/src/contexts/AuthContext.jsx](apps/command-center/src/contexts/AuthContext.jsx) and `registerUser` in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)
- `volunteers` - encrypted volunteer registration records in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)
- `missions` - dispatched missions and status history in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)
- `system_state` - break-glass state under a `breakglass` document in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)
- `breakglass_audit` - audit log of minimum-necessary access in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)

### Demo Fallback Storage

When Firebase is not configured, the app falls back to localStorage keys:

- `na_volunteers`
- `na_missions`
- `na_breakglass_state`
- `na_breakglass_audit`

There is no live Firestore collection for crises or alerts; those are mock-data driven in the frontend.

## Major Components

### Layout and Shell

- [apps/command-center/src/components/Layout/Navbar.jsx](apps/command-center/src/components/Layout/Navbar.jsx)
- [apps/command-center/src/components/Layout/Sidebar.jsx](apps/command-center/src/components/Layout/Sidebar.jsx)
- [apps/command-center/src/components/Layout/ProtectedRoute.jsx](apps/command-center/src/components/Layout/ProtectedRoute.jsx)

### Operational Visuals

- [apps/command-center/src/components/Map/CrisisMap.jsx](apps/command-center/src/components/Map/CrisisMap.jsx)

### UI Primitives

- [apps/command-center/src/components/UI/Button.jsx](apps/command-center/src/components/UI/Button.jsx)
- [apps/command-center/src/components/UI/Badge.jsx](apps/command-center/src/components/UI/Badge.jsx)
- [apps/command-center/src/components/UI/LoadingSpinner.jsx](apps/command-center/src/components/UI/LoadingSpinner.jsx)
- [apps/command-center/src/components/UI/Toast.jsx](apps/command-center/src/components/UI/Toast.jsx)
- [apps/command-center/src/components/UI/DroneFeedModal.jsx](apps/command-center/src/components/UI/DroneFeedModal.jsx) appears to exist but is not wired into the current flow

### Page-Level Features

- Landing and SOS: [apps/command-center/src/pages/Home.jsx](apps/command-center/src/pages/Home.jsx)
- Admin overview: [apps/command-center/src/pages/AdminHome.jsx](apps/command-center/src/pages/AdminHome.jsx)
- Auth flows: [apps/command-center/src/pages/Login.jsx](apps/command-center/src/pages/Register.jsx)
- Admin setup: [apps/command-center/src/pages/AdminSetup.jsx](apps/command-center/src/pages/AdminSetup.jsx)
- Admin management: [apps/command-center/src/pages/ManageAdmins.jsx](apps/command-center/src/pages/ManageAdmins.jsx)
- Matching and dispatch: [apps/command-center/src/pages/Matching.jsx](apps/command-center/src/pages/Matching.jsx)
- Mission tracking: [apps/command-center/src/pages/MissionTracker.jsx](apps/command-center/src/pages/MissionTracker.jsx)
- Volunteer profile: [apps/command-center/src/pages/Profile.jsx](apps/command-center/src/pages/Profile.jsx)
- Emergency alerts: [apps/command-center/src/pages/Alerts.jsx](apps/command-center/src/pages/Alerts.jsx)
- Resilience scoring: [apps/command-center/src/pages/ResilienceScore.jsx](apps/command-center/src/pages/ResilienceScore.jsx)
- Dashboard: [apps/command-center/src/pages/Dashboard.jsx](apps/command-center/src/pages/Dashboard.jsx)

## Reusable UI Components

- `Button` - theme variants, loading state, and shared action styling
- `Badge` - status pills for live/health/severity states
- `LoadingSpinner` - common async/loading shell
- `Toast` - transient notification rendering
- `Sidebar` - shared dashboard chrome

These components are all in the command-center app and form the reusable presentation layer for most pages.

## State Management

The repository does not use Redux, Zustand, or another global client store.

### Frontend State

- Local React state dominates page behavior
- `AuthContext` provides `currentUser`, `userRole`, `loading`, `isAdmin`, and `isVolunteer`
- `ToastProvider` manages toast queue and timeouts
- `useGemini` wraps AI service calls and exposes loading/error state
- `useAccessibilitySOS` handles shake and tap based SOS triggers
- `useFirebase` exists as a helper hook, but it appears unused in the current workspace

### Backend State

- In-memory singletons in `backend/api/main.py`: `active_volunteers`, `iot_sensor_data`, and `global_model_state`
- In-memory event history in `backend/events/bus.py`
- In-memory graph nodes and edges in `backend/world_model/graph.py`

## API Calls

### Frontend Service Calls

- Firebase auth and Firestore persistence in [apps/command-center/src/services/firebaseService.js](apps/command-center/src/services/firebaseService.js)
- OSRM route lookup in [apps/command-center/src/services/routingService.js](apps/command-center/src/services/routingService.js)
- Flood detection, crisis detection, and resilience score in [apps/command-center/src/services/floodService.js](apps/command-center/src/services/floodService.js)
- WhatsApp dispatch in [apps/command-center/src/services/whatsappService.js](apps/command-center/src/services/whatsappService.js)
- Heartbeat and federated-learning sync in [apps/command-center/src/services/prototypeService.js](apps/command-center/src/services/prototypeService.js)
- AI matching and translation in [apps/command-center/src/services/geminiService.js](apps/command-center/src/services/geminiService.js)

### Backend-Only Integrations

- Twilio WhatsApp sending
- OSRM routing
- Gemini-powered flood/crisis/video analysis fallbacks
- In-memory flood basin simulation and resilience scoring

## AI Integration Points

- `SensorFusionAgent` calls Gemini to detect incidents from signals in [backend/agents/sensor_fusion.py](backend/agents/sensor_fusion.py)
- `MissionPlannerAgent` transforms incidents into missions in [backend/agents/mission_planner.py](backend/agents/mission_planner.py)
- `IncidentCommanderAgent` reviews missions and logs human overrides in [backend/agents/incident_commander.py](backend/agents/incident_commander.py)
- Frontend matching uses a Gemini-first, Groq-fallback, mock-last chain in [apps/command-center/src/services/geminiService.js](apps/command-center/src/services/geminiService.js)
- Mission brief translation can use Gemini in [apps/command-center/src/services/geminiService.js](apps/command-center/src/services/geminiService.js) and [apps/command-center/src/services/whatsappService.js](apps/command-center/src/services/whatsappService.js)
- Edge fallback still invokes Gemini when possible in [edge/gemma/commander.py](edge/gemma/commander.py)
- Backend drone analysis uses Gemini in [backend/api/main.py](backend/api/main.py)

## Potential Dead Code

- [apps/command-center/src/hooks/useFirebase.js](apps/command-center/src/hooks/useFirebase.js) appears unused
- [apps/command-center/src/components/UI/DroneFeedModal.jsx](apps/command-center/src/components/UI/DroneFeedModal.jsx) appears unused
- `droneIcon` in [apps/command-center/src/components/Map/CrisisMap.jsx](apps/command-center/src/components/Map/CrisisMap.jsx) is defined but not used
- `getFloodRiskData` and `detectCrisis` in [apps/command-center/src/services/floodService.js](apps/command-center/src/services/floodService.js) are exported but not currently consumed by the visible UI
- `getCrisisAnalysis` and `processVoiceCommand` in [apps/command-center/src/services/geminiService.js](apps/command-center/src/services/geminiService.js) are available but not wired into pages
- [apps/citizen-app/src/App.jsx](apps/citizen-app/src/App.jsx) and [apps/responder-app/src/App.jsx](apps/responder-app/src/App.jsx) are still default Vite starter content, not product flows
- [backend/api/createAdmin.js](backend/api/createAdmin.js) is a one-off Firestore role script rather than an in-app feature

## Technical Debt

1. The backend API file contains duplicated route blocks, which makes ownership and future edits risky.
2. The repository documentation overstates the implementation by referencing folders and services that do not exist in the workspace tree.
3. The command center depends on a demo mode that silently shifts to localStorage when Firebase env vars are missing or placeholder-like, which can hide integration failures.
4. Several important flows are mock-driven instead of end-to-end live, especially crises, alerts, and some admin/dashboard surfaces.
5. The edge commander is branded as local-first, but it still depends on Gemini when online, so it is not actually an on-device model implementation.
6. The SDKs expose more surface than the backend currently supports, especially the Python interactions wrapper and its `/api/interactions` fallback path.
7. Security is prototype-grade: encryption keys are derived client-side, admin setup is hard-coded, and many sensitive flows assume trusted client behavior.
8. Testing is shallow relative to the app surface area. Existing Playwright coverage only validates landing/login basics, while most dispatch and backend paths are untested.

## Notes on Repository Maturity

- The command center is the primary implemented product surface.
- The backend is functional but simulation-heavy.
- The SDKs are usable as wrappers, but they do not fully reflect the backend surface.
- The citizen and responder apps are placeholders.

## Recommended Interpretation

Treat this repo as a polished hackathon prototype with a coherent emergency-response narrative, not as a finished production platform. The architecture is meaningful, but many of the integrations are demo-safe or fallback-driven rather than fully enforced end to end.