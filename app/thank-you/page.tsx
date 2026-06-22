import type { Metadata } from 'next';
import Link from 'next/link';
import { ThankYouLeadTracker } from './ThankYouLeadTracker';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Thanks for subscribing to Newcastle Digest.',
};

export default function Page() {
  return (
    <section className="bg-[#faf9f6] min-h-screen py-20 px-4 sm:px-6 md:px-8">
      <ThankYouLeadTracker />
      <div className="container mx-auto max-w-2xl text-center">
        <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-4">
          Subscription confirmed
        </p>
        <h1 className="font-sans-main text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 text-[#251f18]">
          Thank You.
        </h1>
        <p className="font-serif-alt italic text-xl text-[#251f18]/70 mb-10">
          You are in. We will send the best of Newcastle to your inbox each Wednesday.
        </p>
        <Link
          href="/"
          className="inline-flex px-8 py-4 rounded-full bg-[#251f18] text-[#faf9f6] font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#849bff] transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </section>
  );
}
