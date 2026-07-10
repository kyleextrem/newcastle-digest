'use client';

import { useState } from 'react';
import { Check, Copy, Users } from 'lucide-react';
import { LinkCard } from './LinkCard';

const SHARE_MESSAGE =
  "I've been reading Newcastle Digest, the best way to keep up with what's on in Newcastle. Worth a subscribe: https://newcastledigest.com/subscribe";

export function ReferFriendCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_MESSAGE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable, fail silently
    }
  };

  return (
    <LinkCard
      icon={<Users className="h-4 w-4" strokeWidth={2} />}
      heading="Refer a friend"
      description="Know someone who'd love this?"
    >
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy message
          </>
        )}
      </button>
    </LinkCard>
  );
}
