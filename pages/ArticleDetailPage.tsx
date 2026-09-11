import React, { Fragment, useMemo } from 'react';
import { ArrowRight, ExternalLink, Newspaper } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getAllNews, getNewsArticle } from '../services/seasonDataJson';
import { formatTaipeiDate } from '../utils/dateFormat';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

type ArticleContentBlock =
  | { type: 'label'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'info'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'cta'; label: string; url: string }
  | { type: 'paragraph'; text: string };

const BULLET_PATTERN = /^(?:[-*•▪・])\s*(.+)$/;
const ORDERED_PATTERN = /^\d+[.、]\s*(.+)$/;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const STANDALONE_URL_PATTERN = /^https?:\/\/[^\s]+$/;
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
    return { type: 'label', text: lines[0].slice(1, -1).trim() };
  }

  if (
    lines.length === 2 &&
    lines[0].length <= 80 &&
    STANDALONE_URL_PATTERN.test(lines[1])
  ) {
    return {
      type: 'cta',
      label: lines[0].replace(/[：:]$/, '').trim() || '前往相關網站',
      url: lines[1],
    };
  }

  if (lines.length === 1 && STANDALONE_URL_PATTERN.test(lines[0])) {
    return { type: 'cta', label: '前往相關網站', url: lines[0] };
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

const ArticleHighlight: React.FC<{ text: string }> = ({ text }) => (
  <div aria-label="文章重點">
    <p className="text-[18px] font-semibold leading-[1.75] text-neutral-700 md:text-[22px] md:leading-[1.68]">
      {text}
    </p>
    <div className="mt-6 h-1 w-10 bg-brand-accent" aria-hidden="true" />
  </div>
);

const ArticleSectionHeading: React.FC<{ text: string }> = ({ text }) => (
  <div className="mb-6 mt-12 first:mt-0 md:mb-7 md:mt-14">
    <h2 className="font-display text-[22px] font-bold leading-tight tracking-tight text-brand-black md:text-[26px]">
      {renderInlineText(text)}
    </h2>
    <div className="mt-3 h-1 w-10 bg-brand-accent" aria-hidden="true" />
  </div>
);

const ArticleBody: React.FC<{
  text: string;
  category: 'Match Report' | 'Official';
}> = ({ text, category }) => {
  const blocks = useMemo(() => {
    const parsedBlocks = text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => parseArticleBlock(block, category));

    if (category !== 'Match Report') return parsedBlocks;

    let firstContentIndex = 0;
    while (
      firstContentIndex < parsedBlocks.length &&
      (parsedBlocks[firstContentIndex].type === 'label' ||
        parsedBlocks[firstContentIndex].type === 'info')
    ) {
      firstContentIndex += 1;
    }

    if (parsedBlocks[firstContentIndex]?.type === 'heading') {
      firstContentIndex += 1;
    }

    return parsedBlocks.slice(firstContentIndex);
  }, [category, text]);

  if (blocks.length === 0) return null;

  return (
    <div className="break-words text-left text-[16px] font-normal leading-[1.9] text-neutral-800 md:text-[17px] md:leading-[1.92]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'label' || block.type === 'heading') {
          return <ArticleSectionHeading key={key} text={block.text} />;
        }

        if (block.type === 'info') {
          return (
            <section
              key={key}
              className="my-9 border-y border-neutral-200 py-5 md:my-10 md:py-6"
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

        if (block.type === 'cta') {
          return (
            <div key={key} className="mb-8 mt-9">
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 items-center border-b-2 border-brand-black pb-1 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4"
              >
                {block.label}
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </a>
            </div>
          );
        }

        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol
                key={key}
                className="mb-8 list-decimal space-y-3 pl-6 marker:font-bold marker:text-brand-blue"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${itemIndex}-${item.slice(0, 16)}`} className="pl-1">
                    {renderInlineText(item)}
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <ul key={key} className="mb-8 space-y-3">
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${itemIndex}-${item.slice(0, 16)}`}
                  className="grid grid-cols-[20px_1fr] gap-2"
                >
                  <span className="font-bold text-brand-blue" aria-hidden="true">
                    —
                  </span>
                  <span>{renderInlineText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={key} className="mb-8 last:mb-0">
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

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    const candidates = getAllNews()
      .filter((item) => item.id !== article.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    const sameSeason = candidates.filter((item) => item.seasonId === article.seasonId);
    const otherSeasons = candidates.filter((item) => item.seasonId !== article.seasonId);

    return [...sameSeason, ...otherSeasons].slice(0, 2);
  }, [article]);

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
            返回最新消息
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const contentText = article.content || article.summary || '';
  const highlightText = article.highlight || article.summary;
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-7 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8 lg:px-12">
        <nav className="mb-8 md:mb-12" aria-label="文章導覽">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-neutral-500 transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1" aria-hidden="true">
              ←
            </span>
            最新消息
          </Link>
        </nav>

        <header className="border-b border-neutral-200 pb-8 md:pb-12">
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[10px] font-bold tracking-[0.13em] md:text-[11px]">
              <span
                className={`inline-flex items-center gap-2 ${
                  article.category === 'Match Report' ? 'text-brand-black' : 'text-brand-blue'
                }`}
              >
                <span
                  className={`h-2 w-2 ${
                    article.category === 'Match Report' ? 'bg-brand-accent' : 'bg-brand-blue'
                  }`}
                  aria-hidden="true"
                />
                {CATEGORY_META[article.category].label}
              </span>
              {seasonLabel && (
                <>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-500">{seasonLabel}</span>
                </>
              )}
              <span className="text-neutral-300">/</span>
              <time dateTime={article.timestamp} className="font-mono text-neutral-400">
                {formatTaipeiDate(article.timestamp, '.')}
              </time>
            </div>

            <h1 className="mt-5 max-w-[980px] font-display text-[34px] font-bold leading-[1.15] tracking-tight text-brand-black md:mt-6 md:text-[48px] md:leading-[1.13] lg:text-[56px]">
              {article.title}
            </h1>
          </div>
        </header>

        {article.imageUrl && (
          <figure className="-mx-5 mt-8 sm:mx-0 md:mt-12">
            <div className="flex min-h-[220px] w-full items-center justify-center overflow-hidden bg-neutral-50/70 py-4 sm:px-4 md:min-h-[360px] md:px-6 md:py-7">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-auto max-h-[760px] w-auto max-w-full object-contain"
              />
            </div>
          </figure>
        )}

        <div
          className={`mx-auto max-w-[740px] ${
            article.imageUrl ? 'mt-9 md:mt-12' : 'mt-9 md:mt-12'
          }`}
        >
          {highlightText && <ArticleHighlight text={highlightText} />}

          <section
            className={highlightText ? 'mt-10 md:mt-12' : undefined}
            aria-label="文章正文"
          >
            <ArticleBody text={contentText} category={article.category} />
          </section>
        </div>

        {relatedArticles.length > 0 && (
          <section className="mx-auto mt-20 max-w-5xl border-t border-neutral-200 pt-8 md:mt-24 md:pt-10" aria-labelledby="related-news-heading">
            <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
              <div>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                  More from D League
                </span>
                <h2 id="related-news-heading" className="font-display text-2xl font-bold tracking-tight text-brand-black md:text-3xl">
                  更多最新消息
                </h2>
              </div>
              <Link
                to="/news"
                className="hidden min-h-11 items-center text-xs font-bold tracking-[0.12em] text-brand-blue transition-colors hover:text-brand-black md:inline-flex"
              >
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              {relatedArticles.map((item) => (
                <Link
                  key={`${item.seasonId ?? 'global'}-${item.id}-related`}
                  to={`/news/${item.id}`}
                  className="group flex gap-4 border-b border-neutral-200 pb-5 md:block md:border-b-0 md:pb-0"
                >
                  <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden bg-neutral-100 md:aspect-[16/9] md:w-full">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Newspaper className="h-7 w-7 text-neutral-300" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 md:pt-4">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 text-[9px] font-bold tracking-[0.12em] text-neutral-400 md:text-[10px]">
                      <span className="text-brand-blue">{CATEGORY_META[item.category].label}</span>
                      <span className="text-neutral-300">/</span>
                      <time dateTime={item.timestamp}>{formatTaipeiDate(item.timestamp, '.')}</time>
                    </div>
                    <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight tracking-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-xl">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              to="/news"
              className="mt-7 inline-flex min-h-11 items-center text-xs font-bold tracking-[0.12em] text-brand-blue transition-colors hover:text-brand-black md:hidden"
            >
              查看全部最新消息
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        )}
      </div>
    </article>
  );
};

export default ArticleDetailPage;
