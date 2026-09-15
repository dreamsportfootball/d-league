import type { MatchVideoUrls } from '../../types';
import type { MediaAlbum } from '../../types/media';

interface MatchMediaPreviewFixture {
  videoUrls: MatchVideoUrls;
  album: MediaAlbum;
}

export const MATCH_MEDIA_PREVIEW_FIXTURE: MatchMediaPreviewFixture = {
  videoUrls: {
    firstHalf: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    secondHalf: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  album: {
    id: 'preview-media-demo-album',
    seasonId: '2026-27',
    title: '測試比賽照片（預覽示意）',
    date: '2026/09/15',
    cover: '',
    link: 'https://drive.google.com/',
  },
};
