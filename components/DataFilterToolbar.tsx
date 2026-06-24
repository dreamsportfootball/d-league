import React from 'react';
import { ChevronRight, Filter } from 'lucide-react';

interface DataFilterToolbarProps {
  primaryText: string;
  secondaryText: string;
  onOpen?: () => void;
  onOpenDesktop?: () => void;
  onOpenMobile?: () => void;
  activeFilterCount?: number;
  buttonLabel?: string;
  ariaLabel?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  activeFilterCount: number;
  buttonLabel: string;
  ariaLabel: string;
  className: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  activeFilterCount,
  buttonLabel,
  ariaLabel,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`ml-4 min-h-11 shrink-0 items-center text-sm font-black transition-colors ${
      activeFilterCount > 0 ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'
    } ${className}`}
  >
    <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
    {buttonLabel}
    {activeFilterCount > 0 && (
      <span className="ml-1.5 text-xs font-black">{activeFilterCount}</span>
    )}
    <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
  </button>
);

const DataFilterToolbar: React.FC<DataFilterToolbarProps> = ({
  primaryText,
  secondaryText,
  onOpen,
  onOpenDesktop,
  onOpenMobile,
  activeFilterCount = 0,
  buttonLabel = '篩選',
  ariaLabel,
}) => {
  const desktopHandler = onOpenDesktop ?? onOpen;
  const mobileHandler = onOpenMobile ?? onOpen;

  if (!desktopHandler || !mobileHandler) {
    throw new Error('DataFilterToolbar requires open handlers for desktop and mobile');
  }

  const resolvedAriaLabel = ariaLabel ?? buttonLabel;

  return (
    <div className="mb-8 flex min-h-14 items-center justify-between border-b border-neutral-100">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="shrink-0 font-display text-sm font-black tracking-wide text-brand-black md:text-base">
          {primaryText}
        </span>
        <span className="truncate text-[11px] font-bold text-neutral-400 md:text-xs">
          {secondaryText}
        </span>
      </div>

      <ToolbarButton
        onClick={mobileHandler}
        activeFilterCount={activeFilterCount}
        buttonLabel={buttonLabel}
        ariaLabel={resolvedAriaLabel}
        className="inline-flex md:hidden"
      />
      <ToolbarButton
        onClick={desktopHandler}
        activeFilterCount={activeFilterCount}
        buttonLabel={buttonLabel}
        ariaLabel={resolvedAriaLabel}
        className="hidden md:inline-flex"
      />
    </div>
  );
};

export default DataFilterToolbar;
