'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

// Update this single constant when your Beehiiv domain changes — all journal links will follow
const BEEHIIV_PUB_URL = 'https://newsletter.newcastledigest.com';

const DEFAULT_ARTICLES = [
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

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop';

interface ArticleItem {
  title: string;
  desc: string;
  link: string;
  img: string;
}

interface BeehiivIssueItem {
  title: string;
  slug: string;
  web_url: string;
  published_at: string;
  subtitle: string;
  thumbnail_url: string | null;
}

interface StoriesGridProps {
  /** When set (e.g. "blog"), fetches posts with this content tag from Beehiiv instead of using static list */
  contentTag?: string;
}

export const StoriesGrid: React.FC<StoriesGridProps> = ({ contentTag }) => {
  const [articles, setArticles] = useState<ArticleItem[]>(contentTag ? [] : DEFAULT_ARTICLES);
  const [loading, setLoading] = useState(!!contentTag);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentTag) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const apiUrl = `${window.location.origin}/api/beehiiv?type=issues&content_tag=${encodeURIComponent(contentTag)}`;
    fetch(apiUrl)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          console.error('[StoriesGrid] Non-JSON from /api/beehiiv:', { status: res.status, bodyPreview: text.slice(0, 200) });
          throw new Error('Could not load journal');
        }
        if (!res.ok) throw new Error('Could not load journal');
        return res.json();
      })
      .then((data: BeehiivIssueItem[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setArticles(
          list.map((post) => ({
            title: post.title ?? '',
            desc: post.subtitle ?? '',
            link: post.web_url ?? '',
            img: post.thumbnail_url ?? PLACEHOLDER_IMG,
          }))
        );
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load journal');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [contentTag]);

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

        {loading && (
          <div className="flex justify-center py-20">
            <p className="font-serif-alt italic text-[#251f18]/60">Loading articles…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="font-sans-main text-[#251f18]/70 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-[#849bff] font-mono-main text-xs uppercase tracking-widest hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && contentTag && (
          <div className="text-center py-20">
            <p className="font-serif-alt italic text-[#251f18]/60">No blog articles yet.</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <>
            <div className="grid gap-12 md:gap-20">
              {articles.map((article, i) => (
                <a
                  key={article.link || i}
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
          </>
        )}
      </div>
    </section>
  );
};
