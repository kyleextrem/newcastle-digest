import { Briefcase } from 'lucide-react';
import { LinkCard } from './LinkCard';

const JOBS_URL = 'https://jobs.newcastledigest.com';

export function JobBoardCard() {
  return (
    <LinkCard
      icon={<Briefcase className="h-4 w-4" strokeWidth={2} />}
      heading="Job board"
      description="Hiring or job hunting in Newcastle?"
    >
      <a
        href={JOBS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Browse jobs
      </a>
    </LinkCard>
  );
}
