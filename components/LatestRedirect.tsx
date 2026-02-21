import React, { useEffect, useState } from 'react';

export function LatestRedirect() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const apiUrl = `${window.location.origin}/api/latest`;
        const res = await fetch(apiUrl);
        if (cancelled) return;

        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          console.error('[LatestRedirect] Non-JSON response from /api/latest:', { status: res.status, contentType, bodyPreview: text.slice(0, 200) });
          setStatus('error');
          setMessage('Could not load latest issue');
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data?.error ?? 'Could not load latest issue');
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        }

        setStatus('error');
        setMessage('No latest issue URL returned');
      } catch {
        if (cancelled) return;
        setStatus('error');
        setMessage('Could not load latest issue');
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[#18181e] font-sans-main text-lg mb-4">{message}</p>
        <a
          href="/"
          className="text-[#849bff] font-mono-main text-sm uppercase tracking-widest hover:underline"
        >
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[#18181e] font-sans-main text-lg">Taking you to the latest issue…</p>
    </div>
  );
}
