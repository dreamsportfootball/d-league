import React, { useMemo } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { formatTaipeiDate } from '../utils/dateFormat';

const getBadgeName = (category: string): string =>
  category === 'Match Report' ? '戰報' : '公告';

const NewsSection: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const displayNews = useMemo(
    () =>
      [...seasonData.news]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 3),
    [seasonData.news],
  );

  const [featuredArticle, ...secondaryArticles] = displayNews;

  return (
    <section aria-labelledby="home-news-title">
      <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-blue">
            Latest · {activeSeason.shortName}
          </p>
          <h2 id="home-news-title" className="font-display text-3xl font-black tracking-tight text-brand-black md:text-4xl">
            最新消息
          </h2>
        </div>
        <Link
          to="/news"
          className="group inline-flex min-h-11 items-center py-3 text-xs font-black tracking-wider text-brand-blue transition-colors hover:text-brand-black"
        >
          全部消息
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {featuredArticle ? (
        <>
          <Link
            to={`/news/${featuredArticle.id}`}
            className="group grid gap-5 border-b border-neutral-200 py-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-stretch md:gap-7 md:py-6"
          >
            <div className="min-w-0 md:py-1">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                <span className="bg-brand-blue px-2 py-1 text-white">
                  {getBadgeName(featuredArticle.category)}
                </span>
                <span className="text-brand-blue">{activeSeason.shortName}</span>
                <span className="text-neutral-400">{formatTaipeiDate(featuredArticle.timestamp)}</span>
              </div>
              <h3 className="font-display text-2xl font-black leading-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-3xl">
                {featuredArticle.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-neutral-500">
                {featuredArticle.summary}
              </p>
              <span className="mt-5 inline-flex items-center text-xs font-black tracking-wider text-brand-black">
                閱讀公告
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

            {featuredArticle.imageUrl && (
              <div className="order-first aspect-[16/9] overflow-hidden bg-neutral-100 md:order-last md:aspect-auto md:min-h-44">
                <img
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}
          </Link>

          {secondaryArticles.length > 0 && (
            <div className="divide-y divide-neutral-200">
              {secondaryArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/news/${article.id}`}
                  className="group grid min-h-24 grid-cols-[minmax(0,1fr)_84px] gap-4 py-4 md:grid-cols-[minmax(0,1fr)_112px] md:gap-6 md:py-5"
                >
                  <div className="min-w-0 self-center">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                      <span className="text-brand-blue">{getBadgeName(article.category)}</span>
                      <span className="text-neutral-400">{formatTaipeiDate(article.timestamp)}</span>
                    </div>
                    <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-xl">
                      {article.title}
                    </h3>
                  </div>

                  {article.imageUrl ? (
                    <div className="aspect-square overflow-hidden bg-neutral-100 md:aspect-[4/3]">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-neutral-50 md:aspect-[4/3]">
                      <Newspaper className="h-5 w-5 text-neutral-300" aria-hidden="true" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center border-b border-neutral-200 text-center">
          <Newspaper className="mb-3 h-8 w-8 text-neutral-300" aria-hidden="true" />
          <p className="text-sm font-bold text-neutral-400">目前尚無消息</p>
        </div>
      )}
    </section>
  );
};

export default NewsSection;
