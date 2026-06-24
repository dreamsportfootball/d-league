import React from 'react';
import { useSeason } from '../hooks/useSeason';
import type { MatchEvent, MatchEventType } from '../types/matchEvent';
import AutoFitText from './AutoFitText';

const ICON_URLS = {
  GOAL: 'https://www.gstatic.com/onebox/sports/game_feed/goal_icon.svg',
};

const EVENT_LABELS: Record<MatchEventType, string> = {
  GOAL: '進球',
  YELLOW_CARD: '黃牌',
  RED_CARD: '直接紅牌',
  SECOND_YELLOW: '雙黃退場',
};

const getEventIcon = (type: MatchEventType) => {
  switch (type) {
    case 'GOAL':
      return <img src={ICON_URLS.GOAL} alt="進球" className="h-4 w-4" />;
    case 'YELLOW_CARD':
      return (
        <div
          className="h-4 w-3 rounded-[2px] border border-black/10 bg-yellow-400 shadow-sm"
          title="黃牌"
        />
      );
    case 'RED_CARD':
      return (
        <div
          className="h-4 w-3 rounded-[2px] border border-black/10 bg-red-600 shadow-sm"
          title="直接紅牌"
        />
      );
    case 'SECOND_YELLOW':
      return (
        <div className="relative flex h-4 w-4 items-center justify-center" title="雙黃退場">
          <div className="absolute left-0 top-0 h-4 w-3 -rotate-6 rounded-[2px] border border-black/10 bg-yellow-400 shadow-sm" />
          <div className="absolute left-[3px] top-[1px] z-10 h-4 w-3 rotate-3 rounded-[2px] border border-black/10 bg-red-600 shadow-sm" />
        </div>
      );
    default:
      return null;
  }
};

interface TimelineRowProps {
  event: MatchEvent;
  teamColor?: string;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ event, teamColor }) => {
  const isHome = event.team === 'HOME';
  const extraText = event.isPK ? 'PK' : event.isOwnGoal ? '烏龍球' : '';

  const eventCard = (
    <div
      className={`w-full max-w-[13rem] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ${
        isHome ? 'justify-self-end text-right' : 'justify-self-start text-left'
      }`}
      style={{
        borderTopColor: teamColor ?? undefined,
        borderTopWidth: teamColor ? 2 : undefined,
      }}
    >
      <AutoFitText
        text={event.player}
        maxFontSize={14}
        minFontSize={8}
        className="font-black text-brand-black"
      />
      <div
        className={`mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 ${
          isHome ? 'justify-end' : 'justify-start'
        }`}
      >
        <span>{EVENT_LABELS[event.type]}</span>
        {extraText && (
          <>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span>{extraText}</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative grid min-h-16 w-full grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 py-1.5 sm:gap-4">
      <div className="min-w-0">{isHome ? eventCard : null}</div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <span className="mb-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 font-display text-[11px] font-black tabular-nums text-brand-blue shadow-sm">
          {event.minute}'
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
          {getEventIcon(event.type)}
        </span>
      </div>

      <div className="min-w-0">{!isHome ? eventCard : null}</div>
    </div>
  );
};

const MatchEvents: React.FC<{ matchId: string }> = ({ matchId }) => {
  const { seasonData } = useSeason();
  const match = seasonData.matches.find((item) => item.id === matchId);
  const events = seasonData.matchEvents[matchId] ?? [];
  const homeTeam = match ? seasonData.teamMap[match.homeTeamId] : undefined;
  const awayTeam = match ? seasonData.teamMap[match.awayTeamId] : undefined;

  if (events.length === 0) {
    return (
      <div className="mx-auto my-5 flex min-h-24 w-full max-w-xl items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-5 text-center">
        <p className="text-sm font-medium text-neutral-400">目前沒有比賽事件記錄</p>
      </div>
    );
  }

  const sortedEvents = events.slice().sort((a, b) => a.minute - b.minute);

  return (
    <div className="relative mx-auto mt-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-neutral-50/70 px-2 py-4 sm:px-4">
      <div
        className="pointer-events-none absolute bottom-7 left-1/2 top-7 w-px -translate-x-1/2 bg-neutral-200"
        aria-hidden="true"
      />

      <div className="relative flex flex-col">
        {sortedEvents.map((event) => (
          <TimelineRow
            key={event.id}
            event={event}
            teamColor={event.team === 'HOME' ? homeTeam?.primaryColor : awayTeam?.primaryColor}
          />
        ))}
      </div>
    </div>
  );
};

export default MatchEvents;
