import t25 from '../data/seasons/2025-26/teams.json';
import p25 from '../data/seasons/2025-26/players.json';
import pi25 from '../data/seasons/2025-26/playerImages.json';
import m25 from '../data/seasons/2025-26/matches.json';
import e25 from '../data/seasons/2025-26/matchEvents.json';
import d25 from '../data/seasons/2025-26/disciplineDecisions.json';
import l25 from '../data/seasons/2025-26/lineups.json';
import n25 from '../data/seasons/2025-26/news.json';
import v25 from '../data/seasons/2025-26/media.json';
import a25 from '../data/seasons/2025-26/albums.json';
import { preview2026Matches, preview2026Teams } from '../data/previews/season2026Preview';
import t26 from '../data/seasons/2026-27/teams.json';
import p26 from '../data/seasons/2026-27/players.json';
import pi26 from '../data/seasons/2026-27/playerImages.json';
import m26 from '../data/seasons/2026-27/matches.json';
import e26 from '../data/seasons/2026-27/matchEvents.json';
import d26 from '../data/seasons/2026-27/disciplineDecisions.json';
import l26 from '../data/seasons/2026-27/lineups.json';
import n26 from '../data/seasons/2026-27/news.json';
import v26 from '../data/seasons/2026-27/media.json';
import a26 from '../data/seasons/2026-27/albums.json';
import type { Match, NewsArticle, Video } from '../types';
import type { DisciplineDecision, MatchLineup } from '../types/discipline';
import type { MatchEvent } from '../types/matchEvent';
import type { MediaAlbum } from '../types/media';
import type { PlayerProfile } from '../types/player';
import type { SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

export interface SeasonData {
  teams: SeasonTeam[];
  teamMap: Record<string, SeasonTeam>;
  players: PlayerProfile[];
  playerImages: Record<string, string>;
  matches: Match[];
  matchEvents: Record<string, MatchEvent[]>;
  disciplineDecisions: DisciplineDecision[];
  lineups: Record<string, MatchLineup>;
  news: NewsArticle[];
  media: Video[];
  albums: MediaAlbum[];
}

const useOptimizedImages = import.meta.env.VITE_USE_OPTIMIZED_IMAGES === 'true';

const getOptimizedAssetPath = (path: string): string => {
  if (!useOptimizedImages || !/\.(png|jpe?g)$/i.test(path)) return path;
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
};

export const assetUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  const cleanPath = path.replace(/^\/+/, '').replace(/^d-league\//, '');
  return `${import.meta.env.BASE_URL}${getOptimizedAssetPath(cleanPath)}`;
};

const use2026PreviewData = import.meta.env.VITE_USE_PREVIEW_DATA === 'true';

const makeData = (
  id: SeasonId,
  teamsInput: SeasonTeam[],
  players: PlayerProfile[],
  imagesInput: Record<string, string>,
  matches: Match[],
  matchEvents: Record<string, MatchEvent[]>,
  disciplineDecisions: DisciplineDecision[],
  lineups: Record<string, MatchLineup>,
  newsInput: NewsArticle[],
  mediaInput: Video[],
  albumsInput: MediaAlbum[],
): SeasonData => {
  const teams = teamsInput.map((team) => ({ ...team, logo: assetUrl(team.logo) }));
  return {
    teams,
    teamMap: Object.fromEntries(teams.map((team) => [team.id, team])),
    players,
    playerImages: Object.fromEntries(Object.entries(imagesInput).map(([name, path]) => [name, assetUrl(path)])),
    matches,
    matchEvents,
    disciplineDecisions,
    lineups,
    news: newsInput.map((article) => ({
      ...article,
      seasonId: id,
      imageUrl: article.imageUrl ? assetUrl(article.imageUrl) : '',
    })),
    media: mediaInput.map((item) => ({ ...item, thumbnail: assetUrl(item.thumbnail) })),
    albums: albumsInput.map((album) => ({ ...album, cover: assetUrl(album.cover) })),
  };
};

const DATA: Record<SeasonId, SeasonData> = {
  '2025-26': makeData(
    '2025-26',
    t25 as SeasonTeam[],
    p25 as PlayerProfile[],
    pi25 as Record<string, string>,
    m25 as Match[],
    e25 as Record<string, MatchEvent[]>,
    d25 as DisciplineDecision[],
    l25 as Record<string, MatchLineup>,
    n25 as NewsArticle[],
    v25 as Video[],
    a25 as MediaAlbum[],
  ),
  '2026-27': makeData(
    '2026-27',
    use2026PreviewData ? preview2026Teams : t26 as SeasonTeam[],
    p26 as PlayerProfile[],
    pi26 as Record<string, string>,
    use2026PreviewData ? preview2026Matches : m26 as Match[],
    e26 as Record<string, MatchEvent[]>,
    d26 as DisciplineDecision[],
    l26 as Record<string, MatchLineup>,
    n26 as NewsArticle[],
    v26 as Video[],
    a26 as MediaAlbum[],
  ),
};

const ALL_NEWS: NewsArticle[] = Object.values(DATA).flatMap((season) => season.news);

export const getSeasonData = (seasonId: SeasonId): SeasonData => DATA[seasonId];

export const getAllNews = (): NewsArticle[] => ALL_NEWS.slice();

export const getNewsArticle = (articleId: string): NewsArticle | null =>
  ALL_NEWS.find((article) => article.id === articleId) ?? null;
