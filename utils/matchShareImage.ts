import type { Match } from '../types';

export type ShareGraphicResult = 'SHARED' | 'DOWNLOADED' | 'CANCELLED';

const color = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  blue: '#0047AB',
  lime: '#CCFF00',
  muted: '#A3A3A3',
};

const drawFittedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  minSize: number,
  family: string,
): void => {
  let fontSize = size;
  do {
    ctx.font = '900 ' + fontSize + 'px ' + family;
    if (ctx.measureText(text).width <= maxWidth || fontSize <= minSize) break;
    fontSize -= 2;
  } while (fontSize > minSize);
  ctx.fillText(text, x, y, maxWidth);
};

const loadLogo = async (url: string): Promise<HTMLImageElement | null> => {
  if (!url) return null;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(null), 4500);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    image.src = url;
  });
};

const drawLogo = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  fallbackText: string,
  x: number,
  y: number,
): void => {
  if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
    const scale = Math.min(215 / image.naturalWidth, 215 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    try {
      ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
      return;
    } catch {
      // Some cross-origin logos block canvas rendering. Never fail the whole graphic.
    }
  }
  ctx.fillStyle = color.white;
  ctx.textAlign = 'center';
  drawFittedText(ctx, fallbackText.slice(0, 4), x, y + 13, 255, 45, 28, '"Inter", sans-serif');
};

export const createMatchShareGraphic = async (
  match: Match,
  homeName: string,
  awayName: string,
  homeLogo: string,
  awayLogo: string,
  seasonLabel: string,
  detailUrl: string,
): Promise<Blob> => {
  if (match.homeScore === null || match.awayScore === null) {
    throw new Error('僅能製作已有正式比分的賽果圖');
  }
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法產生比賽圖片');

  ctx.fillStyle = color.black;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = color.blue;
  ctx.fillRect(0, 0, 1080, 18);
  ctx.fillStyle = color.white;
  ctx.textAlign = 'left';
  ctx.font = '900 76px "Oswald", "Inter", sans-serif';
  ctx.fillText('D LEAGUE', 78, 139);
  ctx.font = '600 26px "Inter", sans-serif';
  ctx.fillStyle = color.muted;
  ctx.fillText(seasonLabel, 82, 192);

  ctx.fillStyle = color.lime;
  ctx.fillRect(78, 244, 80, 7);
  ctx.fillStyle = color.white;
  ctx.textAlign = 'center';
  ctx.font = '700 28px "Inter", sans-serif';
  ctx.fillText(match.league + '  /  第 ' + match.round + ' 輪', 540, 315);
  ctx.fillStyle = color.muted;
  const date = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(match.timestamp));
  ctx.font = '500 26px "Inter", sans-serif';
  ctx.fillText(date, 540, 365);

  const [homeImage, awayImage] = await Promise.all([loadLogo(homeLogo), loadLogo(awayLogo)]);
  drawLogo(ctx, homeImage, homeName, 280, 540);
  drawLogo(ctx, awayImage, awayName, 800, 540);

  ctx.fillStyle = color.white;
  ctx.textAlign = 'center';
  drawFittedText(ctx, homeName, 280, 742, 430, 48, 26, '"Inter", sans-serif');
  drawFittedText(ctx, awayName, 800, 742, 430, 48, 26, '"Inter", sans-serif');

  ctx.font = '900 144px "Oswald", "Inter", sans-serif';
  ctx.fillStyle = color.white;
  ctx.fillText(String(match.homeScore) + '  -  ' + String(match.awayScore), 540, 945);
  ctx.font = '700 26px "Inter", sans-serif';
  ctx.fillStyle = color.lime;
  ctx.fillText(match.administrativeNote ? match.administrativeNote.slice(0, 26) : 'FULL TIME  /  比賽結束', 540, 1024);
  ctx.fillStyle = color.blue;
  ctx.fillRect(78, 1095, 924, 3);
  ctx.fillStyle = color.muted;
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.fillText(match.venue ?? '台南市立仁德文賢國中人工草', 540, 1160);
  ctx.font = '400 19px "Inter", sans-serif';
  ctx.fillText(detailUrl, 540, 1224, 920);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('圖片轉換失敗')),
    'image/png',
  ));
};

export const shareMatchGraphic = async (blob: Blob, matchId: string): Promise<ShareGraphicResult> => {
  const name = 'D-LEAGUE-' + matchId + '.png';
  const file = new File([blob], name, { type: 'image/png' });
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'D LEAGUE 賽果圖' });
      return 'SHARED';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'CANCELLED';
      // Browsers may reject async Web Share activation; fall back to PNG.
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);
  return 'DOWNLOADED';
};
