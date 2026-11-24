/** Only request generated local thumbnails in optimized builds. */
export const getImageThumbnailUrl = (src: string, kind: 'portrait' | 'news'): string => {
  if (import.meta.env.VITE_USE_OPTIMIZED_IMAGES !== 'true' ||
      !src.startsWith(import.meta.env.BASE_URL) || !/\.webp$/i.test(src)) return src;
  const eligible = kind === 'portrait' ? /\/players\//i.test(src) : /\/(news|media)\//i.test(src);
  return eligible ? src.replace(/\.webp$/i, kind === 'portrait' ? '.thumb-320.webp' : '.thumb-768.webp') : src;
};
