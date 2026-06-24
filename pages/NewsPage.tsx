import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import type { NewsArticle } from '../types';
import type { SeasonId } from '../types/season';

type NewsFilter = 'ALL' | 'Match Report' | 'Official';

const CATEGORY_MAP: Record<NewsArticle['category'], string> = {
  'Match Report': '賽事戰報',
  Official: '官方公告',
};

const TAG_COLOR_MAP: Record<NewsArticle['category'], string> = {
  'Match Report': 'bg-brand-accent text-brand-black',
  Official: 'bg-brand-blue text-white',
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const MinimalNewsCard: React.FC<{ article: NewsArticle; seasonId: string }> = ({ article, seasonId }) => (
  <Link to={`/news/${article.id}?season=${seasonId}`} className="group flex h-full cursor-pointer flex-col">
    <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100">
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100">
          <Newspaper className="h-10 w-10 text-neutral-300" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
    </div>

    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center justify-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.15em] ${TAG_COLOR_MAP[article.category]}`}
        >
          {CATEGORY_MAP[article.category]}
        </span>
        <span className="font-mono text-[11px] text-neutral-400">
          {formatDate(article.timestamp)}
        </span>
      </div>

      <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-blue">
        {article.title}
      </h3>

      <p className="mb-4 line-clamp-2 text-xs leading-normal text-neutral-500">
        {article.summary}
      </p>

      <div className="group/btn mt-auto flex items-center pt-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
        <span className="mr-2 decoration-2 underline-offset-4 group-hover/btn:underline">查看內容</span>
        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-1" />
      </div>
    </div>
  </Link>
);

const NewsPage: React.FC = () => {
  const { activeSeason, activeSeasonId, availableSeasons, seasonData, setActiveSeason } = useSeason();
  const [activeFilter, setActiveFilter] = useState<NewsFilter>(() => {
    try {
      const saved = window.sessionStorage.getItem('newsActiveFilter');
      return saved === 'ALL' || saved === 'Match Report' || saved === 'Official'
        ? saved
        : 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const sortedNews = useMemo(
    () =>
      seasonData.news
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
    [seasonData.news],
  );

  const filteredNews = useMemo(
    () =>
      activeFilter === 'ALL'
        ? sortedNews
        : sortedNews.filter((article) => article.category === activeFilter),
    [activeFilter, sortedNews],
  );

  const updateFilter = (filter: NewsFilter) => {
    setActiveFilter(filter);
    try {
      window.sessionStorage.setItem('newsActiveFilter', filter);
    } catch {
      // Session storage may be unavailable.
    }
  };

  const newsFilters: { key: NewsFilter; label: string }[] = [
    { key: 'ALL', label: '全部消息' },
    { key: 'Match Report', label: '賽事戰報' },
    { key: 'Official', label: '官方公告' },
  ];

  return (
    <div className="min-h-[80vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-neutral-100 pb-8 md:mb-12 md:flex-row md:items-end">
          <div>
            <h1 className="mb-3 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
              最新 <span className="text-brand-blue">消息</span>
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400 md:text-base">
              {activeSeason.displayName} 賽事戰報與官方公告
            </p>
          </div>

          <label className="block w-full md:w-56">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400">
              賽季
            </span>
            <span className="relative block">
              <select
                value={activeSeasonId}
                onChange={(event) => setActiveSeason(event.target.value as SeasonId)}
                data-analytics-event="season_switch"
                className="min-h-11 w-full appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-10 text-sm font-bold text-brand-black shadow-sm transition-colors hover:border-neutral-300 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
              >
                {availableSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.displayName}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
            </span>
          </label>
        </div>

        <div className="mb-10 flex flex-wrap gap-x-6 gap-y-3 border-b border-neutral-100">
          {newsFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilter(filter.key)}
              className={`relative border-b-2 pb-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeFilter === filter.key
                  ? 'border-brand-blue text-brand-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((article) => (
              <MinimalNewsCard key={article.id} article={article} seasonId={activeSeasonId} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
            <Newspaper className="mb-4 h-10 w-10 text-neutral-300" aria-hidden="true" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-brand-black">
              目前尚無相關消息
            </h2>
            <p className="mt-3 text-sm font-medium text-neutral-500">
              {activeSeason.shortName} 的消息將於主辦單位公布後更新
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
