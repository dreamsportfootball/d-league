import type { SeasonId } from '../types/season';
import type {
  StructuredArticleContentBlock,
  StructuredArticleContentMap,
} from '../types/articleContent';

const contentModules = import.meta.glob('../data/seasons/*/articleContentBlocks.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export const getArticleContentBlocks = (
  seasonId: SeasonId,
  articleId: string,
): StructuredArticleContentBlock[] | null => {
  const key = `../data/seasons/${seasonId}/articleContentBlocks.json`;
  const contentMap = contentModules[key] as StructuredArticleContentMap | undefined;

  return contentMap?.[articleId] ?? null;
};
