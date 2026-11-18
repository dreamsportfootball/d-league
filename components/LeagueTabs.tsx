import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Trophy } from 'lucide-react';

interface LeagueTabsProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  getMobileLabel?: (value: T) => string;
}

function LeagueTabs<T extends string>({
  options,
  active,
  onChange,
  getLabel,
  getMobileLabel,
}: LeagueTabsProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const desktopLabel = (option: T): string => {
    const leagueNumber = /^L(\d+)$/.exec(option)?.[1];
    return leagueNumber ? 'LEAGUE ' + leagueNumber : getLabel(option);
  };

  const mobileLabel = (option: T): string => {
    if (getMobileLabel) return getMobileLabel(option);
    return /^L\d+$/.test(option) ? option : getLabel(option);
  };

  const selectedIndex = Math.max(0, options.indexOf(active));

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    optionRefs.current[selectedIndex]?.focus();

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, selectedIndex]);

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (index + direction + options.length) % options.length;
      optionRefs.current[nextIndex]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      optionRefs.current[event.key === 'Home' ? 0 : options.length - 1]?.focus();
    }
  };

  return (
    <div className="mb-6 flex min-w-0 flex-wrap items-center justify-start gap-x-2.5 gap-y-2 border-b border-neutral-200 pb-3 md:mb-8 md:gap-x-3 md:pb-4">
      <h2 className="flex shrink-0 items-center font-display text-xs font-bold uppercase tracking-wider text-neutral-900 md:text-sm">
        <Trophy className="mr-1.5 h-4 w-4 text-brand-blue md:mr-2 md:h-5 md:w-5" aria-hidden="true" />
        選擇聯賽
      </h2>

      <div ref={containerRef} data-league-selector className="relative inline-flex shrink-0">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={'選擇聯賽：' + desktopLabel(active)}
          onClick={() => setIsOpen((previous) => !previous)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          className="group relative inline-flex min-h-11 min-w-[84px] items-center justify-between gap-1.5 whitespace-nowrap rounded-full bg-transparent px-2.5 font-sans text-[11px] font-semibold leading-none tracking-normal text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:min-h-9 md:min-w-[116px] md:gap-2 md:border md:border-neutral-200 md:bg-white md:px-3 md:font-display md:tracking-wide md:transition-colors md:hover:border-neutral-400"
        >
          <span data-league-pill aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-1.5 rounded-full border border-neutral-200 bg-white transition-colors group-hover:border-neutral-400 md:hidden" />
          <span data-league-selected className="relative z-10">
            <span className="md:hidden">{mobileLabel(active)}</span>
            <span className="hidden md:inline">{desktopLabel(active)}</span>
          </span>
          <ChevronDown className={'relative z-10 h-3 w-3 shrink-0 transition-transform md:h-3.5 md:w-3.5 ' + (isOpen ? 'rotate-180' : '')} aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            id={menuId}
            role="menu"
            aria-label="聯賽選項"
            className="absolute left-0 top-full z-40 mt-0 w-full rounded-[18px] border border-neutral-200 bg-white p-1 shadow-[0_8px_22px_rgba(0,0,0,0.10)] md:mt-1 md:rounded-lg md:shadow-md"
          >
            {options.map((option, index) => {
              const isActive = active === option;
              return (
                <button
                  key={option}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={
                    'flex min-h-11 w-full items-center justify-between gap-2 rounded-[14px] px-1.5 text-left font-sans text-[11px] font-semibold leading-none tracking-normal focus-visible:outline-2 focus-visible:outline-brand-blue md:min-h-9 md:rounded-md md:px-2 md:font-display md:tracking-wide ' +
                    (isActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-neutral-700 hover:bg-neutral-100 hover:text-brand-blue')
                  }
                >
                  <span data-league-item-label className="inline-flex min-w-0 flex-1 items-center">
                    <span className="md:hidden">{mobileLabel(option)}</span>
                    <span className="hidden md:inline">{desktopLabel(option)}</span>
                  </span>
                  {isActive && <Check className="h-3 w-3 shrink-0 md:h-3.5 md:w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeagueTabs;
