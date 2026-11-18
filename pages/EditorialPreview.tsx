import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, ArrowRight, Menu, X } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import { calculateLeagueTable } from '../services/competitionEngine';
import { formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import type { LeagueId } from '../types/season';
import './EditorialPreview.css';

type Panel = 'matches' | 'table' | 'clubs';
const EditorialPreview: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [league, setLeague] = useState<LeagueId>('L1');
  const [panel, setPanel] = useState<Panel>('matches');
  const [onlyFinished, setOnlyFinished] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentLeague = activeSeason.enabledLeagues.includes(league) ? league : activeSeason.enabledLeagues[0];
  const teamMap = seasonData.teamMap;
  const fixtures = useMemo(() => seasonData.matches.filter(m => m.league === currentLeague && (!onlyFinished || m.status === MatchStatus.FINISHED)).sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()),[seasonData.matches,currentLeague,onlyFinished]);
  const standings = useMemo(()=>calculateLeagueTable({league:currentLeague,teams:seasonData.teams,matches:seasonData.matches,matchEvents:seasonData.matchEvents,rules:activeSeason.rules,leagueConfig:activeSeason.leagues[currentLeague],isFinalStandings:activeSeason.status==='completed'}),[seasonData,activeSeason,currentLeague]);
  const displayed = showAll ? fixtures : fixtures.slice(0,6);
  return <div className="edp">
    <div className="edp-notice">EXPERIMENTAL DESIGN / NOT LIVE <span>獨立設計提案 · 正式網站未變更</span></div>
    <header className="edp-nav">
      <div className="edp-brand"><span className="edp-brand-mark">D<span>.</span></span><span className="edp-brand-name">LEAGUE<small>TAIWAN FOOTBALL CULTURE</small></span></div>
      <nav aria-label="預覽導覽"><button onClick={()=>setPanel('matches')}>MATCHES</button><button onClick={()=>setPanel('table')}>STANDINGS</button><button onClick={()=>setPanel('clubs')}>CLUBS</button></nav>
      <Link to="/" className="edp-back">BACK TO SITE <ArrowUpRight size={15}/></Link>
    </header>
    <section className="edp-hero">
      <div className="edp-hero-top"><span>INDEPENDENT FOOTBALL LEAGUE</span><span>TAINAN, TAIWAN — EST. 2025</span></div>
      <div className="edp-hero-title"><span>BEYOND</span><span>THE <em>90.</em></span></div>
      <div className="edp-hero-bottom"><p>不只是場上的 90 分鐘。<br/>每一場比賽，都是台南足球文化的一部分。</p><div className="edp-hero-circle"><ArrowUpRight size={29}/></div></div>
      <div className="edp-hero-index">01 / THE COMPETITION</div>
    </section>
    <section className="edp-dashboard">
      <div className="edp-section-heading"><div><span className="edp-kicker">THE COMPETITION / 2026—27</span><h1>賽事中心<span className="edp-dot">.</span></h1></div><span className="edp-heading-side">18 CLUBS<br/>03 DIVISIONS<br/>ONE COMMUNITY</span></div>
      <div className="edp-controls">
        <div className="edp-leagues" aria-label="選擇聯賽">{activeSeason.enabledLeagues.map(l=><button key={l} className={currentLeague===l?'active':''} onClick={()=>{setLeague(l);setShowAll(false)}} aria-pressed={currentLeague===l}>{l}<span className="edp-league-long"> / LEAGUE {l.slice(1)}</span></button>)}</div>
        <div className="edp-panels" role="tablist" aria-label="資料分類"><button role="tab" aria-selected={panel==='matches'} onClick={()=>setPanel('matches')}>賽程</button><button role="tab" aria-selected={panel==='table'} onClick={()=>setPanel('table')}>積分</button><button role="tab" aria-selected={panel==='clubs'} onClick={()=>setPanel('clubs')}>球隊</button></div>
      </div>
      {panel==='matches'&&<div className="edp-content"><div className="edp-list-heading"><div><span className="edp-kicker">01 / FIXTURES & RESULTS</span><h2>所有比賽 <sup>{fixtures.length.toString().padStart(2,'0')}</sup></h2></div><button className={'edp-filter '+(onlyFinished?'on':'')} aria-pressed={onlyFinished} onClick={()=>{setOnlyFinished(v=>!v);setShowAll(false)}}>{onlyFinished?'✓ 已完賽':'只看已完賽'} <ChevronDown size={14}/></button></div>
        <div className="edp-match-list">{displayed.map((m,i)=>{const h=teamMap[m.homeTeamId],a=teamMap[m.awayTeamId];if(!h||!a)return null;const done=m.status===MatchStatus.FINISHED;return <Link className="edp-match" to={'/matches/'+encodeURIComponent(m.id)} key={m.id}><div className="edp-match-number">{String(i+1).padStart(2,'0')}</div><div className="edp-match-meta"><b>{formatTaipeiMonthDayWeekday(m.timestamp)}</b><span>{formatTaipeiTime(m.timestamp)} / ROUND {m.round}</span></div><div className="edp-match-teams"><div><i style={{background:h.primaryColor}}/>{h.name}</div><div><i style={{background:a.primaryColor}}/>{a.name}</div></div><div className="edp-match-score"><b>{done?m.homeScore:'—'}</b><b>{done?m.awayScore:'—'}</b></div><span className="edp-match-status">{done?'FT':'UPCOMING'}</span><ArrowUpRight className="edp-match-arrow" size={19}/></Link>})}</div>
        {fixtures.length===0&&<p className="edp-empty">目前沒有符合條件的比賽。</p>}{!showAll&&fixtures.length>6&&<button className="edp-more" onClick={()=>setShowAll(true)}>VIEW ALL MATCHES <ArrowRight size={18}/></button>}
      </div>}
      {panel==='table'&&<div className="edp-content"><div className="edp-list-heading"><div><span className="edp-kicker">02 / LEAGUE TABLE</span><h2>積分排名 <sup>{standings.length.toString().padStart(2,'0')}</sup></h2></div><span className="edp-smallnote">使用現有官方排名計算邏輯</span></div><div className="edp-table-wrap"><table className="edp-table"><thead><tr><th>POS</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>{standings.map(row=><tr key={row.teamId}><td>{row.rank.toString().padStart(2,'0')}</td><td>{teamMap[row.teamId]?.name??'球隊'}</td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.gd}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></div><p className="edp-smallnote">排名依既有競賽計算程式顯示；實際順位及升降級以正式積分榜、競賽規程為準。</p></div>}
      {panel==='clubs'&&<div className="edp-content"><div className="edp-list-heading"><div><span className="edp-kicker">03 / THE CLUBS</span><h2>參賽球隊 <sup>{standings.length.toString().padStart(2,'0')}</sup></h2></div></div><div className="edp-club-grid">{standings.map((row,i)=><div className="edp-club" key={row.teamId}><span>{String(i+1).padStart(2,'0')} / {currentLeague}</span><h3>{teamMap[row.teamId]?.name??'球隊'}</h3><div><span>{row.played} MATCHES</span><ArrowUpRight size={20}/></div></div>)}</div></div>}
    </section>
    <footer className="edp-footer"><span>D LEAGUE — DREAM IT. PLAY IT.</span><span>DESIGN STUDY / 2026</span></footer>
  </div>;
};
export default EditorialPreview;