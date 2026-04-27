# Aplicatie de inventariere si monitorizare datacenter

## Getting started

1. **Lansarea aplicatiei**

   ```bash
   docker compose up --build
   ```

2. **Accesarea aplicatiei**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
   - Backend Admin: [http://localhost:8000/admin](http://localhost:8000/admin)

## Structura Proiect

- `backend/`: Django + Django Ninja + PostgreSQL
- `frontend/`: React + Vite + TailwindCSS
- `docker-compose.yml`: Service orchestration

## Development

- Backend-ul foloseste volume docker pentru a permite modificari instantanee.
- Frontend-ul foloseste Vite HMR (Hot Module Replacement).
