# Falkvard Tattoo — Setup Guide

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key (for ChatKit sessions) | Yes |
| `CHATKIT_WORKFLOW_ID` | Agent Builder workflow ID | Yes |
| `ADMIN_PASSWORD` | Password for /admin dashboard | Yes |
| `JWT_SECRET` | Secret for signing admin JWT tokens | Yes |
| `AGENT_SECRET` | Shared secret between Agent Builder webhook and this server | Recommended |
| `RESEND_API_KEY` | Resend API key for email notifications | Optional |
| `OWNER_EMAIL` | Andrea's email for booking notifications | Optional |
| `DB_PATH` | Path to SQLite database file (default: `data/falkvard.db`) | No |

## Running

```bash
# Development (hot reload on port 3333)
docker compose up dev

# Production (port 3000)
docker compose up prod
```

## Admin Dashboard

1. Go to `http://localhost:3333/admin`
2. Log in with `ADMIN_PASSWORD`
3. View, approve, or reject bookings
4. Bookings created via the AI chat show an "AI" badge

## AI Chat Agent Setup

See `AGENT_INSTRUCTION.md` for the full system prompt and tool schemas.

### Quick Setup

1. Open [Agent Builder](https://platform.openai.com/agent-builder)
2. Create/edit workflow `wf_69986468ba408190b6838fe0ec0698f00e63a8a725890aee`
3. Paste the system prompt from `AGENT_INSTRUCTION.md`
4. Enable **DALL-E / Image Generation** tool
5. Add a **Function** tool named `create_booking` with the schema from the instruction doc
6. Set the function webhook URL to `https://YOUR_DOMAIN/api/agent/booking`
7. Add `Authorization: Bearer YOUR_AGENT_SECRET` header to the webhook
8. Deploy the workflow

### How It Works

```
Customer opens chat → ChatKit widget → Creates session via /api/chatkit/session
                                      → Connects to Agent Builder workflow
                                      → Agent chats, generates designs (DALL-E)
                                      → Agent calls create_booking webhook
                                      → Booking appears in /admin/dashboard
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/chatkit/session` | Public | Creates ChatKit session |
| POST | `/api/bookings` | Public | Create booking (web form) |
| GET | `/api/bookings` | Admin | List all bookings |
| GET | `/api/bookings/:id` | Admin | Get single booking |
| PATCH | `/api/bookings/:id` | Admin | Update booking status |
| POST | `/api/admin/login` | Public | Admin login (returns JWT) |
| POST | `/api/agent/booking` | Agent | Create booking (AI agent webhook) |
