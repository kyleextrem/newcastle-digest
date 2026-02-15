
import React from 'react';

export const FloatingGallery: React.FC = () => {
  return (
    <section className="relative py-24 min-h-[500px] flex flex-col items-center justify-center border border-[#251f18]/5 bg-[#251f18]/[0.02]">
      <div className="text-center space-y-8 px-4">
        <p className="font-serif-alt italic text-2xl text-[#251f18]/40">
          The latest Newcastle Digest edition will appear here.
        </p>
        <button className="px-8 py-4 bg-[#251f18] text-white font-mono-main text-xs uppercase tracking-widest hover:bg-[#849bff] transition-all">
          View latest edition &rarr;
        </button>
      </div>
    </section>
  );
};
