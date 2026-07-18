# RakshaLink Backend

AI-powered disaster response coordination platform — backend API.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Copy the example environment file and fill in your keys
cp .env.example .env

# Run the development server
uvicorn api.main:app --reload
```

## Endpoints

| Method | Path      | Description              |
|--------|-----------|--------------------------|
| GET    | /         | Root — confirms API is up |
| GET    | /health/  | Health check              |

## Project Structure

```
backend/
├── api/
│   ├── main.py          # FastAPI application entry point
│   ├── config.py         # Environment variable configuration
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic and external integrations
│   ├── models/           # Pydantic data models (Firestore documents)
│   ├── schemas/          # Request / response schemas
│   └── utils/            # Shared utilities (logging, helpers)
├── requirements.txt
├── .env.example
└── README.md
```
