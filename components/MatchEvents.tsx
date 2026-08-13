import React from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import {
  getPlayerIdentity,
  getTeamIdentity,
  resolveMatchEventPlayer,
} from '../services/entityData';
import type { MatchEvent, MatchEventType } from '../types/matchEvent';

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

interface TimelineRowProps {
  event: MatchEvent;
  playerHref?: string;
  teamHref?: string;
  teamName?: string;
}

const TimelineRow: React.FC<TimelineRowProps> = ({
  event,
  playerHref,
  teamHref,
  teamName,
}) => {
  const isHome = event.team === 'HOME';
  const isLongName = event.player.length > 12;
  const textSizeClass = isLongName ? 'text-[11px] leading-tight' : 'text-[13px] sm:text-sm';
  const extraText = event.isPK ? '（十二碼）' : event.isOwnGoal ? '（烏龍球）' : '';
  const playerClass = `break-words font-semibold text-brand-black transition-colors ${textSizeClass} ${playerHref ? 'hover:text-brand-blue' : ''}`;

  const playerName = playerHref ? (
    <Link to={playerHref} className={playerClass}>
      {event.player}
      <span className="ml-1 text-[10px] font-normal text-neutral-400">{extraText}</span>
    </Link>
  ) : (
    <span className={playerClass}>
      {event.player}
      <span className="ml-1 text-[10px] font-normal text-neutral-400">{extraText}</span>
    </span>
  );

  const teamLabel = teamName && teamHref ? (
    <Link
      to={teamHref}
      className="mt-0.5 block text-[10px] font-bold text-neutral-400 transition-colors hover:text-brand-blue"
    >
      {teamName}
    </Link>
  ) : teamName ? (
    <span className="mt-0.5 block text-[10px] font-bold text-neutral-400">{teamName}</span>
  ) : null;

  return (
    <div className="relative flex min-h-9 w-full items-center py-1.5">
      <div className="flex min-w-0 flex-1 justify-end pr-2.5 sm:pr-3">
        {isHome && (
          <div className="flex w-full items-center justify-end gap-2">
            <div className="min-w-0 text-right">
              {playerName}
              {teamLabel}
            </div>
            <span className="w-7 shrink-0 text-center text-[11px] font-bold tabular-nums text-neutral-500">{event.minute}'</span>
          </div>
        )}
      </div>

      <div className="z-10 flex w-9 shrink-0 items-center justify-center">{getEventIcon(event.type)}</div>

      <div className="flex min-w-0 flex-1 justify-start pl-2.5 sm:pl-3">
        {!isHome && (
          <div className="flex w-full items-center gap-2">
            <span className="w-7 shrink-0 text-center text-[11px] font-bold tabular-nums text-neutral-500">{event.minute}'</span>
            <div className="min-w-0 text-left">
              {playerName}
              {teamLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchEvents: React.FC<{ matchId: string }> = ({ matchId }) => {
  const { activeSeason, seasonData } = useSeason();
  const events = seasonData.matchEvents[matchId] ?? [];
  const match = seasonData.matches.find((item) => item.id === matchId);

  if (events.length === 0) {
    return <p className="py-5 text-center text-sm font-medium text-neutral-400">目前沒有比賽事件</p>;
  }

  const sortedEvents = events.slice().sort((a, b) => a.minute - b.minute);

  return (
    <div className="relative mx-auto mt-5 flex w-full max-w-lg flex-col sm:mt-6">
      {sortedEvents.map((event) => {
        const player = match ? resolveMatchEventPlayer(seasonData, match, event) : undefined;
        const team = match
          ? seasonData.teamMap[event.team === 'HOME' ? match.homeTeamId : match.awayTeamId]
          : undefined;
        const playerHref = player
          ? `/players/${getPlayerIdentity(player)}?season=${activeSeason.id}`
          : undefined;
        const teamHref = team
          ? `/teams/${getTeamIdentity(team)}?season=${activeSeason.id}`
          : undefined;

        return (
          <TimelineRow
            key={event.id}
            event={event}
            playerHref={playerHref}
            teamHref={teamHref}
            teamName={team?.shortName || team?.name}
          />
        );
      })}
    </div>
  );
};

export default MatchEvents;
