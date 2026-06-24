import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface SeasonDropdownOption {
  value: string;
  label: string;
}

interface SeasonDropdownProps {
  value: string;
  buttonLabel: string;
  options: readonly SeasonDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

const SeasonDropdown: React.FC<SeasonDropdownProps> = ({
  value,
  buttonLabel,
  options,
  onChange,
  ariaLabel,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative hidden w-[164px] md:block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`flex min-h-11 w-full items-center justify-between whitespace-nowrap border-b-2 px-1 text-sm font-black transition-colors ${
          open ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-black hover:text-brand-blue'
        }`}
      >
        <span>{buttonLabel}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!selected) onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-12 w-full items-center justify-between border-b border-neutral-100 px-4 text-left text-sm font-bold last:border-b-0 ${
                  selected ? 'text-brand-blue' : 'text-brand-black hover:bg-neutral-50 hover:text-brand-blue'
                }`}
              >
                <span>{option.label}</span>
                {selected && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeasonDropdown;
