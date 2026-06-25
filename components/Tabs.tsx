import React from 'react';

interface TabsProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  variant?: 'standard' | 'compact';
  ariaLabel?: string;
}

function Tabs<T extends string>({
  options,
  active,
  onChange,
  getLabel,
  variant = 'standard',
  ariaLabel = '切換內容',
}: TabsProps<T>) {
  const compact = variant === 'compact';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`no-scrollbar flex min-w-0 items-center overflow-x-auto ${compact ? 'gap-2' : 'gap-4'}`}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={active === option}
          onClick={() => onChange(option)}
          className={`shrink-0 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
            compact
              ? `rounded-full px-4 py-1.5 text-xs font-bold ${
                  active === option
                    ? 'bg-white text-brand-black shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`
              : `border-b-2 px-1 pb-2 text-xs font-bold md:text-sm ${
                  active === option
                    ? 'border-brand-blue text-brand-black'
                    : 'border-transparent font-medium text-neutral-400 hover:text-neutral-600'
                }`
          }`}
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
