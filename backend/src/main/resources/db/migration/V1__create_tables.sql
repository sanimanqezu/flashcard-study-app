-- V1__create_tables.sql
-- Flashcard Study App — Initial Schema

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE decks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE cards (
    id               BIGSERIAL PRIMARY KEY,
    deck_id          BIGINT  NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front            TEXT    NOT NULL,
    back             TEXT    NOT NULL,
    ease_factor      DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval         INTEGER NOT NULL DEFAULT 1,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    next_review_date DATE    NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE study_sessions (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id        BIGINT    NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    started_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at   TIMESTAMP,
    cards_reviewed INTEGER   NOT NULL DEFAULT 0,
    cards_correct  INTEGER   NOT NULL DEFAULT 0
);

CREATE INDEX idx_decks_user_id        ON decks(user_id);
CREATE INDEX idx_cards_deck_id        ON cards(deck_id);
CREATE INDEX idx_cards_next_review    ON cards(next_review_date);
CREATE INDEX idx_sessions_user_id     ON study_sessions(user_id);
CREATE INDEX idx_sessions_deck_id     ON study_sessions(deck_id);
