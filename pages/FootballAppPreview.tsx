import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, CircleUserRound, Clock3, ListFilter, Shield, Trophy } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { LeagueId } from '../types/season';
import type { PlayerProfile } from '../types/player';
import type { SeasonTeam } from '../types/team';
import { calculateLeagueTable } from '../services/competitionEngine';
import { getPlayerIdentity, getPlayerSeasonStats, getTeamIdentity, resolveMatchEventPlayer } from '../services/entityData';
import { formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import './FootballAppPreview.css';

type Screen = 'matches' | 'standings' | 'players' | 'teams' | 'match' | 'player' | 'team';
type FixtureFilter = 'all' | 'upcoming' | 'finished';
const MAIN_TABS: { id: Screen; label: string }[] = [
  { id: 'matches', label: '賽程' },
  { id: 'standings', label: '積分榜' },
  { id: 'players', label: '球員' },
  { id: 'teams', label: '球隊' },
];
const badgeFor = (form: 'W' | 'D' | 'L') => form === 'W' ? '勝' : form === 'D' ? '和' : '敗';
const eventLabel = (type: string, isPK?: boolean, isOwnGoal?: boolean) =>
  type === 'GOAL' ? (isOwnGoal ? '烏龍球' : isPK ? '十二碼進球' : '進球') :
  type === 'YELLOW_CARD' ? '黃牌' : type === 'RED_CARD' ? '紅牌' : '第二張黃牌';
const formatResult = (match: Match) => match.homeScore === null || match.awayScore === null ? '– : –' : match.homeScore + ' : ' + match.awayScore;

const TeamBadge: React.FC<{team?: SeasonTeam; compact?: boolean}> = ({ team, compact = false }) => (
  <span className={'fap-badge ' + (compact ? 'fap-badge-small' : '')}>
    {team?.logo ? <img src={team.logo} alt="" loading="lazy" /> : <Shield size={17} aria-hidden="true" />}
  </span>
);

const FootballAppPreview: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [league, setLeague] = useState<LeagueId>('L1');
  const selectedLeague: LeagueId = activeSeason.enabledLeagues.includes(league) ? league : activeSeason.enabledLeagues[0];
  const [screen, setScreen] = useState<Screen>('matches');
  const [fixtureFilter, setFixtureFilter] = useState<FixtureFilter>('all');
  const [showAll, setShowAll] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [backStack, setBackStack] = useState<Screen[]>([]);
  const teamMap = seasonData.teamMap;
  const leagueTeams = useMemo(() => seasonData.teams.filter(t => t.leagueId === selectedLeague && t.competitionStatus !== 'WITHDRAWN'), [seasonData.teams, selectedLeague]);
  const leagueTeamIds = useMemo(() => new Set(leagueTeams.map(t => t.id)), [leagueTeams]);
  const fixtures = useMemo(() => seasonData.matches
    .filter(m => m.league === selectedLeague)
    .filter(m => fixtureFilter === 'all' || (fixtureFilter === 'finished' ? m.status === MatchStatus.FINISHED : m.status !== MatchStatus.FINISHED))
    .sort((a, b) => {
      const af = a.status === MatchStatus.FINISHED;
      const bf = b.status === MatchStatus.FINISHED;
      if (fixtureFilter === 'all' && af !== bf) return af ? 1 : -1;
      return af ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }), [seasonData.matches, selectedLeague, fixtureFilter]);
  const standings = useMemo(() => calculateLeagueTable({
    league: selectedLeague,
    teams: seasonData.teams,
    matches: seasonData.matches,
    matchEvents: seasonData.matchEvents,
    rules: activeSeason.rules,
    leagueConfig: activeSeason.leagues[selectedLeague],
    isFinalStandings: activeSeason.status === 'completed',
  }), [seasonData, activeSeason, selectedLeague]);
  const players = useMemo(() => seasonData.players.filter(p => leagueTeamIds.has(p.teamId) && !p.hideFromTeamRoster && p.rosterStatus !== 'INACTIVE_REPLACED')
    .map(p => ({ player: p, stats: getPlayerSeasonStats({ seasonId: activeSeason.id, season: activeSeason, data: seasonData, player: p, team: teamMap[p.teamId] }) }))
    .sort((a, b) => b.stats.goals - a.stats.goals || a.player.name.localeCompare(b.player.name, 'zh-TW')),
    [seasonData, activeSeason, leagueTeamIds, teamMap]);
  const activeMatch = seasonData.matches.find(m => m.id === matchId);
  const activePlayer = seasonData.players.find(p => p.id === playerId);
  const activeTeam = teamId ? teamMap[teamId] : undefined;
  const openDetail = (next: Screen) => { setBackStack(stack => [...stack, screen]); setScreen(next); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const viewMatch = (id: string) => { setMatchId(id); openDetail('match'); };
  const viewPlayer = (id: string) => { setPlayerId(id); openDetail('player'); };
  const viewTeam = (id: string) => { setTeamId(id); openDetail('team'); };
  const navigateTo = (next: Screen) => { setBackStack([]); setScreen(next); setShowAll(false); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const returnTo = () => { setScreen(backStack[backStack.length - 1] ?? 'matches'); setBackStack(stack => stack.slice(0, -1)); window.scrollTo({ top: 0, behavior: 'auto' }); };

  const renderFixture = (match: Match) => {
    const home = teamMap[match.homeTeamId], away = teamMap[match.awayTeamId];
    if (!home || !away) return null;
    const finished = match.status === MatchStatus.FINISHED;
    return <button type="button" key={match.id} className="fap-match-row" onClick={() => viewMatch(match.id)} aria-label={home.name + ' 對 ' + away.name + '，查看比賽詳情'}>
      <div className="fap-match-when"><span>{formatTaipeiMonthDayWeekday(match.timestamp)}</span><strong>{finished ? '完賽' : formatTaipeiTime(match.timestamp)}</strong></div>
      <div className="fap-match-pair">
        <span><TeamBadge team={home} compact /> <b>{home.name}</b></span>
        <span><TeamBadge team={away} compact /> <b>{away.name}</b></span>
      </div>
      <div className="fap-match-goals" aria-label={formatResult(match)}><strong>{finished ? match.homeScore : '–'}</strong><strong>{finished ? match.awayScore : '–'}</strong></div>
      <ChevronRight className="fap-chevron" size={17} aria-hidden="true" />
    </button>;
  };
  return <div className="fap-app">
    <div className="fap-preview-label"><span>FOOTBALL APP DESIGN PREVIEW</span><span>僅供設計評估 · 非正式網站</span></div>
    <header className="fap-header">
      <div className="fap-brand"><span className="fap-brand-symbol">D<span>·</span></span><div><strong>D LEAGUE</strong><small>TAIWAN SEVEN-A-SIDE FOOTBALL</small></div></div>
      <a href="https://dreamsportfootball.github.io/d-league/" className="fap-backsite">返回正式網站 <ArrowRight size={15}/></a>
    </header>
    <div className="fap-shell">
      <section className="fap-intro">
        <div><p className="fap-eyebrow">2026/27 SEASON · FOOTBALL CENTER</p><h1>每一場，都值得記錄。</h1><p>賽程、比分、積分與球員紀錄，一個地方掌握。</p></div>
        <div className="fap-season"><Trophy size={17}/><span>2026 / 27</span></div>
      </section>
      <div className="fap-league-bar">
        <span className="fap-league-label">選擇聯賽</span>
        <div className="fap-pill-tabs" role="group" aria-label="聯賽">
          {activeSeason.enabledLeagues.map(l => <button key={l} type="button" aria-pressed={selectedLeague===l} className={selectedLeague===l ? 'selected' : ''} onClick={() => {setLeague(l);setBackStack([]);setShowAll(false);setScreen('matches');}}><span className="fap-mobile-league">{l}</span><span className="fap-desktop-league">LEAGUE {l.slice(1)}</span></button>)}
        </div>
        <span className="fap-league-note">SEVEN-A-SIDE</span>
      </div>
      <nav className="fap-main-tabs" aria-label="內容導覽">
        {MAIN_TABS.map(tab=><button key={tab.id} type="button" aria-current={screen===tab.id?'page':undefined} className={screen===tab.id?'active':''} onClick={()=>navigateTo(tab.id)}>{tab.label}</button>)}
      </nav>
      <main id="fap-main" className="fap-main">
        {screen === 'matches' && <>
          <div className="fap-section-head"><div><p className="fap-eyebrow">MATCHES & RESULTS</p><h2>賽程與賽果</h2></div><span className="fap-muted">{seasonData.matches.filter(m=>m.league===selectedLeague).length} 場比賽</span></div>
          <div className="fap-filter" role="group" aria-label="篩選比賽">
            {([{id:'all',label:'全部'}, {id:'upcoming',label:'未開賽'}, {id:'finished',label:'已完賽'}] as const).map(item=><button key={item.id} className={fixtureFilter===item.id?'active':''} aria-pressed={fixtureFilter===item.id} onClick={()=>{setFixtureFilter(item.id);setShowAll(false)}}>{item.label}</button>)}
          </div>
          <div className="fap-paper"><div className="fap-paper-top"><span>LEAGUE {selectedLeague.slice(1)} · FIXTURES</span><span>{fixtures.length} MATCHES</span></div>{(showAll?fixtures:fixtures.slice(0,9)).map(renderFixture)}{fixtures.length===0&&<p className="fap-empty">目前沒有符合條件的比賽。</p>}</div>
          {!showAll&&fixtures.length>9&&<button className="fap-showall" onClick={()=>setShowAll(true)}>顯示全部比賽 <ArrowRight size={16}/></button>}
        </>}
        {screen === 'match' && activeMatch && (() => {
          const home = teamMap[activeMatch.homeTeamId],away = teamMap[activeMatch.awayTeamId];
          const events = [...(seasonData.matchEvents[activeMatch.id] ?? [])].sort((a,b)=>a.minute-b.minute);
          return <><button className="fap-back" onClick={returnTo}><ArrowLeft size={17}/> 返回比賽列表</button>
            <div className="fap-scoreboard"><p className="fap-eyebrow">{selectedLeague} · 第 {activeMatch.round} 輪 · {formatTaipeiMonthDayWeekday(activeMatch.timestamp)} {formatTaipeiTime(activeMatch.timestamp)}</p>
              <div className="fap-score-line"><button onClick={()=>viewTeam(activeMatch.homeTeamId)}><TeamBadge team={home}/><strong>{home?.name}</strong></button><div><span>{activeMatch.status===MatchStatus.FINISHED?'FULL TIME':'SCHEDULED'}</span><b>{formatResult(activeMatch)}</b></div><button onClick={()=>viewTeam(activeMatch.awayTeamId)}><TeamBadge team={away}/><strong>{away?.name}</strong></button></div>
              <p className="fap-venue">{activeMatch.venue}</p>
            </div>
            <div className="fap-section-head"><div><p className="fap-eyebrow">MATCH TIMELINE</p><h2>比賽事件</h2></div><span className="fap-muted">進球 · 黃牌 · 紅牌</span></div>
            <div className="fap-paper fap-events">{events.map(e=>{const player=resolveMatchEventPlayer(seasonData,activeMatch,e);return <div className="fap-event" key={e.id}><span className="fap-event-time">{e.minute}′</span><span className={'fap-event-dot '+(e.type==='GOAL'?'goal':e.type==='YELLOW_CARD'?'yellow':'red')}/><div><b>{eventLabel(e.type,e.isPK,e.isOwnGoal)}</b><p>{player?<button className="fap-inline-link" onClick={()=>viewPlayer(player.id)}>{e.player}</button>:e.player}</p></div><small>{e.team==='HOME'?home?.shortName:away?.shortName}</small></div>})}{events.length===0&&<p className="fap-empty">這場比賽目前沒有已確認的事件紀錄。</p>}</div>
            <a className="fap-official-link" href={'https://dreamsportfootball.github.io/d-league/matches/'+encodeURIComponent(activeMatch.id)+'/?season='+encodeURIComponent(activeSeason.id)}>查看正式比賽頁 <ArrowRight size={17}/></a>
          </>;
        })()}
        {screen === 'standings' && <>
          <div className="fap-section-head"><div><p className="fap-eyebrow">THE LEAGUE TABLE</p><h2>聯賽積分榜</h2></div><span className="fap-muted">依現有競賽規程計算</span></div>
          <div className="fap-paper"><div className="fap-table-head"><span>排名 / 球隊</span><span>賽</span><span>得失</span><span>積分</span></div>{standings.map((r,i)=><button key={r.teamId} className="fap-standing-row" onClick={()=>viewTeam(r.teamId)}><span className="fap-standing-team"><b className="fap-rank">{i+1}</b><TeamBadge team={teamMap[r.teamId]} compact/><span><strong>{teamMap[r.teamId]?.name??'球隊'}</strong><small>{r.form.slice(0,5).map((f,j)=><em key={j} className={f.toLowerCase()}>{badgeFor(f)}</em>)}</small></span></span><span>{r.played}</span><span>{r.gd>0?'+':''}{r.gd}</span><b className="fap-points">{r.points}</b></button>)}</div>
          <p className="fap-note">同分、紀律、升降級與抽籤等正式認定，以完整競賽規程及正式積分榜為準。</p><a className="fap-official-link" href="https://dreamsportfootball.github.io/d-league/standings/">前往正式積分榜 <ArrowRight size={17}/></a>
        </>}
        {screen === 'players' && <><div className="fap-section-head"><div><p className="fap-eyebrow">PLAYER STATISTICS</p><h2>球員數據</h2></div><span className="fap-muted">依已確認進球紀錄排序</span></div><div className="fap-paper"><div className="fap-player-head"><span>球員 / 球隊</span><span>進球</span><span>黃牌</span></div>{players.slice(0,showAll?players.length:18).map(({player,stats},i)=><button key={player.id} className="fap-player-row" onClick={()=>viewPlayer(player.id)}><b className="fap-rank">{i+1}</b><span className="fap-avatar">{player.number??'—'}</span><span className="fap-player-name"><strong>{player.name}</strong><small>{teamMap[player.teamId]?.name??'球隊'}</small></span><strong>{stats.goals}</strong><span>{stats.yellowCards}</span></button>)}</div>{!showAll&&players.length>18&&<button className="fap-showall" onClick={()=>setShowAll(true)}>查看全部球員 <ArrowRight size={16}/></button>}</>}
        {screen === 'player' && activePlayer && (()=>{const stats=getPlayerSeasonStats({seasonId:activeSeason.id,season:activeSeason,data:seasonData,player:activePlayer,team:teamMap[activePlayer.teamId]});const related=Object.entries(seasonData.matchEvents).filter(([id,es])=>es.some(e=>e.playerId===activePlayer.id||e.subjectId===activePlayer.id)).map(([id])=>seasonData.matches.find(m=>m.id===id)).filter((m):m is Match=>Boolean(m)).sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());return <><button className="fap-back" onClick={returnTo}><ArrowLeft size={17}/> 返回球員列表</button><div className="fap-profile"><div className="fap-profile-symbol"><CircleUserRound size={35}/></div><p className="fap-eyebrow">{teamMap[activePlayer.teamId]?.name}</p><h2>{activePlayer.name}</h2><p>背號 {activePlayer.number??'未登錄'} · {selectedLeague}</p></div><div className="fap-stat-grid"><div><span>GOALS</span><strong>{stats.goals}</strong><small>進球</small></div><div><span>YELLOW CARDS</span><strong>{stats.yellowCards}</strong><small>黃牌</small></div><div><span>RED CARDS</span><strong>{stats.directRedCards}</strong><small>直接紅牌</small></div></div><p className="fap-note">以上為已有事件資料的統計；不代表完整出賽場次。</p><div className="fap-section-head"><div><p className="fap-eyebrow">RECORDED MATCHES</p><h2>相關賽事</h2></div></div><div className="fap-paper">{related.slice(0,10).map(renderFixture)}{related.length===0&&<p className="fap-empty">目前沒有可核對的個人賽事事件。</p>}</div><a href={'https://dreamsportfootball.github.io/d-league/players/'+encodeURIComponent(getPlayerIdentity(activePlayer))+'/'} className="fap-official-link">查看正式球員頁 <ArrowRight size={17}/></a></>})()}
        {screen === 'teams' && <><div className="fap-section-head"><div><p className="fap-eyebrow">CLUB DIRECTORY</p><h2>參賽球隊</h2></div><span className="fap-muted">{leagueTeams.length} 支球隊</span></div><div className="fap-team-grid">{leagueTeams.map(team=><button className="fap-team-card" key={team.id} onClick={()=>viewTeam(team.id)}><TeamBadge team={team}/><strong>{team.name}</strong><span>{selectedLeague} · 查看球隊 <ChevronRight size={16}/></span></button>)}</div></>}
        {screen === 'team' && activeTeam && (()=>{const row=standings.find(r=>r.teamId===activeTeam.id);const roster=seasonData.players.filter(p=>p.teamId===activeTeam.id&&!p.hideFromTeamRoster&&p.rosterStatus!=='INACTIVE_REPLACED');const games=seasonData.matches.filter(m=>m.homeTeamId===activeTeam.id||m.awayTeamId===activeTeam.id);
const nextGames=games.filter(m=>m.status!==MatchStatus.FINISHED&&Date.parse(m.timestamp)>=Date.now()).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)).slice(0,2);
const latestResults=games.filter(m=>m.status===MatchStatus.FINISHED).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,3);
const featuredGames=[...nextGames,...latestResults];return <><button className="fap-back" onClick={returnTo}><ArrowLeft size={17}/> 返回球隊列表</button><div className="fap-team-hero"><TeamBadge team={activeTeam}/><p className="fap-eyebrow">{selectedLeague} / CLUB</p><h2>{activeTeam.name}</h2><p>{activeSeason.displayName}</p></div><div className="fap-stat-grid"><div><span>PLAYED</span><strong>{row?.played??0}</strong><small>已賽</small></div><div><span>GOAL DIFF.</span><strong>{row?.gd??0}</strong><small>得失球</small></div><div><span>POINTS</span><strong>{row?.points??0}</strong><small>積分</small></div></div><div className="fap-section-head"><div><p className="fap-eyebrow">TEAM MATCHES</p><h2>下一場與近期賽事</h2></div></div><div className="fap-paper">{featuredGames.map(renderFixture)}{featuredGames.length===0&&<p className="fap-empty">目前沒有已確認的賽程或結果。</p>}</div><div className="fap-section-head fap-section-after"><div><p className="fap-eyebrow">REGISTERED PLAYERS</p><h2>球員名單</h2></div></div><div className="fap-paper">{roster.map(p=><button key={p.id} className="fap-roster-row" onClick={()=>viewPlayer(p.id)}><span>#{p.number??'—'}</span><b>{p.name}</b><ChevronRight size={17}/></button>)}{roster.length===0&&<p className="fap-empty">目前沒有公開的球員名單。</p>}</div><a href={'https://dreamsportfootball.github.io/d-league/teams/'+encodeURIComponent(getTeamIdentity(activeTeam))+'/'} className="fap-official-link">查看正式球隊頁 <ArrowRight size={17}/></a></>})()}
      </main>
      <div className="fap-disclaimer">此頁為獨立 UI Preview，引用現有賽季資料與正式排名計算程式；未修改正式網站、球員紀錄或賽事結果。非即時比分系統。</div>
    </div>
    <nav className="fap-bottom-nav" aria-label="手機快速導覽">{MAIN_TABS.map(t=><button key={t.id} className={screen===t.id?'active':''} onClick={()=>navigateTo(t.id)}><span>{t.id==='matches'?<CalendarDays size={19}/>:t.id==='standings'?<Trophy size={19}/>:t.id==='players'?<CircleUserRound size={19}/>:<Shield size={19}/>}</span>{t.label}</button>)}</nav>
  </div>;
};
export default FootballAppPreview;
