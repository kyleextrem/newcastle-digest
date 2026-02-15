import React from 'react';
import { ExternalLink } from 'lucide-react';

// Update this single constant when your Beehiiv domain changes — all journal links will follow
const BEEHIIV_PUB_URL = 'https://newsletter.newcastledigest.com';

const articles = [
  {
    title: 'Free Things to Do in Newcastle NSW (2025)',
    desc: "Coastal walks, museums, markets, and hidden gems — a comprehensive guide to the best free experiences in the Hunter.",
    link: `${BEEHIIV_PUB_URL}/p/free-things-to-do-in-newcastle-nsw-2025`,
    img: '/newcastle/205018-2-235f1443-d2ff-4aa1-9a4a-e579101948ed.png',
  },
  {
    title: 'Black Friday Sales in Newcastle 2025',
    desc: "A straightforward round-up of key Black Friday activity across local centres, retailers, and brands.",
    link: `${BEEHIIV_PUB_URL}/p/black-friday-sales-in-newcastle-2025`,
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop',
  },
];

export const StoriesGrid: React.FC = () => {
  return (
    <section className="bg-[#faf9f6] py-14 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-16 md:mb-20 text-center">
          <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-3">Editorial</p>
          <h1 className="font-sans-main text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
            The Journal.
          </h1>
          <p className="font-serif-alt italic text-xl text-[#251f18]/60 max-w-xl mx-auto leading-snug">
            Stories and guides from across Newcastle. Published on Beehiiv.
          </p>
        </div>

        <div className="grid gap-12 md:gap-20">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="aspect-[16/10] rounded-[32px] overflow-hidden shadow-lg order-2 md:order-1">
                  <img
                    src={article.img}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-4 order-1 md:order-2">
                  <h2 className="font-sans-main text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-[#251f18] group-hover:text-[#849bff] transition-colors">
                    {article.title}
                  </h2>
                  <p className="font-serif-alt italic text-lg text-[#251f18]/60 leading-snug">
                    {article.desc}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-20 text-center">
          <a
            href={BEEHIIV_PUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#849bff] font-mono-main text-xs uppercase tracking-widest hover:underline"
          >
            View all articles <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
