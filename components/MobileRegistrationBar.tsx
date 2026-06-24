import React from 'react';
import { FileText } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';

const MobileRegistrationBar: React.FC = () => {
  const { activeSeason } = useSeason();

  if (
    activeSeason.status !== 'registration' ||
    !activeSeason.registrationFormUrl ||
    !activeSeason.regulationsUrl
  ) {
    return null;
  }

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-[950] border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_auto] gap-2">
          <a
            href={activeSeason.registrationFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="registration_click"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-accent px-5 text-sm font-black text-brand-black"
          >
            立即報名
          </a>
          <a
            href={activeSeason.regulationsUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="regulations_click"
            aria-label="查看競賽規程"
            className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-300 bg-white text-brand-black"
          >
            <FileText className="h-5 w-5" />
          </a>
        </div>
      </div>
    </>
  );
};

export default MobileRegistrationBar;
