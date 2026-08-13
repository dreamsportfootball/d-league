import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

const MatchPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams();
  const season = searchParams.get('season');

  if (season) next.set('season', season);
  if (id) next.set('match', id);

  const query = next.toString();
  return <Navigate to={`/schedule${query ? `?${query}` : ''}`} replace />;
};

export default MatchPage;