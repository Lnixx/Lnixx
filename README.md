# Bookly

A local-services booking marketplace: coaches, barbers, painters (دهان), plumbers (سباكة), car tinting (تضليل), electricians, cleaning, and AC techs. Providers create a free profile with a portfolio; customers browse, book a time slot, and confirm — all in a few taps.

## Features

- Browse by category (bilingual English/Arabic labels)
- Provider profile pages with bio, rating, and portfolio gallery
- Booking flow: pick a day, pick a time, enter details, confirm (demo payment)
- "Become a Pro" signup form so any provider can list their own services

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
