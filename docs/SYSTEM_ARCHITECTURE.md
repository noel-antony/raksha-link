# System Architecture

This document describes the complete architecture of the RakshaLink MVP, an AI-powered disaster response coordination platform.

## Overall Architecture
RakshaLink follows a decoupled client-server architecture relying heavily on Firebase for real-time state and Google Gemini for AI-driven decision support. The platform is designed to operate seamlessly during crises by prioritizing critical workflows over bloated features.

### 1. Frontend Architecture
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Mapping**: Leaflet for geographic visualization of crises and volunteers (`CrisisMap.jsx`).
- **State Management**: React Context (`AuthContext`, `ToastProvider`) combined with Firebase real-time listeners.
- **AI Integration**: Direct client-side SDK integration (`@google/genai`) for immediate natural language processing and mission translation (`geminiService.js`).

### 2. Backend Architecture
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Purpose**: Acts as a supplementary microservice layer to handle operations that are computationally heavy, require secure credential isolation, or simulate complex external integrations (like routing).
- **Offline Fallback**: Integrates with Gemma (`edge/gemma/commander.py`) to provide localized AI support if cloud connectivity drops.

### 3. Firebase Architecture
- **Authentication**: Firebase Auth manages identities for Officers (Command Center users) and Volunteers.
- **Database (Firestore)**: NoSQL document store acting as the primary source of truth. It handles highly concurrent reads/writes for mission tracking, volunteer profiles, and system-wide configurations (e.g., break-glass mode).

### 4. AI Architecture
- **Primary Model**: Google Gemini API (gemini-2.5-flash / gemini-pro).
- **Core AI Functions**:
  1. **Matching Engine**: Evaluates disaster parameters against volunteer profiles to recommend the best responders based on skill compatibility and distance.
  2. **Translation Engine**: Generates multilingual mission briefs to ensure volunteers understand dispatch instructions in their native language.

---

## Complete Workflow and Module Responsibilities

The RakshaLink MVP revolves around the lifecycle of an **Incident**.

### 1. Citizen Report
- **Workflow**: A citizen submits an emergency request containing text, images, or GPS coordinates.
- **Responsible Module**: Frontend Intake Form (`CitizenReport.jsx` - *To be implemented*) and Firebase Firestore (`incidents` collection).

### 2. AI Analysis
- **Workflow**: The raw citizen report is processed by AI to extract structured data (e.g., number of victims, hazards).
- **Responsible Module**: Gemini API via `geminiService.js` (Frontend) or an equivalent Backend FastAPI endpoint for secure parsing.

### 3. Incident Classification
- **Workflow**: AI categorizes the report into standardized disaster types (e.g., Medical Emergency, Fire, Flood).
- **Responsible Module**: Gemini AI Pipeline.

### 4. Priority Scoring
- **Workflow**: The system assigns a severity score (e.g., Low, High, Critical) based on the extracted context.
- **Responsible Module**: Gemini AI Pipeline.

### 5. Duplicate Detection
- **Workflow**: Before creating a new incident, the system cross-references active incidents in the same geographic radius to prevent redundant dispatches.
- **Responsible Module**: Backend AI pipeline querying Firestore (`incidents` collection).

### 6. Mission Planner (Matching)
- **Workflow**: When an incident is active, the system fetches nearby volunteers, calculates road distances via OSRM, and uses AI to recommend the most qualified responders.
- **Responsible Module**: `Matching.jsx` orchestrating data from `firebaseService.js` (Volunteers), `routingService.js` (OSRM), and `geminiService.js` (AI Matcher).

### 7. Officer Confirmation
- **Workflow**: The control room officer reviews the AI's recommended matches, edits the task assignment if necessary, and confirms the dispatch.
- **Responsible Module**: `Matching.jsx` UI.

### 8. Dispatch
- **Workflow**: A localized, translated mission brief is generated and dispatched to the volunteer's device. PII access is logged in the audit trail.
- **Responsible Module**: `Matching.jsx` (UI), `geminiService.js` (Translation), and a Dispatch Gateway (currently mocked, intended for Backend SMS/WhatsApp integration).

### 9. Responders / Volunteers
- **Workflow**: The volunteer receives the brief, executes the mission, and their live GPS heartbeat updates the control room map.
- **Responsible Module**: `Profile.jsx` (Heartbeat generator) and Backend `/api/volunteer/heartbeat` (Receiver).
