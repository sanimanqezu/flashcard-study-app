import {
  AuthResponse,
  Card,
  Deck,
  Progress,
  StudySession,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// Auth
export const api = {
  auth: {
    register: (data: {
      username: string;
      email: string;
      password: string;
    }): Promise<AuthResponse> =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: {
      username: string;
      password: string;
    }): Promise<AuthResponse> =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  decks: {
    list: (): Promise<Deck[]> => request("/api/decks"),

    get: (id: number): Promise<Deck> => request(`/api/decks/${id}`),

    create: (data: { name: string; description?: string }): Promise<Deck> =>
      request("/api/decks", { method: "POST", body: JSON.stringify(data) }),

    update: (
      id: number,
      data: { name: string; description?: string }
    ): Promise<Deck> =>
      request(`/api/decks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: number): Promise<void> =>
      request(`/api/decks/${id}`, { method: "DELETE" }),
  },

  cards: {
    list: (deckId: number): Promise<Card[]> =>
      request(`/api/decks/${deckId}/cards`),

    create: (
      deckId: number,
      data: { front: string; back: string }
    ): Promise<Card> =>
      request(`/api/decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      cardId: number,
      data: { front: string; back: string }
    ): Promise<Card> =>
      request(`/api/cards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (cardId: number): Promise<void> =>
      request(`/api/cards/${cardId}`, { method: "DELETE" }),

    getDue: (deckId: number): Promise<Card[]> =>
      request(`/api/decks/${deckId}/study`),

    review: (cardId: number, rating: number): Promise<Card> =>
      request(`/api/cards/${cardId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),

    progress: (deckId: number): Promise<Progress> =>
      request(`/api/decks/${deckId}/progress`),
  },

  sessions: {
    start: (deckId: number): Promise<StudySession> =>
      request("/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ deckId }),
      }),

    complete: (
      sessionId: number,
      data: { cardsReviewed: number; cardsCorrect: number }
    ): Promise<StudySession> =>
      request(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
