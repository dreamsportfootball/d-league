import teams2025Json from '../data/seasons/2025-26/teams.json';
import matches2025Json from '../data/seasons/2025-26/matches.json';
import albums2025Json from '../data/seasons/2025-26/albums.json';
import teams2026Json from '../data/seasons/2026-27/teams.json';
import players2026Json from '../data/seasons/2026-27/players.json';
import matches2026Json from '../data/seasons/2026-27/matches.json';
import matchEvents2026Json from '../data/seasons/2026-27/matchEvents.json';
import news2026Json from '../data/seasons/2026-27/news.json';
import media2026Json from '../data/seasons/2026-27/media.json';
import albums2026Json from '../data/seasons/2026-27/albums.json';
import { PLAYER_IMAGES } from '../staticData';
import { ALL_PLAYERS, type PlayerProfile } from '../playerData';
import { MATCH_EVENTS, MOCK_VIDEOS } from '../matchData';
import { MOCK_NEWS } from './geminiService';
import type { Match, NewsArticle, Video } from '../types';
import type { MatchEvent } from '../types/matchEvent';
import type { MediaAlbum } from '../types/media';
import type { SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

export interface SeasonData {
  teams: SeasonTeam[];
  teamMap: Record<string, SeasonTeam>;
  players: PlayerProfile[];
  matches: Match[];
  matchEvents: Record<string, MatchEvent[]>;
  playerImages: Record<string, string>;
  news: NewsArticle[];
  media: Video[];
  albums: MediaAlbum[];
}

export const assetUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  const cleanPath = path.replace(/^\/+/, '').replace(/^d-league\//, '');
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

const normalizeTeamAssets = (teams: SeasonTeam[]): SeasonTeam[] =>
  teams.map((team) => ({ ...team, logo: assetUrl(team.logo) }));

const normalizeNewsAssets = (news: NewsArticle[], seasonId: SeasonId): NewsArticle[] =>
  news.map((article) => ({
    ...article,
    seasonId,
    imageUrl: article.imageUrl ? assetUrl(article.imageUrl) : '',
  }));

const normalizeMediaAssets = (media: Video[]): Video[] =>
  media.map((item) => ({ ...item, thumbnail: assetUrl(item.thumbnail) }));

const normalizeAlbumAssets = (albums: MediaAlbum[]): MediaAlbum[] =>
  albums.map((album) => ({ ...album, cover: assetUrl(album.cover) }));

const toTeamMap = (teams: SeasonTeam[]): Record<string, SeasonTeam> =>
  Object.fromEntries(teams.map((team) => [team.id, team]));

const teams2025 = normalizeTeamAssets(teams2025Json as SeasonTeam[]);
const teams2026 = normalizeTeamAssets(teams2026Json as SeasonTeam[]);

const seasonData: Record<SeasonId, SeasonData> = {
  '2025-26': {
    teams: teams2025,
    teamMap: toTeamMap(teams2025),
    players: ALL_PLAYERS,
    matches: matches2025Json as Match[],
    matchEvents: MATCH_EVENTS,
    playerImages: Object.fromEntries(
      Object.entries(PLAYER_IMAGES).map(([name, path]) => [name, assetUrl(path)]),
    ),
    news: normalizeNewsAssets(MOCK_NEWS, '2025-26'),
    media: normalizeMediaAssets(MOCK_VIDEOS),
    albums: normalizeAlbumAssets(albums2025Json as MediaAlbum[]),
  },
  '2026-27': {
    teams: teams2026,
    teamMap: toTeamMap(teams2026),
    players: players2026Json as PlayerProfile[],
    matches: matches2026Json as Match[],
    matchEvents: matchEvents2026Json as Record<string, MatchEvent[]>,
    playerImages: {},
    news: normalizeNewsAssets(news2026Json as NewsArticle[], '2026-27'),
    media: normalizeMediaAssets(media2026Json as Video[]),
    albums: normalizeAlbumAssets(albums2026Json as MediaAlbum[]),
  },
};

export const getSeasonData = (seasonId: SeasonId): SeasonData => seasonData[seasonId];
