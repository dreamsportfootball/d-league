import React, { Fragment, useMemo } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StructuredArticleBody from '../components/article/StructuredArticleBody';
import { getSeasonConfig } from '../config/seasons';
import { getArticleContentBlocks } from '../services/articleContentBlocks';
import { getNewsArticle } from '../services/seasonDataJson';
import { formatTaipeiDate } from '../utils/dateFormat';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

const getBadgeStyle = (category: 'Match Report' | 'Official') =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black'
    : 'bg-brand-blue text-white';

type ArticleContentBlock =
  | { type: 'label'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'info'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string };

const BULLET_PATTERN = /^(?:[-*•▪・])\s*(.+)$/;
const ORDERED_PATTERN = /^\d+[.、]\s*(.+)$/;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const PARAGRAPH_START_PATTERN = /^(?:第\s*\d|開賽|賽前|上半場|下半場|半場前|進入|比賽|最終|經歷|主辦單位|D LEAGUE)/;

const parseArticleBlock = (
  rawBlock: string,
  category: 'Match Report' | 'Official',
): ArticleContentBlock => {
  const text = rawBlock.trim();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 1 && /^【.+】$/.test(lines[0])) {
    return { type: 'label', text: lines[0] };
  }

  if (lines.length > 0 && lines.every((line) => BULLET_PATTERN.test(line))) {
    return {
      type: 'list',
      ordered: false,
      items: lines.map((line) => line.match(BULLET_PATTERN)?.[1] ?? line),
    };
  }

  if (lines.length > 0 && lines.every((line) => ORDERED_PATTERN.test(line))) {
    return {
      type: 'list',
      ordered: true,
      items: lines.map((line) => line.match(ORDERED_PATTERN)?.[1] ?? line),
    };
  }

  const looksLikeMatchInfo =
    category === 'Match Report' &&
    lines.length >= 2 &&
    lines.length <= 4 &&
    (lines[0].startsWith('D LEAGUE｜') || lines.some((line) => /\d+\s*-\s*\d+/.test(line)));

  if (looksLikeMatchInfo) {
    return { type: 'info', lines };
  }

  const isShortHeading =
    category === 'Match Report' &&
    lines.length === 1 &&
    lines[0].length <= 38 &&
    !PARAGRAPH_START_PATTERN.test(lines[0]) &&
    !/[。！？!?]$/.test(lines[0]);

  if (isShortHeading) {
    return { type: 'heading', text: lines[0] };
  }

  return { type: 'paragraph', text };
};

const renderInlineText = (text: string): React.ReactNode =>
  text.split(URL_PATTERN).map((part, index) => {
    const isUrl = /^https?:\/\//.test(part);

    if (!isUrl) {
      return <Fragment key={`${index}-${part.slice(0, 12)}`}>{part}</Fragment>;
    }

    return (
      <a
        key={`${index}-${part}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${part}，另開新分頁`}
        className="break-all font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-4 transition-colors hover:decoration-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {part}
        <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
      </a>
    );
  });

const renderMultilineText = (text: string): React.ReactNode[] =>
  text.split('\n').map((line, index, lines) => (
    <Fragment key={`${index}-${line.slice(0, 16)}`}>
      {renderInlineText(line)}
      {index < lines.length - 1 && <br />}
    </Fragment>
  ));

const ArticleBody: React.FC<{
  text: string;
  category: 'Match Report' | 'Official';
}> = ({ text, category }) => {
  const blocks = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => parseArticleBlock(block, category)),
    [category, text],
  );

  if (blocks.length === 0) return null;

  return (
    <div className="break-words text-left text-[16px] font-normal leading-[1.9] text-neutral-800 md:text-[17px] md:leading-[1.95]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'label') {
          return (
            <p
              key={key}
              className="mb-5 mt-10 font-display text-xs font-bold tracking-[0.18em] text-brand-blue first:mt-0"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === 'heading') {
          return (
            <h2
              key={key}
              className="mb-5 mt-10 font-display text-2xl font-bold leading-snug tracking-tight text-brand-black first:mt-0 md:text-[28px]"
            >
              {renderInlineText(block.text)}
            </h2>
          );
        }

        if (block.type === 'info') {
          return (
            <section
              key={key}
              className="my-8 border-y border-neutral-200 bg-neutral-50 px-5 py-5 md:px-6"
              aria-label="賽事資訊"
            >
              <div className="space-y-1.5 font-display text-lg font-semibold leading-relaxed text-brand-black md:text-xl">
                {block.lines.map((line, lineIndex) => (
                  <p key={`${lineIndex}-${line.slice(0, 16)}`}>{renderInlineText(line)}</p>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === 'list') {
          const ListElement = block.ordered ? 'ol' : 'ul';
          return (
            <ListElement
              key={key}
              className={`mb-7 space-y-2.5 pl-6 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              } marker:font-bold marker:text-brand-blue`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item.slice(0, 16)}`} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ListElement>
          );
        }

        return (
          <p key={key} className="mb-7 last:mb-0">
            {renderMultilineText(block.text)}
          </p>
        );
      })}
    </div>
  );
};

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const article = useMemo(() => (id ? getNewsArticle(id) : null), [id]);

  if (!article) {
    return (
      <main className="min-h-[75vh] bg-white px-5 py-24 text-center md:py-32">
        <div className="mx-auto max-w-lg border-y border-neutral-200 py-14">
          <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Article Not Found
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-brand-black">
            找不到這篇文章
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-500">
            此文章可能已移除，或網址內容不正確
          </p>
          <Link
            to="/news"
            className="mt-7 inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            返回最新消息
          </Link>
        </div>
      </main>
    );
  }

  const contentText = article.content || article.summary || '';
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;
  const structuredContent = article.seasonId
    ? getArticleContentBlocks(article.seasonId, article.id)
    : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-6xl px-5 md:px-10 lg:px-12">
        <nav className="mb-8 md:mb-12" aria-label="文章導覽">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-neutral-500 transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft
              className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            返回最新消息
          </Link>
        </nav>

        <header className="border-b border-neutral-200 pb-9 md:pb-12">
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className={`inline-flex items-center rounded-sm px-2.5 py-1.5 text-[11px] font-bold tracking-[0.12em] ${getBadgeStyle(
                  article.category,
                )}`}
              >
                {CATEGORY_META[article.category].label}
              </span>
              {seasonLabel && (
                <span className="text-[11px] font-bold tracking-[0.14em] text-brand-blue">
                  {seasonLabel} 賽季
                </span>
              )}
              <time
                dateTime={article.timestamp}
                className="font-mono text-[11px] tracking-[0.08em] text-neutral-400"
              >
                {formatTaipeiDate(article.timestamp, '.')}
              </time>
            </div>

            <h1 className="mt-6 max-w-[980px] font-display text-[34px] font-bold leading-[1.16] tracking-tight text-brand-black md:text-5xl md:leading-[1.14] lg:text-[54px]">
              {article.title}
            </h1>

            {article.summary && (
              <p className="mt-6 max-w-3xl text-[17px] font-medium leading-[1.75] text-neutral-600 md:text-xl md:leading-[1.7]">
                {article.summary}
              </p>
            )}
          </div>
        </header>

        {article.imageUrl && (
          <figure className="my-9 md:my-12">
            <div className="flex min-h-[220px] w-full items-center justify-center overflow-hidden px-3 py-3 md:min-h-[360px] md:px-6 md:py-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-auto max-h-[760px] w-auto max-w-full object-contain"
              />
            </div>
          </figure>
        )}

        <section className="mx-auto max-w-[720px]" aria-label="文章正文">
          {structuredContent ? (
            <StructuredArticleBody blocks={structuredContent} />
          ) : (
            <ArticleBody text={contentText} category={article.category} />
          )}
        </section>

        <footer className="mx-auto mt-16 max-w-[720px] border-t border-neutral-200 pt-7 md:mt-20">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <ArrowLeft
              className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            返回最新消息
          </Link>
        </footer>
      </div>
    </article>
  );
};

export default ArticleDetailPage;
