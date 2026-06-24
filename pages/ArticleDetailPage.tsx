import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getNewsArticle } from '../services/seasonDataJson';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

const getBadgeStyle = (category: 'Match Report' | 'Official') =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black border-transparent'
    : 'bg-brand-blue text-white border-transparent';

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const ArticleBody: React.FC<{ text: string }> = ({ text }) => {
  const blocks = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean),
    [text],
  );

  if (blocks.length === 0) return null;

  return (
    <div className="text-justify text-[15px] font-light leading-[2.2] text-neutral-800 md:text-[16px] md:font-medium">
      <div className="mb-10 whitespace-pre-line border-l-[3px] border-[#0047AB] pl-4 font-display text-[18px] font-semibold leading-[1.7] tracking-wide text-black md:pl-5 md:text-[20px]">
        {blocks[0]}
      </div>
      {blocks.slice(1).map((block, index) => (
        <p key={`${index}-${block.slice(0, 20)}`} className="mb-8 whitespace-pre-line tracking-wide">
          {block}
        </p>
      ))}
    </div>
  );
};

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const article = useMemo(
    () => (id ? getNewsArticle(id) : null),
    [id],
  );

  if (!article) {
    return (
      <div className="min-h-screen bg-white px-6 pt-32 text-center">
        <h1 className="mb-4 text-xl font-medium tracking-widest text-neutral-900">文章不存在</h1>
        <p className="mb-6 text-sm text-neutral-400">此文章可能已移除或網址不正確</p>
        <Link
          to="/news"
          className="border-b border-transparent pb-1 text-xs tracking-[0.2em] text-neutral-400 transition-colors hover:border-black hover:text-black"
        >
          返回最新消息
        </Link>
      </div>
    );
  }

  const contentText = article.content || article.summary || '';
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

  return (
    <article className="min-h-screen bg-white pb-32 pt-14 md:pt-24">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="mb-6 md:mb-8">
          <Link
            to="/news"
            className="group inline-flex items-center text-[11px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-black md:text-[12px]"
          >
            <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
            返回最新消息
          </Link>
        </div>

        <header className="mb-12 flex flex-col items-start text-left md:mb-16">
          <div className="mb-6 flex flex-row items-center gap-3 md:mb-8">
            <span
              className={`rounded-sm px-2 py-1 text-[12px] font-bold tracking-[0.1em] ${getBadgeStyle(
                article.category,
              )}`}
            >
              {CATEGORY_META[article.category].label}
            </span>
            <span className="font-mono text-[11px] tracking-wider text-neutral-400">
              {formatDate(article.timestamp)}
            </span>
            {seasonLabel && (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">
                {seasonLabel}
              </span>
            )}
          </div>

          <h1 className="mb-4 font-display text-[26px] font-bold uppercase leading-[1.2] tracking-wider text-neutral-900 md:mb-5 md:text-[34px]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mb-6 text-[13px] leading-relaxed tracking-wide text-neutral-500 md:mb-7 md:text-[14px]">
              {article.summary}
            </p>
          )}

          <div className="h-px w-10 bg-neutral-300" />
        </header>

        {article.imageUrl && (
          <figure className="mb-8 md:mb-10">
            <div className="w-full overflow-hidden bg-neutral-100">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="block h-auto w-full grayscale-[10%] transition-all duration-700 hover:grayscale-0"
              />
            </div>
          </figure>
        )}

        <div className="mx-auto max-w-[680px]">
          <ArticleBody text={contentText} />
        </div>

        <div className="mt-24 flex justify-center opacity-30 grayscale transition-all duration-500 hover:grayscale-0">
          <img
            src="https://cdn.store-assets.com/s/783745/f/16299215.png"
            alt="D LEAGUE"
            className="h-auto w-12 object-contain"
          />
        </div>
      </div>
    </article>
  );
};

export default ArticleDetailPage;
