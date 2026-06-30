import React from 'react';
import type { NewsArticle } from '../../types';
import { formatTaipeiDate } from '../../utils/dateFormat';
import { ARTICLE_CATEGORY_META, getArticleSeasonLabel } from './articlePresentation';

interface ArticleCategoryLabelProps {
  category: NewsArticle['category'];
  compact?: boolean;
}

export const ArticleCategoryLabel: React.FC<ArticleCategoryLabelProps> = ({
  category,
  compact = false,
}) => {
  const meta = ARTICLE_CATEGORY_META[category];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-sm font-black uppercase leading-none tracking-[0.14em] ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]'
      } ${meta.className}`}
    >
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
};

interface ArticleMetaProps {
  article: NewsArticle;
  compact?: boolean;
  className?: string;
}

const ArticleMeta: React.FC<ArticleMetaProps> = ({ article, compact = false, className = '' }) => {
  const seasonLabel = getArticleSeasonLabel(article);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}
      aria-label="文章資訊"
    >
      <ArticleCategoryLabel category={article.category} compact={compact} />
      {seasonLabel && (
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-blue md:text-[11px]">
          {seasonLabel} 賽季
        </span>
      )}
      <time
        dateTime={article.timestamp}
        className="font-mono text-[10px] font-medium tracking-[0.08em] text-neutral-400 md:text-[11px]"
      >
        {formatTaipeiDate(article.timestamp, '.')}
      </time>
    </div>
  );
};

export default ArticleMeta;
