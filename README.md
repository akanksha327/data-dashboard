# Data Dashboard

A full-stack dashboard project split into two independent applications:

- `frontend/` - Next.js dashboard UI running on `http://localhost:3000`
- `backend/` - Node.js + Express API running on `http://localhost:5000`

The frontend talks to the backend over HTTP, so each side can be developed, deployed, and scaled independently.

## Project Structure

```text
project-root/
├── frontend/        # Next.js app
│   ├── scripts/     # Frontend-local tooling
│   ├── src/
│   └── package.json
├── backend/         # Express API
│   ├── scripts/     # Backend-local tooling
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Frontend

The frontend owns:

- dashboard shell
- auth screens
- charts and insights views
- API calls to the backend using `fetch`
- local tooling in `frontend/scripts/`

Environment:

```bash
cd frontend
cp .env.example .env.local
```

Start in development:

```bash
cd frontend
npm install
npm run dev
```

Production commands:

```bash
cd frontend
npm run build
npm start
```

Default local URL: `http://localhost:3000`

## Backend

The backend owns:

- CORS configuration
- CSV upload parsing
- dataset storage
- `/upload` and `/query` API routes
- AI services and data processing
- local tooling in `backend/scripts/`

Environment:

```bash
cd backend
cp .env.example .env
```

Start in development:

```bash
cd backend
npm install
npm run dev
```

Production command:

```bash
cd backend
npm start
```

Default local URL: `http://localhost:5000`

## API Flow

Upload a CSV:

```http
POST /upload
Content-Type: multipart/form-data
```

Query the uploaded dataset:

```http
POST /query
Content-Type: application/json
```

Frontend example:

```ts
await fetch('http://localhost:5000/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    datasetId,
    question,
  }),
});
```

## Development Notes

- Frontend and backend run independently.
- The legacy root `.zscripts/` folder has been removed in favor of app-local scripts.
- `frontend/scripts/run-next.js` owns Next.js command execution.
- `backend/scripts/run-backend.js` owns backend start and dev execution.
- Generated dataset files are ignored by git.
