'use client';

import { useCallback, useState, type FC } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdvertisingEnquiryModal } from '@/components/advertising/EnquiryForm';
import { ContactForm } from '@/components/contact/ContactForm';

const SUBMIT_EVENT_URL = 'https://events.newcastledigest.com/submit';
const EMAIL = 'kyle@newcastledigest.com';

export const Contact: FC = () => {
  const [enquireOpen, setEnquireOpen] = useState(false);
  const closeEnquiry = useCallback(() => setEnquireOpen(false), []);

  return (
    <section className="relative overflow-hidden bg-[#18181e] px-4 pb-16 pt-28 text-white md:px-8 md:pb-24 md:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(132,155,255,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(132,155,255,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <p className="mb-4 font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff]">Get in touch</p>
        <h1 className="font-sans-main text-6xl font-black uppercase leading-[0.85] tracking-tighter md:text-8xl">
          Contact.
        </h1>
        <p className="mt-5 max-w-xl font-sans-main text-lg leading-relaxed text-white/70">
          Send a note about a story, a correction, or anything else. We read every message.
        </p>

        <div className="mt-10 rounded-[24px] bg-[#faf9f6] p-6 text-[#251f18] shadow-2xl md:rounded-[32px] md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter md:text-3xl">Send a note</h2>
              <p className="mt-2 font-sans-main text-[#251f18]/70">Tell us what you&apos;d like to read, or just say hello.</p>
            </div>
            <img src="/nd-logo.png" alt="" className="h-12 w-12 shrink-0" />
          </div>
          <ContactForm />
          <p className="mt-6 font-sans-main text-sm text-[#251f18]/60">
            Or email{' '}
            <a href={`mailto:${EMAIL}`} className="font-bold text-[#251f18] underline decoration-[#849bff] underline-offset-4">
              {EMAIL}
            </a>
            .
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#222228] p-5">
            <h2 className="font-sans-main text-lg font-black uppercase tracking-tighter">Advertising</h2>
            <p className="mt-2 font-sans-main text-sm leading-relaxed text-white/70">
              Put your business in front of locals who read Newcastle Digest. We reply by email.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/work"
                className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] underline decoration-[#849bff]/40 underline-offset-4"
              >
                See options
              </Link>
              <button
                type="button"
                onClick={() => setEnquireOpen(true)}
                className="inline-flex items-center rounded-full border border-[#849bff] px-4 py-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:bg-[#849bff] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]"
              >
                Enquire
              </button>
            </div>
          </div>

          <a
            href={SUBMIT_EVENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-white/10 bg-[#222228] p-5 transition-colors hover:border-[#849bff]/40"
          >
            <h2 className="font-sans-main text-lg font-black uppercase tracking-tighter">Submit an event</h2>
            <p className="mt-2 font-sans-main text-sm leading-relaxed text-white/70">
              Have an event coming up? Submit it to the Newcastle Digest Events Directory.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
              Submit event <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>
      </div>
      <AdvertisingEnquiryModal open={enquireOpen} source="contact" packageId="unsure" onClose={closeEnquiry} />
    </section>
  );
};
