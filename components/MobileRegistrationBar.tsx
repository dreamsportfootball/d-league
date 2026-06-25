import React from 'react';
import { FileText } from 'lucide-react';
import { getSeasonConfig } from '../config/seasons';
import { CURRENT_SEASON_ID, SHOW_REGISTRATION_NAV } from '../config/siteConfig';

const MobileRegistrationBar: React.FC = () => {
  const currentSeason = getSeasonConfig(CURRENT_SEASON_ID);
  const hasRegistration = Boolean(currentSeason.registrationFormUrl);
  const hasRegulations = Boolean(currentSeason.regulationsUrl);

  if (!SHOW_REGISTRATION_NAV || (!hasRegistration && !hasRegulations)) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[950] border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className={`mx-auto grid max-w-lg gap-2 ${hasRegistration && hasRegulations ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
        {currentSeason.registrationFormUrl && (
          <a
            href={currentSeason.registrationFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="registration_click"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-accent px-5 text-sm font-black text-brand-black"
          >
            立即報名
          </a>
        )}
        {currentSeason.regulationsUrl && (
          <a
            href={currentSeason.regulationsUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="regulations_click"
            aria-label="查看競賽規程"
            className={`inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white text-brand-black ${hasRegistration ? 'w-12' : 'w-full px-5'}`}
          >
            <FileText className="h-5 w-5" />
            {!hasRegistration && <span className="ml-2 text-sm font-black">查看競賽規程</span>}
          </a>
        )}
      </div>
    </div>
  );
};

export default MobileRegistrationBar;
