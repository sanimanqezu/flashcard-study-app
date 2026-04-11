export interface User {
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export interface Deck {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  totalCards: number;
  dueToday: number;
}

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
}

export interface Progress {
  totalCards: number;
  dueToday: number;
  learned: number;
  masteryPercent: number;
}

export interface StudySession {
  id: number;
  deckId: number;
  deckName: string;
  startedAt: string;
  completedAt: string | null;
  cardsReviewed: number;
  cardsCorrect: number;
}

export type Rating = 0 | 1 | 3 | 5;

export interface RatingOption {
  value: Rating;
  label: string;
  description: string;
  colorClass: string;
}

export const RATING_OPTIONS: RatingOption[] = [
  {
    value: 0,
    label: "Again",
    description: "Complete blackout",
    colorClass: "bg-red-500 hover:bg-red-600",
  },
  {
    value: 1,
    label: "Hard",
    description: "Incorrect, but familiar",
    colorClass: "bg-orange-500 hover:bg-orange-600",
  },
  {
    value: 3,
    label: "Good",
    description: "Correct with effort",
    colorClass: "bg-blue-500 hover:bg-blue-600",
  },
  {
    value: 5,
    label: "Easy",
    description: "Perfect recall",
    colorClass: "bg-green-500 hover:bg-green-600",
  },
];
