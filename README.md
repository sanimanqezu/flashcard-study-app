# Flashcard Study App

[![CI](https://github.com/sanimanqezu/flashcard-study-app/actions/workflows/ci.yml/badge.svg)](https://github.com/sanimanqezu/flashcard-study-app/actions/workflows/ci.yml)

A full-stack spaced repetition flashcard application built for efficient memorization. Study smarter — not longer — by reviewing cards exactly when you're about to forget them.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Java 25, Spring Boot 3.5.16, Spring Security, JJWT 0.12.3 |
| Database | PostgreSQL 16, Flyway migrations                |
| ORM      | Spring Data JPA + Hibernate                     |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| State    | Zustand                                         |
| Auth     | JWT (stateless)                                 |

---

## Spaced Repetition Algorithm

This app implements a simplified **SM-2** (SuperMemo 2) algorithm — the same algorithm that powers Anki.

### How It Works

Each card tracks three values:
- **easeFactor** — how easy the card is (default: 2.5, min: 1.3)
- **interval** — how many days until the next review (default: 1)
- **repetitions** — how many times the card has been answered correctly in a row

When you rate a card after studying, one of four ratings is applied:

| Rating | Value | Meaning              |
|--------|-------|----------------------|
| Again  | 0     | Complete blackout    |
| Hard   | 1     | Incorrect, but familiar |
| Good   | 3     | Correct with effort  |
| Easy   | 5     | Perfect recall       |

### Algorithm Logic

```
If rating < 3 (AGAIN or HARD):
  repetitions = 0
  interval    = 1
  nextReview  = today

If rating >= 3 (GOOD or EASY):
  repetitions = repetitions + 1
  interval    = repetitions == 1 ? 1
              : repetitions == 2 ? 6
              : round(interval * easeFactor)
  easeFactor  = max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  nextReview  = today + interval days
```

**Result:** Cards you find easy are pushed far into the future. Cards you struggle with come back tomorrow. This minimizes total study time while maximizing retention.

---

## Key Design Points

- **Stateless JWT security** — a single `SecurityFilterChain` runs a `JwtAuthFilter` before the username/password filter; sessions are `STATELESS` and only `/api/auth/**` is public.
- **Ownership enforced in the service layer** — every deck/card lookup goes through `getDeckForUser` / `getCardForUser`, which raise `AccessDeniedException` when the authenticated user does not own the resource, so controllers never leak another user's data.
- **Centralized exception handling** — a single `@RestControllerAdvice` maps domain exceptions to HTTP status with a consistent JSON error body (`timestamp`, `status`, `message`, optional `details`): validation → 400, `NoSuchElementException` → 404, `AccessDeniedException` → 403, `BadCredentialsException` → 401.
- **Pure, testable algorithm** — `applySpacedRepetition` mutates a `Card` with no I/O, making the SM-2 schedule fully unit-testable in isolation.
- **Schema owned by Flyway** — production runs with `ddl-auto: validate` against Flyway-managed migrations; Hibernate never alters the live schema.

---

## Features

- **JWT Authentication** — register, login, stateless sessions
- **Deck Management** — create, edit, delete decks with descriptions
- **Card Management** — add/delete flashcards per deck
- **Study Mode** — interactive card flip with CSS 3D animation
- **4-Button Rating System** — Again / Hard / Good / Easy
- **Progress Dashboard** — total cards, due today, learned count, mastery %
- **Study Sessions** — tracked start/end time, cards reviewed, accuracy
- **Spaced Repetition** — SM-2 algorithm schedules the next review per card

---

## Getting Started

### Prerequisites
- Java 25+
- Node.js 22+
- PostgreSQL 16+ (or Docker)

### Run with Docker Compose

```bash
# Clone and start everything
git clone <repo-url>
cd flashcard-study-app
docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8080

### Run Locally

**Backend**

The backend connects to a centralized PostgreSQL instance, configured entirely through environment variables (sensible `localhost` defaults are provided in `application.yml`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `flashcard_db` | Database name |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | dev fallback | HS256 signing key |

```bash
# 1. Point the app at your centralized Postgres (skip for localhost defaults):
export DB_HOST=... DB_PORT=5432 DB_NAME=flashcard_db DB_USERNAME=... DB_PASSWORD=...

# ...or run a throwaway instance locally:
docker run -d --name pg -e POSTGRES_DB=flashcard_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

# 2. Flyway applies migrations on boot, then start the API:
cd backend
mvn spring-boot:run
```

**Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Tests

```bash
cd backend
mvn test
```

The backend suite has **26 tests** across three layers, all self-contained (no real database or network — an in-memory H2 datasource backs the Spring context):

| Layer | Class | What it covers |
|-------|-------|----------------|
| Algorithm | `SpacedRepetitionTest` (8) | Every SM-2 case: AGAIN/HARD reset, GOOD first/second/third repetitions, EASY ease-factor increase, ease-factor floor (1.3), and a multi-step progression sequence |
| Service | `CardServiceTest` (10) | `@ExtendWith(MockitoExtension.class)` — happy paths, not-found (`NoSuchElementException`), ownership (`AccessDeniedException`), the 20-card due cap, review scheduling, and mastery-percentage math including the empty-deck edge case |
| Controller | `CardControllerTest` (8) | `@WebMvcTest` + `@MockitoBean` — status codes (200/201/204), delegation, bean-validation → 400, and `@RestControllerAdvice` mapping of 404/403 error bodies |

---

## API Reference

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/decks` | List all user decks |
| POST | `/api/decks` | Create a deck |
| GET | `/api/decks/{id}` | Get a deck |
| PUT | `/api/decks/{id}` | Update a deck |
| DELETE | `/api/decks/{id}` | Delete a deck |
| GET | `/api/decks/{id}/cards` | List cards in a deck |
| POST | `/api/decks/{id}/cards` | Add a card |
| PUT | `/api/cards/{id}` | Update a card |
| DELETE | `/api/cards/{id}` | Delete a card |
| GET | `/api/decks/{id}/study` | Get due cards (max 20) |
| POST | `/api/cards/{id}/review` | Submit rating `{rating: 0\|1\|3\|5}` |
| GET | `/api/decks/{id}/progress` | Get deck progress stats |
| POST | `/api/sessions/start` | Start a study session |
| POST | `/api/sessions/{id}/complete` | Complete a study session |

---

## Project Structure

```
flashcard-study-app/
├── backend/
│   ├── src/main/java/com/sanele/flashcard/
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # Spring Data repos
│   │   ├── security/        # JWT, filters, SecurityConfig
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── service/         # Business logic + SM-2 algorithm
│   │   ├── controller/      # REST controllers
│   │   └── exception/       # GlobalExceptionHandler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/V1__create_tables.sql
│   └── src/test/            # SpacedRepetitionTest, CardServiceTest, CardControllerTest (26 tests)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   ├── register/
│       │   ├── decks/
│       │   │   ├── page.tsx          # Deck grid
│       │   │   └── [id]/
│       │   │       ├── page.tsx      # Deck detail + card list
│       │   │       └── study/
│       │   │           └── page.tsx  # Study mode with flip animation
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── FlipCard.tsx          # CSS 3D flip card component
│       ├── lib/api.ts                # API client
│       ├── store/deckStore.ts        # Zustand state
│       └── types/index.ts
│
└── docker-compose.yml
```
