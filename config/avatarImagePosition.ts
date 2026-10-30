import type { CSSProperties } from 'react';

/**
 * Explicit, per-image circular framing. Keep ordinary player images centred:
 * the previous height-ratio heuristic moved already-good portraits and
 * clipped lower-set faces (e.g. 鄧進成).
 *
 * Paths omit their extensions so GitHub Pages generated WebP assets get
 * exactly the same positioning as original PNG/JPEG assets.
 */
type AvatarStyle = Partial<Pick<CSSProperties, 'objectPosition' | 'transform'>>;

const AVATAR_OVERRIDES: Readonly<Record<string, AvatarStyle>> = {
  '/assets/seasons/2026-27/staff/southboys-chen-mei-ling-excel.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/al26-01.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/pw26-08.': { objectPosition: '50% 85%' },

  // Individually reviewed in the 104px / 48px circular portrait QA sheets.
  '/assets/seasons/2026-27/players/sf26-13.': { objectPosition: '50% 85%' },
  '/assets/seasons/2026-27/players/sf26-15.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/sf26-18.': { objectPosition: '50% 20%', transform: 'scale(2.1)' },
  '/assets/seasons/2026-27/players/sf26-19.': { objectPosition: '50% 63%', transform: 'translateX(42%) scale(1.7)' },
  '/assets/seasons/2026-27/players/sf26-20.': { transform: 'translateY(43%) scale(2.2)' },
  '/assets/seasons/2026-27/players/ka26-02.': { objectPosition: '50% 0%', transform: 'translateY(16%) scale(1.6)' },
  '/assets/seasons/2026-27/players/tq26-06.': { objectPosition: '50% 0%', transform: 'translateY(55%) scale(1.8)' },
  '/assets/seasons/2026-27/players/ch26-15.': { objectPosition: '50% 0%', transform: 'scale(1.8)' },
  '/assets/seasons/2026-27/players/ch26-20.': { objectPosition: '50% 0%', transform: 'translateY(30%) scale(1.5)' },
  '/assets/seasons/2026-27/players/al26-03.': { transform: 'translateY(32%) scale(2)' },
  '/assets/seasons/2026-27/players/kbk26-01.': { objectPosition: '50% 0%', transform: 'translate(-31%, 36%) scale(1.6)' },
  '/assets/players/陳公舘/吳明威.': { objectPosition: '50% 0%', transform: 'translateY(30%) scale(1.5)' },
  '/assets/players/酒號矯正署/顏廷邕.': { objectPosition: '50% 0%', transform: 'translateY(28%) scale(1.5)' },
  '/assets/players/酒號矯正署/吳啓明.': { objectPosition: '50% 0%', transform: 'translateY(40%) scale(1.8)' },

  // Source photos with large empty margins: individually focus on faces.
  '/assets/seasons/2026-27/staff/alian-chung-ming-han.': {
    transform: 'translate(-10%, 48%) scale(2)',
  },
  '/assets/seasons/2026-27/staff/alian-lin-yu-ting.': {
    transform: 'translateY(42%) scale(2)',
  },
  '/assets/seasons/2026-27/staff/holy-tseng-yi-an.': {
    transform: 'translateY(35%) scale(1.7)',
  },
};

export const getAvatarPhotoStyle = (src?: string): AvatarStyle => {
  if (!src) return { objectPosition: '50% 50%' };
  const override = Object.entries(AVATAR_OVERRIDES)
    .find(([path]) => src.includes(path));
  return {
    objectPosition: '50% 50%',
    ...(override?.[1] ?? {}),
  };
};
