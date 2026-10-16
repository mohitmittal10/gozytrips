# Wander Labs - AI Travel Architect

Welcome to Wander Labs, a travel planning application powered by AI. This project uses Next.js and Google's Gemini to generate personalized travel itineraries, plus CRM and client portal tools for agents.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **AI**: [Genkit](https://firebase.google.com/docs/genkit) + Google Gemini (via authenticated server actions)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Postgres, RLS)
- **Styling**: Tailwind CSS + ShadCN UI
- **Payments**: Razorpay (optional)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- A Supabase project

### Setup

```bash
npm install
```

Create a `.env` file (never commit real secrets):

```env
# AI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# App origin (required for invoice / share links)
NEXT_PUBLIC_APP_URL="http://localhost:9002"

# Security
CRON_SECRET="long-random-string"
TOKEN_TRACKER_SECRET="long-random-string"

# Optional integrations
UNSPLASH_ACCESS_KEY=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
RAZORPAY_PLAN_ID_PRO=""
RAZORPAY_PLAN_ID_AGENCY=""
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
BACKUP_CRON_CONCURRENCY="5"
```

See [ENV_REFERENCE.md](ENV_REFERENCE.md) and [TODO_BACKUP_CRON.md](TODO_BACKUP_CRON.md) for details.

### Run

```bash
npm run dev          # http://localhost:9002
npm run typecheck
npm run test
npm run lint
```

Optional Genkit Dev UI (local only; production uses server actions):

```bash
npm run genkit:watch
```

## Security notes

- Rotate any API keys that were ever committed to git history.
- `/api/backup/cron` requires `CRON_SECRET` (fail-closed). Prefer `Authorization: Bearer …`.
- `/api/token-stats` requires a logged-in session or `x-api-key: TOKEN_TRACKER_SECRET`.
- `/api/genkit/*` is disabled (410) — flows run through authenticated server actions only.
