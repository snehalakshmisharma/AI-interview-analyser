# AI Placement Interview Analyzer

A full-stack mock interview and assessment platform for students, with faculty tools for monitoring interview performance.

## Features

- Student accounts with email/password, optional Google OAuth, and configurable OIDC single sign-on.
- Interview setup for HR, technical, behavioral, and mixed interviews, with text, audio, and video response modes.
- Question-aware evaluation with nine score dimensions, feedback, and placement-readiness indicators.
- Interview history, performance trends, and faculty dashboards.
- Local speech transcription using Faster-Whisper. Live captions are previews; the submitted recording is transcribed separately for evaluation.
- Demo evaluation mode that works without an AI API key, and optional Gemini evaluation in real mode.

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL 15, Drizzle ORM, and Drizzle Kit
- Faster-Whisper service (FastAPI) for audio/video transcription
- Docker Compose for the app, database, and transcription service

## Prerequisites

For local development, install:

- Node.js 20 or later and npm
- PostgreSQL 15, or Docker Desktop with the Compose plugin

Docker Desktop is required to run Postgres or Whisper through Compose. The first Whisper startup downloads the selected model and can take several minutes; model files are cached in a Docker volume.

## Quick Start: Local Development

The commands below run the Next.js app on your machine and PostgreSQL in Docker. Whisper is optional for text interviews and can be started separately for audio/video transcription.

1. Install dependencies and create your local environment file:

   ```powershell
   npm ci
   Copy-Item .env.example .env
   ```

   On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`.

2. Start PostgreSQL:

   ```powershell
   docker compose up -d postgres
   ```

   The Compose database defaults to `postgres` / `postgres`, database `app_db`, port `5432`. The example `DATABASE_URL` connects to this database from the host.

   If you already have PostgreSQL running locally, skip Docker and update `DATABASE_URL` in `.env` to match your local database and credentials.

3. Apply the Drizzle schema:

   ```powershell
   npx drizzle-kit push
   ```

4. Start the app:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. (Optional) Start local transcription in a second terminal:

   ```powershell
   docker compose up --build whisper
   ```

   The app uses `http://localhost:8001/transcribe`; the browser connects to `ws://localhost:8001/live` for live caption previews.

## Quick Start: Full Docker Compose Stack

This starts the app, PostgreSQL, and Whisper. Compose reads `.env` for variable substitution, so create it first:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

The first Whisper build/start may take several minutes while Docker downloads the model. Once the services are ready, apply the database schema and seed sample data:

```powershell
docker compose exec app npx drizzle-kit push
```

Set a non-empty `SEED_SECRET` in `.env`, then seed the questions and demo accounts:

```powershell
curl.exe -X POST http://localhost:3000/api/seed -H "x-seed-secret: your-seed-secret"
```

Open [http://localhost:3000](http://localhost:3000). Useful service commands:

```powershell
docker compose ps
docker compose logs -f app
docker compose down
```

`docker compose down` preserves the database and Whisper model volumes. To delete the persisted database and downloaded model as well, use `docker compose down -v` (this permanently deletes that data).

### Compose Services and Ports

| Service | Purpose | Host address |
| --- | --- | --- |
| `app` | Next.js web app and API | `http://localhost:3000` |
| `postgres` | PostgreSQL 15 | `localhost:5432` |
| `whisper` | Transcription API | `http://localhost:8001` |

The app container connects to Postgres by the Compose service name `postgres` and to Whisper at `http://whisper:8000/transcribe`. The browser uses the host-published Whisper address for live captions. PostgreSQL data is stored in the `postgres_data` volume; Whisper models are stored in `whisper_models`.

## Environment Configuration

Copy `.env.example` to `.env`. For local development, review these values:

| Variable | Purpose | Default / guidance |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Example uses `postgresql://postgres:postgres@127.0.0.1:5432/app_db`; inside Compose the app uses the `postgres` service address. |
| `JWT_SECRET` | Signs authentication cookies | Replace the example value with a long random secret. |
| `AI_MODE` | Evaluation mode | `demo` (default) or `real`. |
| `GEMINI_API_KEY` | Gemini evaluation API key | Required for `AI_MODE=real`; create a key in Google AI Studio. |
| `GEMINI_MODEL` | Gemini model name | Defaults to `gemini-2.5-flash`. |
| `NEXT_PUBLIC_AI_MODE` | Mode label shown by the client | Keep in sync with `AI_MODE` when changing modes. |
| `WHISPER_API_URL` | Server-side transcription endpoint | Host development: `http://localhost:8001/transcribe`; Compose sets the internal service URL. |
| `WHISPER_MODEL` | Faster-Whisper model size | `base` by default; `tiny` uses fewer resources, while `small` is slower and may improve accuracy. |
| `NEXT_PUBLIC_APP_URL` | Public app URL used in auth flows | `http://localhost:3000` locally. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials | Optional; configure both to enable Google login. |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback | `http://localhost:3000/api/auth/oauth/google/callback` locally. |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER_URL` | OIDC SSO credentials | Optional; set for your identity provider. |
| `OIDC_REDIRECT_URI` | OIDC callback | `http://localhost:3000/api/auth/sso/callback` locally. |
| `SEED_SECRET` | Protects the seed endpoint outside development | Set a private value before using the endpoint in Docker/production. |

Compose uses its own `postgres` service URL and local development database credentials. Change the database credentials in `docker-compose.yml` and the app connection URL together before exposing the stack beyond local development. Do not commit `.env` or use the development credentials in production.

## Seed Data and Demo Accounts

The seed endpoint inserts the starter question bank and these accounts if they do not already exist:

- Student: `student@demo.com` / `demo123`
- Faculty: `faculty@demo.com` / `demo123`

In local development, seed with:

```powershell
curl.exe -X POST http://localhost:3000/api/seed
```

In Docker or any production-mode deployment, the endpoint requires `SEED_SECRET` and the `x-seed-secret` request header as shown above. Change or remove the demo accounts before using a deployed instance with real users.

## Google OAuth and OIDC Setup

### Google OAuth

1. Create a Web OAuth client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:3000/api/auth/oauth/google/callback` as an authorized redirect URI.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `.env`.

### OIDC single sign-on

1. Register the application with your OIDC provider (for example, Microsoft Entra ID).
2. Add `http://localhost:3000/api/auth/sso/callback` as a redirect URI.
3. Set `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER_URL`, and `OIDC_REDIRECT_URI`.

For other environments, use the matching deployed app URL in the provider configuration and environment variables.

## AI and Speech Behavior

- `AI_MODE=demo` evaluates answers with local heuristics and makes no Gemini evaluation request.
- `AI_MODE=real` uses Gemini and requires `GEMINI_API_KEY`; if no supported key is present, evaluation falls back to demo heuristics.
- Faster-Whisper transcription runs locally and is independent of the evaluation mode. It does not need an external transcription API key.
- Live captions are generated from overlapping audio windows and may lag. They are previews; the final uploaded recording is transcribed separately by the server.
- Whisper runs on CPU with `int8` in the provided Compose configuration. Choose a smaller model for lower resource use or a larger model for potentially better accuracy.

## Database Workflow

The Drizzle schema is defined in `src/db/schema.ts`, with configuration in `drizzle.config.ts`. For local development, apply schema changes with:

```powershell
npx drizzle-kit push
```

For the Docker app, run the same command inside the container:

```powershell
docker compose exec app npx drizzle-kit push
```

The checked-in SQL files are migration history; `drizzle-kit push` is the current development workflow. Back up persistent data before applying schema changes to a database you care about.

## Tests and Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Security and Deployment Notes

- Use unique, strong values for `JWT_SECRET`, database credentials, and `SEED_SECRET` outside local development.
- Keep secrets in the deployment platform's secret manager; never commit `.env`.
- The seed endpoint is protected by `SEED_SECRET` when `NODE_ENV` is not `development`.
- Uploaded recordings are stored under `public/uploads`; the Compose app mounts this directory from the host. Configure durable, private storage and retention controls before production use.
- The provided Compose configuration is intended for local development. Add TLS, managed secrets, backups, resource limits, durable/private upload storage, and an appropriately hosted Whisper service before production deployment.
- Audio/video capture requires browser permission and support for the relevant recording APIs.

## License

Educational project. Review the code and deployment configuration for your requirements before production use.
