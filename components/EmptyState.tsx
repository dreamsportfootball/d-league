import React from 'react';
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  showRegistrationLink?: boolean;
  primaryAction?: {
    label: string;
    to: string;
  };
  primaryButton?: {
    label: string;
    onClick: () => void;
  };
  eyebrow?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  showRegistrationLink = false,
  primaryAction,
  primaryButton,
  eyebrow = '目前狀態',
}) => (
  <section className="w-full border-y border-neutral-200 bg-neutral-50/70 px-5 py-8 md:px-8 md:py-10">
    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-[52px_minmax(0,1fr)] md:gap-6">
      <div className="flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white">
        <ClipboardList className="h-5 w-5 text-brand-blue" aria-hidden="true" />
      </div>

      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-pretty font-display text-2xl font-black tracking-tight text-brand-black md:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-sm font-medium leading-6 text-neutral-500 md:text-base md:leading-7">
          {description}
        </p>

        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
          {!primaryAction && !primaryButton && (
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              返回首頁
            </Link>
          )}

          {primaryAction && (
            <Link
              to={primaryAction.to}
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              {primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          )}

          {primaryButton && (
            <button
              type="button"
              onClick={primaryButton.onClick}
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              {primaryButton.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {showRegistrationLink && !primaryAction && !primaryButton && (
            <Link
              to="/registration"
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-brand-black px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              查看報名詳情
            </Link>
          )}
        </div>
      </div>
    </div>
  </section>
);

export default EmptyState;