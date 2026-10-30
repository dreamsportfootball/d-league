// Refresh after image mappings and targeted image framing corrections.
// Re-verify Excel-sourced portrait framing for khk26-06, khk26-11, kbk26-12, ka26-38.
// Second-pass audit: 16 source-verified facial framing adjustments (2026-10-30).
// Verify final Li Fuxiang and Zhang Jianzhi portrait focus; 2026-10-30.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const root = process.cwd();
const reportDir = path.join(root, 'audit');
const tempDir = path.join(reportDir, '_portrait-audit-tmp');
const thumbsDir = path.join(tempDir, 'thumbs');
const reportPdf = path.join(reportDir, 'portrait-contact-sheet-2026-10-30.pdf');
const reportJson = path.join(reportDir, 'portrait-contact-sheet-2026-10-30.json');
const readJson = async (p) => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const players25 = await readJson('data/seasons/2025-26/players.json');
const players26 = await readJson('data/seasons/2026-27/players.json');
const images25 = await readJson('data/seasons/2025-26/playerImages.json');
const images26 = await readJson('data/seasons/2026-27/playerImages.json');
const teams25 = await readJson('data/seasons/2025-26/teams.json');
const teams26 = await readJson('data/seasons/2026-27/teams.json');
const aliases = await readJson('data/playerIdentityAliases.json');
const framingSource = await fs.readFile(path.join(root, 'config/avatarImagePosition.ts'), 'utf8');
const overrides = Array.from(framingSource.matchAll(/'([^']+\.)':\s*\{([^}]+)\}/g), match => ({
  path: match[1],
  position: match[2].match(/objectPosition:\s*'([^']+)'/)?.[1],
  transform: match[2].match(/transform:\s*'([^']+)'/)?.[1],
}));
const imgByIdentity25 = new Map();
for (const player of players25) {
  const identity = aliases['2025-26']?.[player.id] ?? player.identityId ?? player.id;
  if (images25[player.name]) imgByIdentity25.set(identity, images25[player.name]);
}
const teamNames = (teams) => new Map(teams.map(t => [t.id, t.name]));
const labels25 = teamNames(teams25);
const labels26 = teamNames(teams26);
const rows = [];
for (const player of players26) {
  const identity = aliases['2026-27']?.[player.id] ?? player.identityId ?? player.id;
  const direct = images26[player.name] ??
    (player.name === '魏嘉成' ? 'assets/seasons/2026-27/players/ns26-16.jpg' : undefined);
  const photo = direct ?? imgByIdentity25.get(identity);
  rows.push({ season: '2026/27', category: '球員', team: labels26.get(player.teamId) ?? player.teamId, name: player.name,
    id: player.id, photo: photo ?? null, source: direct ? '當季' : photo ? '歷史補圖' : '未提供' });
}
// Match the site's getTeamStaffProfiles(): only reuse a player photo when the
// same season and team have exactly one player with this person's name.
// A missing staff.image is NOT a missing headshot when this fallback succeeds.
for (const team of teams26) for (const staff of team.staff ?? []) {
  const matchingPlayers = players26.filter(player =>
    player.teamId === team.id && player.name === staff.name
  );
  const player = matchingPlayers.length === 1 ? matchingPlayers[0] : null;
  const registeredPlayerImage = player
    ? images26[player.name] ?? (player.name === '魏嘉成' ? 'assets/seasons/2026-27/players/ns26-16.jpg' : null)
    : null;
  const photo = staff.image ?? registeredPlayerImage;
  rows.push({
    season: '2026/27', category: '隊職員', team: team.name, name: staff.name, id: staff.id,
    photo: photo ?? null, source: staff.image ? '隊職員專用照片' : registeredPlayerImage ? '同隊球員照片' : '未提供',
  });
}
const imgByIdentity26 = new Map();
for (const player of players26) {
  const identity = aliases['2026-27']?.[player.id] ?? player.identityId ?? player.id;
  const photo = images26[player.name] ?? (player.name === '魏嘉成' ? 'assets/seasons/2026-27/players/ns26-16.jpg' : null);
  if (photo) imgByIdentity26.set(identity, photo);
}
for (const player of players25) {
  const identity = aliases['2025-26']?.[player.id] ?? player.identityId ?? player.id;
  const direct = images25[player.name];
  const photo = direct ?? imgByIdentity26.get(identity) ?? null;
  rows.push({ season: '2025/26', category: '球員', team: labels25.get(player.teamId) ?? player.teamId,
    name: player.name, id: player.id, photo,
    source: direct ? '歷史' : photo ? '同人當季備援' : '未提供' });
}
await fs.mkdir(thumbsDir, { recursive: true });
const imageJobs = [];
const report = { generatedAt: new Date().toISOString(), branch: 'season/2026-27', expectedCount: rows.length,
  rows: [], summary: {} };
for (const [idx, row] of rows.entries()) {
  const url = row.photo ? '/' + row.photo.replace(/^\/+/, '') : '';
  const override = overrides.find(o => url.includes(o.path));
  const frame = { objectPosition: override?.position ?? '50% 50%', transform: override?.transform ?? 'none' };
  const originFile = row.photo ? path.join(root, 'public', row.photo) : null;
  let exists = false;
  if (originFile) exists = (await fs.stat(originFile).catch(() => null))?.isFile() ?? false;
  const thumbName = String(idx + 1).padStart(4, '0') + '.jpg';
  if (exists) imageJobs.push({ originFile, thumbnail: path.join(thumbsDir, thumbName) });
  report.rows.push({ ...row, exists, ...frame, thumbnail: exists ? 'thumbs/' + thumbName : null });
}
let next = 0;
const workers = Array.from({ length: 6 }, async () => {
  while (next < imageJobs.length) {
    const job = imageJobs[next++];
    await sharp(job.originFile).rotate().flatten({ background: '#ffffff' })
      .resize({ width: 520, height: 520, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72 }).toFile(job.thumbnail);
  }
});
await Promise.all(workers);
report.summary = {
  totalPersons: rows.length,
  currentPlayers: players26.length,
  previousPlayers: players25.length,
  staffProfiles: teams26.flatMap(t => t.staff ?? []).length,
  staffWithDedicatedPhotos: report.rows.filter(r => r.category === '隊職員' && r.source === '隊職員專用照片' && r.exists).length,
  staffUsingPlayerPhotos: report.rows.filter(r => r.category === '隊職員' && r.source === '同隊球員照片' && r.exists).length,
  staffWithoutEffectivePhotos: report.rows.filter(r => r.category === '隊職員' && !r.exists).length,
  availablePhotos: report.rows.filter(r => r.exists).length,
  missingOrBrokenPhotos: report.rows.filter(r => !r.exists).length,
  explicitFramingOverrides: report.rows.filter(r => r.objectPosition !== '50% 50%' || r.transform !== 'none').length,
};
await fs.writeFile(reportJson, JSON.stringify(report, null, 2) + '\n', 'utf8');
const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const cellsPerPage = 35;
const pages = [];
for (let i = 0; i < report.rows.length; i += cellsPerPage) {
  const batch = report.rows.slice(i, i + cellsPerPage);
  const pageNumber = Math.floor(i / cellsPerPage) + 1;
  const cards = batch.map((r, j) => {
    const imgStyle = 'object-position:' + escapeHtml(r.objectPosition) + ';transform:' + escapeHtml(r.transform);
    const portrait = r.exists
      ? '<img src="' + escapeHtml(r.thumbnail) + '" style="' + imgStyle + '" alt="">'
      : '<div class="no-image">NO PHOTO</div>';
    const small = r.exists
      ? '<img src="' + escapeHtml(r.thumbnail) + '" style="' + imgStyle + '" alt="">'
      : '<div class="no-image">—</div>';
    return '<article class="card"><div class="faces"><div class="big face">' + portrait +
      '</div><div class="small face">' + small + '</div></div><div class="person">' +
      escapeHtml(String(i + j + 1) + '. ' + r.name) + '</div><div class="team">' +
      escapeHtml(r.team) + '</div><div class="detail">' +
      escapeHtml(r.id + ' · ' + r.source + (r.exists ? '' : ' · 缺圖')) +
      '</div></article>';
  }).join('');
  pages.push('<section class="sheet"><header><b>D LEAGUE 人物頭像逐張裁切驗收</b>' +
    '<span>' + escapeHtml(batch[0]?.season) + ' | 第 ' + pageNumber + ' 頁 / ' +
    Math.ceil(report.rows.length / cellsPerPage) + ' 頁</span></header>' +
    '<p class="hint">同一人物：104px 大頭像 + 48px 小頭像；依現行 object-fit / object-position / transform 重現圓形裁切</p>' +
    '<div class="grid">' + cards + '</div><footer>核對：頭頂／下巴／臉部中心／比例／缺圖 · QA 素材，非公開人物資料修改</footer></section>');
}
const html = '<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><style>' +
  '@page{size:1100px 1550px;margin:0}*{box-sizing:border-box}body{margin:0;color:#111;font-family:"Noto Sans CJK TC",Arial,sans-serif}' +
  '.sheet{width:1100px;height:1550px;break-after:page;padding:24px 31px;background:white;overflow:hidden}' +
  'header{display:flex;justify-content:space-between;border-bottom:4px solid #0047ab;padding-bottom:13px;font-size:23px}' +
  'header span{font-size:17px;color:#444}.hint{font-size:13px;margin:10px 0 15px;color:#555}' +
  '.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(7,191px);gap:3px 12px}' +
  '.card{border-bottom:1px solid #ddd;text-align:center;padding:8px 4px 0;overflow:hidden}' +
  '.faces{display:flex;gap:10px;justify-content:center;align-items:center;height:110px}' +
  '.face{border-radius:50%;overflow:hidden;background:#eee;border:1px solid #ddd;flex-shrink:0}' +
  '.big{width:104px;height:104px}.small{width:48px;height:48px}.face img{width:100%;height:100%;object-fit:cover;display:block}' +
  '.no-image{height:100%;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px}' +
  '.person{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}' +
  '.team{font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.detail{font-size:10px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  'footer{font-size:12px;color:#666;border-top:1px solid #ddd;margin-top:10px;padding-top:7px}' +
  '</style></head><body>' + pages.join('') + '</body></html>';
const indexFile = path.join(tempDir, 'index.html');
await fs.writeFile(indexFile, html, 'utf8');
const browser = await chromium.launch({ headless: true, args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1550 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(indexFile).href, { waitUntil: 'load', timeout: 120000 });
  const broken = await page.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
  if (broken.length) throw new Error('Failed to render ' + broken.length + ' images: ' + broken.slice(0, 5).join(', '));
  for (let index = 0; index < pages.length; index += 1) {
    const photoSheet = path.join(reportDir, 'portrait-sheet-' + String(index + 1).padStart(2, '0') + '.jpg');
    await page.locator('.sheet').nth(index).screenshot({ path: photoSheet, type: 'jpeg', quality: 74 });
  }
  await page.pdf({ path: reportPdf, width: '1100px', height: '1550px',
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }, printBackground: true, preferCSSPageSize: true });
  console.log(JSON.stringify({ pdf: reportPdf, json: reportJson, pages: pages.length, ...report.summary }, null, 2));
} finally { await browser.close(); }
