import React, { useMemo, useState } from 'react';
import { ChevronDown, Newspaper } from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';
import { getArticleKey, sortArticlesByNewest } from '../components/news/articlePresentation';
import { getAllNews } from '../services/seasonDataJson';
import type { NewsArticle } from '../types';

type NewsFilter = 'ALL' | NewsArticle['category'];

const NEWS_BATCH_SIZE = 9;

const NewsPage: React.FC = () => {
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
  const [visibleCount, setVisibleCount] = useState(() => {
    try {
      const saved = Number.parseInt(window.sessionStorage.getItem('newsVisibleCount') ?? '', 10);
      return Number.isFinite(saved) && saved >= NEWS_BATCH_SIZE ? saved : NEWS_BATCH_SIZE;
    } catch {
      return NEWS_BATCH_SIZE;
    }
  });

  const sortedNews = useMemo(() => sortArticlesByNewest(getAllNews()), []);
  const filteredNews = useMemo(
    () =>
      activeFilter === 'ALL'
        ? sortedNews
        : sortedNews.filter((article) => article.category === activeFilter),
    [activeFilter, sortedNews],
  );

  const featuredArticle = filteredNews[0] ?? null;
  const visibleNews = filteredNews.slice(1, visibleCount);
  const hasMoreNews = visibleCount < filteredNews.length;

  const updateFilter = (filter: NewsFilter) => {
    setActiveFilter(filter);
    setVisibleCount(NEWS_BATCH_SIZE);
    try {
      window.sessionStorage.setItem('newsActiveFilter', filter);
      window.sessionStorage.setItem('newsVisibleCount', String(NEWS_BATCH_SIZE));
    } catch {
      // Session storage may be unavailable.
    }
  };

  const loadMoreNews = () => {
    const nextCount = Math.min(visibleCount + NEWS_BATCH_SIZE, filteredNews.length);
    setVisibleCount(nextCount);
    try {
      window.sessionStorage.setItem('newsVisibleCount', String(nextCount));
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
    <div className="min-h-[80vh] bg-white pb-24 pt-6 md:pb-32 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <header className="mb-8 border-b border-neutral-200 pb-8 md:mb-12 md:pb-10">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.28em] text-neutral-400">
            Newsroom
          </p>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
            最新 <span className="text-brand-blue">消息</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-neutral-500 md:text-base">
            D LEAGUE 官方公告、賽事戰報與各賽季重要消息
          </p>
        </header>

        <nav
          className="mb-10 flex flex-wrap gap-x-7 gap-y-2 border-b border-neutral-200"
          aria-label="最新消息分類"
        >
          {newsFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilter(filter.key)}
              aria-pressed={activeFilter === filter.key}
              className={`relative min-h-11 border-b-2 pb-3 text-sm font-bold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                activeFilter === filter.key
                  ? 'border-brand-blue text-brand-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </nav>

        {featuredArticle ? (
          <div aria-live="polite">
            <section aria-labelledby="featured-news-title">
              <h2 id="featured-news-title" className="sr-only">
                最新焦點文章
              </h2>
              <ArticleCard article={featuredArticle} variant="featured" />
            </section>

            {visibleNews.length > 0 && (
              <section className="mt-16 md:mt-20" aria-labelledby="news-archive-title">
                <div className="mb-8 flex items-end justify-between gap-6 border-b border-neutral-200 pb-4">
                  <div>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">
                      Archive
                    </p>
                    <h2 id="news-archive-title" className="mt-1 font-display text-2xl font-black tracking-tight text-brand-black md:text-3xl">
                      更多消息
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-neutral-400">
                    共 {filteredNews.length} 篇
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-x-9 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                  {visibleNews.map((article) => (
                    <ArticleCard key={getArticleKey(article)} article={article} />
                  ))}
                </div>
              </section>
            )}

            {hasMoreNews && (
              <div className="mt-16 flex justify-center border-t border-neutral-200 pt-8">
                <button
                  type="button"
                  onClick={loadMoreNews}
                  className="inline-flex min-h-12 items-center justify-center border border-neutral-300 bg-white px-7 text-sm font-black tracking-wide text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                >
                  載入更多消息
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center border-y border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
            <Newspaper className="mb-4 h-10 w-10 text-neutral-300" aria-hidden="true" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-brand-black">
              目前尚無相關消息
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-500">
              最新公告與賽事戰報將於主辦單位公布後更新
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
