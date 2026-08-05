import React from 'react';
import type { LeagueId, SeasonParticipantsConfig } from '../types/season';

interface SeasonParticipantsProps {
  participants: SeasonParticipantsConfig;
  className?: string;
}

const LEAGUE_ORDER: LeagueId[] = ['L1', 'L2', 'L3'];

const formatDate = (value: string): string => value.replaceAll('-', '/');

const formatDeadline = (value: string): string => {
  const [datePart, timePart = ''] = value.split('T');
  const formattedDate = formatDate(datePart);
  const formattedTime = timePart.slice(0, 5);

  return formattedTime ? `${formattedDate} ${formattedTime} 前` : `${formattedDate} 前`;
};

const SeasonParticipants: React.FC<SeasonParticipantsProps> = ({
  participants,
  className = '',
}) => {
  const totalTeams = LEAGUE_ORDER.reduce(
    (total, leagueId) => total + participants.leagues[leagueId].length,
    0,
  );

  return (
    <section
      className={`border-y-2 border-brand-black py-8 md:py-10 ${className}`}
      aria-labelledby="season-participants-title"
    >
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-blue">
            Confirmed Clubs
          </p>
          <h2
            id="season-participants-title"
            className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-5xl"
          >
            正式參賽隊伍
          </h2>
          <p className="mt-3 text-xs font-bold tracking-wide text-neutral-500 md:text-sm">
            正式分級公布於 {formatDate(participants.confirmedAt)}
          </p>
        </div>
        <p className="font-display text-2xl font-black text-brand-blue">共 {totalTeams} 隊</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-px lg:border lg:border-neutral-200 lg:bg-neutral-200">
        {LEAGUE_ORDER.map((leagueId) => {
          const teams = participants.leagues[leagueId];
          const headingId = `season-participants-${leagueId.toLowerCase()}`;

          return (
            <section key={leagueId} className="border border-neutral-200 bg-white lg:border-0" aria-labelledby={headingId}>
              <div className="flex min-h-20 items-center justify-between bg-brand-black px-5 py-4 text-white">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-accent">
                    League {leagueId.slice(1)}
                  </p>
                  <h3 id={headingId} className="mt-1 font-display text-3xl font-black tracking-tight">
                    {leagueId}
                  </h3>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/65">
                  {teams.length} 隊
                </span>
              </div>

              <ol className="divide-y divide-neutral-200">
                {teams.map((team, index) => (
                  <li key={team} className="flex min-h-16 items-center px-5 py-4">
                    <span className="mr-4 w-7 shrink-0 font-display text-lg font-black tabular-nums text-brand-blue">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-black leading-6 text-brand-black md:text-base">
                      {team}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <p className="flex items-center border-l-2 border-brand-blue pl-4 text-xs font-bold leading-6 text-neutral-600 md:text-sm">
          {participants.note}
        </p>
        <p className="border-l-2 border-brand-accent bg-brand-black px-4 py-3 text-xs font-bold leading-6 text-white md:text-sm">
          {participants.nextStep}
        </p>
      </div>

      {participants.deadlines.length > 0 && (
        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-blue">重要期限</p>
          <div className="mt-4 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-2">
            {participants.deadlines.map((item) => (
              <div key={item.label} className="bg-white p-5 md:p-6">
                <p className="text-xs font-black tracking-widest text-neutral-500">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-black leading-tight text-brand-black md:text-3xl">
                  {formatDeadline(item.deadline)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-l-2 border-brand-blue pl-4 text-xs font-bold leading-6 text-neutral-600 md:text-sm">
            {participants.detailsNote}
          </p>
        </div>
      )}
    </section>
  );
};

export default SeasonParticipants;
