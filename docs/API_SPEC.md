# API Specification

This document details the backend FastAPI endpoints required for the RakshaLink MVP. 

*Note: While RakshaLink uses a backend for specific complex tasks (routing proxies, offline NLP fallbacks, live volatile tracking), the primary data CRUD operations and real-time streams are handled directly between the React frontend and Firebase Firestore via the Firebase Client SDK.*

---

## 1. Health Check

- **URL**: `/api/health`
- **HTTP Method**: `GET`
- **Purpose**: Verifies that the FastAPI backend is running and reachable.
- **Authentication**: None required.
- **Request Body**: None.
- **Response Body**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-07-18T10:00:00.000000"
  }
  ```
- **Firestore Accessed**: None.
- **Gemini Usage**: None.
- **Frontend Interaction**: Queried occasionally to display system status indicators on the Command Center dashboard.

---

## 2. OSRM Route Calculation Proxy

- **URL**: `/api/route`
- **HTTP Method**: `POST`
- **Purpose**: Proxies requests to an external OSRM (Open Source Routing Machine) server to calculate accurate road driving distances and ETAs between volunteers and crises. Proxied through the backend to avoid CORS issues and rate limits.
- **Authentication**: Bearer Token (Officer level).
- **Request Body**:
  ```json
  {
    "locations": [
      [76.350, 10.100], 
      [76.355, 10.105]
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "distance_meters": 1200,
    "duration_seconds": 180,
    "route_geometry": "..."
  }
  ```
- **Firestore Accessed**: None.
- **Gemini Usage**: None.
- **Frontend Interaction**: Called by `routingService.js` before handing volunteer arrays to the Gemini matching algorithm, ensuring matches are based on actual road distance rather than straight-line (haversine) distance.

---

## 3. NLP Translation Fallback

- **URL**: `/api/translate`
- **HTTP Method**: `POST`
- **Purpose**: Provides an offline/dictionary-based fallback translation for mission briefs if the cloud Gemini API fails or rate limits.
- **Authentication**: Bearer Token (Officer level).
- **Request Body**:
  ```json
  {
    "text": "Provide immediate first aid",
    "target_language": "Malayalam"
  }
  ```
- **Response Body**:
  ```json
  {
    "translated_text": "...",
    "source_language": "en",
    "target_language": "Malayalam",
    "method": "dictionary_fallback"
  }
  ```
- **Firestore Accessed**: None.
- **Gemini Usage**: None (Serves as a fallback *when* Gemini is unavailable).
- **Frontend Interaction**: Called by the translation layer if the primary `@google/genai` call in `geminiService.js` throws an error.

---

## 4. Volunteer GPS Heartbeat (Live Tracking)

- **URL**: `/api/volunteer/heartbeat`
- **HTTP Method**: `POST`
- **Purpose**: Receives high-frequency GPS coordinate pings from dispatched or on-duty volunteers.
- **Authentication**: Bearer Token (Volunteer level).
- **Request Body**:
  ```json
  {
    "user_id": "vol_987",
    "name": "Arun Kumar",
    "lat": 10.055,
    "lng": 76.649,
    "is_active": true
  }
  ```
- **Response Body**:
  ```json
  {
    "status": "success",
    "active_count": 42
  }
  ```
- **Firestore Accessed**: None. (Maintained in highly volatile server memory to avoid bankrupting Firestore quota with thousands of writes per minute).
- **Gemini Usage**: None.
- **Frontend Interaction**: `Profile.jsx` uses `navigator.geolocation.watchPosition` to ping this endpoint every 30 seconds while the volunteer's tracking switch is active.

---

## 5. Fetch Active Volunteer Heatmap

- **URL**: `/api/volunteers/active`
- **HTTP Method**: `GET`
- **Purpose**: Retrieves the aggregated list of volunteers who have sent a heartbeat in the last 15 minutes.
- **Authentication**: Bearer Token (Officer level).
- **Request Body**: None.
- **Response Body**:
  ```json
  {
    "active_volunteers": [
      {
        "user_id": "vol_987",
        "lat": 10.055,
        "lng": 76.649,
        "last_seen": "2026-07-18T10:15:00Z"
      }
    ],
    "count": 1
  }
  ```
- **Firestore Accessed**: None.
- **Gemini Usage**: None.
- **Frontend Interaction**: The Command Center `CrisisMap.jsx` polls this endpoint periodically to render live blue dots on the map representing active field personnel.
