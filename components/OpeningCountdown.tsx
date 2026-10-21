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
  const clock = [
    { label: '時', value: padNumber(hours) },
    { label: '分', value: padNumber(minutes) },
    { label: '秒', value: padNumber(seconds) },
  ];

  return (
    <section
      className="bg-brand-black text-white"
      aria-label={`${activeSeason.shortName} 賽季開幕戰倒數`}
    >
      <div className="container mx-auto grid gap-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 lg:py-8">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-accent">
            {activeSeason.shortName} · SEASON KICKOFF
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight tracking-wide text-white sm:text-4xl">
            距離開幕戰
          </h2>
          <p className="mt-2 font-sans text-xs font-semibold leading-relaxed text-white/80 sm:text-sm">
            {formatTaipeiDateWithWeekday(kickoffDate)} · {formatTaipeiTime(kickoffDate)} 開球
          </p>
          <p className="mt-0.5 font-sans text-xs leading-relaxed text-white/60">
            {activeSeason.venue} · 台灣時間
          </p>
        </div>

        <div
          role="timer"
          aria-label={`距離開幕戰還有 ${days} 天 ${hours} 小時 ${minutes} 分鐘 ${seconds} 秒`}
          aria-live="off"
          className="flex min-w-0 items-end justify-between gap-4 sm:justify-start sm:gap-10 lg:gap-12"
        >
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-display text-[82px] font-bold leading-none tracking-tight tabular-nums text-brand-accent sm:text-[96px] lg:text-[104px]">
              {padNumber(days)}
            </span>
            <span className="font-sans text-sm font-extrabold text-brand-accent">天</span>
          </div>

          <div className="flex min-w-0 items-end gap-1 pb-1 sm:gap-2 lg:pb-2">
            {clock.map(({ label, value }, index) => (
              <React.Fragment key={label}>
                {index > 0 && (
                  <span aria-hidden="true" className="self-start pt-0.5 font-display text-2xl font-medium text-white/35 sm:text-3xl">
                    :
                  </span>
                )}
                <div className="flex min-w-0 flex-col items-center gap-1">
                  <span className="font-display text-[34px] font-semibold leading-none tracking-tight tabular-nums text-white sm:text-[42px] lg:text-5xl">
                    {value}
                  </span>
                  <span className="font-sans text-[11px] font-bold text-white/65">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpeningCountdown;
