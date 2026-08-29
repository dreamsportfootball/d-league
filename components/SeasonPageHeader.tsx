import React from 'react';
import SeasonSelector from './SeasonSelector';

interface SeasonPageHeaderProps {
  title: string;
  accent: string;
  description: React.ReactNode;
  bordered?: boolean;
  showMobileSeasonSelector?: boolean;
  showDesktopSeasonSelector?: boolean;
}

const formatDesktopLeagueText = (value: string): string =>
  value.replace(/\bL(\d+)\b/g, 'LEAGUE $1');

const SeasonPageHeader: React.FC<SeasonPageHeaderProps> = ({
  title,
  accent,
  description,
  bordered = false,
  showMobileSeasonSelector = true,
  showDesktopSeasonSelector = true,
}) => {
  const stringDescription = typeof description === 'string' ? description : null;
  const desktopDescription = stringDescription ? formatDesktopLeagueText(stringDescription) : null;
  const hasDesktopDescription = stringDescription !== null && desktopDescription !== stringDescription;

  return (
    <section
      className={`mb-6 md:mb-12 ${
        bordered ? 'border-b border-neutral-100 pb-6 md:pb-10' : ''
      }`}
    >
      <div className="md:flex md:items-end md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 md:block">
            <h1 className="min-w-0 whitespace-nowrap font-display text-[32px] font-extrabold uppercase leading-none tracking-tight text-brand-black md:mb-4 md:text-6xl">
              {title}{' '}<span className="text-brand-blue">{accent}</span>
            </h1>

            {showMobileSeasonSelector && (
              <div className="shrink-0 md:hidden">
                <SeasonSelector compact />
              </div>
            )}
          </div>

          <div className="mt-2 text-xs font-medium tracking-wide text-neutral-500 md:mt-0 md:text-base [&>div>span:nth-child(n+2)]:hidden md:[&>div>span:nth-child(n+2)]:flex">
            {hasDesktopDescription ? (
              <>
                <span className="md:hidden">{stringDescription}</span>
                <span className="hidden md:inline">{desktopDescription}</span>
              </>
            ) : description}
          </div>
        </div>

        {showDesktopSeasonSelector && (
          <div className="hidden shrink-0 md:flex">
            <SeasonSelector />
          </div>
        )}
      </div>
    </section>
  );
};

export default SeasonPageHeader;
