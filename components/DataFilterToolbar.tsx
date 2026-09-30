import React from 'react';
import { ChevronRight, Filter } from 'lucide-react';

interface DataFilterToolbarProps {
  primaryText: string;
  secondaryText?: string;
  onOpen: () => void;
  activeFilterCount?: number;
  buttonLabel?: string;
  ariaLabel?: string;
  contextLabel?: string;
}

const formatDesktopLeagueText = (value: string): string =>
  value.replace(/\bL(\d+)\b/g, 'LEAGUE $1');

const DataFilterToolbar: React.FC<DataFilterToolbarProps> = ({
  primaryText,
  secondaryText,
  onOpen,
  activeFilterCount = 0,
  buttonLabel = '篩選',
  ariaLabel,
  contextLabel = '目前查看',
}) => {
  const desktopPrimaryText = formatDesktopLeagueText(primaryText);
  const hasDesktopLabel = desktopPrimaryText !== primaryText;

  return (
    <div className="mb-8 grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-stretch border-y border-neutral-100">
      <div className="flex min-w-0 flex-col justify-center py-2.5 pr-4">
        <span className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400 md:text-[10px]">
          {contextLabel}
        </span>
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span className={`shrink-0 font-display text-sm font-black tracking-wide text-brand-black md:text-base ${hasDesktopLabel ? 'md:hidden' : ''}`}>
            {primaryText}
          </span>
          {hasDesktopLabel && (
            <span className="hidden shrink-0 font-display text-base font-black tracking-wide text-brand-black md:inline">
              {desktopPrimaryText}
            </span>
          )}
          {secondaryText && (
            <span className="truncate text-[11px] font-bold text-neutral-500 md:text-xs">
              {secondaryText}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-label={ariaLabel ?? buttonLabel}
        className={`inline-flex min-h-11 shrink-0 items-center border-l border-neutral-100 pl-4 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue md:pl-6 ${
          activeFilterCount > 0 ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'
        }`}
      >
        <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
        {buttonLabel}
        {activeFilterCount > 0 && (
          <span className="ml-1.5 text-xs font-black">{activeFilterCount}</span>
        )}
        <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default DataFilterToolbar;
