
import React from 'react';

export const NewsletterSignup: React.FC = () => {
  return (
    <section className="py-24 md:py-48 px-4 md:px-8 border-t border-[#251f18]/10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 bg-white p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Abstract circle decor */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#849bff]/5 rounded-full" />
          
          <div className="relative z-10 flex flex-col justify-center">
            <h2 className="font-serif-main text-5xl md:text-7xl lowercase italic mb-6 text-[#849bff]">
              Contact
            </h2>
            <p className="font-serif-alt text-xl md:text-2xl text-[#251f18]/80 mb-4">
              Suggestions, partnerships, or general enquiries.
            </p>
            <p className="font-mono-main text-[10px] uppercase tracking-widest opacity-60">
              hello@newcastledigest.com
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-4">
              <label className="block font-mono-main text-[10px] uppercase tracking-widest opacity-60">Your Name</label>
              <input 
                type="text" 
                className="w-full border-b border-[#251f18]/20 py-4 focus:outline-none focus:border-[#849bff] transition-colors font-serif-alt text-xl italic" 
                placeholder="Full name"
              />
            </div>
            <div className="space-y-4">
              <label className="block font-mono-main text-[10px] uppercase tracking-widest opacity-60">Email Address</label>
              <input 
                type="email" 
                className="w-full border-b border-[#251f18]/20 py-4 focus:outline-none focus:border-[#849bff] transition-colors font-serif-alt text-xl italic" 
                placeholder="Email address"
              />
            </div>
            <div className="space-y-4">
              <label className="block font-mono-main text-[10px] uppercase tracking-widest opacity-60">Message</label>
              <textarea 
                className="w-full border-b border-[#251f18]/20 py-4 focus:outline-none focus:border-[#849bff] transition-colors font-serif-alt text-xl italic resize-none" 
                rows={3}
                placeholder="How can we help?"
              />
            </div>
            <button className="w-full bg-[#849bff] text-white py-5 font-mono-main text-xs uppercase tracking-widest hover:bg-[#251f18] transition-all">
              Send Message &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
