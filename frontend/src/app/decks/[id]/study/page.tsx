"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useDeckStore } from "@/store/deckStore";
import { api } from "@/lib/api";
import FlipCard from "@/components/FlipCard";
import { Card, RATING_OPTIONS, StudySession } from "@/types";

type StudyPhase = "loading" | "studying" | "complete";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = Number(params.id);

  const { isAuthenticated } = useAuthStore();
  const { currentDeck, fetchDeck } = useDeckStore();

  const [phase, setPhase] = useState<StudyPhase>("loading");
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [cardsCorrect, setCardsCorrect] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finishSession = useCallback(
    async (reviewed: number, correct: number, activeSession: StudySession | null) => {
      if (activeSession) {
        try {
          await api.sessions.complete(activeSession.id, {
            cardsReviewed: reviewed,
            cardsCorrect: correct,
          });
        } catch {
          // Non-critical — show completion anyway
        }
      }
      setPhase("complete");
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const init = async () => {
      try {
        await fetchDeck(deckId);
        const due = await api.cards.getDue(deckId);

        if (due.length === 0) {
          setPhase("complete");
          return;
        }

        const newSession = await api.sessions.start(deckId);
        setSession(newSession);
        setQueue(due);
        setPhase("studying");
      } catch (err) {
        setError((err as Error).message);
        setPhase("complete");
      }
    };

    init();
  }, [isAuthenticated, deckId, router, fetchDeck]);

  const currentCard = queue[currentIndex];
  const progress = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleRate = async (ratingValue: number) => {
    if (!currentCard || submitting) return;
    setRating(ratingValue);
    setSubmitting(true);

    try {
      await api.cards.review(currentCard.id, ratingValue);

      const newReviewed = cardsReviewed + 1;
      const newCorrect = ratingValue >= 3 ? cardsCorrect + 1 : cardsCorrect;

      setCardsReviewed(newReviewed);
      setCardsCorrect(newCorrect);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        await finishSession(newReviewed, newCorrect, session);
      } else {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        setRating(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  // Loading state
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading your study session...</p>
      </div>
    );
  }

  // Completion screen
  if (phase === "complete") {
    const accuracy = cardsReviewed > 0 ? Math.round((cardsCorrect / cardsReviewed) * 100) : 0;
    const noCards = queue.length === 0 && !error;

    return (
      <div className="max-w-md mx-auto">
        <div className="text-center py-12">
          {error ? (
            <>
              <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-8">{error}</p>
            </>
          ) : noCards ? (
            <>
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">All caught up!</h2>
              <p className="text-gray-400 mb-8">No cards are due for review today. Check back tomorrow!</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Session Complete!</h2>
              <p className="text-gray-400 mb-8">Great work — keep the streak going.</p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-100">{cardsReviewed}</div>
                  <div className="text-xs text-gray-500 mt-1">Reviewed</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-400">{cardsCorrect}</div>
                  <div className="text-xs text-gray-500 mt-1">Correct</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${accuracy >= 70 ? "text-green-400" : accuracy >= 40 ? "text-orange-400" : "text-red-400"}`}>
                    {accuracy}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Accuracy</div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/decks/${deckId}`}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Back to Deck
            </Link>
            <Link
              href="/decks"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              All Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main study mode
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Exit
        </Link>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Deck name */}
      <p className="text-gray-500 text-sm text-center mb-4">
        {currentDeck?.name}
      </p>

      {/* Flip Card */}
      {currentCard && (
        <FlipCard
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      )}

      {/* Action area */}
      <div className="mt-8">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 py-3.5 rounded-xl font-medium transition-colors text-lg"
          >
            Flip Card
          </button>
        ) : (
          <div>
            <p className="text-center text-sm text-gray-500 mb-4">How well did you recall this?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRate(option.value)}
                  disabled={submitting}
                  className={`${option.colorClass} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-4 px-3 font-medium transition-all flex flex-col items-center gap-1 group`}
                >
                  <span className="text-base font-bold">{option.label}</span>
                  <span className="text-xs opacity-75 text-center leading-tight">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
            {submitting && (
              <div className="flex justify-center mt-4">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-gray-700 text-xs mt-6">
        Click the card to flip it
      </p>
    </div>
  );
}
