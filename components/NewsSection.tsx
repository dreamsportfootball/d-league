import React, { useMemo } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';

const getBadgeStyle = (category: string) =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black border-transparent'
    : 'bg-brand-blue text-white border-transparent';

const getBadgeName = (category: string) =>
  category === 'Match Report' ? '戰報' : '公告';

const NewsSection: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();

  const displayNews = useMemo(
    () =>
      seasonData.news
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 3),
    [seasonData.news],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-shadow duration-500 hover:shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-white p-5">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-brand-black">
          最新消息
        </h3>
        <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-blue">
          {activeSeason.shortName}
        </span>
      </div>

      <div className="flex flex-grow flex-col divide-y divide-neutral-100">
        {displayNews.length > 0 ? (
          displayNews.map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.id}`}
              className="group relative flex cursor-pointer items-start space-x-5 overflow-hidden p-5 text-left transition-colors hover:bg-neutral-50"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 -translate-x-full bg-brand-blue transition-transform duration-300 group-hover:translate-x-0" />

              <div className="z-10 min-w-0 flex-1">
                <div className="mb-2 flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-sm px-2 pb-[3px] pt-[5px] text-[10px] font-bold uppercase leading-none tracking-wider shadow-sm ${getBadgeStyle(
                      article.category,
                    )}`}
                  >
                    {getBadgeName(article.category)}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {new Date(article.timestamp).toLocaleDateString('zh-TW')}
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
                <div className="relative z-10 h-20 w-28 shrink-0 overflow-hidden rounded bg-neutral-100 shadow-sm transition-shadow group-hover:shadow-md md:h-24 md:w-32">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              )}
            </Link>
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <Newspaper className="mb-3 h-8 w-8 text-neutral-300" aria-hidden="true" />
            <p className="text-sm font-medium text-neutral-400">目前尚無本賽季消息</p>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-neutral-100 bg-neutral-50 p-4 transition-colors hover:bg-white">
        <Link
          to="/news"
          className="group/btn flex w-full items-center justify-center py-2 text-center text-xs font-black uppercase tracking-widest text-neutral-400 transition-colors hover:text-brand-black"
        >
          查看全部消息
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default NewsSection;
