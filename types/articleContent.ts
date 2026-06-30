export interface ArticleParagraphBlock {
  type: 'paragraph';
  text: string;
  variant?: 'default' | 'lead';
}

export interface ArticleHeadingBlock {
  type: 'heading';
  text: string;
}

export interface ArticleListBlock {
  type: 'list';
  ordered?: boolean;
  items: string[];
}

export interface ArticleMatchInfoBlock {
  type: 'matchInfo';
  competition: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  dateLabel?: string;
}

export interface ArticleKeyFact {
  label: string;
  value: string;
}

export interface ArticleKeyFactsBlock {
  type: 'keyFacts';
  items: ArticleKeyFact[];
}

export interface ArticleTimelineItem {
  time: string;
  text: string;
}

export interface ArticleTimelineBlock {
  type: 'timeline';
  items: ArticleTimelineItem[];
}

export interface ArticleNoticeBlock {
  type: 'notice';
  title?: string;
  text: string;
}

export interface ArticleCtaBlock {
  type: 'cta';
  label: string;
  href: string;
}

export type StructuredArticleContentBlock =
  | ArticleParagraphBlock
  | ArticleHeadingBlock
  | ArticleListBlock
  | ArticleMatchInfoBlock
  | ArticleKeyFactsBlock
  | ArticleTimelineBlock
  | ArticleNoticeBlock
  | ArticleCtaBlock;

export type StructuredArticleContentMap = Record<string, StructuredArticleContentBlock[]>;
