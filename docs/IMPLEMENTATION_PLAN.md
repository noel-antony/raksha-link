# Implementation Plan

This document breaks down the RakshaLink MVP into specific, independently actionable tasks. 

## Phase 1: Database & Intake Foundations

### Task 1.1: Implement Live Firestore `incidents` Collection
- **Goal**: Replace `MOCK_CRISIS_EVENTS` with real-time Firebase subscriptions.
- **Difficulty**: Easy
- **Estimated Time**: 1.5 hours
- **Prerequisites**: None
- **Files to Change**: `apps/command-center/src/services/firebaseService.js`, `apps/command-center/src/pages/Dashboard.jsx`, `apps/command-center/src/config/mockData.js`
- **Details**: Create CRUD functions in `firebaseService.js` for the `incidents` collection. Hook up `Dashboard.jsx` and `CrisisMap.jsx` to listen to these live documents rather than static mock arrays.

### Task 1.2: Citizen Report Intake Form UI
- **Goal**: Build a simple public-facing UI for citizens to report emergencies.
- **Difficulty**: Easy
- **Estimated Time**: 1.5 hours
- **Prerequisites**: Task 1.1
- **Files to Change**: `apps/command-center/src/App.jsx`, `apps/command-center/src/pages/CitizenReport.jsx` (New)
- **Details**: Create a public route `/report`. Form fields: Description, Location (Text/GPS), Image Upload (optional). Submitting writes directly to the new `incidents` Firestore collection with status `Pending`.

---

## Phase 2: AI Pipeline & Analysis

### Task 2.1: Gemini AI Incident Classification Pipeline
- **Goal**: Process new `Pending` incidents using Gemini to assign Type and Priority.
- **Difficulty**: Medium
- **Estimated Time**: 2 hours
- **Prerequisites**: Task 1.1
- **Files to Change**: `backend/api/main.py` OR `apps/command-center/src/services/aiService.js`
- **Details**: Create a listener (or backend endpoint triggered on document creation) that feeds the raw Citizen Report into Gemini-2.5-Flash. Extract structured JSON containing `type`, `priorityScore`, `hazards`, and update the Firestore incident document to status `Active`.

### Task 2.2: Duplicate Detection Algorithm
- **Goal**: Prevent control room spam by flagging redundant reports.
- **Difficulty**: Medium
- **Estimated Time**: 1.5 hours
- **Prerequisites**: Task 2.1
- **Files to Change**: `apps/command-center/src/services/aiService.js`
- **Details**: Before creating/activating a new incident, query active incidents within a 5km radius. Ask Gemini to compare the text descriptions to determine if they refer to the same event. If true, link them via the `duplicateOf` field.

---

## Phase 3: Responder Management & Dispatch

### Task 3.1: Live Volunteer Registration & Profiles
- **Goal**: Replace `MOCK_VOLUNTEERS` with actual database records.
- **Difficulty**: Medium
- **Estimated Time**: 2 hours
- **Prerequisites**: None
- **Files to Change**: `apps/command-center/src/pages/Register.jsx`, `apps/command-center/src/services/firebaseService.js`
- **Details**: Build out the volunteer registration flow allowing users to input skills and assets. Ensure the encrypted payload architecture (Break-glass functionality) correctly encrypts PII before writing to Firestore.

### Task 3.2: Finalize Secure WhatsApp Dispatch
- **Goal**: Connect the `Matching.jsx` dispatch button to a real messaging gateway (e.g., Twilio Sandbox).
- **Difficulty**: Easy
- **Estimated Time**: 1 hour
- **Prerequisites**: Task 3.1
- **Files to Change**: `backend/api/main.py`, `apps/command-center/src/pages/Matching.jsx`
- **Details**: Create a `/api/dispatch` POST endpoint on the FastAPI backend that safely holds the Twilio API keys. Update `Matching.jsx` to hit this endpoint with the translated mission brief payload rather than logging to the console.

---

## Parallel Development Plan

To ensure rapid development and minimize git merge conflicts, work should be divided between two developers based on feature domains (Frontend/Intake vs. AI/Backend).

### Developer A (Frontend & Database focus)
- **Responsibilities**: UI construction, Firebase real-time listeners, mapping.
- **Tasks**:
  - Task 1.1: Live Firestore `incidents` Collection
  - Task 1.2: Citizen Report Intake Form UI
  - Task 3.1: Live Volunteer Registration & Profiles
- **Primary Files**: `Dashboard.jsx`, `CitizenReport.jsx`, `Register.jsx`, `firebaseService.js`, `CrisisMap.jsx`.

### Developer B (AI & Backend focus)
- **Responsibilities**: Prompt engineering, AI parsing, Backend FastAPI development, external API integrations.
- **Tasks**:
  - Task 2.1: Gemini AI Incident Classification Pipeline
  - Task 2.2: Duplicate Detection Algorithm
  - Task 3.2: Finalize Secure WhatsApp Dispatch
- **Primary Files**: `backend/api/main.py`, `aiService.js`, `geminiService.js`.

### Integration Checkpoints
To maintain stability, both branches should merge into `main` and test end-to-end functionality at the following checkpoints:

1. **Checkpoint 1 (After Tasks 1.2 & 2.1)**: Dev A submits a report via the UI. Dev B's AI pipeline should automatically catch it, classify it, and it should immediately appear categorized on Dev A's Dashboard map.
2. **Checkpoint 2 (After Task 3.1)**: Dev A creates a live volunteer. The existing Matching algorithm should be able to query this live volunteer rather than the mock data.
3. **Checkpoint 3 (After Task 3.2)**: Final End-to-End Test. A citizen report triggers the AI, the officer clicks dispatch on the live volunteer, and the backend successfully sends the SMS/WhatsApp message.
