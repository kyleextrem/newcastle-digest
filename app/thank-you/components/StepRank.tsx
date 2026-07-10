'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { InterestItem } from '../constants';
import { DEFAULT_INTERESTS } from '../constants';

interface StepRankProps {
  onNext: (orderedInterests: InterestItem[]) => void;
}

export function StepRank({ onNext }: StepRankProps) {
  const [items, setItems] = useState<InterestItem[]>(DEFAULT_INTERESTS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] sm:text-4xl md:text-5xl">
          Rank what you love.
        </h2>
        <p className="mt-3 font-sans-main text-base text-[#251f18]/60">
          Drag to reorder, most important at the top.
        </p>
        <p className="mt-2 font-sans-main text-sm text-[#251f18]/50">
          Helps us understand what Newcastle locals actually care about.
        </p>
      </div>

      <ul className="mb-10 w-full max-w-lg space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex cursor-grab items-center gap-4 rounded-[20px] border border-[#251f18]/06 bg-white px-4 py-4 shadow-sm transition-shadow active:cursor-grabbing ${
              dragIndex === index ? 'shadow-md ring-2 ring-[#849bff]/30' : ''
            }`}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#849bff]/15 font-mono-main text-xs font-bold text-[#849bff]">
              {index + 1}
            </span>
            <span className="text-xl" aria-hidden>
              {item.emoji}
            </span>
            <span className="flex-1 font-sans-main text-sm font-bold text-[#251f18] sm:text-base">
              {item.label}
            </span>
            <GripVertical className="h-5 w-5 flex-shrink-0 text-[#251f18]/25" aria-hidden />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onNext(items)}
        className="rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#6a7be6]"
      >
        Done →
      </button>
    </div>
  );
}
