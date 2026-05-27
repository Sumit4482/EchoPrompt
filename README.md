# EchoPrompt

AI prompt builder with template management, Gemini integration, and user accounts.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind
- **Backend:** Node.js, Express, MongoDB
- **Auth:** JWT

## Setup

```bash
# Frontend
cp .env.example .env
npm install
npm run dev

# Backend
cd backend
cp env.example .env
npm install
npm run dev
```

## Environment

| Variable | Location | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Frontend `.env` | API base URL (e.g. `http://localhost:3001/api`) |
| `MONGODB_URI` | Backend `.env` | MongoDB connection string |
| `JWT_SECRET` | Backend `.env` | Secret for signing tokens |
| `GEMINI_API_KEY` | Backend `.env` | Google Gemini API key |
| `CORS_ORIGIN` | Backend `.env` | Allowed frontend origins (comma-separated) |

## Production

Deploy with [render.yaml](./render.yaml):

```bash
npm run build          # frontend
cd backend && npm run build && npm start
```

Set `CORS_ORIGIN` and `VITE_API_URL` to your deployed URLs before going live.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `cd backend && npm run dev` | Start backend with hot reload |
| `cd backend && npm run seed` | Seed database with sample data |
