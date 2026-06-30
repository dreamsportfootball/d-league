import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Instagram,
  PackageOpen,
  Percent,
  UsersRound,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import { STAFF_PARTNER_TEAM_POPUP } from '../config/siteConfig';

const StaffPartnerTeamPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(STAFF_PARTNER_TEAM_POPUP.storageKey, 'dismissed');
    } catch {
      // Session storage may be unavailable in privacy-restricted browsers.
    }
  }, []);

  useEffect(() => {
    if (!STAFF_PARTNER_TEAM_POPUP.enabled) return;

    try {
      if (window.sessionStorage.getItem(STAFF_PARTNER_TEAM_POPUP.storageKey) === 'dismissed') {
        return;
      }
    } catch {
      // Continue and show the announcement when session storage is unavailable.
    }

    const timer = window.setTimeout(() => setOpen(true), STAFF_PARTNER_TEAM_POPUP.showDelayMs);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[];
      const enabledFocusable = focusable.filter((element) => !element.hasAttribute('disabled'));

      if (enabledFocusable.length === 0) return;
      const first = enabledFocusable[0];
      const last = enabledFocusable[enabledFocusable.length - 1];

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
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [dismiss, open]);

  if (!open) return null;

  const leagueLabel = STAFF_PARTNER_TEAM_POPUP.targetLeagues.join('、');

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
        aria-label="關閉工作人員合作隊招募"
        onClick={dismiss}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-partner-popup-title"
        aria-describedby="staff-partner-popup-description"
        className="relative w-full max-w-[560px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.34)] ring-1 ring-black/10 sm:rounded-[18px]"
      >
        <div className="h-1 bg-brand-accent sm:h-1.5" aria-hidden="true" />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="關閉工作人員合作隊招募"
          className="absolute right-2 top-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <header className="bg-brand-black px-5 pb-5 pt-5 text-white sm:px-8 sm:pb-8 sm:pt-8">
          <div className="flex items-center gap-1.5 text-brand-accent sm:gap-2">
            <UsersRound className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
            <p className="pr-11 text-[9px] font-black uppercase tracking-[0.14em] sm:pr-12 sm:text-xs sm:tracking-[0.2em]">
              {STAFF_PARTNER_TEAM_POPUP.eyebrow}
            </p>
          </div>

          <h2
            id="staff-partner-popup-title"
            className="mt-3 max-w-none whitespace-nowrap font-display text-[19px] font-black uppercase leading-tight tracking-[-0.03em] sm:mt-4 sm:text-[30px] sm:leading-[1.05] sm:tracking-tight"
          >
            {STAFF_PARTNER_TEAM_POPUP.title}
          </h2>
          <p
            id="staff-partner-popup-description"
            className="mt-3 max-w-lg text-[12px] font-medium leading-[1.55] text-white/70 sm:mt-4 sm:text-[15px] sm:leading-6"
          >
            <span className="block sm:inline">{STAFF_PARTNER_TEAM_POPUP.introQuestion}</span>
            <span className="block sm:inline">
              <span className="hidden sm:inline"> </span>
              {STAFF_PARTNER_TEAM_POPUP.introCallout}
            </span>
          </p>

          <div className="mt-4 inline-flex min-h-9 items-center border border-brand-accent/60 bg-brand-accent px-3 py-1.5 text-xs font-black text-brand-black sm:mt-5 sm:min-h-11 sm:px-4 sm:py-2 sm:text-sm">
            {leagueLabel} 各限 {STAFF_PARTNER_TEAM_POPUP.slotsPerLeague} 隊
          </div>
        </header>

        <div className="px-5 py-5 sm:px-8 sm:py-7">
          <section
            aria-labelledby="staff-partner-offer-heading"
            className="border border-brand-accent bg-brand-accent px-4 py-3.5 text-brand-black sm:px-5 sm:py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-black text-brand-accent sm:h-11 sm:w-11">
                <Percent className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-black/65 sm:text-[10px]">
                  {STAFF_PARTNER_TEAM_POPUP.offerEyebrow}
                </p>
                <h3
                  id="staff-partner-offer-heading"
                  className="mt-0.5 font-display text-[22px] font-black uppercase leading-none tracking-tight sm:text-2xl"
                >
                  {STAFF_PARTNER_TEAM_POPUP.offerTitle}
                </h3>
                <p className="mt-1.5 text-[10px] font-bold leading-4 text-brand-black/70 sm:text-[11px]">
                  {STAFF_PARTNER_TEAM_POPUP.offerNote}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
            <section aria-labelledby="staff-partner-tasks-heading">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-brand-blue sm:h-4 sm:w-4" aria-hidden="true" />
                <h3 id="staff-partner-tasks-heading" className="text-[10px] font-black uppercase leading-4 tracking-[0.08em] text-brand-black sm:text-xs sm:tracking-[0.16em]">
                  比賽日協助內容
                </h3>
              </div>
              <ul className="mt-2.5 space-y-2 sm:mt-3 sm:space-y-2.5">
                {STAFF_PARTNER_TEAM_POPUP.tasks.map((task) => (
                  <li key={task} className="flex items-start text-[12px] font-medium leading-4 text-neutral-600 sm:text-sm sm:leading-5">
                    <PackageOpen className="mr-1.5 mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 sm:mr-2 sm:h-4 sm:w-4" aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="staff-partner-benefits-heading" className="border-t border-neutral-200 pt-4 sm:border-t-0 sm:pt-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Utensils className="h-3.5 w-3.5 shrink-0 text-brand-blue sm:h-4 sm:w-4" aria-hidden="true" />
                <h3 id="staff-partner-benefits-heading" className="text-[10px] font-black uppercase leading-4 tracking-[0.08em] text-brand-black sm:text-xs sm:tracking-[0.16em]">
                  其他合作安排
                </h3>
              </div>
              <ul className="mt-2.5 space-y-2 sm:mt-3 sm:space-y-2.5">
                {STAFF_PARTNER_TEAM_POPUP.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start text-[12px] font-bold leading-4 text-brand-black sm:text-sm sm:leading-5">
                    <Check className="mr-1.5 mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue sm:mr-2 sm:h-4 sm:w-4" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-4 border-l-2 border-neutral-200 pl-2.5 text-[9px] font-medium leading-4 text-neutral-400 sm:mt-6 sm:pl-3 sm:text-[11px] sm:leading-5">
            {STAFF_PARTNER_TEAM_POPUP.supportNote}
          </p>

          <div className="mt-5 flex gap-2 sm:mt-6 sm:gap-3">
            <a
              href={STAFF_PARTNER_TEAM_POPUP.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              data-analytics-event="staff_partner_team_inquiry"
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center bg-brand-blue px-3 py-2.5 text-[11px] font-black text-white transition-colors hover:bg-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Instagram className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" aria-hidden="true" />
              <span className="truncate">{STAFF_PARTNER_TEAM_POPUP.ctaLabel}</span>
              <ArrowUpRight className="ml-1.5 h-4 w-4 shrink-0 sm:ml-2" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-11 shrink-0 items-center justify-center border border-neutral-300 px-3 py-2.5 text-[11px] font-black text-neutral-500 transition-colors hover:border-brand-black hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm"
            >
              稍後再看
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPartnerTeamPopup;
