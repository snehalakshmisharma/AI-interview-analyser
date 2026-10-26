# AI Placement Interview Analyzer

**AI Interview Scoring and Communication Analytics**

Professional placement interview practice and assessment platform for college students, with faculty monitoring.

> Practice smarter. Understand your performance. Improve your interview readiness.

## Problem Statement
College students need realistic mock interviews and structured feedback before placements. Existing tools lack question-aware technical evaluation, communication analytics, and placement readiness indicators.

## Features

### Student
- **Interview Setup**: Type (HR, Technical, Behavioral, Mixed), Difficulty (Beginner/Intermediate/Advanced), Mode (Text/Audio/Video), Category (General, CS, Data Science/AI, Software Dev, Custom), Questions (5/10/15)
- **Interview Flow**: Timer, question display, expected concepts, text/audio/video response, recording controls
- **AI Evaluation**: 9 dimensions - Technical, Relevance, Communication, Fluency, Grammar, Vocabulary, Problem Solving, Structure, Confidence
- **Reports**: Dimension-wise scores, strengths, improvement areas, missing concepts, recommendations, question-wise analysis
- **Analytics**: Score trends, category performance, radar charts, placement readiness indicator
- **History**: Search, filter, sort interviews

### Faculty / Admin
- Dashboard: Total students, interviews, average scores
- Student list with search/filter, placement readiness
- Student detail: profile, interview history, trends
- View all reports

### AI / Speech
- **Speech-to-Text**: Local Faster-Whisper transcribes submitted audio/video recordings; live captions use local CPU inference when available
- **Live Caption Fallback**: Browser speech recognition may show temporary captions if local Whisper is unavailable; fallback captions are not saved or used for evaluation
- **Speech Analysis**: Duration, speaking rate (wpm), pause count, filler words, fluency, confidence
- **Question-aware Evaluation**: Uses question + expected concepts + guidance + transcript
- **Demo Mode**: Clearly marked mock outputs when AI not configured; real mode uses OpenAI
- **Validation**: All scores clamped 0-100, malformed AI responses handled gracefully

### Auth & Security
- Email/password with bcrypt hashing
- Google OAuth 2.0 (real flow, state validation)
- OIDC SSO abstraction (Google Workspace, Microsoft Entra ID, any OIDC provider)
- JWT httpOnly cookies, 7d expiry, secure in prod
- Role-based access: STUDENT, FACULTY, ADMIN
- Backend authorization enforced (not just frontend)
- File validation, size limits, safe filenames

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide React, Recharts
- **Backend**: Next.js API Routes (fullstack), Drizzle ORM, PostgreSQL
- **AI**: OpenAI-compatible API, Whisper STT, heuristic fallback for demo
- **Auth**: jose JWT, bcryptjs, OAuth 2.0, OIDC
- **Deployment**: Docker, Docker Compose, Vercel-ready

## Architecture
```
/src
  /app
    /api - REST APIs (auth, questions, interviews, faculty, performance, seed)
    /(auth)/login, register
    /dashboard, /interview, /history, /performance, /faculty
  /components/ui - Button, Card, Input, Badge, Navbar
  /lib - auth, scoring, ai-evaluation, speech, oauth, seed-questions, utils
  /db - schema, index
```

## Database Models
- **users**: id, name, email, password_hash, role, department, year, skills
- **oauth_accounts**: user_id, provider, provider_account_id
- **questions**: question_text, category, difficulty, interview_type, expected_concepts[], evaluation_guidance, time_limit
- **interviews**: student_id, type, category, difficulty, mode, status, overall/technical/communication scores, placement_readiness
- **interview_questions**: interview_id, question_id, sequence
- **responses**: interview_question_id, response_type, text_content, audio_path, video_path, transcript, duration
- **speech_analyses**: response_id, duration, speaking_rate, pause_count, filler_words, fluency, confidence
- **evaluations**: response_id, 9 dimension scores, overall, explanation, strengths[], improvement_areas[], missing_concepts[], recommendations[]

## Scoring Configuration
Centralized in `src/lib/scoring.ts`:
- Technical 25%, Relevance 15%, Communication 15%, Fluency 10%, Grammar 10%, Vocabulary 5%, Problem Solving 10%, Structure 5%, Confidence 5%
- Placement Readiness: technical 50%, communication 30%, overall 20% -> level: Highly Ready (85+), Ready (70+), Moderately Ready (55+), Developing (40+), Needs Improvement

## Installation

### Prerequisites
- Node.js 18+, PostgreSQL 14+

### Local Setup
```bash
git clone <repo>
npm install
cp .env.example .env
# Edit .env with DATABASE_URL, JWT_SECRET
npx drizzle-kit push
npm run dev
```

### Seed Data
```bash
curl -X POST http://localhost:3000/api/seed
# Or auto-seeds on dashboard load
```

Demo accounts:
- Student: student@demo.com / demo123
- Faculty: faculty@demo.com / demo123

### Environment Variables
See `.env.example`:
- `DATABASE_URL` - Postgres connection
- `JWT_SECRET` - min 32 chars
- `AI_MODE` - demo | real
- `GEMINI_API_KEY` - for real AI evaluation
- `WHISPER_API_URL` - local faster-whisper service URL
- `WHISPER_MODEL` - Whisper model size (default: `base`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER_URL`, `OIDC_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`

## OAuth Setup

### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web)
3. Authorized redirect: `http://localhost:3000/api/auth/oauth/google/callback`
4. Set env vars

### OIDC SSO (e.g., Microsoft Entra ID)
1. Register app in Entra ID
2. Set redirect: `http://localhost:3000/api/auth/sso/callback`
3. Get issuer URL (e.g., `https://login.microsoftonline.com/{tenant}/v2.0`)
4. Set OIDC_* env vars

Provider abstraction in `src/lib/oauth.ts` - add new providers by extending getOIDCAuthUrl.

## API Documentation

### Auth
- POST /api/auth/register - {name,email,password,role,department,year}
- POST /api/auth/login - {email,password}
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/auth/oauth/google - redirects to Google
- GET /api/auth/oauth/google/callback
- GET /api/auth/sso - redirects to OIDC provider
- GET /api/auth/sso/callback

### Questions
- GET /api/questions?category=&difficulty=&type=
- POST /api/questions (faculty only)

### Interviews
- POST /api/interviews - {type,category,difficulty,mode,totalQuestions}
- GET /api/interviews?studentId=
- GET /api/interviews/{id}
- POST /api/interviews/{id}/responses - JSON or multipart (file)
- POST /api/interviews/{id}/complete

### Reports & Analytics
- GET /api/performance/me
- GET /api/faculty/students
- GET /api/faculty/students/{id}
- GET /api/config
- POST /api/seed

## Speech & AI Configuration

### Demo Mode (default)
- Heuristic scoring based on word count, concept coverage, structure
- AI evaluation uses no external API calls
- Visible "Demo Mode" badge
- Audio/video responses are transcribed by the local Whisper service

### Real Mode
Set `AI_MODE=real` and configure `GEMINI_API_KEY` to use Gemini for evaluation. Local Faster-Whisper transcription works independently of `AI_MODE` and does not require a transcription API key.

### Start Local Whisper
Docker Desktop is required on Windows. The first start downloads the selected Whisper model and may take several minutes; subsequent starts reuse the cached model in the `whisper_models` volume. The service uses CPU inference with `int8` by default and publishes port `8001` on loopback for local HTTP transcription and live captions. No OpenAI API key is needed.

For local development with `npm run dev`, start only the transcription service:
```bash
docker compose up --build whisper
```
The app connects to `http://localhost:8001/transcribe` for final recording transcription and `ws://localhost:8001/live` for live audio/video captions. To run the full stack in Docker Compose, use `docker compose up --build`; the app container uses the internal Whisper service address for final transcription, while the browser uses the host-published port for live captions.

Live captions are emitted from overlapping six-second audio windows, then refreshed every four seconds. CPU latency varies by machine and model size; this is near-real-time windowed decoding, not token-by-token streaming. Live captions are a preview only. The completed recording is transcribed separately by the server, and only that server-generated transcript is persisted and evaluated.

Set `WHISPER_MODEL=tiny` for faster, lower-resource transcription, or `WHISPER_MODEL=small` for better accuracy at higher CPU and memory cost. The default `base` model uses CPU inference.

## File Storage
- Local: `public/uploads/` (gitignored, created at runtime)
- Validates MIME, size 25MB max, safe UUID filenames
- Abstraction ready for S3/GCS extension

## Responsive Design
Tested breakpoints: 1920, 1440, 1024, 768, 480, 390, 360
- Desktop: full sidebar, multi-column, tables
- Tablet: collapsible nav, responsive grids
- Mobile: hamburger, stacked cards, touch-friendly, no horizontal overflow

## Security
- Password hashing bcrypt 12 rounds
- JWT httpOnly, secure, sameSite lax
- OAuth state validation, CSRF protection
- Role enforcement on backend
- File type/size validation
- No secrets in frontend

## Known Limitations
- Video analysis: No facial/emotion detection (intentionally excluded per spec - would be unreliable without proper ML pipeline)
- Speech metrics: Estimated from transcript when duration not provided; "Not available" shown when unreliable
- Live captions: Local CPU Whisper updates in overlapping windows, so captions may lag speech; browser fallback captions are preview-only
- Audio recording: Browser-dependent, requires permission
- AI evaluation: Requires GEMINI_API_KEY for real LLM evaluation; demo uses heuristics clearly marked

## Future Enhancements
- Cloud storage (S3) for recordings
- More question categories and adaptive difficulty
- Peer review and faculty comments
- Resume analysis integration
- Detailed speech fluency with actual audio processing (e.g., using Web Audio API for pause detection)
- WebSocket for real-time interview coaching

## Testing
Manual testing checklist:
- [x] Registration, login, logout
- [x] Google OAuth when configured
- [x] SSO when configured
- [x] Role isolation (student cannot access faculty APIs)
- [x] Interview creation, text response, evaluation
- [x] Audio recording (browser)
- [x] Report generation, history, performance
- [x] Faculty dashboard
- [x] Responsive layouts
- [x] Error handling (mic denied, API failure)

## Deployment

### Docker
```bash
docker-compose up --build
# App at http://localhost:3000, Postgres at 5432
```

### Vercel (Frontend)
- Set env vars in Vercel dashboard
- Add DATABASE_URL pointing to managed Postgres (e.g., Neon, Supabase)

### Render (Backend equivalent)
- This is fullstack Next.js, so same Docker image works
- Ensure DATABASE_URL and JWT_SECRET set

## License
Educational project - not for production without security audit.
