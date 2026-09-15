import React, { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import MatchDialog from '../components/MatchDialog';
import { isSeasonId } from '../config/seasons';
import { SeasonContext } from '../contexts/SeasonContext';
import { MATCH_MEDIA_PREVIEW_FIXTURE } from '../data/demo/matchMediaPreview';
import { useSeason } from '../hooks/useSeason';
import { getMatchRecord } from '../services/entityData';
import { getMatchRoute } from '../utils/matchPermalink';

const MatchPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { availableSeasons } = useSeason();
  const requestedSeason = searchParams.get('season');
  const preferredSeason = isSeasonId(requestedSeason) ? requestedSeason : undefined;
  const record = useMemo(
    () => getMatchRecord(id, preferredSeason),
    [id, preferredSeason],
  );

  if (!record || !record.homeTeam || !record.awayTeam) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此場比賽" description="此比賽不存在、尚未公布，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/schedule" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue">
              返回賽程
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { seasonId, season, data, match } = record;
  const mediaDemoEnabled = import.meta.env.VITE_MEDIA_DEMO_ENABLED === 'true'
    && searchParams.get('mediaDemo') === '1'
    && seasonId === MATCH_MEDIA_PREVIEW_FIXTURE.album.seasonId;
  const demoMatch = mediaDemoEnabled
    ? {
        ...match,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        videoUrls: MATCH_MEDIA_PREVIEW_FIXTURE.videoUrls,
        albumId: MATCH_MEDIA_PREVIEW_FIXTURE.album.id,
      }
    : match;
  const seasonData = mediaDemoEnabled
    ? {
        ...data,
        matches: data.matches.map((candidate) => candidate.id === match.id ? demoMatch : candidate),
        albums: [
          ...data.albums.filter((album) => album.id !== MATCH_MEDIA_PREVIEW_FIXTURE.album.id),
          MATCH_MEDIA_PREVIEW_FIXTURE.album,
        ],
      }
    : data;
  const navigationMatchIds = seasonData.matches
    .filter((candidate) => candidate.league === match.league)
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((candidate) => candidate.id);
  const matchSeasonContext = {
    activeSeasonId: seasonId,
    activeSeason: season,
    seasonData,
    availableSeasons,
    setActiveSeason: () => {},
  };
  const scheduleRoute = `/schedule?season=${seasonId}`;

  return (
    <SeasonContext.Provider value={matchSeasonContext}>
      <div className="min-h-[75vh] bg-neutral-50" aria-hidden="true" />
      <MatchDialog
        matchId={match.id}
        onClose={() => navigate(scheduleRoute)}
        onSelectMatch={(nextMatchId) => navigate(getMatchRoute(nextMatchId), { replace: true })}
        navigationMatchIds={navigationMatchIds}
      />
    </SeasonContext.Provider>
  );
};

export default MatchPage;
