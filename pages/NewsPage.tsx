import React, { useMemo, useState } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import type { NewsArticle } from '../types';

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
        <div className="mb-8 flex flex-col justify-between border-b border-neutral-100 pb-8 md:mb-12 md:flex-row md:items-end">
          <div>
            <h1 className="mb-3 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
              最新 <span className="text-brand-blue">消息</span>
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400 md:text-base">
              {activeSeason.displayName} 賽事戰報與官方公告
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 md:mt-0">
            {availableSeasons.map((season) => (
              <button
                key={season.id}
                type="button"
                onClick={() => setActiveSeason(season.id)}
                className={`rounded-full border px-4 py-2 text-xs font-black transition-colors ${
                  activeSeasonId === season.id
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                {season.shortName}
              </button>
            ))}
          </div>
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
