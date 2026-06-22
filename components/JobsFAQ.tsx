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
      'Every listing stays on the board for 30 days. Featured and Premium listings get top placement on the board for the full 30 days, not just the first week.',
  },
  {
    question: 'How does the newsletter mention work?',
    answer:
      'Featured and Premium listings are mentioned in every Newcastle Digest newsletter for 4 weeks running, read by 7,000+ locals with a 60% open rate each send. Your role appears alongside the week\'s stories and guides, not buried in a classifieds block.',
  },
  {
    question: 'Can I edit my listing after posting?',
    answer:
      'Not yet through the site itself, but every listing has a quick contact link if you need something changed, and we\'ll sort it for you directly.',
  },
  {
    question: 'What if I just want a free listing?',
    answer:
      'The free tier is a great place to start. Your role goes live on the job board immediately, no payment required. If you want more reach later, you can upgrade to Featured or Premium at any time.',
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
