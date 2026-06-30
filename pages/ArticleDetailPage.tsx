import React, { useMemo, useState } from 'react';
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

const splitBlockLines = (block: string): string[] =>
  block
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeComparableText = (text: string): string =>
  text
    .replace(/[【】｜|⚽️！!，,。．：:（）()\-–—\s]/g, '')
    .toLowerCase();

const isDecorativeMatchLabel = (line: string): boolean =>
  /^【.*賽後戰報.*】$/.test(line) || /^賽後戰報/.test(line);

const isCompetitionLine = (line: string): boolean =>
  /^D LEAGUE\s*[｜|]/i.test(line) && /(第\s*\d+\s*輪|L[123])/i.test(line);

const isScoreLine = (line: string): boolean =>
  /^.+?\s+\d+\s*[-–—]\s*\d+\s+.+$/.test(line.replace(/\s+/g, ' '));

const MATCH_MOMENT_PATTERN =
  /^(開賽第\s*\d+\s*分鐘|開場第\s*\d+\s*分鐘|第\s*\d+\s*分鐘|下半場第\s*\d+\s*分鐘|下半場開賽僅\s*\d+\s*分鐘|上半場尾聲|半場前|下半場開始後|進入下半場後|比賽進入第\s*\d+\s*分鐘|比賽後段|比賽最後階段|比賽尾聲第\s*\d+\s*分鐘|終場前|最終)([，,:：]?)/;

interface MatchReportContent {
  competitionLabel: string | null;
  paragraphs: string[];
}

const parseMatchReport = (article: NewsArticle): MatchReportContent => {
  const titleKey = normalizeComparableText(article.title);
  let competitionLabel: string | null = null;

  const paragraphs = splitArticleBlocks(article.content || article.summary || '')
    .map((block) => {
      const remainingLines = splitBlockLines(block).filter((line) => {
        if (isDecorativeMatchLabel(line)) return false;

        if (isCompetitionLine(line)) {
          competitionLabel = line.replace(/^D LEAGUE\s*[｜|]\s*/i, '').trim();
          return false;
        }

        if (isScoreLine(line)) return false;
        return true;
      });

      return remainingLines.join('\n').trim();
    })
    .filter(Boolean)
    .filter((block) => {
      const blockKey = normalizeComparableText(block);
      if (!blockKey || block.length > 80 || block.includes('\n')) return true;
      return !(titleKey.includes(blockKey) || blockKey.includes(titleKey));
    });

  return { competitionLabel, paragraphs };
};

const cleanOfficialBlocks = (article: NewsArticle): string[] => {
  const titleKey = normalizeComparableText(article.title);

  return splitArticleBlocks(article.content || article.summary || '').filter((block, index) => {
    if (index > 1 || block.includes('\n') || block.length > 60) return true;

    const blockKey = normalizeComparableText(block);
    if (!blockKey) return false;
    return !(titleKey.includes(blockKey) || blockKey.includes(titleKey));
  });
};

type ImageShape = 'unknown' | 'portrait' | 'square' | 'landscape';

interface ArticleImageProps {
  article: NewsArticle;
}

const ArticleImage: React.FC<ArticleImageProps> = ({ article }) => {
  const [shape, setShape] = useState<ImageShape>('unknown');

  if (!article.imageUrl) return null;

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;
    if (ratio < 0.82) setShape('portrait');
    else if (ratio > 1.25) setShape('landscape');
    else setShape('square');
  };

  const isOfficial = article.category === 'Official';
  const widthClass =
    shape === 'portrait'
      ? isOfficial
        ? 'max-w-[460px]'
        : 'max-w-[520px]'
      : shape === 'square'
        ? isOfficial
          ? 'max-w-[560px]'
          : 'max-w-[620px]'
        : isOfficial
          ? 'max-w-[700px]'
          : 'max-w-[760px]';

  const imageClass =
    shape === 'portrait'
      ? 'mx-auto block h-auto max-h-[68vh] w-auto max-w-full object-contain md:max-h-[680px]'
      : 'block h-auto w-full object-contain';

  return (
    <figure className={`mx-auto mb-10 w-full md:mb-14 ${widthClass}`}>
      <div className={isOfficial ? 'border border-neutral-200 bg-neutral-50' : 'bg-neutral-100'}>
        <img
          src={article.imageUrl}
          alt={article.title}
          onLoad={handleLoad}
          className={imageClass}
        />
      </div>
    </figure>
  );
};

interface ArticleMetaProps {
  article: NewsArticle;
  competitionLabel?: string | null;
}

const ArticleMeta: React.FC<ArticleMetaProps> = ({ article, competitionLabel }) => {
  const seasonLabel = article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;
  const categoryLabel = article.category === 'Official' ? '官方公告' : '賽事戰報';

  return (
    <div className="mb-5 flex items-stretch gap-3 md:mb-6">
      <span className="w-[3px] shrink-0 bg-brand-blue" aria-hidden="true" />
      <div>
        <p className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-brand-black md:text-[13px]">
          D LEAGUE / {categoryLabel}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold tracking-[0.1em] text-neutral-400 md:text-[11px]">
          {seasonLabel && <span>{seasonLabel}</span>}
          {competitionLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{competitionLabel}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={article.timestamp} className="font-mono tracking-wider">
            {formatTaipeiDate(article.timestamp, '.')}
          </time>
        </div>
      </div>
    </div>
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
  <footer className="mx-auto mt-16 flex max-w-[660px] items-end justify-between gap-6 border-t border-neutral-200 pt-5 md:mt-20">
    <ArticleBackLink />
    <div className="shrink-0 text-right font-display text-[10px] font-bold leading-[1.15] tracking-[0.18em] text-neutral-300 md:text-[11px]">
      <p>DREAM IT</p>
      <p className="text-brand-blue/50">PLAY IT</p>
    </div>
  </footer>
);

const isScheduleBlock = (lines: string[]): boolean =>
  lines.length >= 2 && lines.every((line) => /^\d{1,2}:\d{2}\s+/.test(line));

const isBulletListBlock = (lines: string[]): boolean =>
  lines.length >= 2 && lines.every((line) => /^(▸|•|🥇|🥈|🥉)/.test(line));

const isBracketHeading = (line: string): boolean => /^【.+】$/.test(line);

const isStandaloneOfficialHeading = (block: string): boolean => {
  const lines = splitBlockLines(block);
  if (lines.length !== 1 || block.length > 34 || /[。；]/.test(block)) return false;

  return (
    isBracketHeading(block) ||
    /^(🏆|🎯|⚠️|📅|📢|最終戰|LAST TWO)/.test(block)
  );
};

const OfficialSchedule: React.FC<{ lines: string[] }> = ({ lines }) => (
  <div className="mb-9 border-y border-neutral-200 py-2 md:mb-10">
    {lines.map((line) => {
      const match = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
      if (!match) return null;

      return (
        <div
          key={line}
          className="grid grid-cols-[58px_minmax(0,1fr)] gap-4 border-b border-neutral-100 py-3.5 last:border-b-0 md:grid-cols-[70px_minmax(0,1fr)]"
        >
          <span className="font-display text-[16px] font-bold text-brand-blue md:text-[18px]">
            {match[1]}
          </span>
          <span className="self-center text-[14px] font-medium leading-relaxed text-neutral-800 md:text-[15px]">
            {match[2]}
          </span>
        </div>
      );
    })}
  </div>
);

const OfficialBlock: React.FC<{ block: string }> = ({ block }) => {
  const lines = splitBlockLines(block);

  if (block === '-') {
    return <div className="my-9 h-px w-10 bg-neutral-300" aria-hidden="true" />;
  }

  if (isScheduleBlock(lines)) return <OfficialSchedule lines={lines} />;

  if (lines.length > 1 && isBracketHeading(lines[0])) {
    return (
      <section className="mb-9 md:mb-10">
        <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.01em] text-brand-black md:text-[22px]">
          {lines[0].slice(1, -1)}
        </h2>
        <div className="border-y border-neutral-200 py-2">
          {lines.slice(1).map((line) => (
            <p
              key={line}
              className="border-b border-neutral-100 py-2.5 text-[14px] font-medium text-neutral-700 last:border-b-0 md:text-[15px]"
            >
              {line}
            </p>
          ))}
        </div>
      </section>
    );
  }

  if (isStandaloneOfficialHeading(block)) {
    return (
      <h2 className="mb-5 mt-10 font-display text-[20px] font-bold leading-tight tracking-[-0.01em] text-brand-black first:mt-0 md:text-[23px]">
        {isBracketHeading(block) ? block.slice(1, -1) : block}
      </h2>
    );
  }

  if (isBulletListBlock(lines)) {
    return (
      <ul className="mb-9 space-y-3 border-l-2 border-brand-blue pl-5 md:mb-10">
        {lines.map((line) => (
          <li key={line} className="text-[14px] font-medium leading-relaxed text-neutral-700 md:text-[15px]">
            {line}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mb-7 whitespace-pre-line text-[15px] font-normal leading-[1.95] text-neutral-700 md:mb-8 md:text-[16px] md:leading-[2]">
      {block}
    </p>
  );
};

const OfficialArticle: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const blocks = useMemo(() => cleanOfficialBlocks(article), [article]);

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 md:px-8">
        <div className="mb-6 md:mb-9">
          <ArticleBackLink />
        </div>

        <header className="mx-auto mb-9 max-w-[760px] md:mb-12">
          <ArticleMeta article={article} />
          <h1 className="font-display text-[31px] font-bold leading-[1.14] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[46px]">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mt-5 max-w-[700px] text-[15px] font-medium leading-[1.8] text-neutral-500 md:mt-6 md:text-[17px]">
              {article.summary}
            </p>
          )}
        </header>

        <ArticleImage article={article} />

        <div className="mx-auto max-w-[660px] text-left">
          {blocks.map((block, index) => (
            <OfficialBlock key={`${index}-${block.slice(0, 24)}`} block={block} />
          ))}
        </div>

        <ArticleFooter />
      </div>
    </article>
  );
};

const MatchParagraph: React.FC<{ text: string; isFirst: boolean }> = ({ text, isFirst }) => {
  const match = text.match(MATCH_MOMENT_PATTERN);
  const paragraphClass = isFirst
    ? 'mb-8 whitespace-pre-line text-[15px] font-medium leading-[1.95] text-neutral-800 md:text-[16px] md:leading-[2]'
    : 'mb-7 whitespace-pre-line text-[15px] font-normal leading-[1.95] text-neutral-700 md:mb-8 md:text-[16px] md:leading-[2]';

  if (!match) return <p className={paragraphClass}>{text}</p>;

  const lead = `${match[1]}${match[2] ?? ''}`;
  const remainder = text.slice(match[0].length);

  return (
    <p className={paragraphClass}>
      <strong className="font-semibold text-neutral-950">{lead}</strong>
      {remainder}
    </p>
  );
};

const MatchReportArticle: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const parsed = useMemo(() => parseMatchReport(article), [article]);

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 md:px-8">
        <div className="mb-6 md:mb-9">
          <ArticleBackLink />
        </div>

        <header className="mx-auto mb-9 max-w-[820px] md:mb-12">
          <ArticleMeta article={article} competitionLabel={parsed.competitionLabel} />
          <h1 className="font-display text-[31px] font-bold leading-[1.13] tracking-[-0.025em] text-neutral-950 [text-wrap:balance] md:text-[47px]">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mt-5 max-w-[740px] text-[15px] font-medium leading-[1.8] text-neutral-500 md:mt-6 md:text-[17px]">
              {article.summary}
            </p>
          )}
        </header>

        <ArticleImage article={article} />

        <div className="mx-auto max-w-[660px] text-left">
          {parsed.paragraphs.map((paragraph, index) => (
            <MatchParagraph
              key={`${index}-${paragraph.slice(0, 24)}`}
              text={paragraph}
              isFirst={index === 0}
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
