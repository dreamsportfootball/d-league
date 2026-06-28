import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Instagram,
  PackageOpen,
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
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[560px] overflow-y-auto rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.34)] ring-1 ring-black/10"
      >
        <div className="h-1.5 bg-brand-accent" aria-hidden="true" />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="關閉工作人員合作隊招募"
          className="absolute right-3 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:right-4"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <header className="bg-brand-black px-5 pb-7 pt-6 text-white sm:px-8 sm:pb-8 sm:pt-8">
          <div className="flex items-center gap-2 text-brand-accent">
            <UsersRound className="h-5 w-5" aria-hidden="true" />
            <p className="pr-12 text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              {STAFF_PARTNER_TEAM_POPUP.eyebrow}
            </p>
          </div>

          <h2
            id="staff-partner-popup-title"
            className="mt-4 max-w-md font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl"
          >
            {STAFF_PARTNER_TEAM_POPUP.title}
          </h2>
          <p
            id="staff-partner-popup-description"
            className="mt-4 max-w-lg text-sm font-medium leading-6 text-white/70 sm:text-[15px]"
          >
            {STAFF_PARTNER_TEAM_POPUP.intro}
          </p>

          <div className="mt-5 inline-flex min-h-11 items-center border border-brand-accent/60 bg-brand-accent px-4 py-2 text-sm font-black text-brand-black">
            {leagueLabel} 各限 {STAFF_PARTNER_TEAM_POPUP.slotsPerLeague} 隊
          </div>
        </header>

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <section aria-labelledby="staff-partner-tasks-heading">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                <h3 id="staff-partner-tasks-heading" className="text-xs font-black uppercase tracking-[0.16em] text-brand-black">
                  比賽日協助內容
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5">
                {STAFF_PARTNER_TEAM_POPUP.tasks.map((task) => (
                  <li key={task} className="flex items-start text-sm font-medium leading-5 text-neutral-600">
                    <PackageOpen className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="staff-partner-benefits-heading">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                <h3 id="staff-partner-benefits-heading" className="text-xs font-black uppercase tracking-[0.16em] text-brand-black">
                  合作隊伍專屬安排
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5">
                {STAFF_PARTNER_TEAM_POPUP.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start text-sm font-bold leading-5 text-brand-black">
                    <Check className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-6 border-l-2 border-neutral-200 pl-3 text-[11px] font-medium leading-5 text-neutral-400">
            {STAFF_PARTNER_TEAM_POPUP.supportNote}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={STAFF_PARTNER_TEAM_POPUP.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              data-analytics-event="staff_partner_team_inquiry"
              className="inline-flex min-h-12 flex-1 items-center justify-center bg-brand-blue px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
              {STAFF_PARTNER_TEAM_POPUP.ctaLabel}
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-12 items-center justify-center border border-neutral-300 px-5 py-3 text-sm font-black text-neutral-500 transition-colors hover:border-brand-black hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 sm:flex-none"
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
