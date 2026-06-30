import React from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NewsArticle } from '../../types';
import ArticleMeta from './ArticleMeta';
import {
  getArticleImageFitClass,
  getArticlePath,
} from './articlePresentation';

interface ArticleImageProps {
  article: NewsArticle;
  className?: string;
  sizes?: string;
  eager?: boolean;
}

const ArticleImage: React.FC<ArticleImageProps> = ({
  article,
  className = '',
  sizes,
  eager = false,
}) => (
  <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
    {article.imageUrl ? (
      <img
        src={article.imageUrl}
        alt={article.imageAlt ?? article.title}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        sizes={sizes}
        className={`h-full w-full ${getArticleImageFitClass(article)} transition-transform duration-500 ease-out group-hover:scale-[1.025]`}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
        <Newspaper className="h-10 w-10 text-neutral-300" />
      </div>
    )}
  </div>
);

interface ArticleCardProps {
  article: NewsArticle;
  variant?: 'featured' | 'standard' | 'compact';
}

const FeaturedArticleCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group grid overflow-hidden border-y border-neutral-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4 md:grid-cols-12"
  >
    <ArticleImage
      article={article}
      eager
      className="aspect-[16/10] md:col-span-7 md:aspect-auto md:min-h-[390px]"
      sizes="(min-width: 768px) 58vw, 100vw"
    />
    <div className="flex flex-col justify-center px-1 py-7 md:col-span-5 md:px-9 md:py-10 lg:px-12">
      <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
        最新焦點
      </p>
      <ArticleMeta article={article} />
      <h2 className="mt-5 font-display text-3xl font-black leading-[1.16] tracking-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-4xl lg:text-[42px]">
        {article.title}
      </h2>
      <p className="mt-5 line-clamp-3 max-w-xl text-sm font-medium leading-7 text-neutral-600 md:text-base">
        {article.summary}
      </p>
      <span className="mt-7 inline-flex min-h-11 items-center self-start text-xs font-black uppercase tracking-[0.18em] text-brand-blue">
        閱讀完整內容
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </div>
  </Link>
);

const StandardArticleCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group flex h-full flex-col border-t-2 border-brand-black pt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4"
  >
    <ArticleImage
      article={article}
      className="mb-5 aspect-[16/10]"
      sizes="(min-width: 1024px) 31vw, (min-width: 768px) 48vw, 100vw"
    />
    <ArticleMeta article={article} compact />
    <h3 className="mt-4 line-clamp-3 font-display text-xl font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-2xl">
      {article.title}
    </h3>
    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
      {article.summary}
    </p>
    <span className="mt-auto inline-flex min-h-11 items-center pt-5 text-xs font-black uppercase tracking-[0.16em] text-brand-blue">
      查看內容
      <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </span>
  </Link>
);

const CompactArticleCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group grid min-h-[132px] grid-cols-[minmax(0,1fr)_96px] items-center gap-4 border-b border-neutral-200 py-5 last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset sm:grid-cols-[minmax(0,1fr)_128px]"
  >
    <div className="min-w-0">
      <ArticleMeta article={article} compact />
      <h4 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-blue md:text-xl">
        {article.title}
      </h4>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 sm:text-sm">
        {article.summary}
      </p>
    </div>
    <ArticleImage
      article={article}
      className="aspect-[4/3] w-full"
      sizes="128px"
    />
  </Link>
);

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'standard' }) => {
  if (variant === 'featured') return <FeaturedArticleCard article={article} />;
  if (variant === 'compact') return <CompactArticleCard article={article} />;
  return <StandardArticleCard article={article} />;
};

export default ArticleCard;
