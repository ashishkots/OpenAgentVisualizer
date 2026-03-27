# Product: OpenAgentVisualizer

## Project Context
OpenAgentVisualizer is a gamified virtual world for AI agent management. It provides real-time 2D/3D visualization of agent workflows, interactive topology graphs, animated state machines, and an immersive dashboard for monitoring multi-agent systems.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Python 3.11+ / FastAPI / SQLAlchemy 2.x / Alembic
- Database: PostgreSQL 15+
- Infrastructure: Docker Compose (local), GitHub Actions CI/CD
- Key Libraries: @pixi/react + pixi.js (2D rendering), @rive-app/canvas (animations), xstate/@xstate/react (state machines), gsap (animation), reactflow (node graphs), celery, opentelemetry-proto, protobuf, grpcio, orjson, uuid7, zustand, @tanstack/react-query, recharts, vitest, @testing-library/react

## Coding Standards
- Backend: Python — PEP 8, type hints, Pydantic models for I/O
- Frontend: TypeScript strict mode, ESLint + Prettier
- Naming: snake_case (Python), camelCase (TS), PascalCase (components)
- Testing: pytest (backend), Vitest (frontend); 80% coverage target
- Comments: docstrings for public APIs only

## Architecture Patterns
- Clean Architecture: routers -> services -> models
- Component-based frontend: pages -> components -> ui
- Repository pattern for data access
- Canvas-based rendering with PixiJS scene graph
- State machine driven agent visualization (XState)

## File Organization
src/backend/app/ — core/, models/, routers/, schemas/, services/
src/frontend/src/ — api/, components/, pages/, types/, lib/

## Git Conventions
- Branch: feature/{ticket}-{desc}, fix/{ticket}-{desc}
- Commit: conventional commits
- PR required for main merges

## Default Credentials (Dev)
- Email: kotsai@gmail.com / Password: kots@123

## Known Fixes
- Pin bcrypt==4.0.1
- Add email-validator==2.2.0
- Never name SQLAlchemy column "metadata"
- Frontend: npm install (not npm ci)
