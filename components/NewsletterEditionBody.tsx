import React from 'react';

export function NewsletterEditionBody({ html }: { html: string }) {
  if (!html) {
    return (
      <p className="font-sans-main text-lg leading-relaxed text-[#251f18]/70">
        This edition is being prepared. Check back soon, or subscribe to receive Newcastle Digest every Wednesday.
      </p>
    );
  }

  return (
    <div
      className="newsletter-edition-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
