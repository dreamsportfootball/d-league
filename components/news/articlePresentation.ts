import { getSeasonConfig } from '../../config/seasons';
import type { NewsArticle } from '../../types';

export const ARTICLE_CATEGORY_META: Record<
  NewsArticle['category'],
  {
    label: string;
    shortLabel: string;
    eyebrow: string;
    className: string;
  }
> = {
  Official: {
    label: '官方公告',
    shortLabel: '公告',
    eyebrow: 'Official',
    className: 'bg-brand-blue text-white',
  },
  'Match Report': {
    label: '賽事戰報',
    shortLabel: '戰報',
    eyebrow: 'Match Report',
    className: 'bg-brand-accent text-brand-black',
  },
};

export const getArticleSeasonLabel = (article: NewsArticle): string | null =>
  article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

export const getArticlePath = (article: NewsArticle): string => `/news/${article.id}`;

export const getArticleKey = (article: NewsArticle): string =>
  `${article.seasonId ?? 'global'}-${article.id}`;

export const sortArticlesByNewest = (articles: NewsArticle[]): NewsArticle[] =>
  [...articles].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

export const getArticleImageFitClass = (article: NewsArticle): string =>
  article.category === 'Official' ? 'object-contain' : 'object-cover';
