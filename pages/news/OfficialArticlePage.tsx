import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeasonConfig } from '../../config/seasons';
import type { NewsArticle } from '../../types';
import { formatTaipeiDate } from '../../utils/dateFormat';

interface OfficialArticlePageProps {
  article: NewsArticle;
}

const splitParagraphs = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !/^【.+】$/.test(paragraph));

const OfficialArticlePage: React.FC<OfficialArticlePageProps> = ({ article }) => {
  const paragraphs = useMemo(
    () => splitParagraphs(article.content || article.summary || ''),
    [article.content, article.summary],
  );
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 md:px-8">
        <Link
          to="/news"
          className="group mb-7 inline-flex min-h-11 items-center text-[11px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand-black md:mb-10 md:text-[12px]"
        >
          <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
          返回最新消息
        </Link>

        <header className="mb-9 md:mb-12">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-sm bg-brand-blue px-2 py-1 text-[11px] font-bold tracking-[0.1em] text-white">
              官方公告
            </span>
            {seasonLabel && (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">
                {seasonLabel}
              </span>
            )}
            <span className="font-mono text-[11px] tracking-wider text-neutral-400">
              {formatTaipeiDate(article.timestamp, '.')}
            </span>
          </div>

          <h1 className="max-w-[820px] font-display text-[31px] font-bold leading-[1.15] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[46px]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mt-5 max-w-3xl text-[15px] font-medium leading-[1.8] text-neutral-500 md:mt-6 md:text-[17px]">
              {article.summary}
            </p>
          )}
        </header>

        {article.imageUrl && (
          <figure className="mb-10 md:mb-14">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="block h-auto w-full bg-neutral-100"
            />
          </figure>
        )}

        <div className="mx-auto max-w-[660px] text-left text-[15px] font-normal leading-[1.95] text-neutral-700 md:text-[16px] md:leading-[2]">
          {paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`} className="mb-7 whitespace-pre-line md:mb-8">
              {paragraph}
            </p>
          ))}
        </div>

        <footer className="mx-auto mt-16 flex max-w-[660px] items-center justify-between border-t border-neutral-200 pt-5 md:mt-20">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            返回全部消息
          </Link>
          <img
            src="https://cdn.store-assets.com/s/783745/f/16299215.png"
            alt="D LEAGUE"
            className="h-auto w-9 object-contain opacity-20 grayscale"
          />
        </footer>
      </div>
    </article>
  );
};

export default OfficialArticlePage;
