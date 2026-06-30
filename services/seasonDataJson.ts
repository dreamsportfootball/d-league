import { CURRENT_SEASON_ID, SEASON_IDS } from '../config/siteManifest.js';
import { preview2026Matches, preview2026Teams } from '../data/previews/season2026Preview';
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

type JsonModuleMap = Record<string, unknown>;

const teamsModules = import.meta.glob('../data/seasons/*/teams.json', { eager: true, import: 'default' }) as JsonModuleMap;
const playersModules = import.meta.glob('../data/seasons/*/players.json', { eager: true, import: 'default' }) as JsonModuleMap;
const playerImagesModules = import.meta.glob('../data/seasons/*/playerImages.json', { eager: true, import: 'default' }) as JsonModuleMap;
const matchesModules = import.meta.glob('../data/seasons/*/matches.json', { eager: true, import: 'default' }) as JsonModuleMap;
const matchEventsModules = import.meta.glob('../data/seasons/*/matchEvents.json', { eager: true, import: 'default' }) as JsonModuleMap;
const disciplineModules = import.meta.glob('../data/seasons/*/disciplineDecisions.json', { eager: true, import: 'default' }) as JsonModuleMap;
const lineupsModules = import.meta.glob('../data/seasons/*/lineups.json', { eager: true, import: 'default' }) as JsonModuleMap;
const newsModules = import.meta.glob('../data/seasons/*/news.json', { eager: true, import: 'default' }) as JsonModuleMap;
const mediaModules = import.meta.glob('../data/seasons/*/media.json', { eager: true, import: 'default' }) as JsonModuleMap;
const albumsModules = import.meta.glob('../data/seasons/*/albums.json', { eager: true, import: 'default' }) as JsonModuleMap;

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

const getSeasonJson = <T,>(modules: JsonModuleMap, seasonId: SeasonId, fileName: string): T => {
  const key = `../data/seasons/${seasonId}/${fileName}`;
  const value = modules[key];
  if (value === undefined) throw new Error(`${seasonId}: missing ${fileName}`);
  return value as T;
};

const useCurrentSeasonPreviewData = import.meta.env.VITE_USE_PREVIEW_DATA === 'true';

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

const DATA = Object.fromEntries(
  SEASON_IDS.map((seasonId) => {
    const usePreview = useCurrentSeasonPreviewData && seasonId === CURRENT_SEASON_ID;
    return [
      seasonId,
      makeData(
        seasonId,
        usePreview ? preview2026Teams : getSeasonJson<SeasonTeam[]>(teamsModules, seasonId, 'teams.json'),
        getSeasonJson<PlayerProfile[]>(playersModules, seasonId, 'players.json'),
        getSeasonJson<Record<string, string>>(playerImagesModules, seasonId, 'playerImages.json'),
        usePreview ? preview2026Matches : getSeasonJson<Match[]>(matchesModules, seasonId, 'matches.json'),
        getSeasonJson<Record<string, MatchEvent[]>>(matchEventsModules, seasonId, 'matchEvents.json'),
        getSeasonJson<DisciplineDecision[]>(disciplineModules, seasonId, 'disciplineDecisions.json'),
        getSeasonJson<Record<string, MatchLineup>>(lineupsModules, seasonId, 'lineups.json'),
        getSeasonJson<NewsArticle[]>(newsModules, seasonId, 'news.json'),
        getSeasonJson<Video[]>(mediaModules, seasonId, 'media.json'),
        getSeasonJson<MediaAlbum[]>(albumsModules, seasonId, 'albums.json'),
      ),
    ];
  }),
) as Record<SeasonId, SeasonData>;

const ALL_NEWS: NewsArticle[] = SEASON_IDS.flatMap((seasonId) => DATA[seasonId].news);

export const getSeasonData = (seasonId: SeasonId): SeasonData => DATA[seasonId];
export const getAllNews = (): NewsArticle[] => ALL_NEWS.slice();
export const getNewsArticle = (articleId: string): NewsArticle | null =>
  ALL_NEWS.find((article) => article.id === articleId) ?? null;
