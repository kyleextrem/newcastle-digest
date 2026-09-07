import React from 'react';

const BEEHIIV_EMBED_URL = 'https://embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9?slim=true';

export function NewsletterSubscribeCta() {
  return (
    <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-[#251f18] text-white p-10 md:p-14 shadow-[0_20px_50px_-16px_rgba(37,31,24,0.25)] flex justify-center">
      <div className="w-full max-w-md text-center">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-3">
          Get the digest
        </p>
        <p className="font-sans-main text-white/80 text-sm mb-5">
          Every Wednesday. No spam, just Newcastle.
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
