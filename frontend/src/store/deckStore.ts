import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Deck, Card, User } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  cards: Card[];
  dueCards: Card[];
  isLoading: boolean;
  error: string | null;

  fetchDecks: () => Promise<void>;
  fetchDeck: (id: number) => Promise<void>;
  createDeck: (name: string, description?: string) => Promise<Deck>;
  updateDeck: (id: number, name: string, description?: string) => Promise<void>;
  deleteDeck: (id: number) => Promise<void>;

  fetchCards: (deckId: number) => Promise<void>;
  createCard: (deckId: number, front: string, back: string) => Promise<void>;
  deleteCard: (cardId: number) => Promise<void>;

  fetchDueCards: (deckId: number) => Promise<Card[]>;
  reviewCard: (cardId: number, rating: number) => Promise<Card>;

  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        localStorage.setItem("token", token);
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  currentDeck: null,
  cards: [],
  dueCards: [],
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    set({ isLoading: true, error: null });
    try {
      const decks = await api.decks.list();
      set({ decks, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchDeck: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const deck = await api.decks.get(id);
      set({ currentDeck: deck, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createDeck: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const deck = await api.decks.create({ name, description });
      set((state) => ({ decks: [deck, ...state.decks], isLoading: false }));
      return deck;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateDeck: async (id, name, description) => {
    try {
      const deck = await api.decks.update(id, { name, description });
      set((state) => ({
        decks: state.decks.map((d) => (d.id === id ? deck : d)),
        currentDeck: state.currentDeck?.id === id ? deck : state.currentDeck,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteDeck: async (id) => {
    try {
      await api.decks.delete(id);
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== id),
        currentDeck: state.currentDeck?.id === id ? null : state.currentDeck,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  fetchCards: async (deckId) => {
    set({ isLoading: true, error: null });
    try {
      const cards = await api.cards.list(deckId);
      set({ cards, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createCard: async (deckId, front, back) => {
    try {
      const card = await api.cards.create(deckId, { front, back });
      set((state) => ({ cards: [card, ...state.cards] }));
      // Refresh deck to update card counts
      const deck = await api.decks.get(deckId);
      set((state) => ({
        decks: state.decks.map((d) => (d.id === deckId ? deck : d)),
        currentDeck: deck,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteCard: async (cardId) => {
    const card = get().cards.find((c) => c.id === cardId);
    try {
      await api.cards.delete(cardId);
      set((state) => ({ cards: state.cards.filter((c) => c.id !== cardId) }));
      if (card) {
        const deck = await api.decks.get(card.deckId);
        set((state) => ({
          decks: state.decks.map((d) => (d.id === card.deckId ? deck : d)),
          currentDeck: state.currentDeck?.id === card.deckId ? deck : state.currentDeck,
        }));
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  fetchDueCards: async (deckId) => {
    try {
      const dueCards = await api.cards.getDue(deckId);
      set({ dueCards });
      return dueCards;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  reviewCard: async (cardId, rating) => {
    try {
      const updated = await api.cards.review(cardId, rating);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === cardId ? updated : c)),
        dueCards: state.dueCards.filter((c) => c.id !== cardId),
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
