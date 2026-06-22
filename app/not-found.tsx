import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center bg-[#faf9f6]">
      <h1 className="font-sans-main font-black text-2xl md:text-3xl text-[#251f18] mb-4">Page not found</h1>
      <p className="font-serif-alt text-[#251f18]/70 mb-6">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="text-[#849bff] font-mono-main text-sm uppercase tracking-widest hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
