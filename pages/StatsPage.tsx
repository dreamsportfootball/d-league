import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, User } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { useSeason } from '../hooks/useSeason';
import type { LeagueId } from '../types/season';

interface PlayerStats {
  name: string;
  teamId: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

type StatsTab = 'SCORERS' | 'CARDS';

const StatsPage: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(() => {
    try {
      const saved = window.sessionStorage.getItem('statsActiveLeague');
      return saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'L1';
    } catch {
      return 'L1';
    }
  });
  const [activeTab, setActiveTab] = useState<StatsTab>('SCORERS');

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues, activeSeason.id]);

  const handleLeagueChange = (league: LeagueId) => {
    setActiveLeague(league);
    try {
      window.sessionStorage.setItem('statsActiveLeague', league);
    } catch {
      // Session storage may be unavailable.
    }
  };

  const playerCurrentTeamMap = useMemo(() => {
    const map: Record<string, string> = {};
    seasonData.players.forEach((player) => {
      map[player.name] = player.teamId;
    });
    return map;
  }, [seasonData.players]);

  const statsData = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};
    const matchMap = Object.fromEntries(seasonData.matches.map((match) => [match.id, match]));

    Object.entries(seasonData.matchEvents).forEach(([matchId, events]) => {
      const match = matchMap[matchId];
      if (!match || match.league !== activeLeague) return;

      events.forEach((event) => {
        const currentTeamId = playerCurrentTeamMap[event.player];
        const currentTeam = currentTeamId ? seasonData.teamMap[currentTeamId] : undefined;
        const eventTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
        const displayTeamId = currentTeam?.leagueId === activeLeague ? currentTeamId : eventTeamId;

        const row = stats[event.player] ?? {
          name: event.player,
          teamId: displayTeamId,
          goals: 0,
          yellowCards: 0,
          redCards: 0,
        };

        row.teamId = displayTeamId;

        if (event.type === 'GOAL' && !event.isOwnGoal && !event.player.includes('(烏龍球)')) {
          row.goals += 1;
        }
        if (event.type === 'YELLOW_CARD') row.yellowCards += 1;
        if (event.type === 'RED_CARD') row.redCards += 1;
        if (event.type === 'SECOND_YELLOW') {
          row.yellowCards += 1;
          row.redCards += 1;
        }

        stats[event.player] = row;
      });
    });

    return Object.values(stats);
  }, [activeLeague, playerCurrentTeamMap, seasonData.matchEvents, seasonData.matches, seasonData.teamMap]);

  const sortedList = useMemo(() => {
    if (activeTab === 'SCORERS') {
      return statsData
        .filter((player) => player.goals > 0)
        .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'zh-TW'));
    }

    return statsData
      .filter((player) => player.yellowCards > 0 || player.redCards > 0)
      .sort((a, b) => {
        if (b.redCards !== a.redCards) return b.redCards - a.redCards;
        if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
        return a.name.localeCompare(b.name, 'zh-TW');
      });
  }, [activeTab, statsData]);

  const rankedList = useMemo(() => {
    let currentRank = 1;
    return sortedList.map((player, index) => {
      if (
        activeTab === 'SCORERS' &&
        index > 0 &&
        player.goals !== sortedList[index - 1].goals
      ) {
        currentRank = index + 1;
      } else if (activeTab === 'CARDS') {
        currentRank = index + 1;
      }
      return { ...player, rank: currentRank };
    });
  }, [activeTab, sortedList]);

  const hasData = rankedList.length > 0;

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-4 flex flex-col justify-between md:mb-12 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:mb-4 md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
              數據 <span className="text-brand-blue">中心</span>
            </h1>
            <p className="text-sm font-medium tracking-wide text-neutral-400 md:text-base">
              {activeSeason.displayName} {activeLeague} 球員數據
            </p>
          </div>
        </div>

        <div className="mb-10 flex items-center justify-between border-b border-neutral-100 pb-4">
          <h3 className="flex items-center font-display text-base font-bold uppercase tracking-wider text-neutral-900">
            <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
            選擇聯賽
          </h3>
          <div className="flex space-x-4 text-xs font-bold">
            {activeSeason.enabledLeagues.map((league) => (
              <button
                key={league}
                type="button"
                onClick={() => handleLeagueChange(league)}
                className={`whitespace-nowrap border-b-2 px-1 pb-1 transition-all ${
                  activeLeague === league
                    ? 'border-brand-blue font-bold text-brand-black'
                    : 'border-transparent font-medium text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <span className="font-display md:hidden">{league}</span>
                <span className="hidden md:inline">{activeSeason.leagues[league]?.displayName ?? league}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex space-x-10 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('SCORERS')}
            className={`text-sm font-bold uppercase tracking-widest transition-colors md:text-base ${
              activeTab === 'SCORERS' ? 'text-brand-black' : 'text-neutral-300 hover:text-neutral-500'
            }`}
          >
            射手榜
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CARDS')}
            className={`text-sm font-bold uppercase tracking-widest transition-colors md:text-base ${
              activeTab === 'CARDS' ? 'text-brand-black' : 'text-neutral-300 hover:text-neutral-500'
            }`}
          >
            紅黃牌
          </button>
        </div>

        {!hasData ? (
          <EmptyState
            title="新賽季尚未開始"
            description="新賽季尚未開始，射手榜及紅黃牌紀錄將於比賽開始後更新"
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : (
          <div className="flex w-full flex-col">
            {rankedList.map((player, index) => {
              const team = seasonData.teamMap[player.teamId];
              if (!team) return null;
              const playerImage = seasonData.playerImages[player.name];
              const isTopScorer = activeTab === 'SCORERS' && index === 0;

              return (
                <div
                  key={`${player.name}-${player.teamId}`}
                  className={`group relative flex items-center border-b border-neutral-100 transition-colors ${
                    isTopScorer ? 'bg-white py-6' : 'py-3.5 hover:bg-neutral-50'
                  }`}
                >
                  <div className="mr-3 flex w-12 shrink-0 justify-center md:mr-4 md:w-16">
                    <span className={`font-display font-black tracking-tighter ${isTopScorer ? 'text-4xl italic text-brand-blue' : 'text-xl text-brand-black'}`}>
                      {player.rank}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center">
                    {activeTab === 'SCORERS' && (
                      <div className={`relative shrink-0 overflow-hidden rounded-full border border-neutral-100 bg-neutral-100 ${isTopScorer ? 'h-20 w-20 shadow-xl md:h-24 md:w-24' : 'h-10 w-10 md:h-11 md:w-11'}`}>
                        {playerImage ? (
                          <img src={playerImage} alt={player.name} className="h-full w-full object-cover object-top" />
                        ) : (
                          <User className="h-full w-full p-2 text-neutral-300" aria-hidden="true" />
                        )}
                      </div>
                    )}

                    <div className={`${activeTab === 'SCORERS' ? (isTopScorer ? 'ml-6 md:ml-8' : 'ml-4') : ''} min-w-0`}>
                      <span className={`block break-words tracking-tight text-brand-black ${isTopScorer ? 'font-display text-2xl font-black italic text-brand-blue md:text-3xl' : 'text-sm font-bold md:text-base'}`}>
                        {player.name}
                      </span>
                      <div className="mt-1 flex items-center">
                        <img src={team.logo} alt="" className="mr-2 h-4 w-4 object-contain" />
                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          {team.shortName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[90px] shrink-0 pl-4 pr-2 text-right md:pr-4">
                    {activeTab === 'SCORERS' ? (
                      <span className={`font-display font-black tabular-nums tracking-tighter ${isTopScorer ? 'text-5xl text-brand-blue md:text-6xl' : 'text-2xl text-brand-black md:text-3xl'}`}>
                        {player.goals}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end space-x-3">
                        {player.redCards > 0 && (
                          <div className="flex h-8 w-6 -skew-x-12 items-center justify-center rounded-sm bg-red-600 font-display text-sm font-black text-white shadow-sm">
                            <span className="skew-x-12">{player.redCards}</span>
                          </div>
                        )}
                        {player.yellowCards > 0 && (
                          <div className="flex h-8 w-6 -skew-x-12 items-center justify-center rounded-sm bg-yellow-400 font-display text-sm font-black text-black shadow-sm">
                            <span className="skew-x-12">{player.yellowCards}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
