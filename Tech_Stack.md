# Tech Stack — Road Damage Detection System

This document outlines the technology choices for this final year project, along with the rationale for each decision.

---

## AI / Machine Learning

**YOLOv8 (Ultralytics)**
YOLOv8 is the primary object detection model used to identify and classify road damage from images. It was selected for its speed-accuracy trade-off, making it suitable for near-real-time inference on uploaded images. YOLOv8 supports custom training, allowing the model to be fine-tuned on road damage datasets (e.g. RDD2022) to detect specific damage types such as cracks, potholes, and rutting. The Ultralytics library also provides a clean Python API that integrates directly with FastAPI.

---

## Backend

**FastAPI (Python)**
FastAPI serves as the REST API layer between the frontend and the AI model. It was chosen because it is Python-native (matching the YOLOv8 ecosystem), supports asynchronous request handling, and auto-generates interactive API documentation via Swagger UI. FastAPI handles image upload endpoints, triggers model inference, stores results to the database, and serves detection data to the frontend.

**SQLAlchemy (ORM)**
SQLAlchemy is used as the Object Relational Mapper to interact with PostgreSQL from Python. It provides a clean abstraction over raw SQL queries and works seamlessly with FastAPI through the `databases` or `asyncpg` async drivers.

**Alembic (Database migrations)**
Alembic manages schema migrations, allowing the database structure to evolve safely across development, staging, and production environments without manual SQL scripts.

---

## Database

**PostgreSQL**
PostgreSQL is the primary relational database, storing users, inspections, detections, damage reports, and location data. It was selected over alternatives like MySQL or SQLite for its robustness, support for JSON column types (used to store bounding box coordinates), and compatibility with the PostGIS extension for geospatial queries — which underpins the map visualization feature.

---

## Frontend

**React.js**
React.js is used to build the user-facing web interface. Its component-based architecture makes it straightforward to build reusable UI elements such as the image upload panel, detection results viewer, and damage report dashboard. React's large ecosystem provides ready-made libraries for map rendering (Leaflet.js / React-Leaflet) and chart visualization (Recharts).

**Leaflet.js / React-Leaflet**
Leaflet is used to render the interactive map showing geo-tagged damage detections. It is lightweight, open-source, and integrates well with React via the React-Leaflet wrapper.

**Axios**
Axios handles all HTTP requests from the frontend to the FastAPI backend, including image uploads and fetching detection results.

---

## DevOps & Deployment

**Docker & Docker Compose**
Docker containers are used to package each service (FastAPI backend, React frontend, PostgreSQL database) into isolated, reproducible environments. Docker Compose orchestrates all services locally with a single `docker-compose up` command, making it easy to demo the full system on any machine without environment setup issues.

**GitHub Actions (CI)**
A basic CI pipeline is configured to run linting and unit tests on every push to the `dev` branch, ensuring that broken code is caught before it reaches `main`.

---

## Development Tools

| Tool | Purpose |
|---|---|
| Python 3.11 | Backend runtime |
| Node.js 20 LTS | Frontend runtime |
| Poetry | Python dependency management |
| npm | Node package management |
| Pytest | Backend unit and integration tests |
| Jest + React Testing Library | Frontend component tests |
| ESLint + Prettier | JavaScript code style |
| Black + Flake8 | Python code style |
| Postman | Manual API testing |

---

## Architecture Overview

```
[ React Frontend ]
       │
       │ HTTP (REST)
       ▼
[ FastAPI Backend ]
       │              │
       │ SQL           │ Inference
       ▼              ▼
[ PostgreSQL ]    [ YOLOv8 Model ]
```

All services are containerised with Docker and communicate over an internal Docker network. The frontend is served via a Nginx container in production.

---

*Last updated: Week 1 — Phase 1 Setup & Planning*
