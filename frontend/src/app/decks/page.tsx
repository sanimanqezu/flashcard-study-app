"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, useDeckStore } from "@/store/deckStore";

export default function DecksPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { decks, isLoading, error, fetchDecks, createDeck } = useDeckStore();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchDecks();
  }, [isAuthenticated, router, fetchDecks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setFormError("");
    try {
      const deck = await createDeck(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      setShowForm(false);
      router.push(`/decks/${deck.id}`);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Decks</h1>
          <p className="text-gray-400 mt-1">
            {decks.length} deck{decks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Deck
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Create New Deck</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Deck Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Spanish Vocabulary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                placeholder="What will you study in this deck?"
              />
            </div>
            {formError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                {formError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Deck"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="text-gray-400 hover:text-gray-200 px-5 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && decks.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No decks yet</h3>
          <p className="text-gray-500 mb-6">Create your first deck to get started studying</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Create your first deck
          </button>
        </div>
      )}

      {/* Decks grid */}
      {!isLoading && decks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {deck.name}
                </h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {deck.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {deck.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-auto">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {deck.totalCards} card{deck.totalCards !== 1 ? "s" : ""}
                </div>

                {deck.dueToday > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-orange-400 font-medium">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    {deck.dueToday} due
                  </div>
                )}

                {deck.dueToday === 0 && deck.totalCards > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All caught up
                  </div>
                )}
              </div>

              {deck.totalCards > 0 && (
                <div className="mt-4">
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, 100 - (deck.dueToday / deck.totalCards) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
