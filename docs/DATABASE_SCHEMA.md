# Database Schema

This document outlines the Firestore NoSQL database design for the RakshaLink MVP. It defines the collections required to track the complete incident lifecycle from citizen reports to volunteer dispatch.

---

## 1. `users`
**Purpose**: Stores authentication profiles and role-based access control for the platform.

- **Fields & Data Types**:
  - `id` (String): Firebase Auth UID (Document ID).
  - `email` (String): User's email address.
  - `role` (String): Role of the user (e.g., `"volunteer"`, `"officer"`, `"admin"`).
  - `createdAt` (Timestamp): Account creation time.
- **Relationships**: 1-to-1 mapping with the `volunteers` collection if `role == "volunteer"`.
- **Required Indexes**: None (direct document lookup by UID).
- **Example Document**:
  ```json
  {
    "email": "officer.john@rakshalink.gov",
    "role": "officer",
    "createdAt": "2026-07-18T10:00:00Z"
  }
  ```

---

## 2. `volunteers`
**Purpose**: Stores detailed responder profiles, skills, and secure PII (Personally Identifiable Information).

- **Fields & Data Types**:
  - `id` (String): Matches the `users` UID.
  - `phone` (String): Contact number (encrypted/protected in Break-Glass mode).
  - `encryptedPayload` (String): Encrypted JSON string of highly sensitive PII.
  - `profile.name` (String): Volunteer name.
  - `profile.skills` (Array of Strings): e.g., `["First Aid", "Search & Rescue"]`.
  - `profile.assets` (Array of Strings): e.g., `["4x4 Vehicle", "Boat"]`.
  - `profile.lat` (Number): Last known latitude.
  - `profile.lng` (Number): Last known longitude.
  - `breakGlassLocked` (Boolean): Indicates if PII is currently secured.
  - `createdAt` (Timestamp): Registration time.
  - `updatedAt` (Timestamp): Last profile update.
- **Relationships**: 1-to-Many with `missions` (a volunteer can have multiple historical missions).
- **Required Indexes**: 
  - `profile.skills` (Array-contains)
- **Example Document**:
  ```json
  {
    "id": "vol_987",
    "phone": "+919876543210",
    "profile": {
      "name": "Arun Kumar",
      "skills": ["Medical", "CPR"],
      "assets": ["Medical Kit"],
      "lat": 10.055,
      "lng": 76.649
    },
    "breakGlassLocked": true
  }
  ```

---

## 3. `incidents` (Proposed for MVP)
**Purpose**: Serves as the central intake for citizen reports and the anchor for all coordination workflows.

- **Fields & Data Types**:
  - `id` (String): Auto-generated Document ID.
  - `type` (String): Crisis category (e.g., `"Flood"`, `"Medical"`, `"Fire"`).
  - `description` (String): Raw citizen report text.
  - `location` (String): Human-readable address.
  - `lat` (Number): Latitude.
  - `lng` (Number): Longitude.
  - `priorityScore` (String/Number): AI-assigned severity (`"Critical"`, `"High"`, `"Low"`).
  - `status` (String): Current state (`"Active"`, `"Resolved"`, `"Duplicate"`).
  - `aiClassification` (Map): Structured data extracted by Gemini.
  - `duplicateOf` (String): Reference to another incident ID if flagged as duplicate.
  - `reportedAt` (Timestamp): Time of report.
- **Relationships**: 1-to-Many with `missions` (one incident spawns multiple volunteer missions).
- **Required Indexes**:
  - `status` Ascending, `reportedAt` Descending
- **Example Document**:
  ```json
  {
    "type": "Medical",
    "description": "Tree fell on a house, two people trapped and injured.",
    "location": "Aluva Town Center",
    "lat": 10.100,
    "lng": 76.350,
    "priorityScore": "Critical",
    "status": "Active",
    "aiClassification": {
      "hazards": ["Fallen Tree", "Structural Damage"],
      "victims": 2
    },
    "reportedAt": "2026-07-18T10:15:00Z"
  }
  ```

---

## 4. `missions`
**Purpose**: Tracks the lifecycle of a volunteer being dispatched to an incident.

- **Fields & Data Types**:
  - `id` (String): Auto-generated Document ID.
  - `crisisId` (String): Reference to the `incidents` collection.
  - `volunteerId` (String): Reference to the `volunteers` collection.
  - `volunteerName` (String): Denormalized volunteer name for fast querying.
  - `phone` (String): Contact number used for dispatch.
  - `primarySkill` (String): The skill matched for this specific task.
  - `assignedTask` (String): AI-generated specific instructions for the volunteer.
  - `status` (String): Current state (`"Notified"`, `"En Route"`, `"On Scene"`, `"Completed"`).
  - `statusHistory` (Array of Maps): Audit trail of status changes with timestamps.
  - `whatsappPreview` (String): The exact localized message sent to the volunteer.
  - `translatedLanguage` (String): The language the brief was sent in.
  - `createdAt` (Timestamp): Dispatch time.
- **Relationships**: Belongs to an `incident` and a `volunteer`.
- **Required Indexes**:
  - `crisisId` Ascending, `createdAt` Descending
- **Example Document**:
  ```json
  {
    "crisisId": "inc_445",
    "volunteerId": "vol_987",
    "volunteerName": "Arun Kumar",
    "primarySkill": "Medical",
    "assignedTask": "Provide immediate first aid to trapped victims.",
    "status": "En Route",
    "translatedLanguage": "Malayalam",
    "createdAt": "2026-07-18T10:20:00Z"
  }
  ```

---

## 5. `resources` (Proposed for MVP)
**Purpose**: Tracks physical assets and infrastructure separately from human volunteers to allow equipment dispatch.

- **Fields & Data Types**:
  - `id` (String): Auto-generated Document ID.
  - `type` (String): Resource category (`"Boat"`, `"Generator"`, `"Ambulance"`).
  - `ownerId` (String): Reference to a user/organization that owns it.
  - `lat` (Number): Current latitude.
  - `lng` (Number): Current longitude.
  - `status` (String): (`"Available"`, `"In Use"`, `"Maintenance"`).
  - `capacity` (Map): e.g., `{"passengers": 6}`.
- **Relationships**: Can be associated with `missions` or `incidents`.
- **Required Indexes**:
  - `type` Ascending, `status` Ascending
- **Example Document**:
  ```json
  {
    "type": "Boat",
    "ownerId": "org_112",
    "lat": 10.090,
    "lng": 76.340,
    "status": "Available",
    "capacity": { "passengers": 12 }
  }
  ```

---

## 6. System & Audit Collections

### `system_state`
- **Purpose**: Global singleton flags.
- **Fields**: `type` (e.g., "breakglass"), `breakGlassActive` (Boolean), `crisisId`, `coordinatorId`, `activatedAt`.

### `breakglass_audit`
- **Purpose**: Immutable append-only log of PII decryption events.
- **Fields**: `timestamp`, `volunteerId_hashed`, `crisisId`, `fieldsAccessed`, `coordinatorId`.
