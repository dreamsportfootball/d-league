import type { CSSProperties } from 'react';

/**
 * Explicit, per-image circular framing. Keep ordinary player images centred:
 * the previous height-ratio heuristic moved already-good portraits and
 * clipped lower-set faces (e.g. 鄧進成).
 *
 * Paths omit their extensions so GitHub Pages generated WebP assets get
 * exactly the same positioning as original PNG/JPEG assets.
 */
type AvatarStyle = Pick<CSSProperties, 'objectPosition' | 'transform'>;

const AVATAR_OVERRIDES: Readonly<Record<string, AvatarStyle>> = {
  '/assets/seasons/2026-27/staff/southboys-chen-mei-ling-excel.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/al26-01.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/pw26-08.': { objectPosition: '50% 85%' },

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
