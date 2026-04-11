# Flashcard Study App

A full-stack spaced repetition flashcard application built for efficient memorization. Study smarter — not longer — by reviewing cards exactly when you're about to forget them.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Java 17, Spring Boot 3.2.5, Spring Security, JJWT 0.12.3 |
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
- Java 17+
- Node.js 20+
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
```bash
cd backend

# Start PostgreSQL (or use Docker):
docker run -d --name pg -e POSTGRES_DB=flashcard_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

mvn spring-boot:run
```

**Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Run Backend Tests

```bash
cd backend
mvn test
```

The test suite covers all 8 SM-2 algorithm cases: AGAIN reset, HARD reset, GOOD first/second/third repetitions, EASY ease factor increase, ease factor floor (1.3), and a multi-step progression sequence.

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
│   └── src/test/            # SpacedRepetitionTest (8 test cases)
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
