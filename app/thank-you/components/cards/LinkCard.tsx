import type { ReactNode } from 'react';

interface LinkCardProps {
  icon: ReactNode;
  heading: string;
  description: string;
  children: ReactNode;
}

export function LinkCard({ icon, heading, description, children }: LinkCardProps) {
  return (
    <div className="flex h-full flex-col border border-[#251f18]/08 bg-white p-4">
      <div className="mb-2 text-[#849bff]">{icon}</div>
      <h3 className="mb-1 font-sans-main text-sm font-black uppercase leading-tight tracking-tight text-[#251f18]">
        {heading}
      </h3>
      <p className="mb-3 flex-1 font-sans-main text-xs leading-snug text-[#251f18]/55">
        {description}
      </p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}
