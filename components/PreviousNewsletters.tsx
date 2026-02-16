import React, { useEffect, useState } from 'react';

const PAGE_TITLE = 'Previous Newsletters | Newcastle Digest';
const META_DESCRIPTION =
  'Browse past editions of Newcastle Digest — a weekly email covering events, food, markets, gigs, and local finds.';

interface IssueItem {
  title: string;
  slug: string;
  web_url: string;
  published_at: string;
  subtitle: string;
  thumbnail_url: string | null;
}

function formatPublishDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

export const PreviousNewsletters: React.FC = () => {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = PAGE_TITLE;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', META_DESCRIPTION);
    return () => {
      document.title = 'Newcastle Digest | The best of Newcastle';
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const apiUrl = `${window.location.origin}/api/issues`;
    fetch(apiUrl)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          console.error('[Previous Newsletters] Non-JSON response from /api/issues:', { status: res.status, contentType, bodyPreview: text.slice(0, 200) });
          throw new Error('Could not load archive');
        }
        if (!res.ok) throw new Error('Could not load archive');
        return res.json();
      })
      .then((data: IssueItem[]) => {
        if (!cancelled) {
          setIssues(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load archive');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-[#faf9f6] min-h-screen py-14 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-16 md:mb-20 text-center">
          <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-3">
            Archive
          </p>
          <h1 className="font-sans-main text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Previous Newsletters
          </h1>
          <p className="font-serif-alt italic text-xl text-[#251f18]/70 max-w-xl mx-auto leading-snug">
            Catch up on past editions of Newcastle Digest.
          </p>
        </header>

        {loading && (
          <div className="flex justify-center py-20">
            <p className="font-serif-alt italic text-[#251f18]/60">Loading editions…</p>
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

        {!loading && !error && issues.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif-alt italic text-[#251f18]/60">No past editions yet.</p>
          </div>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {issues.map((issue) => (
              <a
                key={issue.slug || issue.web_url}
                href={issue.web_url}
                className="group block bg-white rounded-[24px] overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] transition-all duration-300"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#18181e]/8">
                  {issue.thumbnail_url ? (
                    <img
                      src={issue.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={640}
                      height={360}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[#251f18]/20 font-mono-main text-[10px] uppercase tracking-widest"
                      aria-hidden
                    >
                      No image
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-7">
                  <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] mb-2">
                    {formatPublishDate(issue.published_at)}
                  </p>
                  <h2 className="font-sans-main text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-[#251f18] group-hover:text-[#849bff] transition-colors mb-2">
                    {issue.title}
                  </h2>
                  {issue.subtitle && (
                    <p className="font-serif-alt italic text-[#251f18]/60 text-sm leading-snug line-clamp-2">
                      {issue.subtitle}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
