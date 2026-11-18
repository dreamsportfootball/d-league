import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, ShieldCheck, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import { formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import { calculateLeagueTable } from '../services/competitionEngine';
import type { LeagueId } from '../types/season';

type View = 'matches' | 'standings' | 'teams';
const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'matches', label: '賽程與賽果' },
  { id: 'standings', label: '積分榜' },
  { id: 'teams', label: '球隊' },
];
const buildMatchUrl = (id: string) => '/matches/' + encodeURIComponent(id);

const FootballUiPreviewPage: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [league, setLeague] = useState<LeagueId>(activeSeason.enabledLeagues[0] ?? 'L1');
  const [view, setView] = useState<View>('matches');
  const [expanded, setExpanded] = useState(false);
  const [resultsOnly, setResultsOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedLeague: LeagueId = activeSeason.enabledLeagues.includes(league)
    ? league : activeSeason.enabledLeagues[0] ?? 'L1';
  const teams = useMemo(() => new Map(seasonData.teams.map((team) => [team.id, team])), [seasonData.teams]);
  const matches = useMemo(() => seasonData.matches
    .filter((match) => match.league === selectedLeague)
    .filter((match) => !resultsOnly || match.status === MatchStatus.FINISHED)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [seasonData.matches, selectedLeague, resultsOnly]);
  const visibleMatches = expanded ? matches : matches.slice(0, 8);
  const standings = useMemo(() => calculateLeagueTable({
    league: selectedLeague,
    teams: seasonData.teams,
    matches: seasonData.matches,
    matchEvents: seasonData.matchEvents,
    rules: activeSeason.rules,
    leagueConfig: activeSeason.leagues[selectedLeague],
    isFinalStandings: activeSeason.status === 'completed',
  }), [selectedLeague, seasonData, activeSeason]);
  const tableTeams = standings.map((standing) => ({
    id: standing.teamId,
    name: teams.get(standing.teamId)?.name ?? '未命名球隊',
    p: standing.played, w: standing.won, d: standing.drawn,
    l: standing.lost, gf: standing.gf, ga: standing.ga, pts: standing.points,
    rank: standing.rank,
  }));
  const isFinished = (match: typeof matches[number]) => match.status === MatchStatus.FINISHED;
  return <main className="min-h-screen bg-[#f5f7fa] pb-24 text-neutral-950">
    <div className="mx-auto max-w-6xl px-4 pb-7 pt-8 md:px-8 md:pt-14">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-500">
        <span className="rounded-full bg-[#e7effc] px-3 py-1 text-[#0047ab]">DESIGN PREVIEW</span>
        <span>獨立預覽 · 官方資料 · 未部署設計預覽</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="mb-1 font-sans text-xs font-semibold tracking-wide text-neutral-500">D LEAGUE · FOOTBALL CENTER</p>
          <h1 className="font-display text-[38px] font-black uppercase leading-none tracking-tight md:text-6xl">MATCH <span className="text-[#0047ab]">CENTER</span></h1>
          <p className="mt-3 text-sm text-neutral-500">讓賽程、積分、球隊資訊更容易找到。</p></div>
        <Link to="/" className="shrink-0 rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold hover:border-[#0047ab]">返回正式頁</Link>
      </div>
    </div>
    <div className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-neutral-200 p-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <Trophy aria-hidden="true" className="h-4 w-4 text-[#0047ab]" />
            <span className="font-display text-xs font-bold uppercase tracking-wider md:text-sm">選擇聯賽</span>
            <div className="relative">
              <button aria-label={'選擇聯賽：' + selectedLeague} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-[#0047ab] md:min-h-9 md:font-display md:text-xs">
                <span className="md:hidden">{selectedLeague}</span><span className="hidden md:inline">LEAGUE {selectedLeague.replace('L','')}</span><ChevronDown className="h-3 w-3" />
              </button>
              {menuOpen && <div role="menu" aria-label="聯賽選單" className="absolute left-0 top-full z-20 mt-1 min-w-full rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                {activeSeason.enabledLeagues.map((id) => <button key={id} role="menuitemradio" aria-checked={selectedLeague === id} onClick={()=>{ setLeague(id); setExpanded(false); setMenuOpen(false); }} className="block min-h-11 w-full whitespace-nowrap rounded-lg px-3 text-left text-xs font-semibold hover:bg-[#e7effc] focus-visible:bg-[#e7effc]">{id}</button>)}
              </div>}
            </div>
          </div><span className="text-[11px] text-neutral-400">資料來源：現有賽季</span>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 pt-2 md:px-5" role="tablist" aria-label="資訊分類">
          {VIEWS.map(({id,label})=><button key={id} type="button" role="tab" aria-selected={view===id} onClick={()=>setView(id)} className={'min-h-11 shrink-0 border-b-[3px] px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#0047ab] md:px-5 md:text-sm '+(view===id?'border-[#0047ab] text-[#0047ab]':'border-transparent text-neutral-500 hover:text-neutral-900')}>{label}</button>)}
        </div>
        {view === 'matches' && <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold">比賽列表 <span className="text-sm font-medium text-neutral-400">{matches.length}</span></h2>
            <button onClick={()=>{setResultsOnly(!resultsOnly);setExpanded(false)}} aria-pressed={resultsOnly} className={'min-h-11 rounded-full border px-3 text-xs font-semibold md:min-h-9 '+(resultsOnly?'border-[#0047ab] bg-[#e7effc] text-[#0047ab]':'border-neutral-200 text-neutral-600')}>{resultsOnly?'只看已完賽 ✓':'只看已完賽'}</button></div>
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {visibleMatches.map(match=>{const home=teams.get(match.homeTeamId),away=teams.get(match.awayTeamId);if(!home||!away)return null;return <Link key={match.id} to={buildMatchUrl(match.id)} className="group flex min-h-[100px] items-center gap-2 px-3 py-3 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-[#0047ab] md:gap-5 md:px-5">
              <div className="w-[68px] shrink-0 border-r border-neutral-100 pr-2 text-[11px] text-neutral-500 md:w-28 md:text-xs"><div className="font-semibold text-neutral-700">{formatTaipeiMonthDayWeekday(match.timestamp)}</div><div className="mt-1">{formatTaipeiTime(match.timestamp)}</div><div className="mt-1 text-[10px] text-[#0047ab]">{match.league} · R{match.round}</div></div>
              <div className="min-w-0 flex-1 space-y-2"><div className="flex items-center gap-2"><span className="h-3 w-1 rounded-full" style={{background:home.primaryColor||'#0047ab'}}/><span className="truncate text-xs font-semibold md:text-sm">{home.name}</span></div><div className="flex items-center gap-2"><span className="h-3 w-1 rounded-full" style={{background:away.primaryColor||'#0047ab'}}/><span className="truncate text-xs font-semibold md:text-sm">{away.name}</span></div></div>
              <div className="flex w-14 shrink-0 flex-col items-end gap-1 font-display text-xl font-bold tabular-nums md:text-2xl"><span>{isFinished(match)?match.homeScore:'–'}</span><span>{isFinished(match)?match.awayScore:'–'}</span></div>
              <div className="ml-1 flex w-11 shrink-0 flex-col items-center gap-1 text-[10px] font-semibold text-neutral-400 md:w-16"><span className={isFinished(match)?'rounded bg-neutral-100 px-1.5 py-1 text-neutral-600':'rounded bg-[#e7effc] px-1.5 py-1 text-[#0047ab]'}>{isFinished(match)?'完賽':'未開賽'}</span><ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/></div>
            </Link>})}
            {matches.length===0&&<p className="px-4 py-12 text-center text-sm text-neutral-500">沒有符合條件的比賽</p>}
          </div>
          {!expanded&&matches.length>8&&<button onClick={()=>setExpanded(true)} className="mt-4 min-h-11 w-full rounded-lg border border-neutral-200 text-sm font-semibold hover:bg-neutral-50">顯示全部 {matches.length} 場</button>}
        </div>}
        {view==='standings'&&<div className="p-4 md:p-6"><div className="mb-2 flex items-center gap-2"><h2 className="font-display text-xl font-bold">積分預覽</h2><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] text-amber-800">正式規則計算 · 預覽版</span></div><p className="mb-4 text-xs leading-5 text-neutral-500">此表使用官網既有競賽計算程式；展示方式仍屬設計預覽，正式認定請以官方積分榜與競賽規程為準。</p><div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[360px] border-collapse text-left text-xs md:text-sm"><thead className="bg-neutral-50 text-[11px] text-neutral-500"><tr><th className="p-3">#</th><th className="p-3">球隊</th><th className="p-3 text-center">賽</th><th className="p-3 text-center">勝</th><th className="p-3 text-center">和</th><th className="p-3 text-center">敗</th><th className="p-3 text-center">得失</th><th className="p-3 text-center">分</th></tr></thead><tbody>{tableTeams.map((team)=><tr key={team.id} className="border-t border-neutral-100"><td className="p-3 font-display font-bold text-[#0047ab]">{team.rank}</td><td className="p-3 font-semibold">{team.name}</td><td className="p-3 text-center tabular-nums">{team.p}</td><td className="p-3 text-center tabular-nums">{team.w}</td><td className="p-3 text-center tabular-nums">{team.d}</td><td className="p-3 text-center tabular-nums">{team.l}</td><td className="p-3 text-center tabular-nums">{team.gf-team.ga}</td><td className="p-3 text-center font-bold tabular-nums">{team.pts}</td></tr>)}</tbody></table></div><Link to="/standings" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#0047ab]">前往正式積分榜 <ArrowRight className="h-4 w-4"/></Link></div>}
        {view==='teams'&&<div className="p-4 md:p-6"><h2 className="mb-4 font-display text-xl font-bold">參賽球隊</h2><div className="grid gap-2 sm:grid-cols-2">{tableTeams.map(team=><div key={team.id} className="flex min-h-16 items-center gap-3 rounded-lg border border-neutral-200 px-4"><ShieldCheck className="h-5 w-5 text-[#0047ab]"/><span className="min-w-0 flex-1 truncate text-sm font-semibold">{team.name}</span><span className="text-xs text-neutral-500">{team.p} 場</span></div>)}</div></div>}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-5 text-neutral-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0047ab]"/><p>這是依現有資料製作的獨立 UI Preview；正式網站、賽果、資料來源與升降級規則均未修改。設計參考 FotMob 的比分層級、Sofascore 的資料導覽與 60fps 的輕量互動。</p></div>
    </div>
  </main>;
};
export default FootballUiPreviewPage;
