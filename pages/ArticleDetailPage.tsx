import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getNewsArticle } from '../services/seasonDataJson';
import type { NewsArticle } from '../types';
import { formatTaipeiDate } from '../utils/dateFormat';

const splitArticleBlocks = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

const isDecorativeLabel = (block: string): boolean => /^【.+】$/.test(block);

const MATCH_MOMENT_PATTERN =
  /^(開賽第\s*\d+\s*分鐘|第\s*\d+\s*分鐘|下半場第\s*\d+\s*分鐘|上半場尾聲|半場前|下半場開始後|進入下半場後|比賽後段|比賽最後階段|終場前|最終)([，,:：]?)/;

interface MatchReportContent {
  competitionLabel: string | null;
  paragraphs: string[];
}

const parseMatchReport = (text: string): MatchReportContent => {
  const blocks = splitArticleBlocks(text);
  const competitionIndex = blocks.findIndex(
    (block) => /^D LEAGUE\s*[｜|]/i.test(block) && /第\s*\d+\s*輪/.test(block),
  );
  const scoreIndex = blocks.findIndex((block) =>
    /^.+?\s+\d+\s*[-–—]\s*\d+\s+.+$/.test(block.replace(/\s+/g, ' ')),
  );
  const headlineIndex = scoreIndex >= 0 ? scoreIndex + 1 : -1;
  const competitionLabel =
    competitionIndex >= 0
      ? blocks[competitionIndex].replace(/^D LEAGUE\s*[｜|]\s*/i, '').trim()
      : null;

  const paragraphs = blocks.filter((block, index) => {
    if (isDecorativeLabel(block)) return false;
    if (index === competitionIndex || index === scoreIndex) return false;
    if (
      index === headlineIndex &&
      block.length <= 72 &&
      !block.includes('\n') &&
      !/^(賽前|開賽|第\s*\d+|上半場|半場|下半場|進入下半場|比賽|終場|最終)/.test(block)
    ) {
      return false;
    }
    return true;
  });

  return { competitionLabel, paragraphs };
};

const MatchParagraph: React.FC<{ text: string; isLead: boolean }> = ({ text, isLead }) => {
  const match = text.match(MATCH_MOMENT_PATTERN);
  const baseClass = isLead
    ? 'mb-8 whitespace-pre-line text-[16px] font-medium leading-[1.95] text-neutral-900 md:text-[18px]'
    : 'mb-7 whitespace-pre-line text-[15px] font-normal leading-[1.95] text-neutral-700 md:mb-8 md:text-[16px] md:leading-[2]';

  if (!match) return <p className={baseClass}>{text}</p>;

  const lead = `${match[1]}${match[2] ?? ''}`;
  const remainder = text.slice(match[0].length);

  return (
    <p className={baseClass}>
      <strong className="font-semibold text-neutral-950">{lead}</strong>
      {remainder}
    </p>
  );
};

const ArticleBackLink: React.FC = () => (
  <Link
    to="/news"
    className="group inline-flex min-h-11 items-center text-[11px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand-black md:text-[12px]"
  >
    <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
    返回最新消息
  </Link>
);

const ArticleFooter: React.FC = () => (
  <footer className="mx-auto mt-16 flex max-w-[660px] items-center justify-between border-t border-neutral-200 pt-5 md:mt-20">
    <ArticleBackLink />
    <img
      src="https://cdn.store-assets.com/s/783745/f/16299215.png"
      alt="D LEAGUE"
      className="h-auto w-9 object-contain opacity-20 grayscale"
    />
  </footer>
);

const OfficialArticle: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const paragraphs = useMemo(
    () =>
      splitArticleBlocks(article.content || article.summary || '').filter(
        (block) => !isDecorativeLabel(block),
      ),
    [article.content, article.summary],
  );
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 md:px-8">
        <div className="mb-6 md:mb-9">
          <ArticleBackLink />
        </div>

        {article.imageUrl && (
          <figure className="mb-8 md:mb-10">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="block h-auto w-full bg-neutral-100"
            />
          </figure>
        )}

        <div className="mx-auto max-w-[720px]">
          <header className="mb-8 border-b border-neutral-200 pb-8 md:mb-10 md:pb-10">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold tracking-[0.12em]">
              <span className="text-brand-blue">官方公告</span>
              {seasonLabel && <span className="text-neutral-500">{seasonLabel}</span>}
              <span className="font-mono font-normal tracking-wider text-neutral-400">
                {formatTaipeiDate(article.timestamp, '.')}
              </span>
            </div>

            <h1 className="font-display text-[30px] font-bold leading-[1.16] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[44px]">
              {article.title}
            </h1>

            {article.summary && (
              <p className="mt-5 text-[15px] font-medium leading-[1.8] text-neutral-500 md:text-[17px]">
                {article.summary}
              </p>
            )}
          </header>

          <div className="max-w-[660px] text-left text-[15px] font-normal leading-[1.95] text-neutral-700 md:text-[16px] md:leading-[2]">
            {paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`} className="mb-7 whitespace-pre-line md:mb-8">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <ArticleFooter />
      </div>
    </article>
  );
};

const MatchReportArticle: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const parsed = useMemo(
    () => parseMatchReport(article.content || article.summary || ''),
    [article.content, article.summary],
  );
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 md:px-8">
        <div className="mb-6 md:mb-9">
          <ArticleBackLink />
        </div>

        <header className="mb-8 md:mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold tracking-[0.12em]">
            <span className="text-brand-blue">賽事戰報</span>
            {seasonLabel && <span className="text-neutral-500">{seasonLabel}</span>}
            {parsed.competitionLabel && (
              <span className="text-neutral-500">{parsed.competitionLabel}</span>
            )}
            <span className="font-mono font-normal tracking-wider text-neutral-400">
              {formatTaipeiDate(article.timestamp, '.')}
            </span>
          </div>

          <h1 className="max-w-[840px] font-display text-[31px] font-bold leading-[1.14] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[46px]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mt-5 max-w-3xl text-[15px] font-medium leading-[1.8] text-neutral-500 md:text-[17px]">
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

        <div className="mx-auto max-w-[660px] text-left">
          {parsed.paragraphs.map((paragraph, index) => (
            <MatchParagraph
              key={`${index}-${paragraph.slice(0, 24)}`}
              text={paragraph}
              isLead={index === 0}
            />
          ))}
        </div>

        <ArticleFooter />
      </div>
    </article>
  );
};

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const article = useMemo(() => (id ? getNewsArticle(id) : null), [id]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white px-6 pt-32 text-center">
        <h1 className="mb-4 text-xl font-medium tracking-widest text-neutral-900">文章不存在</h1>
        <p className="mb-6 text-sm text-neutral-400">此文章可能已移除或網址不正確</p>
        <ArticleBackLink />
      </div>
    );
  }

  return article.category === 'Official' ? (
    <OfficialArticle article={article} />
  ) : (
    <MatchReportArticle article={article} />
  );
};

export default ArticleDetailPage;
