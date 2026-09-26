import React from 'react';

const BEEHIIV_EMBED_URL = 'https://embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9?slim=true';

export function NewsletterSubscribeCta({
  eyebrow = 'Get the digest',
  title,
  description = 'Every Wednesday. No spam, just Newcastle.',
}: {
  eyebrow?: string
  title?: string
  description?: string
}) {
  return (
    <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-[#251f18] text-white p-10 md:p-14 shadow-[0_20px_50px_-16px_rgba(37,31,24,0.25)] flex justify-center">
      <div className="w-full max-w-md text-center">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-3">
          {eyebrow}
        </p>
        {title ? (
          <h2 className="mb-4 font-sans-main text-3xl font-black uppercase tracking-tighter leading-[0.95] md:text-4xl">
            {title}
          </h2>
        ) : null}
        <p className={`mb-5 font-sans-main text-white/80 ${title ? 'text-base md:text-lg' : 'text-sm'}`}>
          {description}
        </p>
        <div className="beehiiv-embed-wrap">
          <iframe
            src={BEEHIIV_EMBED_URL}
            data-test-id="beehiiv-embed"
            height="52"
            frameBorder="0"
            scrolling="no"
            style={{ margin: 0, borderRadius: 0, backgroundColor: 'transparent' }}
            title="Subscribe to Newcastle Digest"
          />
        </div>
        <p className="font-mono-main text-[9px] uppercase tracking-widest text-white/45 mt-4">
          Free. No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
