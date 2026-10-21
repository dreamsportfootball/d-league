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
      className="bg-brand-black text-white"
      aria-label={`${activeSeason.shortName} 賽季開幕戰倒數`}
    >
      <div className="container mx-auto flex flex-col gap-6 px-4 py-7 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-8">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-accent">
            D LEAGUE {activeSeason.shortName} · KICKOFF
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight tracking-wide text-white sm:text-4xl">
            開幕戰倒數
          </h2>
          <p className="mt-2 font-sans text-xs font-semibold leading-relaxed text-white/75 sm:text-sm">
            {formatTaipeiDateWithWeekday(kickoffDate)} · {formatTaipeiTime(kickoffDate)} 開球
          </p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-white/50">
            {activeSeason.venue} · 台灣時間
          </p>
        </div>

        <div
          role="timer"
          aria-label={`距離開幕戰還有 ${days} 天 ${hours} 小時 ${minutes} 分鐘 ${seconds} 秒`}
          aria-live="off"
          className="grid w-full grid-cols-4 gap-x-2 sm:gap-x-3 lg:max-w-[568px]"
        >
          {values.map(({ label, value }) => (
            <div key={label} className="flex min-w-0 items-baseline justify-center gap-1 lg:justify-end">
              <span
                className={`font-display text-[clamp(2.7rem,9vw,4.5rem)] font-bold leading-none tracking-tight tabular-nums ${label === '天' ? 'text-brand-accent' : 'text-white'}`}
              >
                {value}
              </span>
              <span className="shrink-0 font-sans text-[11px] font-bold text-white/65 sm:text-xs">
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
