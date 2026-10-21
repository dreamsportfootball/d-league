import React, { useEffect, useMemo, useState } from 'react';
import { useSeason } from '../hooks/useSeason';
import { formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const padNumber = (value: number): string => String(value).padStart(2, '0');

const OpeningCountdown: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const kickoffAt = useMemo(
    () =>
      seasonData.matches.reduce<number | null>((earliest, match) => {
        if (!activeSeason.enabledLeagues.some((league) => league === match.league)) {
          return earliest;
        }
        const timestamp = Date.parse(match.timestamp);
        return Number.isFinite(timestamp) && (earliest === null || timestamp < earliest)
          ? timestamp
          : earliest;
      }, null),
    [activeSeason.enabledLeagues, seasonData.matches],
  );

  const [now, setNow] = useState(() => Date.now());
  const hasStarted = kickoffAt === null || now >= kickoffAt;

  useEffect(() => {
    if (hasStarted) return;

    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, [hasStarted, kickoffAt]);

  if (kickoffAt === null || hasStarted) return null;

  const secondsLeft = Math.max(0, Math.ceil((kickoffAt - now) / 1000));
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const kickoffDate = new Date(kickoffAt);
  const values = [
    { label: '天', value: padNumber(days) },
    { label: '時', value: padNumber(hours) },
    { label: '分', value: padNumber(minutes) },
    { label: '秒', value: padNumber(seconds) },
  ];

  return (
    <section
      className="border-y border-white/15 bg-brand-black text-white"
      aria-label={`${activeSeason.shortName} 賽季開幕戰倒數`}
    >
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-7 md:flex-row md:justify-between md:gap-10 md:px-6 md:py-8">
        <div className="min-w-0 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-accent">
            {activeSeason.shortName} · SEASON KICKOFF
          </p>
          <h2 className="mt-2 font-display text-[26px] font-bold uppercase leading-tight tracking-wide sm:text-3xl">
            開幕戰倒數
          </h2>
          <p className="mt-2 text-xs font-medium tracking-wide text-white/65 sm:text-sm">
            {formatTaipeiDateWithWeekday(kickoffDate)} {formatTaipeiTime(kickoffDate)} · 台灣時間
          </p>
        </div>

        <div
          role="timer"
          aria-label={`距離開幕戰還有 ${days} 天 ${hours} 小時 ${minutes} 分鐘 ${seconds} 秒`}
          aria-live="off"
          className="grid w-full grid-cols-4 md:w-[448px]"
        >
          {values.map(({ label, value }) => (
            <div key={label} className="flex min-w-0 flex-col items-center px-1 sm:px-3">
              <span className="font-display text-[42px] font-semibold leading-none tracking-tight tabular-nums text-white sm:text-5xl md:text-[60px]">
                {value}
              </span>
              <span className="mt-2 text-[11px] font-bold tracking-widest text-white/55">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OpeningCountdown;
