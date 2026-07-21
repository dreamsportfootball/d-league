import React from 'react';
import type { RegistrationResultsConfig } from '../types/season';

interface RegistrationResultsProps {
  results: RegistrationResultsConfig;
  className?: string;
}

const formatDeadline = (value: string): string => {
  const [datePart, timePart = ''] = value.split('T');
  const formattedDate = datePart.replaceAll('-', '/');
  const formattedTime = timePart.slice(0, 5);

  return formattedTime ? `${formattedDate} ${formattedTime} 前` : `${formattedDate} 前`;
};

const RegistrationResults: React.FC<RegistrationResultsProps> = ({
  results,
  className = '',
}) => (
  <section
    className={`border-y-2 border-brand-black py-8 md:py-10 ${className}`}
    aria-labelledby="registration-results-title"
  >
    <div className="flex flex-col gap-3 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-blue">
          Official Selection
        </p>
        <h2
          id="registration-results-title"
          className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-5xl"
        >
          正式錄取隊伍
        </h2>
      </div>
      <p className="font-display text-2xl font-black text-brand-blue">
        共 {results.acceptedTeams.length} 隊
      </p>
    </div>

    <ol className="grid grid-cols-1 border-x border-b border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
      {results.acceptedTeams.map((team, index) => (
        <li
          key={team}
          className="flex min-h-16 items-center border-b border-neutral-200 px-4 py-4 last:border-b-0 sm:border-r sm:px-5 lg:min-h-20"
        >
          <span className="mr-4 w-7 shrink-0 font-display text-lg font-black tabular-nums text-brand-blue">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-black leading-6 text-brand-black md:text-base">{team}</span>
        </li>
      ))}
    </ol>

    {results.waitlistedTeams.length > 0 && (
      <div className="mt-8 border border-neutral-300 bg-neutral-50 p-5 md:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-2xl font-black uppercase tracking-tight text-brand-black">
            備取隊伍
          </h3>
          <span className="text-xs font-black uppercase tracking-widest text-neutral-500">
            共 {results.waitlistedTeams.length} 隊
          </span>
        </div>
        <ol className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
          {results.waitlistedTeams.map((team, index) => (
            <li key={team} className="flex min-h-14 items-center py-3">
              <span className="mr-4 w-7 shrink-0 font-display text-lg font-black tabular-nums text-neutral-400">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-black leading-6 text-brand-black md:text-base">{team}</span>
            </li>
          ))}
        </ol>
      </div>
    )}

    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <p className="border-l-2 border-brand-blue pl-4 text-xs font-bold leading-6 text-neutral-600 md:text-sm">
        {results.note}
      </p>
      <p className="border-l-2 border-brand-accent bg-brand-black px-4 py-3 text-xs font-bold leading-6 text-white md:text-sm">
        {results.groupingNote}
      </p>
    </div>

    <div className="mt-8 border-t border-neutral-200 pt-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-blue">重要期限</p>
      <div className="mt-4 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-2">
        {results.deadlines.map((item) => (
          <div key={item.label} className="bg-white p-5 md:p-6">
            <p className="text-xs font-black tracking-widest text-neutral-500">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-black leading-tight text-brand-black md:text-3xl">
              {formatDeadline(item.deadline)}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 border-l-2 border-brand-blue pl-4 text-xs font-bold leading-6 text-neutral-600 md:text-sm">
        {results.detailsNote}
      </p>
    </div>
  </section>
);

export default RegistrationResults;
