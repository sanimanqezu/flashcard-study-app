"use client";

import { useState } from "react";

interface FlipCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function FlipCard({ front, back, isFlipped, onFlip }: FlipCardProps) {
  return (
    <div
      className="perspective-1000 w-full cursor-pointer select-none"
      style={{ minHeight: "280px" }}
      onClick={onFlip}
      role="button"
      aria-label={isFlipped ? "Card back — click to flip" : "Card front — click to flip"}
    >
      <div
        className="relative w-full h-full transform-style-3d transition-transform duration-500"
        style={{
          minHeight: "280px",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full min-h-[280px] bg-gray-800 border border-gray-700 rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-medium">
              Question
            </span>
            <p className="text-center text-2xl font-medium text-gray-100 leading-relaxed">
              {front}
            </p>
            <span className="mt-6 text-sm text-gray-600 animate-pulse">
              Click to reveal answer
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="w-full h-full min-h-[280px] bg-indigo-950 border border-indigo-700 rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-xs uppercase tracking-widest text-indigo-400 mb-4 font-medium">
              Answer
            </span>
            <p className="text-center text-2xl font-medium text-gray-100 leading-relaxed">
              {back}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
