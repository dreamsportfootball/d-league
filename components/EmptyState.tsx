import React from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  showRegistrationLink?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  showRegistrationLink = true,
}) => (
  <div className="flex min-h-[360px] w-full flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
      <ClipboardList className="h-6 w-6 text-brand-blue" aria-hidden="true" />
    </div>
    <h2 className="font-display text-2xl font-black uppercase tracking-wide text-brand-black md:text-3xl">
      {title}
    </h2>
    <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-neutral-500 md:text-base">
      {description}
    </p>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center justify-center border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        返回首頁
      </Link>
      {showRegistrationLink && (
        <Link
          to="/registration"
          className="inline-flex min-h-11 items-center justify-center bg-brand-black px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
        >
          查看報名詳情
        </Link>
      )}
    </div>
  </div>
);

export default EmptyState;
