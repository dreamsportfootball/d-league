import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNewsArticle } from '../services/seasonDataJson';
import MatchReportArticlePage from './news/MatchReportArticlePage';
import OfficialArticlePage from './news/OfficialArticlePage';

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

  return article.category === 'Official' ? (
    <OfficialArticlePage article={article} />
  ) : (
    <MatchReportArticlePage article={article} />
  );
};

export default ArticleDetailPage;
