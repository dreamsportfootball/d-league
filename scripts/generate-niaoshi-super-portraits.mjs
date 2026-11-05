/**
 * One-team, source-preserving D LEAGUE super-template portrait generation.
 * The rectangle coordinates refer to a 640px-wide, auto-oriented version
 * of the existing 2026/27 registration photographs. No AI filling or
 * reshaping; a conventional, independently reviewed square crop only.
 *
 * The two already square and suitable close-ups (#14 and #18) are
 * deliberately untouched. Existing originals for all people are retained. Team staff reuse the corresponding player photo.
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assets = path.join(root, 'public/assets/seasons/2026-27/players');
const mappingsPath = path.join(root, 'data/seasons/2026-27/playerImages.json');
const playersPath = path.join(root, 'data/seasons/2026-27/players.json');

const frames = [
  // Source ID, shirt number, name, square left/top/size in 640px reference.
  // Head/hair plus a little shoulder area; avoid copying any other team's crop.
  { id: 'ns26-02', no: 10, name: '許御力', left: 155, top: 153, size: 330 },
  { id: 'ns26-03', no: 25, name: '王竣弘', left: 132, top: 128, size: 375 },
  { id: 'ns26-04', no: 99, name: '于克元', left: 165, top: 160, size: 310 },
  { id: 'ns26-05', no: 20, name: '于克偉', left: 185, top: 214, size: 270 },
  { id: 'ns26-06', no: 6,  name: '吳昱陞', left: 153, top: 73, size: 335 },
  { id: 'ns26-07', no: 76, name: '鄭祖鏗', left: 135, top: 155, size: 370 },
  { id: 'ns26-08', no: 19, name: '郭奕辰', left: 155, top: 116, size: 330 },
  { id: 'ns26-09', no: 17, name: '楊傑儒', left: 165, top: 158, size: 310 },
  { id: 'ns26-10', no: 16, name: '蘇智龍', left: 163, top: 132, size: 315 },
  { id: 'ns26-11', no: 64, name: '薛易昀', left: 190, top: 234, size: 260 },
  { id: 'ns26-12', no: 44, name: '林宏懋', left: 155, top: 158, size: 330 },
  { id: 'ns26-13', no: 88, name: '許漢權', left: 180, top: 184, size: 280 },
  { id: 'ns26-14', no: 42, name: '黃首駿', left: 0, top: 18, size: 640 },
  { id: 'ns26-15', no: 30, name: '陳學璋', left: 142, top: 30, size: 355 },
  { id: 'ns26-16', no: 11, name: '魏嘉成', left: 20, top: 0, size: 600 },
];

const players = JSON.parse(await readFile(playersPath, 'utf8'));
const images = JSON.parse(await readFile(mappingsPath, 'utf8'));
const team = players.filter(p => p.teamId === 't_niaoshi_2026');
if (team.length !== 17) throw new Error('Expected exactly 17 Niaoshi players');

for (const f of frames) {
  const record = team.find(p => p.id === f.id && p.number === f.no && p.name === f.name);
  if (!record) throw new Error('Roster identity changed: ' + f.id + ' #' + f.no + ' ' + f.name);

  const input = path.join(assets, f.id + (f.id === 'ns26-16' ? '.jpg' : '.png'));
  const outputName = f.id + '-super-20261105.webp';
  const output = path.join(assets, outputName);
  const normalized = await sharp(input).rotate().resize({ width: 640, fit: 'inside' }).toBuffer();
  const metadata = await sharp(normalized).metadata();
  // Older originals can have a width below 640; rescale crop geometry if needed.
  const factor = metadata.width / 640;
  const rect = {
    left: Math.round(f.left * factor),
    top: Math.round(f.top * factor),
    width: Math.round(f.size * factor),
    height: Math.round(f.size * factor),
  };
  if (rect.left < 0 || rect.top < 0 || rect.left + rect.width > metadata.width || rect.top + rect.height > metadata.height) {
    throw new Error('Source dimensions outside approved crop: ' + f.id + ' ' + JSON.stringify({metadata,rect}));
  }
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(normalized)
    .extract(rect)
    .resize(720, 720, { fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: 92, effort: 5 })
    .toFile(output);

  images[f.name] = 'assets/seasons/2026-27/players/' + outputName;
  console.log('[niaoshi-super] ' + f.no + ' ' + f.name + ' -> ' + outputName);
}

await writeFile(mappingsPath, JSON.stringify(images, null, 2) + '\n', 'utf8');
console.log('[niaoshi-super] 15 independent 720×720 crops generated; 2 existing square portraits preserved.');
