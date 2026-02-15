
import React from 'react';
import { REVIEWS } from '../constants';

export const Reviews: React.FC = () => {
  return (
    <section className="py-24 md:py-48 bg-[#849bff] text-white/90">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-24 text-center">
          {REVIEWS.map((review, i) => (
            <div key={i} className="space-y-8 animate-in slide-in-from-bottom duration-700">
              <p className="font-serif-main italic text-3xl md:text-5xl leading-tight">
                {review.quote}
              </p>
              <p className="font-mono-main text-xs uppercase tracking-[0.2em] opacity-70">
                {review.attribution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
