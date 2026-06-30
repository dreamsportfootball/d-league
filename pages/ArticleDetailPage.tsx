import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getAllNews, getNewsArticle } from '../services/seasonDataJson';
import type { NewsArticle } from '../types';
import { formatTaipeiDate } from '../utils/dateFormat';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

const getBadgeStyle = (category: NewsArticle['category']) =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black'
    : 'bg-brand-blue text-white';

type MatchArticleMeta = {
  competitionLabel: string | null;
  scoreLabel: string;
};

type ParsedArticleContent = {
  matchMeta: MatchArticleMeta | null;
  bodyBlocks: string[];
};

type EditorialBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string };

const splitArticleBlocks = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

const parseScoreLine = (
  block: string,
): { homeTeam: string; homeScore: string; awayScore: string; awayTeam: string } | null => {
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
  category: NewsArticle['category'],
): ParsedArticleContent => {
  const blocks = splitArticleBlocks(text);

  if (category !== 'Match Report') {
    return {
      matchMeta: null,
      bodyBlocks: blocks.filter((block) => !isDecorativeLabel(block)),
    };
  }

  const scoreIndex = blocks.findIndex((block) => parseScoreLine(block) !== null);
  const score = scoreIndex >= 0 ? parseScoreLine(blocks[scoreIndex]) : null;

  if (!score) {
    return {
      matchMeta: null,
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
  const hasStandaloneHeadline =
    headlineIndex < blocks.length && isLikelyMatchHeadline(blocks[headlineIndex]);

  const bodyBlocks = blocks.filter((block, index) => {
    if (isDecorativeLabel(block)) return false;
    if (index === competitionIndex || index === scoreIndex) return false;
    if (hasStandaloneHeadline && index === headlineIndex) return false;
    return true;
  });

  return {
    matchMeta: {
      competitionLabel,
      scoreLabel: `${score.homeTeam} ${score.homeScore}–${score.awayScore} ${score.awayTeam}`,
    },
    bodyBlocks,
  };
};

const MOMENT_LEAD_PATTERN =
  /^(開賽第\s*\d+\s*分鐘|第\s*\d+\s*分鐘|下半場第\s*\d+\s*分鐘|上半場尾聲|半場前|下半場開始後|進入下半場後|比賽後段|比賽最後階段|終場前|最終)([，,:：]?)/;

const buildEditorialBlocks = (
  blocks: string[],
  category: NewsArticle['category'],
): EditorialBlock[] => {
  if (category !== 'Match Report') {
    return blocks.map((block) => {
      const isHeading =
        block.length <= 34 &&
        !block.includes('\n') &&
        !/[。！？；，,]/.test(block);

      return isHeading
        ? { type: 'heading' as const, text: block }
        : { type: 'paragraph' as const, text: block };
    });
  }

  const editorialBlocks: EditorialBlock[] = [];
  let hasPreMatchHeading = false;
  let hasMatchFlowHeading = false;
  let hasSecondHalfHeading = false;
  let hasResultHeading = false;

  blocks.forEach((block) => {
    if (!hasPreMatchHeading && /^賽前/.test(block)) {
      editorialBlocks.push({ type: 'heading', text: '賽前形勢' });
      hasPreMatchHeading = true;
    } else if (
      !hasMatchFlowHeading &&
      /^(開賽|第\s*\d+\s*分鐘|上半場|半場前)/.test(block)
    ) {
      editorialBlocks.push({ type: 'heading', text: '比賽進程' });
      hasMatchFlowHeading = true;
    } else if (!hasSecondHalfHeading && /^(下半場|進入下半場)/.test(block)) {
      editorialBlocks.push({ type: 'heading', text: '下半場' });
      hasSecondHalfHeading = true;
    } else if (!hasResultHeading && /^(最終|終場)/.test(block)) {
      editorialBlocks.push({ type: 'heading', text: '最終結果' });
      hasResultHeading = true;
    }

    editorialBlocks.push({ type: 'paragraph', text: block });
  });

  return editorialBlocks;
};

const ArticleParagraph: React.FC<{ text: string }> = ({ text }) => {
  const momentMatch = text.match(MOMENT_LEAD_PATTERN);

  if (!momentMatch) {
    return <p className="mb-7 whitespace-pre-line md:mb-8">{text}</p>;
  }

  const lead = `${momentMatch[1]}${momentMatch[2] ?? ''}`;
  const remainder = text.slice(momentMatch[0].length);

  return (
    <p className="mb-7 whitespace-pre-line md:mb-8">
      <strong className="font-semibold text-neutral-950">{lead}</strong>
      {remainder}
    </p>
  );
};

const ArticleBody: React.FC<{
  blocks: string[];
  category: NewsArticle['category'];
}> = ({ blocks, category }) => {
  const editorialBlocks = useMemo(
    () => buildEditorialBlocks(blocks, category),
    [blocks, category],
  );

  if (editorialBlocks.length === 0) return null;

  return (
    <div className="text-left text-[15px] font-normal leading-[1.95] tracking-[0.005em] text-neutral-700 md:text-[16px] md:leading-[2]">
      {editorialBlocks.map((block, index) =>
        block.type === 'heading' ? (
          <h2
            key={`${index}-${block.text}`}
            className="mb-5 mt-11 font-display text-[22px] font-bold leading-tight tracking-[-0.01em] text-brand-black first:mt-0 md:mb-6 md:mt-14 md:text-[27px]"
          >
            <span className="mr-3 inline-block h-[3px] w-7 translate-y-[-0.18em] bg-brand-blue" />
            {block.text}
          </h2>
        ) : (
          <ArticleParagraph key={`${index}-${block.text.slice(0, 24)}`} text={block.text} />
        ),
      )}
    </div>
  );
};

const MatchMetaLine: React.FC<{ meta: MatchArticleMeta }> = ({ meta }) => (
  <div className="mb-10 border-y border-neutral-200 py-4 md:mb-12 md:py-5">
    <div className="flex flex-col gap-1.5 text-[12px] font-bold tracking-wide sm:flex-row sm:items-center sm:gap-3 md:text-[13px]">
      {meta.competitionLabel && (
        <span className="uppercase tracking-[0.14em] text-brand-blue">
          {meta.competitionLabel}
        </span>
      )}
      {meta.competitionLabel && <span className="hidden text-neutral-300 sm:inline">｜</span>}
      <span className="font-display text-[15px] tracking-normal text-brand-black md:text-[17px]">
        {meta.scoreLabel}
      </span>
    </div>
  </div>
);

const getRelatedArticles = (article: NewsArticle): NewsArticle[] =>
  getAllNews()
    .filter((candidate) => candidate.id !== article.id)
    .sort((a, b) => {
      const aSeasonScore = a.seasonId === article.seasonId ? 1 : 0;
      const bSeasonScore = b.seasonId === article.seasonId ? 1 : 0;
      if (aSeasonScore !== bSeasonScore) return bSeasonScore - aSeasonScore;

      const aCategoryScore = a.category === article.category ? 1 : 0;
      const bCategoryScore = b.category === article.category ? 1 : 0;
      if (aCategoryScore !== bCategoryScore) return bCategoryScore - aCategoryScore;

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, 2);

const RelatedArticleLink: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <Link
    to={`/news/${article.id}`}
    className="group grid grid-cols-[92px_minmax(0,1fr)] gap-4 border-t border-neutral-200 py-5 first:border-t-0 sm:grid-cols-[120px_minmax(0,1fr)] md:gap-5"
  >
    <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
    </div>
    <div className="min-w-0 self-center">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
        <span className="text-brand-blue">{CATEGORY_META[article.category].label}</span>
        <span className="text-neutral-300">/</span>
        <span className="font-mono tracking-normal text-neutral-400">
          {formatTaipeiDate(article.timestamp, '.')}
        </span>
      </div>
      <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug tracking-[-0.01em] text-brand-black transition-colors group-hover:text-brand-blue md:text-[20px]">
        {article.title}
      </h3>
      <span className="mt-3 hidden items-center text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 transition-colors group-hover:text-brand-blue sm:inline-flex">
        閱讀文章
        <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </Link>
);

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const article = useMemo(() => (id ? getNewsArticle(id) : null), [id]);
  const relatedArticles = useMemo(
    () => (article ? getRelatedArticles(article) : []),
    [article],
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
  const parsedContent = parseArticleContent(contentText, article.category);

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 md:px-8">
        <div className="mb-5 md:mb-8">
          <Link
            to="/news"
            className="group inline-flex min-h-11 items-center text-[11px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand-black md:text-[12px]"
          >
            <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
            返回最新消息
          </Link>
        </div>

        <header className="mb-9 max-w-4xl md:mb-12">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 md:mb-7">
            <span
              className={`rounded-sm px-2 py-1 text-[11px] font-bold tracking-[0.1em] ${getBadgeStyle(
                article.category,
              )}`}
            >
              {CATEGORY_META[article.category].label}
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

          <h1 className="mb-5 max-w-[900px] font-display text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:mb-7 md:text-[50px]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="max-w-3xl text-[15px] font-medium leading-[1.8] text-neutral-500 md:text-[18px] md:leading-[1.75]">
              {article.summary}
            </p>
          )}
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

        <div className="mx-auto max-w-[700px]">
          {parsedContent.matchMeta && <MatchMetaLine meta={parsedContent.matchMeta} />}
          <ArticleBody blocks={parsedContent.bodyBlocks} category={article.category} />
        </div>

        <footer className="mx-auto mt-20 max-w-[700px] border-t-2 border-brand-black pt-7 md:mt-24 md:pt-9">
          {relatedArticles.length > 0 && (
            <section aria-labelledby="related-news-title">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
                    More from D League
                  </p>
                  <h2
                    id="related-news-title"
                    className="font-display text-[25px] font-bold tracking-[-0.02em] text-brand-black md:text-[30px]"
                  >
                    相關消息
                  </h2>
                </div>
                <Link
                  to="/news"
                  className="inline-flex min-h-11 items-center text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 transition-colors hover:text-brand-blue"
                >
                  全部消息
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>

              <div>
                {relatedArticles.map((relatedArticle) => (
                  <RelatedArticleLink key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-5">
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
          </div>
        </footer>
      </div>
    </article>
  );
};

export default ArticleDetailPage;
