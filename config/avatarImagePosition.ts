import type { CSSProperties } from 'react';

/** Circular portrait framing shared by team rosters, profiles and stats. */
type ObjectPosition = CSSProperties['objectPosition'];

/**
 * Photo-specific overrides win over the portrait ratio default.
 * File extensions are deliberately omitted to support optimized WebP images.
 */
const AVATAR_IMAGE_POSITIONS: Readonly<Record<string, ObjectPosition>> = {
  '/assets/seasons/2026-27/staff/southboys-chen-mei-ling-excel.': '50% 0%',
  '/assets/seasons/2026-27/players/al26-01.': '50% 0%',
};

/**
 * A tall image has extra height clipped in a square avatar. Shift its crop
 * towards the top to protect hairlines; keep near-square and landscape photos
 * centred. Never upscale, redraw or edit the original photo.
 */
export const getAvatarImagePosition = (
  src?: string,
  naturalWidth?: number,
  naturalHeight?: number,
): ObjectPosition => {
  if (!src) return '50% 50%';
  const override = Object.entries(AVATAR_IMAGE_POSITIONS)
    .find(([path]) => src.includes(path));
  if (override) return override[1];
  if (
    naturalWidth && naturalHeight &&
    Number.isFinite(naturalWidth) && Number.isFinite(naturalHeight) &&
    naturalWidth > 0 && naturalHeight / naturalWidth >= 1.15
  ) return '50% 12%';
  return '50% 50%';
};
