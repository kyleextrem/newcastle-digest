import { InstagramCard } from './cards/InstagramCard';
import { ToteBagCard } from './cards/ToteBagCard';
import { JobBoardCard } from './cards/JobBoardCard';
import { ReferFriendCard } from './cards/ReferFriendCard';
import { DigestStudioCard } from './cards/DigestStudioCard';
import { TestimoCard } from './cards/TestimoCard';
import { AdvertiseCard } from './cards/AdvertiseCard';

export function StepEndScreen() {
  return (
    <div className="px-4 py-10 sm:px-6 md:py-16">
      <h2 className="mb-8 text-center font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] sm:text-4xl">
        While you&apos;re here.
      </h2>

      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-px border border-[#251f18]/08 bg-[#251f18]/08">
        <InstagramCard />
        <ToteBagCard />
        <JobBoardCard />
        <ReferFriendCard />
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="mb-6 border-t border-[#251f18]/10 pt-6">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
            Own a business?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px border border-[#251f18]/08 bg-[#251f18]/08">
          <DigestStudioCard />
          <TestimoCard />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="mb-6 border-t border-[#251f18]/10 pt-6">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
            Advertise with us
          </p>
        </div>

        <div className="border border-[#251f18]/08 bg-[#251f18]/08">
          <AdvertiseCard />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
          NEWCASTLE DIGEST
        </p>
        <p className="mt-3 font-sans-main text-base text-[#251f18]/70">
          See you Wednesday.
        </p>
      </div>
    </div>
  );
}
