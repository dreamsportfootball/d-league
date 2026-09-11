import React, { useMemo } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getAllNews } from '../services/seasonDataJson';
import { formatTaipeiDate } from '../utils/dateFormat';

const getBadgeStyle = (category: string) =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black border-transparent'
    : 'bg-brand-blue text-white border-transparent';

const getBadgeName = (category: string) =>
  category === 'Match Report' ? '戰報' : '公告';

const NewsSection: React.FC = () => {
  const displayNews = useMemo(
    () =>
      getAllNews()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 3),
    [],
  );

  const leadArticle = displayNews[0];
  const secondaryArticles = displayNews.slice(1, 3);

  return (
    <>
      {/* Mobile / tablet: keep the existing compact news list. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-white p-5">
          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-brand-black">
            最新消息
          </h3>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-blue">
            LATEST
          </span>
        </div>

        <div className="flex flex-grow flex-col divide-y divide-neutral-100">
          {displayNews.length > 0 ? (
            displayNews.map((article) => {
              const seasonLabel = article.seasonId
                ? getSeasonConfig(article.seasonId).shortName
                : null;

              return (
                <Link
                  key={`${article.seasonId ?? 'global'}-${article.id}`}
                  to={`/news/${article.id}`}
                  data-scroll-anchor-id={`home-news-article-${article.seasonId ?? 'global'}-${article.id}`}
                  className="group relative flex cursor-pointer items-start space-x-5 overflow-hidden p-5 text-left transition-colors hover:bg-neutral-50"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1 -translate-x-full bg-brand-blue transition-transform duration-300 group-hover:translate-x-0" />

                  <div className="z-10 min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex h-[18px] items-center justify-center rounded-sm px-2 text-[10px] font-bold uppercase leading-none tracking-wider shadow-sm ${getBadgeStyle(
                          article.category,
                        )}`}
                      >
                        {getBadgeName(article.category)}
                      </span>
                      {seasonLabel && (
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-blue">
                          {seasonLabel}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-neutral-400">
                        {formatTaipeiDate(article.timestamp)}
                      </span>
                    </div>
                    <h4 className="mb-2 line-clamp-2 font-display text-lg font-bold uppercase leading-tight text-brand-black transition-colors group-hover:text-brand-blue">
                      {article.title}
                    </h4>
                    <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500 opacity-80 transition-opacity group-hover:opacity-100">
                      {article.summary}
                    </p>
                  </div>

                  {article.imageUrl && (
                    <div className="relative z-10 h-20 w-28 shrink-0 overflow-hidden rounded bg-neutral-100 shadow-sm md:h-24 md:w-32">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                  )}
                </Link>
              );
            })
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <Newspaper className="mb-3 h-8 w-8 text-neutral-300" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-400">目前尚無消息</p>
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-neutral-100 bg-neutral-50 p-4">
          <Link
            to="/news"
            data-scroll-anchor-id="home-news-all"
            className="group/btn flex w-full items-center justify-center py-2 text-center text-xs font-black uppercase tracking-widest text-neutral-400 transition-colors hover:text-brand-black"
          >
            查看全部消息
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Desktop: editorial 1 lead story + 2 secondary stories. */}
      <section className="hidden lg:block">
        <div className="mb-5 flex items-end justify-between gap-6 border-b border-neutral-200 pb-3">
          <div>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.28em] text-neutral-400">
              Latest News
            </span>
            <div className="flex items-center gap-3">
              <span className="h-7 w-1 bg-brand-accent" aria-hidden="true" />
              <h3 className="font-display text-3xl font-black tracking-tight text-brand-black">
                最新消息
              </h3>
            </div>
          </div>

          <Link
            to="/news"
            data-scroll-anchor-id="home-news-all-desktop"
            className="group flex min-h-11 items-center text-xs font-black uppercase tracking-[0.16em] text-neutral-400 transition-colors hover:text-brand-black"
          >
            查看全部消息
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {leadArticle ? (
          <div className="grid grid-cols-12 gap-6 xl:gap-7">
            <Link
              to={`/news/${leadArticle.id}`}
              data-scroll-anchor-id={`home-news-article-${leadArticle.seasonId ?? 'global'}-${leadArticle.id}-desktop`}
              className="group col-span-7 min-w-0"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                {leadArticle.imageUrl ? (
                  <img
                    src={leadArticle.imageUrl}
                    alt={leadArticle.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-100">
                    <Newspaper className="h-10 w-10 text-neutral-300" aria-hidden="true" />
                  </div>
                )}
                <span className="absolute left-4 top-4 bg-brand-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-black">
                  Latest
                </span>
              </div>

              <div className="pt-4">
                <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <span className="text-brand-blue">{getBadgeName(leadArticle.category)}</span>
                  {leadArticle.seasonId && (
                    <>
                      <span className="text-neutral-300">/</span>
                      <span className="text-neutral-500">
                        {getSeasonConfig(leadArticle.seasonId).shortName}
                      </span>
                    </>
                  )}
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-400">
                    {formatTaipeiDate(leadArticle.timestamp)}
                  </span>
                </div>

                <h4 className="line-clamp-2 font-display text-[28px] font-black uppercase leading-[1.08] tracking-tight text-brand-black transition-colors group-hover:text-brand-blue xl:text-[30px]">
                  {leadArticle.title}
                </h4>
                <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  {leadArticle.summary}
                </p>
                <span className="mt-4 inline-flex items-center text-[11px] font-black uppercase tracking-[0.14em] text-brand-black">
                  閱讀更多
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            <div className="col-span-5 border-y border-neutral-200">
              {secondaryArticles.map((article, index) => {
                const seasonLabel = article.seasonId
                  ? getSeasonConfig(article.seasonId).shortName
                  : null;

                return (
                  <Link
                    key={`${article.seasonId ?? 'global'}-${article.id}-desktop`}
                    to={`/news/${article.id}`}
                    data-scroll-anchor-id={`home-news-article-${article.seasonId ?? 'global'}-${article.id}-desktop`}
                    className={`group grid grid-cols-[42%_1fr] gap-4 py-4 ${
                      index > 0 ? 'border-t border-neutral-200' : ''
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Newspaper className="h-7 w-7 text-neutral-300" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-center">
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold uppercase tracking-[0.12em]">
                        <span className="text-brand-blue">{getBadgeName(article.category)}</span>
                        {seasonLabel && (
                          <>
                            <span className="text-neutral-300">/</span>
                            <span className="text-neutral-500">{seasonLabel}</span>
                          </>
                        )}
                        <span className="text-neutral-300">/</span>
                        <span className="text-neutral-400">
                          {formatTaipeiDate(article.timestamp)}
                        </span>
                      </div>

                      <h4 className="line-clamp-2 font-display text-lg font-black uppercase leading-[1.12] tracking-tight text-brand-black transition-colors group-hover:text-brand-blue xl:text-xl">
                        {article.title}
                      </h4>

                      <span className="mt-3 inline-flex items-center text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400 transition-colors group-hover:text-brand-black">
                        閱讀更多
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center border-y border-neutral-200 text-center">
            <Newspaper className="mb-3 h-9 w-9 text-neutral-300" aria-hidden="true" />
            <p className="text-sm font-medium text-neutral-400">目前尚無消息</p>
          </div>
        )}
      </section>
    </>
  );
};

export default NewsSection;
