import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import type { FilterDrawerField } from './ResponsiveFilterDrawer';

interface DesktopFilterPopoverProps {
  open: boolean;
  fields: readonly FilterDrawerField[];
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  applyLabel: string;
  clearDisabled?: boolean;
  title?: string;
  subtitle?: string;
}

const DesktopFilterPopover: React.FC<DesktopFilterPopoverProps> = ({
  open,
  fields,
  onClose,
  onClear,
  onApply,
  applyLabel,
  clearDisabled = false,
  title = '篩選資料',
  subtitle = '選擇要查看的資料範圍',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const activeField = fields.find((field) => field.id === activeFieldId) ?? null;
  const fieldIds = useMemo(() => new Set(fields.map((field) => field.id)), [fields]);

  useEffect(() => {
    if (!open) {
      setActiveFieldId(null);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (activeFieldId) {
        setActiveFieldId(null);
      } else {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFieldId, onClose, open]);

  useEffect(() => {
    if (activeFieldId && !fieldIds.has(activeFieldId)) setActiveFieldId(null);
  }, [activeFieldId, fieldIds]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className="absolute right-0 top-[calc(100%+12px)] z-50 hidden w-[360px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.16)] md:flex md:max-h-[min(70vh,560px)] md:flex-col"
    >
      {activeField ? (
        <>
          <div className="grid shrink-0 grid-cols-[44px_1fr_44px] items-center border-b border-neutral-100 px-2 py-2">
            <button
              type="button"
              onClick={() => setActiveFieldId(null)}
              className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:text-brand-black"
              aria-label="返回篩選"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-center font-display text-base font-black text-brand-black">選擇{activeField.label}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black"
              aria-label="取消並關閉"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            {activeField.options.map((option) => {
              const selected = option.value === activeField.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    activeField.onChange(option.value);
                    setActiveFieldId(null);
                  }}
                  className={`flex min-h-[52px] w-full items-center justify-between border-b border-neutral-100 text-left text-sm font-bold last:border-b-0 ${
                    selected ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-brand-blue' : 'border-neutral-300'
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="shrink-0 border-b border-neutral-100 px-5 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-black text-brand-black">{title}</p>
                <p className="mt-1 text-[11px] font-medium text-neutral-400">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black"
                aria-label="取消並關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            {fields.map((field) => (
              <button
                key={field.id}
                type="button"
                onClick={() => setActiveFieldId(field.id)}
                className="flex min-h-[58px] w-full items-center border-b border-neutral-100 text-left last:border-b-0"
              >
                <span className="w-24 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
                <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-brand-black">{field.displayValue}</span>
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-neutral-100 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClear}
              disabled={clearDisabled}
              className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-black text-neutral-500 transition-colors hover:text-brand-black disabled:opacity-30 disabled:hover:text-neutral-500"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> 清除
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white transition-colors hover:bg-blue-800"
            >
              <Check className="mr-2 h-4 w-4" /> {applyLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopFilterPopover;
