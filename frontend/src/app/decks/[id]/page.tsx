"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useDeckStore } from "@/store/deckStore";
import { api } from "@/lib/api";
import { Progress } from "@/types";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = Number(params.id);

  const { isAuthenticated } = useAuthStore();
  const { currentDeck, cards, isLoading, fetchDeck, fetchCards, createCard, deleteCard, deleteDeck } =
    useDeckStore();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchDeck(deckId);
    fetchCards(deckId);
    api.cards.progress(deckId).then(setProgress).catch(() => {});
  }, [isAuthenticated, deckId, router, fetchDeck, fetchCards]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await createCard(deckId, front.trim(), back.trim());
      setFront("");
      setBack("");
      setShowAddForm(false);
      api.cards.progress(deckId).then(setProgress).catch(() => {});
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    await deleteCard(cardId);
    api.cards.progress(deckId).then(setProgress).catch(() => {});
  };

  const handleDeleteDeck = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    await deleteDeck(deckId);
    router.push("/decks");
  };

  if (!isAuthenticated) return null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/decks"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 text-sm mb-6 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Decks
      </Link>

      {/* Header */}
      {currentDeck && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">{currentDeck.name}</h1>
              {currentDeck.description && (
                <p className="text-gray-400 mt-1">{currentDeck.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/decks/${deckId}/study`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                  currentDeck.dueToday > 0
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none"
                }`}
                aria-disabled={currentDeck.dueToday === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {currentDeck.dueToday > 0
                  ? `Study (${currentDeck.dueToday} due)`
                  : "Nothing due"}
              </Link>
              <button
                onClick={handleDeleteDeck}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  deleteConfirm
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "text-gray-500 hover:text-red-400 hover:bg-gray-800"
                }`}
              >
                {deleteConfirm ? "Confirm Delete" : "Delete Deck"}
              </button>
              {deleteConfirm && (
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Progress stats */}
          {progress && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Cards", value: progress.totalCards, color: "text-gray-100" },
                { label: "Due Today", value: progress.dueToday, color: "text-orange-400" },
                { label: "Learned", value: progress.learned, color: "text-indigo-400" },
                { label: "Mastery", value: `${progress.masteryPercent}%`, color: "text-green-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add card section */}
      <div className="mb-6">
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddError(""); }}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
          <h3 className="text-base font-semibold text-gray-100 mb-4">New Flashcard</h3>
          <form onSubmit={handleAddCard} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Front (Question)
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  placeholder="What is the capital of France?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Back (Answer)
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  placeholder="Paris"
                />
              </div>
            </div>
            {addError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                {addError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={adding}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Card"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError(""); }}
                className="text-gray-400 hover:text-gray-200 px-5 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No cards yet</h3>
          <p className="text-gray-500 mb-4">Add your first card to start studying</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Add first card
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            {cards.length} Card{cards.length !== 1 ? "s" : ""}
          </h2>
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-600 uppercase tracking-wider block mb-1">Front</span>
                    <p className="text-gray-200 text-sm">{card.front}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 uppercase tracking-wider block mb-1">Back</span>
                    <p className="text-gray-400 text-sm">{card.back}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    card.repetitions > 0
                      ? "bg-indigo-900/50 text-indigo-300"
                      : "bg-gray-800 text-gray-500"
                  }`}>
                    {card.repetitions > 0 ? `Rep ${card.repetitions}` : "New"}
                  </span>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                    aria-label="Delete card"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
