# SUST GPA Calculator

A GPA and grade tracker built for Mathematics students at Shahjalal University of Science and Technology (SUST), Bangladesh.

Live app: [https://about-myself--iamsaad236.replit.app](https://about-myself--iamsaad236.replit.app)

Built by **Saad** — Mathematics student at SUST.

---

## Features

- Track courses, credits, and grades semester by semester
- Enter marks (0–100) or select a grade letter directly (A+, A, B+, etc.)
- SUST / Bangladesh public university grading scale (A+ = 4.00, F = 0.00)
- Cumulative GPA calculated automatically
- GPA progression chart across semesters
- Google login — data syncs to the cloud from any device
- Works without login too (browser storage)

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Zustand, Framer Motion, Recharts
- **Backend:** Node.js, Express, Drizzle ORM
- **Database:** PostgreSQL
- **Auth:** Google OAuth 2.0

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/sust-gpa-calculator.git
cd sust-gpa-calculator
```

### 2. Install dependencies

```bash
npm install -g pnpm
pnpm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

You need:
- A **PostgreSQL** database (local or cloud)
- A **Google OAuth 2.0** Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com)
  - Set the redirect URI to: `http://localhost:3000/api/auth/google/callback`

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Start the development servers

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in a separate terminal)
pnpm --filter @workspace/gpa-calculator run dev
```

The app will be available at `http://localhost:5173` (or whichever port Vite picks).

---

## Grading Scale

| Marks | Grade | Points |
|-------|-------|--------|
| 80–100 | A+ | 4.00 |
| 75–79 | A | 3.75 |
| 70–74 | A- | 3.50 |
| 65–69 | B+ | 3.25 |
| 60–64 | B | 3.00 |
| 55–59 | B- | 2.75 |
| 50–54 | C+ | 2.50 |
| 45–49 | C | 2.25 |
| 40–44 | D | 2.00 |
| Below 40 | F | 0.00 |
