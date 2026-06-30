import React, { useMemo } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import ArticleCard from './news/ArticleCard';
import { getArticleKey, sortArticlesByNewest } from './news/articlePresentation';
import { getAllNews } from '../services/seasonDataJson';

const NewsSection: React.FC = () => {
  const displayNews = useMemo(
    () => sortArticlesByNewest(getAllNews()).slice(0, 3),
    [],
  );

  return (
    <section className="flex h-full flex-col border-t-4 border-brand-blue bg-white" aria-labelledby="home-news-title">
      <div className="flex items-end justify-between gap-5 border-b border-neutral-200 py-5">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            Latest News
          </p>
          <h3 id="home-news-title" className="mt-1 font-display text-2xl font-black tracking-tight text-brand-black md:text-3xl">
            最新消息
          </h3>
        </div>
        <Link
          to="/news"
          className="group inline-flex min-h-11 shrink-0 items-center text-xs font-black uppercase tracking-[0.16em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          查看全部
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-grow flex-col">
        {displayNews.length > 0 ? (
          displayNews.map((article) => (
            <ArticleCard key={getArticleKey(article)} article={article} variant="compact" />
          ))
        ) : (
          <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center border-b border-neutral-200 px-6 py-16 text-center">
            <Newspaper className="mb-3 h-8 w-8 text-neutral-300" aria-hidden="true" />
            <p className="text-sm font-medium text-neutral-500">目前尚無消息</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsSection;
