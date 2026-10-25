import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import type { PlayerProfile } from '../types/player';
import type { SeasonTeam } from '../types/team';

interface Props {
  player: PlayerProfile;
  team?: SeasonTeam;
  image?: string;
  seasonId: string;
  seasonLabel: string;
  leagueLabel: string;
  appearances: number;
  goals: number;
  yellowCards: number;
  redCards: number;
  hasSeasonResults: boolean;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const drawText = (
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  maxWidth: number, size: number, weight = 800,
): void => {
  let fontSize = size;
  do {
    ctx.font = weight + ' ' + fontSize + 'px sans-serif';
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > 34);
  ctx.fillText(text, x, y, maxWidth);
};

const loadPhoto = (src?: string): Promise<HTMLImageElement | null> => new Promise((resolve) => {
  if (!src) { resolve(null); return; }
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = src;
});

const renderCard = async (canvas: HTMLCanvasElement, props: Props): Promise<void> => {
  await document.fonts.ready;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#0047ab';
  ctx.fillRect(0, 0, WIDTH, 14);
  ctx.fillRect(0, 0, 15, HEIGHT);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px Oswald, sans-serif';
  ctx.fillText('D LEAGUE', 74, 118);
  ctx.textAlign = 'right';
  ctx.font = '700 35px Oswald, sans-serif';
  ctx.fillText(props.seasonLabel, WIDTH - 74, 100);
  ctx.font = '600 24px sans-serif';
  ctx.fillStyle = '#a3a3a3';
  ctx.fillText(props.leagueLabel, WIDTH - 74, 140);
  ctx.textAlign = 'left';

  const photo = await loadPhoto(props.image);
  ctx.save();
  ctx.beginPath();
  ctx.rect(15, 182, WIDTH - 15, 680);
  ctx.clip();
  ctx.fillStyle = '#242424';
  ctx.fillRect(15, 182, WIDTH - 15, 680);
  if (photo && photo.naturalWidth && photo.naturalHeight) {
    const scale = Math.max((WIDTH - 15) / photo.naturalWidth, 680 / photo.naturalHeight);
    const sw = (WIDTH - 15) / scale;
    const sh = 680 / scale;
    ctx.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, 15, 182, WIDTH - 15, 680);
  } else {
    ctx.fillStyle = '#525252';
    ctx.textAlign = 'center';
    ctx.font = '900 86px Oswald, sans-serif';
    ctx.fillText('D LEAGUE', WIDTH / 2, 555);
    ctx.textAlign = 'left';
  }
  const shadow = ctx.createLinearGradient(0, 400, 0, 862);
  shadow.addColorStop(0, 'rgba(10,10,10,0)');
  shadow.addColorStop(1, 'rgba(10,10,10,1)');
  ctx.fillStyle = shadow;
  ctx.fillRect(15, 400, WIDTH - 15, 462);
  ctx.restore();

  ctx.font = '900 206px Oswald, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(props.player.number === null ? '—' : String(props.player.number), WIDTH - 74, 380);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ccff00';
  ctx.font = '700 24px sans-serif';
  ctx.fillText('OFFICIAL PLAYER CARD', 74, 818);
  ctx.fillStyle = '#ffffff';
  drawText(ctx, props.player.name, 74, 936, WIDTH - 148, 100);
  if (props.player.englishName) {
    ctx.fillStyle = '#bcbcbc';
    drawText(ctx, props.player.englishName.toUpperCase(), 74, 993, WIDTH - 148, 34, 600);
  }
  ctx.fillStyle = '#ffffff';
  drawText(ctx, props.team?.name ?? 'D LEAGUE', 74, 1066, WIDTH - 148, 42, 700);
  ctx.fillStyle = '#0047ab';
  ctx.fillRect(74, 1100, WIDTH - 148, 3);
  if (props.hasSeasonResults) {
    const stats = [
      ['出賽', props.appearances],
      ['進球', props.goals],
      ['黃牌', props.yellowCards],
      ['紅牌', props.redCards],
    ] as const;
    stats.forEach(([label, value], i) => {
      const x = 74 + i * 230;
      ctx.fillStyle = '#b5b5b5';
      ctx.font = '600 24px sans-serif';
      ctx.fillText(label, x, 1165);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 75px Oswald, sans-serif';
      ctx.fillText(String(value), x, 1260);
    });
  } else {
    ctx.fillStyle = '#c8c8c8';
    ctx.font = '600 30px sans-serif';
    ctx.fillText('本賽季尚無正式個人賽事紀錄', 74, 1190);
  }
};

const PlayerShareCard: React.FC<Props> = (props) => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    setReady(false);
    const canvas = canvasRef.current;
    if (canvas) {
      void renderCard(canvas, props).then(() => {
        if (!cancelled) setReady(true);
      }).catch(() => {
        if (!cancelled) setError('無法產生球員卡，請重新開啟');
      });
    }
    return () => {
      cancelled = true;
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', keyHandler);
      triggerRef.current?.focus();
    };
  }, [open, props.player.id, props.image, props.seasonId, props.appearances, props.goals, props.yellowCards, props.redCards, props.hasSeasonResults]);

  const download = (): void => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) { setError('圖片製作失敗'); return; }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'DLEAGUE-' + props.seasonId + '-' + props.player.id + '.png';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
      }, 'image/png');
    } catch {
      setError('圖片製作失敗');
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setError(''); setOpen(true); }}
        className="inline-flex min-h-11 items-center gap-2 border border-brand-blue px-4 py-2 text-xs font-black text-brand-blue transition-colors hover:bg-brand-blue hover:text-white focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        球員分享卡
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[110] overflow-y-auto bg-black/85 px-4 py-6 sm:py-10"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <div className="mx-auto w-full max-w-[420px] bg-white p-4 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="player-share-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="player-share-title" className="font-display text-xl font-black text-brand-black">球員專屬分享卡</h2>
                <p className="mt-1 text-xs text-neutral-500">1080 × 1350 PNG · 可分享到社群</p>
              </div>
              <button ref={closeRef} type="button" aria-label="關閉球員分享卡" onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              role="img"
              aria-label={props.player.name + ' · ' + props.seasonLabel + ' 球員分享卡預覽'}
              className="mx-auto aspect-[4/5] w-full max-w-[340px] bg-brand-black"
            />
            <button
              type="button" onClick={download} disabled={!ready}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-brand-blue px-4 text-sm font-black text-white hover:bg-brand-black disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {ready ? '下載球員卡 PNG' : '正在製作預覽…'}
            </button>
            {error && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
};
export default PlayerShareCard;
