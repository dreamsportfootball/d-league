import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';

export interface FilterDrawerOption {
  value: string;
  label: string;
}

export interface FilterDrawerField {
  id: string;
  label: string;
  value: string;
  displayValue: string;
  options: readonly FilterDrawerOption[];
  onChange: (value: string) => void;
}

interface ResponsiveFilterDrawerProps {
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

interface FilterPanelContentProps extends Omit<ResponsiveFilterDrawerProps, 'open'> {
  activeFieldId: string | null;
  setActiveFieldId: React.Dispatch<React.SetStateAction<string | null>>;
  mobile?: boolean;
}

const FilterPanelContent: React.FC<FilterPanelContentProps> = ({
  fields,
  onClose,
  onClear,
  onApply,
  applyLabel,
  clearDisabled = false,
  title = '篩選資料',
  subtitle = '選擇要查看的資料範圍',
  activeFieldId,
  setActiveFieldId,
  mobile = false,
}) => {
  const activeField = fields.find((field) => field.id === activeFieldId) ?? null;
  const horizontalPadding = mobile ? 'px-5' : 'px-7';

  if (activeField) {
    return (
      <>
        <div className={`grid shrink-0 grid-cols-[52px_1fr_52px] items-center border-b border-neutral-100 py-3 ${mobile ? 'px-2' : 'px-3'}`}>
          <button
            type="button"
            onClick={() => setActiveFieldId(null)}
            data-filter-initial-focus
            className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="返回篩選"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-center font-display text-lg font-black text-brand-black">選擇{activeField.label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="取消並關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto overscroll-contain py-3 ${horizontalPadding}`} role="radiogroup" aria-label={activeField.label}>
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
                className={`flex min-h-[56px] w-full items-center justify-between border-b border-neutral-100 text-left text-sm font-bold last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset ${
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
    );
  }

  return (
    <>
      <div className={`shrink-0 border-b border-neutral-100 ${horizontalPadding} ${mobile ? 'pb-4 pt-3' : 'py-7'}`}>
        {mobile && <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200" aria-hidden="true" />}
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`font-display font-black text-brand-black ${mobile ? 'text-xl' : 'text-2xl'}`}>{title}</h2>
            <p className="mt-1 text-xs font-medium text-neutral-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-filter-initial-focus
            className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="取消並關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto overscroll-contain py-3 ${horizontalPadding}`}>
        {fields.map((field) => (
          <button
            key={field.id}
            type="button"
            onClick={() => setActiveFieldId(field.id)}
            className="flex min-h-[64px] w-full items-center border-b border-neutral-100 text-left last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset"
          >
            <span className="w-24 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
            <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-brand-black">{field.displayValue}</span>
            <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className={`grid shrink-0 grid-cols-[auto_1fr] gap-4 border-t border-neutral-100 bg-white ${horizontalPadding} ${mobile ? 'pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4' : 'py-6'}`}>
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-black text-neutral-500 transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-30 disabled:hover:text-neutral-500"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> 清除
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 active:bg-blue-800"
        >
          <Check className="mr-2 h-4 w-4" /> {applyLabel}
        </button>
      </div>
    </>
  );
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null);

const ResponsiveFilterDrawer: React.FC<ResponsiveFilterDrawerProps> = (props) => {
  const { open, onClose, fields, title = '篩選資料' } = props;
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const fieldIds = useMemo(() => new Set(fields.map((field) => field.id)), [fields]);
  const desktopDialogRef = useRef<HTMLElement | null>(null);
  const mobileDialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getActiveDialog = (): HTMLElement | null =>
    window.matchMedia('(min-width: 768px)').matches
      ? desktopDialogRef.current
      : mobileDialogRef.current;

  useEffect(() => {
    if (!open) {
      setActiveFieldId(null);
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const focusInitialControl = () => {
      const dialog = getActiveDialog();
      const initial = dialog?.querySelector<HTMLElement>('[data-filter-initial-focus]');
      (initial ?? dialog)?.focus();
    };
    const frame = window.requestAnimationFrame(focusInitialControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (activeFieldId) setActiveFieldId(null);
        else onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = getActiveDialog();
      if (!dialog) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFieldId, onClose, open]);

  useEffect(() => {
    if (activeFieldId && !fieldIds.has(activeFieldId)) setActiveFieldId(null);
  }, [activeFieldId, fieldIds]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1200] hidden md:block">
        <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} aria-label="取消並關閉篩選" />
        <aside
          ref={desktopDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className="absolute right-0 top-0 flex h-full w-[420px] max-w-full flex-col bg-white shadow-[-24px_0_60px_rgba(0,0,0,0.2)] outline-none"
        >
          <FilterPanelContent {...props} activeFieldId={activeFieldId} setActiveFieldId={setActiveFieldId} />
        </aside>
      </div>

      <div className="fixed inset-0 z-[1200] flex items-end md:hidden">
        <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="取消並關閉篩選" />
        <section
          ref={mobileDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl outline-none"
        >
          <FilterPanelContent {...props} activeFieldId={activeFieldId} setActiveFieldId={setActiveFieldId} mobile />
        </section>
      </div>
    </>
  );
};

export default ResponsiveFilterDrawer;
