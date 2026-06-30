import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ArticleBody from '../components/news/ArticleBody';
import ArticleCard from '../components/news/ArticleCard';
import ArticleMeta from '../components/news/ArticleMeta';
import {
  getArticleKey,
  getArticlePath,
  sortArticlesByNewest,
} from '../components/news/articlePresentation';
import { getAllNews, getNewsArticle } from '../services/seasonDataJson';

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const allArticles = useMemo(() => sortArticlesByNewest(getAllNews()), []);
  const article = useMemo(() => (id ? getNewsArticle(id) : null), [id]);

  const navigation = useMemo(() => {
    if (!article) return { newer: null, older: null };
    const articleIndex = allArticles.findIndex((item) => item.id === article.id);
    return {
      newer: articleIndex > 0 ? allArticles[articleIndex - 1] : null,
      older:
        articleIndex >= 0 && articleIndex < allArticles.length - 1
          ? allArticles[articleIndex + 1]
          : null,
    };
  }, [allArticles, article]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const sameSeasonAndCategory = allArticles.filter(
      (item) =>
        item.id !== article.id &&
        item.seasonId === article.seasonId &&
        item.category === article.category,
    );
    const sameCategory = allArticles.filter(
      (item) =>
        item.id !== article.id &&
        item.category === article.category &&
        !sameSeasonAndCategory.some((candidate) => candidate.id === item.id),
    );
    return [...sameSeasonAndCategory, ...sameCategory].slice(0, 3);
  }, [allArticles, article]);

  if (!article) {
    return (
      <section className="min-h-[75vh] bg-white px-6 py-24 text-center md:py-32">
        <div className="mx-auto max-w-xl border-y border-neutral-200 py-16">
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
            Article Not Found
          </p>
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight text-brand-black md:text-4xl">
            找不到這篇文章
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
            此文章可能已移除、尚未發布，或網址內容不正確
          </p>
          <Link
            to="/news"
            className="mt-8 inline-flex min-h-11 items-center text-xs font-black uppercase tracking-[0.18em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            返回最新消息
          </Link>
        </div>
      </section>
    );
  }

  const contentText = article.content || article.summary || '';

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <nav className="mb-8 md:mb-12" aria-label="文章導覽">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-xs font-black uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            返回最新消息
          </Link>
        </nav>

        <header className="border-b border-neutral-200 pb-10 md:pb-14">
          <div className="max-w-5xl">
            <ArticleMeta article={article} />
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-black leading-[1.12] tracking-tight text-brand-black md:text-6xl lg:text-[68px]">
              {article.title}
            </h1>
            {article.summary && (
              <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-neutral-600 md:text-xl md:leading-9">
                {article.summary}
              </p>
            )}
          </div>
        </header>

        {article.imageUrl && (
          <figure className="my-9 md:my-12">
            <div className="flex max-h-[760px] w-full items-center justify-center overflow-hidden bg-neutral-100">
              <img
                src={article.imageUrl}
                alt={article.imageAlt ?? article.title}
                className="max-h-[760px] h-auto w-auto max-w-full object-contain"
              />
            </div>
          </figure>
        )}

        <section className="mx-auto max-w-[760px]" aria-label="文章正文">
          <ArticleBody text={contentText} />
        </section>

        {(navigation.newer || navigation.older) && (
          <nav className="mx-auto mt-16 grid max-w-5xl gap-px border-y border-neutral-200 bg-neutral-200 md:mt-24 md:grid-cols-2" aria-label="上一篇與下一篇文章">
            <div className="bg-white">
              {navigation.newer ? (
                <Link
                  to={getArticlePath(navigation.newer)}
                  className="group flex h-full min-h-[150px] flex-col justify-center px-5 py-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset md:px-8"
                >
                  <span className="flex items-center text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                    較新消息
                  </span>
                  <span className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-blue md:text-xl">
                    {navigation.newer.title}
                  </span>
                </Link>
              ) : null}
            </div>
            <div className="bg-white">
              {navigation.older ? (
                <Link
                  to={getArticlePath(navigation.older)}
                  className="group flex h-full min-h-[150px] flex-col items-start justify-center px-5 py-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset md:items-end md:px-8 md:text-right"
                >
                  <span className="flex items-center text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    較早消息
                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  <span className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-blue md:text-xl">
                    {navigation.older.title}
                  </span>
                </Link>
              ) : null}
            </div>
          </nav>
        )}

        {relatedArticles.length > 0 && (
          <section className="mt-20 border-t border-neutral-200 pt-10 md:mt-28 md:pt-12" aria-labelledby="related-news-title">
            <div className="mb-8">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">
                Related
              </p>
              <h2 id="related-news-title" className="mt-1 font-display text-2xl font-black tracking-tight text-brand-black md:text-3xl">
                相關消息
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-9 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={getArticleKey(relatedArticle)} article={relatedArticle} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default ArticleDetailPage;
