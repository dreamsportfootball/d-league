import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getNewsArticle } from '../services/seasonDataJson';
import { formatTaipeiDate } from '../utils/dateFormat';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

const getBadgeStyle = (category: 'Match Report' | 'Official') =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black border-transparent'
    : 'bg-brand-blue text-white border-transparent';

type MatchScoreSummary = {
  competitionLabel: string | null;
  homeTeam: string;
  homeScore: string;
  awayScore: string;
  awayTeam: string;
  headline: string | null;
};

type ParsedArticleContent = {
  matchSummary: MatchScoreSummary | null;
  bodyBlocks: string[];
};

const splitArticleBlocks = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

const parseScoreLine = (
  block: string,
): Omit<MatchScoreSummary, 'competitionLabel' | 'headline'> | null => {
  const normalized = block.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.+?)\s+(\d+)\s*[-–—]\s*(\d+)\s+(.+)$/);

  if (!match) return null;

  return {
    homeTeam: match[1].trim(),
    homeScore: match[2],
    awayScore: match[3],
    awayTeam: match[4].trim(),
  };
};

const isDecorativeLabel = (block: string): boolean => /^【.+】$/.test(block);

const isLikelyMatchHeadline = (block: string): boolean =>
  block.length <= 72 &&
  !block.includes('\n') &&
  !/^(賽前|開賽|第\s*\d+|上半場|半場|下半場|進入下半場|比賽|終場|最終)/.test(block);

const parseArticleContent = (
  text: string,
  category: 'Match Report' | 'Official',
): ParsedArticleContent => {
  const blocks = splitArticleBlocks(text);

  if (category !== 'Match Report') {
    return {
      matchSummary: null,
      bodyBlocks: blocks.filter((block) => !isDecorativeLabel(block)),
    };
  }

  const scoreIndex = blocks.findIndex((block) => parseScoreLine(block) !== null);
  const score = scoreIndex >= 0 ? parseScoreLine(blocks[scoreIndex]) : null;

  if (!score) {
    return {
      matchSummary: null,
      bodyBlocks: blocks.filter((block) => !isDecorativeLabel(block)),
    };
  }

  const competitionIndex = blocks.findIndex(
    (block) => /^D LEAGUE\s*[｜|]/i.test(block) && /第\s*\d+\s*輪/.test(block),
  );
  const competitionLabel =
    competitionIndex >= 0
      ? blocks[competitionIndex].replace(/^D LEAGUE\s*[｜|]\s*/i, '').trim()
      : null;

  const headlineIndex = scoreIndex + 1;
  const headline =
    headlineIndex < blocks.length && isLikelyMatchHeadline(blocks[headlineIndex])
      ? blocks[headlineIndex]
      : null;

  const bodyBlocks = blocks.filter((block, index) => {
    if (isDecorativeLabel(block)) return false;
    if (index === competitionIndex || index === scoreIndex) return false;
    if (headline && index === headlineIndex) return false;
    return true;
  });

  return {
    matchSummary: {
      competitionLabel,
      ...score,
      headline,
    },
    bodyBlocks,
  };
};

const MOMENT_LEAD_PATTERN =
  /^(開賽第\s*\d+\s*分鐘|第\s*\d+\s*分鐘|下半場第\s*\d+\s*分鐘|上半場尾聲|半場前|下半場開始後|進入下半場後|比賽後段|比賽最後階段|終場前|最終)([，,:：]?)/;

const isSectionHeading = (block: string): boolean =>
  block.length <= 32 &&
  !block.includes('\n') &&
  !/[。！？；，,]/.test(block) &&
  !parseScoreLine(block) &&
  !MOMENT_LEAD_PATTERN.test(block);

const ArticleParagraph: React.FC<{ block: string }> = ({ block }) => {
  const momentMatch = block.match(MOMENT_LEAD_PATTERN);

  if (!momentMatch) {
    return <p className="mb-8 whitespace-pre-line">{block}</p>;
  }

  const lead = `${momentMatch[1]}${momentMatch[2] ?? ''}`;
  const remainder = block.slice(momentMatch[0].length);

  return (
    <p className="mb-8 whitespace-pre-line">
      <strong className="font-semibold text-neutral-950">{lead}</strong>
      {remainder}
    </p>
  );
};

const ArticleBody: React.FC<{ blocks: string[] }> = ({ blocks }) => {
  if (blocks.length === 0) return null;

  return (
    <div className="text-left text-[15px] font-normal leading-[2] tracking-[0.01em] text-neutral-700 md:text-[16px] md:leading-[2.05]">
      {blocks.map((block, index) =>
        isSectionHeading(block) ? (
          <h2
            key={`${index}-${block}`}
            className="mb-5 mt-12 border-l-[3px] border-brand-blue pl-4 font-display text-[20px] font-bold leading-snug tracking-tight text-brand-black first:mt-0 md:text-[23px]"
          >
            {block}
          </h2>
        ) : (
          <ArticleParagraph key={`${index}-${block.slice(0, 24)}`} block={block} />
        ),
      )}
    </div>
  );
};

const MatchScorePanel: React.FC<{ summary: MatchScoreSummary }> = ({ summary }) => (
  <section
    aria-label="比賽資訊"
    className="mb-12 border-y border-neutral-200 py-6 md:mb-14 md:py-8"
  >
    {summary.competitionLabel && (
      <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue md:mb-6">
        {summary.competitionLabel}
      </p>
    )}

    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-6">
      <p className="[text-wrap:balance] text-right font-display text-[15px] font-bold leading-tight text-brand-black md:text-[20px]">
        {summary.homeTeam}
      </p>
      <p className="whitespace-nowrap font-display text-[34px] font-black leading-none tracking-tight text-brand-black md:text-[48px]">
        {summary.homeScore}
        <span className="mx-2 text-neutral-300 md:mx-3">–</span>
        {summary.awayScore}
      </p>
      <p className="[text-wrap:balance] text-left font-display text-[15px] font-bold leading-tight text-brand-black md:text-[20px]">
        {summary.awayTeam}
      </p>
    </div>

    {summary.headline && (
      <p className="mx-auto mt-5 max-w-2xl text-center text-[13px] font-medium leading-relaxed text-neutral-500 md:mt-6 md:text-[15px]">
        {summary.headline}
      </p>
    )}
  </section>
);

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const article = useMemo(() => (id ? getNewsArticle(id) : null), [id]);

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
  const parsedContent = parseArticleContent(contentText, article.category);

  return (
    <article className="min-h-screen bg-white pb-28 pt-10 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 md:px-8">
        <div className="mb-6 md:mb-9">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-[11px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand-black md:text-[12px]"
          >
            <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
            返回最新消息
          </Link>
        </div>

        <header className="mb-10 flex flex-col items-start text-left md:mb-14">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 md:mb-7">
            <span
              className={`rounded-sm px-2 py-1 text-[11px] font-bold tracking-[0.1em] ${getBadgeStyle(
                article.category,
              )}`}
            >
              {CATEGORY_META[article.category].label}
            </span>
            <span className="font-mono text-[11px] tracking-wider text-neutral-400">
              {formatTaipeiDate(article.timestamp, '.')}
            </span>
            {seasonLabel && (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">
                {seasonLabel}
              </span>
            )}
          </div>

          <h1 className="mb-5 max-w-[820px] font-display text-[30px] font-bold leading-[1.16] tracking-[-0.02em] text-neutral-950 [text-wrap:balance] md:mb-6 md:text-[44px]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="max-w-2xl text-[14px] font-medium leading-[1.85] text-neutral-500 md:text-[16px]">
              {article.summary}
            </p>
          )}

          <div className="mt-7 h-[2px] w-12 bg-brand-blue md:mt-8" />
        </header>

        {article.imageUrl && (
          <figure className="mb-10 md:mb-14">
            <div className="w-full overflow-hidden bg-neutral-100">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="block h-auto w-full"
              />
            </div>
          </figure>
        )}

        <div className="mx-auto max-w-[680px]">
          {parsedContent.matchSummary && <MatchScorePanel summary={parsedContent.matchSummary} />}
          <ArticleBody blocks={parsedContent.bodyBlocks} />
        </div>

        <footer className="mx-auto mt-20 flex max-w-[680px] items-center justify-between gap-6 border-t border-neutral-200 pt-7 md:mt-24">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            返回全部消息
          </Link>
          <img
            src="https://cdn.store-assets.com/s/783745/f/16299215.png"
            alt="D LEAGUE"
            className="h-auto w-10 object-contain opacity-25 grayscale"
          />
        </footer>
      </div>
    </article>
  );
};

export default ArticleDetailPage;
