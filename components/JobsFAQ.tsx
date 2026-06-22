'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How long does my listing stay live?',
    answer:
      'Every listing stays on the board for 30 days from the date you post. Featured and Premium listings also get top placement for 7 or 14 days respectively, plus a mention in the weekly newsletter.',
  },
  {
    question: 'How does the newsletter mention work?',
    answer:
      'Featured and Premium listings are included in the next Wednesday edition of Newcastle Digest — read by 7,000+ locals with a 60% open rate. Your role appears alongside the week\'s stories and guides, not buried in a classifieds block.',
  },
  {
    question: 'Can I edit my listing after posting?',
    answer:
      'Yes. Once your listing is live, you\'ll receive a link to manage it. You can update the title, description, and details at any time during the 30-day listing period.',
  },
  {
    question: 'What if I just want a free listing?',
    answer:
      'The free tier is a great place to start. Your role goes live on the job board immediately — no payment required. If you want more reach later, you can upgrade to Featured or Premium at any time.',
  },
];

export const JobsFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="divide-y divide-[#251f18]/10 border-t border-b border-[#251f18]/10">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-6 py-6 md:py-8 text-left group"
              aria-expanded={isOpen}
            >
              <span className="font-sans-main font-black text-lg md:text-xl uppercase tracking-tight text-[#251f18] group-hover:text-[#849bff] transition-colors">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 text-[#849bff] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 md:pb-8' : 'max-h-0'}`}
            >
              <p className="font-serif-alt italic text-lg text-[#251f18]/65 leading-relaxed max-w-3xl">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
