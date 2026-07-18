# SentinelOS

**SentinelOS** is an **Autonomous Multi-Agent Crisis Operating System**, designed to orchestrate emergency response through a decentralized, highly resilient architecture. Built to operate in severe disaster scenarios where connectivity is unreliable, it seamlessly blends cloud-based AI reasoning with robust, edge-capable execution.

Developed for the **Google DeepMind Bangalore Hackathon**, SentinelOS demonstrates genuine multi-agent collaboration, continuous graph-based state tracking, and local-first fallback capabilities.

---

## 🏗 System Architecture

SentinelOS breaks away from traditional linear monolithic structures. It embraces a highly decoupled event-driven architecture powered by the Google AI stack:

- **Immutable Event Bus**: The nervous system of SentinelOS. Agents never call each other directly; they publish and subscribe to discrete Domain Events (e.g., `IncidentDetected`, `MissionGenerated`, `HumanApproved`).
- **World Model**: A continuous, graph-based representation of physical reality. As incidents, responders, and assets interact, the World Model updates dynamically and publishes `WorldModelUpdated` events.
- **Managed Agent Framework**: 
  - `SensorFusionAgent`: Fuses multimodal inputs (API data, text, voice SOS) and uses **Gemini 3.5 Flash** to autonomously determine incident severity, type, and confidence.
  - `MissionPlannerAgent`: Listens for detected incidents and autonomously plans resource allocation and skill requirements.
  - `IncidentCommanderAgent`: Oversees mission approval and handles zero-trust, human-in-the-loop "Break-Glass" overrides.
- **Edge Commander (Local-First Fallback)**: Simulated via a lightweight Gemma-style prompt. If the cloud connection drops, SentinelOS gracefully degrades, passing control to an on-device Edge Commander to maintain the sense-decide-act loop using cached mesh network data.

---

## 🛠 Tech Stack

- **Frontend Core**: React, Vite, Tailwind CSS, Lucide React
- **Backend API**: Python, FastAPI
- **Agent Framework**: Google GenAI SDK (`gemini-3.5-flash`)
- **Event Mesh**: Custom Pub/Sub Python Event Bus
- **State Management**: In-Memory Graph World Model
- **Database**: Firebase (Firestore, Authentication, Hosting)

---

## 📂 Repository Structure

```
SentinelOS/
├── apps/
│   ├── command-center/       # Admin EOC Dashboard (React/Vite)
│   ├── citizen-app/          # Passive Sensor Mesh & SOS (React/Vite)
│   └── responder-app/        # Mission Execution App (React/Vite)
├── backend/
│   ├── agents/               # Managed Agent Framework (Sensor Fusion, Planner, Commander)
│   ├── api/                  # FastAPI Endpoints
│   ├── events/               # Event Bus & Domain Events
│   ├── services/             # Core Backend Services
│   └── world_model/          # Continuous Graph-Based State
├── edge/
│   └── gemma/                # Edge Commander (Offline fallback logic)
├── shared/                   # Shared configurations
└── infrastructure/           # Deployment & CI/CD configurations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r api/requirements.txt
   ```
3. Set your environment variables in `backend/api/.env`:
   ```env
   GEMINI_API_KEY=your_google_ai_key_here
   ```
4. Run the end-to-end agent architecture tests:
   ```bash
   python test_sentinel.py
   python test_gemma.py
   ```

### Frontend Setup (Command Center)
1. Navigate to the command center directory:
   ```bash
   cd apps/command-center
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Seed the Firebase mock data (requires valid Firebase credentials in `.env`):
   ```bash
   node seedFirebase.js
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🌟 Key Hackathon Features

### Problem Statement 2: Autonomous Orchestration
SentinelOS tackles complex, multi-step disaster coordination by isolating labor. The `SensorFusionAgent` strictly parses reality, the `MissionPlannerAgent` strictly provisions resources, and the `IncidentCommanderAgent` manages ethics and dispatch. They collaborate entirely through an immutable event stream, proving that true functional automation requires decoupled orchestration, not just chained LLM calls.

### Local-First Agents on Gemma (Special Prize)
We recognize that true agency in a crisis means acting when the network fails. The SentinelOS Command Center features a **System Link toggle**. When triggered, the system drops its cloud dependencies and the `GemmaEdgeCommander` takes over. It maintains state locally across the task, making critical routing decisions using cached mesh data without ever reaching out to a server.

---
*Built with ❤️ for the Google DeepMind Bangalore Hackathon.*
