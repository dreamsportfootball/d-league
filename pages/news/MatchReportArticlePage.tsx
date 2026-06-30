import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeasonConfig } from '../../config/seasons';
import type { NewsArticle } from '../../types';
import { formatTaipeiDate } from '../../utils/dateFormat';

interface MatchReportArticlePageProps {
  article: NewsArticle;
}

type MatchReportContent = {
  competitionLabel: string | null;
  paragraphs: string[];
};

const SCORE_LINE_PATTERN = /^(.+?)\s+\d+\s*[-–—]\s*\d+\s+(.+)$/;
const MOMENT_PATTERN =
  /^(開賽第\s*\d+\s*分鐘|第\s*\d+\s*分鐘|下半場第\s*\d+\s*分鐘|上半場尾聲|半場前|下半場開始後|進入下半場後|比賽後段|比賽最後階段|終場前|最終)([，,:：]?)/;

const parseMatchReport = (text: string): MatchReportContent => {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const competitionIndex = blocks.findIndex(
    (block) => /^D LEAGUE\s*[｜|]/i.test(block) && /第\s*\d+\s*輪/.test(block),
  );
  const scoreIndex = blocks.findIndex((block) => SCORE_LINE_PATTERN.test(block.replace(/\s+/g, ' ')));
  const headlineIndex = scoreIndex >= 0 ? scoreIndex + 1 : -1;
  const competitionLabel =
    competitionIndex >= 0
      ? blocks[competitionIndex].replace(/^D LEAGUE\s*[｜|]\s*/i, '').trim()
      : null;

  const paragraphs = blocks.filter((block, index) => {
    if (/^【.+】$/.test(block)) return false;
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

const MatchParagraph: React.FC<{ text: string }> = ({ text }) => {
  const match = text.match(MOMENT_PATTERN);

  if (!match) {
    return <p className="mb-7 whitespace-pre-line md:mb-8">{text}</p>;
  }

  const lead = `${match[1]}${match[2] ?? ''}`;
  const remainder = text.slice(match[0].length);

  return (
    <p className="mb-7 whitespace-pre-line md:mb-8">
      <strong className="font-semibold text-neutral-950">{lead}</strong>
      {remainder}
    </p>
  );
};

const MatchReportArticlePage: React.FC<MatchReportArticlePageProps> = ({ article }) => {
  const parsed = useMemo(
    () => parseMatchReport(article.content || article.summary || ''),
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
            <span className="rounded-sm bg-brand-accent px-2 py-1 text-[11px] font-bold tracking-[0.1em] text-brand-black">
              賽事戰報
            </span>
            {seasonLabel && (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">
                {seasonLabel}
              </span>
            )}
            {parsed.competitionLabel && (
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">
                {parsed.competitionLabel}
              </span>
            )}
            <span className="font-mono text-[11px] tracking-wider text-neutral-400">
              {formatTaipeiDate(article.timestamp, '.')}
            </span>
          </div>

          <h1 className="max-w-[840px] font-display text-[31px] font-bold leading-[1.15] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[46px]">
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
          {parsed.paragraphs.map((paragraph, index) => (
            <MatchParagraph key={`${index}-${paragraph.slice(0, 24)}`} text={paragraph} />
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

export default MatchReportArticlePage;
