// 檔案路徑：d-league web/pages/StatsPage.tsx

import React, { useState, useMemo } from 'react';
import { MATCH_EVENTS, MATCHES, TEAMS, PLAYER_IMAGES, ALL_PLAYERS } from '../constants';
import { Trophy, User } from 'lucide-react';

interface PlayerStats {
  name: string;
  teamId: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

// 定義每個球隊所屬的聯盟
const TEAM_LEAGUES: Record<string, 'L1' | 'L2'> = {
    't_chiayi': 'L1',
    't_jiuhao': 'L1',
    't_tongque': 'L1',
    't_chen': 'L1',
    't_luzhu': 'L2',
    't_pingtung': 'L2',
    't_crazydog': 'L2',
    't_canglong': 'L2',
    't_ppi': 'L2',
    't_niaoshi': 'L2'
};

const ProRank: React.FC<{ rank: number; isHeroMode: boolean }> = ({ rank, isHeroMode }) => {
    if (rank === 1 && isHeroMode) {
        return (
            <div className="flex flex-col items-center justify-center w-12 md:w-16">
                <span className="font-display font-black text-4xl text-brand-blue leading-none italic tracking-tighter">
                    {rank}
                </span>
                <div className="h-0.5 w-4 bg-brand-blue mt-1"></div>
            </div>
        );
    }
    return (
        <div className="w-12 md:w-16 flex justify-center">
            <span className="font-display font-bold text-brand-black text-xl tracking-tighter">
                {rank}
            </span>
        </div>
    );
};

const ProStatRow: React.FC<{ 
    player: PlayerStats; 
    rank: number; 
    activeTab: 'SCORERS' | 'CARDS';
    isHeroModeAllowed: boolean;
}> = ({ player, rank, activeTab, isHeroModeAllowed }) => {
    const team = TEAMS[player.teamId];
    const playerImage = PLAYER_IMAGES[player.name];
    
    // 判斷是否顯示大版面：必須是第一名 + 射手榜 + 允許顯示大版面
    const isHero = rank === 1 && activeTab === 'SCORERS' && isHeroModeAllowed;

    const getNameSizeClass = (name: string, hero: boolean) => {
        const len = name.length;
        if (hero) {
            if (len > 20) return 'text-lg md:text-xl leading-tight'; 
            if (len > 10) return 'text-xl md:text-2xl'; 
            return 'text-2xl md:text-3xl'; 
        } else {
            if (len > 20) return 'text-[10px] md:text-xs leading-tight font-bold';
            if (len > 10) return 'text-xs md:text-sm font-bold';
            return 'text-sm md:text-base font-bold';
        }
    };

    return (
        <div className={`
            group relative flex items-center transition-all duration-300 border-b border-neutral-100
            ${isHero ? 'py-6 bg-white z-10' : 'py-3.5 hover:bg-neutral-50'} 
        `}>
            <div className="shrink-0 mr-2 md:mr-4">
                <ProRank rank={rank} isHeroMode={activeTab === 'SCORERS' && isHeroModeAllowed} />
            </div>

            <div className="flex-1 flex items-center min-w-0">
                {activeTab === 'SCORERS' && (
                    <div className="relative shrink-0">
                        <div className={`
                            relative overflow-hidden rounded-full bg-neutral-100 border border-neutral-100
                            ${isHero ? 'w-20 h-20 md:w-24 md:h-24 shadow-xl' : 'w-10 h-10 md:w-11 md:h-11'}
                        `}>
                            {playerImage ? (
                                <img src={playerImage} className="w-full h-full object-cover object-top" alt={player.name} />
                            ) : (
                                <User className="w-full h-full p-2 text-neutral-300" />
                            )}
                        </div>
                        {team?.logo && (
                            <img 
                                src={team.logo} 
                                alt={team.shortName} 
                                className={`
                                    absolute rounded-full object-contain z-10 
                                    ${isHero 
                                        ? '-bottom-1 -right-1 w-8 h-8 p-0.5'
                                        : '-bottom-1 -right-1 w-4 h-4 p-[1px]'
                                    }
                                `}
                            />
                        )}
                    </div>
                )}
                
                <div className={`flex flex-col justify-center min-w-0 ${isHero ? 'ml-6 md:ml-8' : (activeTab === 'SCORERS' ? 'ml-4' : '')}`}>
                    <span className={`
                        tracking-tight leading-tight block whitespace-normal break-words text-brand-black
                        ${getNameSizeClass(player.name, isHero)} 
                        ${isHero ? 'font-display font-black italic text-brand-blue py-1' : 'font-sans'} 
                    `}>
                        {player.name}
                    </span>
                    <div className="flex items-center mt-0.5">
                        <span className={`text-neutral-400 uppercase font-bold truncate ${isHero ? 'text-xs tracking-widest' : 'text-[10px] tracking-wide'}`}>
                            {team?.shortName || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-right pl-4 pr-2 md:pr-4 shrink-0 min-w-[80px]">
                {activeTab === 'SCORERS' ? (
                    <div className="flex flex-col items-end">
                        <span className={`
                            font-display font-black tabular-nums leading-none tracking-tighter
                            ${isHero ? 'text-5xl md:text-6xl text-brand-blue' : 'text-2xl md:text-3xl text-brand-black'}
                        `}>
                            {player.goals}
                        </span>
                        {isHero && (
                            <span className="text-xs font-black text-brand-blue uppercase tracking-widest mt-1">
                                Goals
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-end space-x-3">
                         {(player.redCards > 0 || (isHero && player.yellowCards === 0)) && (
                            <div className="flex flex-col items-center">
                                <div className="font-display font-black flex items-center justify-center shadow-sm w-6 h-8 text-sm bg-red-600 text-white rounded-sm transform -skew-x-12">
                                    <span className="transform skew-x-12">{player.redCards}</span>
                                </div>
                            </div>
                        )}
                        {(player.yellowCards > 0 || (isHero && player.redCards === 0)) && (
                            <div className="flex flex-col items-center">
                                <div className="font-display font-black flex items-center justify-center shadow-sm w-6 h-8 text-sm bg-yellow-400 text-black rounded-sm transform -skew-x-12">
                                    <span className="transform skew-x-12">{player.yellowCards}</span>
                                </div>
                            </div>
                        )}
                        {(!isHero && player.redCards === 0 && player.yellowCards === 0) && (
                            <span className="text-neutral-200 text-xs">-</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatsPage: React.FC = () => {
    const [activeLeague, setActiveLeague] = useState<'L1' | 'L2'>(() => {
        try {
            const saved = window.sessionStorage.getItem('statsActiveLeague');
            if (saved === 'L1' || saved === 'L2') return saved;
        } catch (e) {}
        return 'L1'; 
    });
    const [activeTab, setActiveTab] = useState<'SCORERS' | 'CARDS'>('SCORERS');

    const handleLeagueChange = (league: 'L1' | 'L2') => {
        setActiveLeague(league);
        try { window.sessionStorage.setItem('statsActiveLeague', league); } catch (e) {}
    };

    const playerCurrentTeamMap = useMemo(() => {
        const map: Record<string, string> = {};
        ALL_PLAYERS.forEach(p => {
            map[p.name] = p.teamId;
        });
        return map;
    }, []);

    const statsData = useMemo(() => {
        const stats: Record<string, PlayerStats> = {};
        
        Object.entries(MATCH_EVENTS).forEach(([matchId, events]) => {
            const match = MATCHES.find((m) => m.id === matchId);
            if (!match || match.league !== activeLeague) return;
            
            events.forEach((event: any) => {
                const playerKey = event.player;
                
                let displayTeamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;

                const currentTeamId = playerCurrentTeamMap[playerKey];
                
                if (currentTeamId) {
                    if (TEAM_LEAGUES[currentTeamId] === activeLeague) {
                        displayTeamId = currentTeamId;
                    }
                }

                if (!stats[playerKey]) {
                    stats[playerKey] = { name: event.player, teamId: displayTeamId, goals: 0, yellowCards: 0, redCards: 0 };
                } else {
                    stats[playerKey].teamId = displayTeamId;
                }
                
                if (event.type === 'GOAL' && !event.isOwnGoal && !event.player.includes('(烏龍球)')) {
                    stats[playerKey].goals += 1;
                }
                if (event.type === 'YELLOW_CARD') stats[playerKey].yellowCards += 1;
                if (event.type === 'RED_CARD') stats[playerKey].redCards += 1;
                if (event.type === 'SECOND_YELLOW') {
                    stats[playerKey].yellowCards += 1;
                    stats[playerKey].redCards += 1;
                }
            });
        });
        return Object.values(stats);
    }, [activeLeague, playerCurrentTeamMap]);

    const sortedList = useMemo(() => {
        if (activeTab === 'SCORERS') {
            return statsData.filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals);
        } else {
            return statsData.filter((p) => p.yellowCards > 0 || p.redCards > 0).sort((a, b) => {
                if (b.redCards !== a.redCards) return b.redCards - a.redCards;
                return b.yellowCards - a.yellowCards;
            });
        }
    }, [statsData, activeTab]);

    // 處理排名數字
    const rankedListWithTiebreaker = useMemo(() => {
        let currentRank = 1;
        return sortedList.map((player, index) => {
            if (index > 0) {
                const prevPlayer = sortedList[index - 1];
                let isTie = false;
                
                // 只有射手榜會檢查係咪數據一樣，如果一樣就並列
                if (activeTab === 'SCORERS') {
                    isTie = player.goals === prevPlayer.goals;
                } else {
                    // 紅黃牌永遠當作唔一樣，唔會並列
                    isTie = false;
                }

                // 如果唔係並列，名次就順住去下一個數字
                if (!isTie) {
                    currentRank = index + 1;
                }
            }
            return { ...player, displayRank: currentRank };
        });
    }, [sortedList, activeTab]);

    // 檢查射手榜係咪有多個人並列第一名
    const hasTieForFirst = useMemo(() => {
        if (activeTab !== 'SCORERS') return false;
        return rankedListWithTiebreaker.filter(p => p.displayRank === 1).length > 1;
    }, [rankedListWithTiebreaker, activeTab]);

    const leagueFilterContent = (
        <div className="flex space-x-4 text-xs font-bold">
            {([ 'L1', 'L2' ] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleLeagueChange(tab)}
                    className={`px-1 pb-1 transition-all whitespace-nowrap border-b-2 
                        ${activeLeague === tab ? 'border-brand-blue text-brand-black font-bold' : 'border-transparent text-neutral-400 font-medium hover:text-neutral-600'}
                    `}
                >
                    <span className="inline md:hidden font-display">{tab}</span>
                    <span className="hidden md:inline">{tab === 'L1' ? 'League 1' : 'League 2'}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="pt-6 md:pt-24 min-h-[85vh] bg-white pb-24">
            <div className="container mx-auto px-4 md:px-12 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-12">
                    <div>
                        <h1 className="font-display font-black md:font-extrabold text-4xl md:text-6xl uppercase text-brand-black mb-2 md:mb-4 tracking-tight [-webkit-text-stroke:.25px_currentColor] md:[-webkit-text-stroke:0px]">
                            數據 <span className="text-brand-blue">中心</span>
                        </h1>
                        <p className="text-neutral-400 text-sm md:text-base font-medium tracking-wide">
                            {activeLeague === 'L1' ? 'League 1' : 'League 2'} 完整球員數據榜
                        </p>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-neutral-100">
                    <h3 className="font-bold text-base text-neutral-900 font-display uppercase tracking-wider flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-brand-blue" />
                        選擇聯賽
                    </h3>
                    {leagueFilterContent}
                </div>
                <div className="flex space-x-10 mb-6 px-2">
                    <button onClick={() => setActiveTab('SCORERS')} className={`text-sm md:text-base font-bold uppercase transition-all duration-300 tracking-widest relative ${activeTab === 'SCORERS' ? 'text-brand-black' : 'text-neutral-300 hover:text-neutral-500'}`}>射手榜</button>
                    <button onClick={() => setActiveTab('CARDS')} className={`text-sm md:text-base font-bold uppercase transition-all duration-300 tracking-widest relative ${activeTab === 'CARDS' ? 'text-brand-black' : 'text-neutral-300 hover:text-neutral-500'}`}>紅黃牌</button>
                </div>
                <div className="w-full">
                    <div className="flex flex-col">
                        {rankedListWithTiebreaker.length > 0 ? (
                            rankedListWithTiebreaker.map((player) => (
                                <ProStatRow 
                                    key={`${player.name}-${player.teamId}`} 
                                    player={player} 
                                    rank={player.displayRank} 
                                    activeTab={activeTab}
                                    isHeroModeAllowed={!hasTieForFirst} 
                                />
                            ))
                        ) : (
                            <div className="py-32 text-center opacity-40">
                                <Trophy className="w-16 h-16 text-neutral-300 mx-auto mb-4 stroke-[1]" />
                                <p className="text-neutral-400 font-medium uppercase tracking-[0.2em] text-xs">NO DATA AVAILABLE</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;