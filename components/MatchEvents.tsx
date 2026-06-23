import React from 'react';
import { useSeason } from '../hooks/useSeason';
import type { MatchEvent, MatchEventType } from '../types';

const ICON_URLS = {
  GOAL: 'https://www.gstatic.com/onebox/sports/game_feed/goal_icon.svg',
};

const getEventIcon = (type: MatchEventType) => {
  switch (type) {
    case 'GOAL':
      return <img src={ICON_URLS.GOAL} alt="進球" className="h-4 w-4" />;
    case 'YELLOW_CARD':
      return <div className="h-3.5 w-2.5 rounded-[1px] border border-black/10 bg-yellow-400 shadow-sm" title="黃牌" />;
    case 'RED_CARD':
      return <div className="h-3.5 w-2.5 rounded-[1px] border border-black/10 bg-red-600 shadow-sm" title="紅牌" />;
    case 'SECOND_YELLOW':
      return (
        <div className="relative flex h-3.5 w-3 items-center justify-center" title="第二張黃牌">
          <div className="absolute left-0 top-0 h-3.5 w-2.5 -rotate-6 rounded-[1px] border border-black/10 bg-yellow-400 shadow-sm" />
          <div className="absolute left-[2px] top-[1px] z-10 h-3.5 w-2.5 rotate-3 rounded-[1px] border border-black/10 bg-red-600 shadow-sm" />
        </div>
      );
    default:
      return null;
  }
};

const TimelineRow: React.FC<{ event: MatchEvent }> = ({ event }) => {
  const isHome = event.team === 'HOME';
  const isLongName = event.player.length > 12;
  const textSizeClass = isLongName ? 'text-[10px] leading-tight' : 'text-sm';
  const extraText = event.isPK ? ' (PK)' : event.isOwnGoal ? ' (烏龍球)' : '';

  return (
    <div className="relative flex w-full items-center py-1">
      <div className="flex min-w-0 flex-1 justify-end pr-2">
        {isHome && (
          <div className="flex w-full items-center justify-end space-x-2">
            <span className={`break-words text-right font-medium text-brand-black ${textSizeClass}`}>
              {event.player}
              <span className="text-xs font-normal text-neutral-500">{extraText}</span>
            </span>
            <span className="w-6 shrink-0 text-center text-[10px] font-bold text-neutral-500">{event.minute}'</span>
          </div>
        )}
      </div>

      <div className="z-10 flex w-8 shrink-0 flex-col items-center">{getEventIcon(event.type)}</div>

      <div className="flex min-w-0 flex-1 justify-start pl-2">
        {!isHome && (
          <div className="flex w-full items-center space-x-2">
            <span className="w-6 shrink-0 text-center text-[10px] font-bold text-neutral-500">{event.minute}'</span>
            <span className={`break-words text-left font-medium text-brand-black ${textSizeClass}`}>
              {event.player}
              <span className="text-xs font-normal text-neutral-500">{extraText}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchEvents: React.FC<{ matchId: string }> = ({ matchId }) => {
  const { seasonData } = useSeason();
  const events = seasonData.matchEvents[matchId] ?? [];

  if (events.length === 0) {
    return <p className="py-4 text-center text-sm text-neutral-400">目前沒有事件記錄</p>;
  }

  const sortedEvents = events.slice().sort((a, b) => a.minute - b.minute);

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-xl flex-col">
      {sortedEvents.map((event) => (
        <TimelineRow key={event.id} event={event} />
      ))}
    </div>
  );
};

export default MatchEvents;
