# Bookly

A local-services booking marketplace: coaches, barbers, painters (دهان), plumbers (سباكة), car tinting (تضليل), electricians, cleaning, and AC techs. Providers create a free profile with a portfolio; customers browse, book a time slot, and confirm — all in a few taps.

## Features

- Browse by category (bilingual English/Arabic labels)
- Provider profile pages with bio, rating, and portfolio gallery
- Booking flow: pick a day, pick a time, enter details, confirm (demo payment)
- "Become a Pro" signup form so any provider can list their own services

## AI front desk

Every provider page has a chat that answers customer questions and books appointments on the provider's behalf (English and Arabic).

- The agent can do three things only: check free times, reserve a slot, and pass a question to the owner. Dates, free slots and phone numbers are validated in code (`src/lib/agent/tools.ts`), so the model cannot create a bad or double booking.
- Agent bookings are stored as `reserved` (customer pays at the appointment).
- Providers see what the agent did at `/provider/<id>/inbox`: questions waiting for them, bookings, and chat transcripts.
- Conversations are stored in SQLite and replayed on each message (`src/lib/agent/engine.ts`).

Configuration (environment variables):

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Required for the chat to answer. Without it the chat reports that the assistant is unavailable. |
| `AGENT_MODEL` | Optional. Claude model ID, default `claude-opus-5-5`. |
| `INBOX_KEY` | Opens the inbox as `/provider/<id>/inbox?key=<INBOX_KEY>`. Without it the inbox is open in development and hidden in production. |

`npm run test:agent` runs the agent loop and its booking rules against a scripted stand-in for the model (no API key needed).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored in a local SQLite database (`data/app.db`, auto-created and seeded with sample providers on first run — not committed to git).

## Notes

- Payment on the booking form is simulated (no real card is charged) — wiring up a real processor like Stripe would need your own merchant account and API keys.
- Portfolio photos are generated as local placeholders; providers can paste their own photo URLs when creating a profile.
