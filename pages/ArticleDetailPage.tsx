import React, { Fragment, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Standings from '../components/Standings';
import { getSeasonConfig } from '../config/seasons';
import { assetUrl, getNewsArticle, getSeasonData } from '../services/seasonDataJson';
import type { LeagueId } from '../types/season';
import { formatTaipeiDate } from '../utils/dateFormat';

const CATEGORY_META = {
  'Match Report': { label: '賽事戰報' },
  Official: { label: '官方公告' },
} as const;

const getBadgeStyle = (category: 'Match Report' | 'Official') =>
  category === 'Match Report'
    ? 'bg-brand-accent text-brand-black'
    : 'bg-brand-blue text-white';

const renderArticleTitle = (title: string): React.ReactNode => {
  const separatorIndex = title.indexOf('｜');
  if (separatorIndex === -1 || separatorIndex === title.length - 1) return title;

  const prefix = title.slice(0, separatorIndex + 1);
  const suffix = title.slice(separatorIndex + 1);

  return (
    <>
      <span className="whitespace-nowrap">{prefix}</span>
      <wbr />
      <span className="whitespace-nowrap">{suffix}</span>
    </>
  );
};

type ArticleContentBlock =
  | { type: 'label'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'info'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string }
  | { type: 'credit'; text: string };

type GalleryItem = {
  src: string;
  alt: string;
  aspectRatio?: '4/3' | '16/9' | '1124/1458';
};

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

  if (category === 'Match Report' && /^Photo credit\s+@\S+$/i.test(text)) {
    return { type: 'credit', text };
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

  // A score mentioned inside prose (e.g. "最終以 8-0 收下開季首勝")
  // must never turn an entire paragraph into a highlighted match-info card.
  const looksLikeMatchInfo =
    category === 'Match Report' &&
    lines.length >= 2 &&
    lines.length <= 4 &&
    lines[0].startsWith('D LEAGUE｜') &&
    lines.slice(1).some((line) => /^\S.+\s+\d+\s*[-–]\s*\d+\s+\S.+$/.test(line));

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
  <blockquote
    className="border-l-[3px] border-brand-blue pl-5 md:pl-7"
    aria-label="文章重點"
  >
    <p className="text-[18px] font-semibold leading-[1.75] text-neutral-700 md:text-[21px] md:leading-[1.7]">
      {text}
    </p>
  </blockquote>
);

const SponsorGalleryImage: React.FC<GalleryItem> = ({ src, alt, aspectRatio = '4/3' }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${
        aspectRatio === '16/9'
          ? 'aspect-video'
          : aspectRatio === '1124/1458'
            ? 'aspect-[1124/1458]'
            : 'aspect-[4/3]'
      }`}
    >
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold tracking-[0.08em] text-neutral-400">
          照片上傳後顯示
        </div>
      )}
    </div>
  );
};

const InlineArticleImage: React.FC<{ src: string; alt: string; whiteBackground?: boolean }> = ({ src, alt, whiteBackground = false }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <figure className={`my-10 aspect-[4/3] w-full overflow-hidden md:my-12 ${whiteBackground ? 'bg-white' : 'bg-neutral-100'}`}>
      <img
        src={src}
        alt={alt}
        width={1124}
        height={1458}
        loading="lazy"
        className="h-full w-full object-contain"
        onError={() => setHasError(true)}
      />
    </figure>
  );
};

const ArticleBody: React.FC<{
  text: string;
  category: 'Match Report' | 'Official';
  articleId?: string;
}> = ({ text, category, articleId }) => {
  const blocks = useMemo(() => {
    const parsedBlocks = text
      .replace(/\n(?=Photo credit\s+@)/gi, '\n\n')
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
    <div className="break-words text-left text-[16px] font-normal leading-[1.9] text-neutral-800 md:text-[17px] md:leading-[1.95]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'label') {
          const showEntesMatchBallImage =
            articleId === '2026-27-entes-match-ball-partner' && block.text === '【關於 ENTES】';

          return (
            <Fragment key={key}>
              {showEntesMatchBallImage && (
                <InlineArticleImage
                  src={assetUrl('assets/news/2026-27-entes-official-match-ball-1.jpg')}
                  alt="D LEAGUE 2026/27 ENTES 官方比賽用球"
                />
              )}
              <p className="mb-5 mt-10 font-display text-xs font-bold tracking-[0.18em] text-brand-blue first:mt-0">
                {block.text}
              </p>
            </Fragment>
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

        if (block.type === 'credit') {
          return (
            <p
              key={key}
              data-article-photo-credit
              className="mt-7 text-xs font-medium leading-relaxed tracking-[0.02em] text-neutral-500 md:text-sm"
            >
              {renderInlineText(block.text)}
            </p>
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

        const showEntesPartnershipImage =
          articleId === '2026-27-entes-match-ball-partner' &&
          block.type === 'paragraph' &&
          block.text.startsWith('感謝 ENTES');

        return (
          <Fragment key={key}>
            {showEntesPartnershipImage && (
              <InlineArticleImage
                src={assetUrl('assets/news/2026-27-entes-official-match-ball-2.png')}
                alt="ENTES × D LEAGUE 2026/27 官方比賽用球合作"
                whiteBackground
              />
            )}
            <p className="mb-7 last:mb-0">{renderMultilineText(block.text)}</p>
          </Fragment>
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
          <BackButton
            fallbackTo="/news"
            className="mt-7 inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          />
        </div>
      </main>
    );
  }

  const contentText = article.content || article.summary || '';
  const highlightText = article.highlight || article.summary;
  const reportSeason = article.seasonId ? getSeasonConfig(article.seasonId) : null;
  const seasonLabel = reportSeason?.shortName ?? null;
  // Prefer the match's confirmed report reference. Older articles may not have
  // that link, so fall back only when their text explicitly names an L1/L2/L3.
  const reportLeague: LeagueId | null = (() => {
    if (article.category !== 'Match Report' || !article.seasonId || !reportSeason) return null;
    const matches = getSeasonData(article.seasonId).matches;
    const match = matches.find((item) => item.reportArticleId === article.id);
    // Earlier seasons did not link their reports directly to match records.
    // Only use the exact legacy match ID or an explicit league label.
    const legacyMatchId = article.id.match(/^match-report-(m\d+)-\d{8}$/)?.[1];
    const legacyMatch = legacyMatchId ? matches.find((item) => item.id === legacyMatchId) : null;
    const sourceLeague = match?.league ??
      legacyMatch?.league ??
      (article.content + '\n' + article.summary).match(/D LEAGUE[｜\s]+(L[123])\b/)?.[1] ??
      article.title.match(/^(L[123])\b/)?.[1];
    return reportSeason.enabledLeagues.find((league) => league === sourceLeague) ?? null;
  })();
  const sponsorGallery: GalleryItem[] | null =
    article.id === '2026-27-chaome-tea-sponsor'
      ? [
          {
            src: assetUrl('assets/news/2026-27-chaome-tea-food-1.png'),
            alt: '超咩茶舖餐點照片 1',
          },
          {
            src: assetUrl('assets/news/2026-27-chaome-tea-food-2.png'),
            alt: '超咩茶舖餐點照片 2',
          },
        ]
      : null;

  return (
    <article className="min-h-screen bg-white pb-24 pt-8 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-6xl px-5 md:px-10 lg:px-12">
        <nav className="mb-8 md:mb-12" aria-label="文章導覽">
          <BackButton
            fallbackTo="/news"
            className="group inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-neutral-500 transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            iconClassName="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
          />
        </nav>

        <header className="border-b border-neutral-200 pb-9 md:pb-12">
          <div className="max-w-5xl lg:mx-auto lg:max-w-[920px]">
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
              {renderArticleTitle(article.title)}
            </h1>
          </div>
        </header>

        {article.imageUrl && (
          <figure className="mt-9 md:mt-12">
            <div className="flex min-h-[220px] w-full items-center justify-center overflow-hidden px-3 py-3 md:min-h-[360px] md:px-6 md:py-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-auto max-h-[760px] w-auto max-w-full object-contain"
              />
            </div>
          </figure>
        )}

        <div
          className={`mx-auto max-w-[720px] ${
            article.imageUrl ? 'mt-8 md:mt-10' : 'mt-9 md:mt-12'
          }`}
        >
          {highlightText && <ArticleHighlight text={highlightText} />}

          <section
            className={highlightText ? 'mt-10 md:mt-12' : undefined}
            aria-label="文章正文"
          >
            <ArticleBody text={contentText} category={article.category} articleId={article.id} />
          </section>

          {sponsorGallery && (
            <section
              className="mt-12 border-t border-neutral-200 pt-8 md:mt-14 md:pt-10"
              aria-label="店家餐點照片"
            >
              <div className="mb-5 md:mb-6">
                <p className="font-display text-xs font-bold tracking-[0.18em] text-brand-blue">
                  店家餐點
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-black md:text-[28px]">
                  超咩茶舖
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
                {sponsorGallery.map((item) => (
                  <SponsorGalleryImage key={item.src} {...item} />
                ))}
              </div>
            </section>
          )}

          {reportLeague && reportSeason && article.seasonId && (
            <section
              data-match-report-standings
              aria-label="戰報最新積分榜"
              className="mt-12 border-t border-neutral-200 pt-9 md:mt-16 md:pt-11"
            >
              <div className="mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
                <div>
                  <p className="mb-2 font-display text-[11px] font-bold tracking-[0.16em] text-brand-blue">
                    LEAGUE TABLE
                  </p>
                  <h2 className="font-display text-xl font-bold leading-snug text-brand-black md:text-2xl">
                    {seasonLabel} {reportLeague}｜{reportSeason.status === 'completed' ? '最終積分榜' : '最新積分榜'}
                  </h2>
                </div>
                <Link
                  to={`/standings?season=${article.seasonId}&league=${reportLeague}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  查看完整積分榜 <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <Standings league={reportLeague} seasonId={article.seasonId} variant="widget" />
              <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">
                {reportSeason.status === 'completed' ? '以該賽季最終賽果計算。' : '依官網目前已公布賽果計算，後續賽果更新時同步調整。'}
              </p>
            </section>
          )}
        </div>

        <footer className="mx-auto mt-16 max-w-[720px] border-t border-neutral-200 pt-7 md:mt-20">
          <BackButton
            fallbackTo="/news"
            className="group inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-brand-blue transition-colors hover:text-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            iconClassName="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
          />
        </footer>
      </div>
    </article>
  );
};

export default ArticleDetailPage;