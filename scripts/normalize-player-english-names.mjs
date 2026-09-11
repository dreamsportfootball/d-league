import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CURRENT_SEASON_ID } from '../config/siteManifest.js';

const root = process.cwd();
const playersPath = join(root, 'data', 'seasons', CURRENT_SEASON_ID, 'players.json');

const surnameAliases = {
  '王': ['WANG', 'WONG'],
  '李': ['LI', 'LEE'],
  '張': ['CHANG', 'ZHANG', 'CHEUNG'],
  '劉': ['LIU', 'LAU'],
  '陳': ['CHEN', 'CHAN'],
  '楊': ['YANG', 'YEUNG'],
  '黃': ['HUANG', 'WONG', 'HWANG'],
  '趙': ['CHAO', 'ZHAO'],
  '周': ['CHOU', 'ZHOU', 'CHOW'],
  '吳': ['WU', 'NG'],
  '徐': ['HSU', 'XU', 'TSUI'],
  '孫': ['SUN', 'SUEN'],
  '胡': ['HU', 'WOO'],
  '朱': ['CHU', 'ZHU'],
  '高': ['KAO', 'GAO', 'KO'],
  '林': ['LIN', 'LAM'],
  '何': ['HO', 'HE'],
  '郭': ['KUO', 'GUO', 'KWOK'],
  '馬': ['MA'],
  '羅': ['LO', 'LUO', 'LAW'],
  '梁': ['LIANG', 'LEUNG'],
  '宋': ['SUNG', 'SONG'],
  '鄭': ['CHENG', 'ZHENG'],
  '謝': ['HSIEH', 'XIE', 'TSE'],
  '韓': ['HAN'],
  '唐': ['TANG'],
  '馮': ['FENG', 'FUNG'],
  '于': ['YU'],
  '董': ['TUNG', 'DONG'],
  '蕭': ['HSIAO', 'XIAO', 'SIU'],
  '程': ['CHENG'],
  '曹': ['TSAO', 'CAO'],
  '袁': ['YUAN', 'YUEN'],
  '鄧': ['TENG', 'DENG', 'TANG'],
  '許': ['HSU', 'XU', 'HUI', 'SHU'],
  '傅': ['FU'],
  '沈': ['SHEN', 'SUM'],
  '曾': ['TSENG', 'ZENG', 'TSANG'],
  '彭': ['PENG', 'PANG'],
  '呂': ['LU', 'LYU', 'LUI'],
  '蘇': ['SU', 'SO'],
  '盧': ['LU', 'LO'],
  '蔣': ['CHIANG', 'JIANG'],
  '蔡': ['TSAI', 'CAI', 'CHOI'],
  '賈': ['CHIA', 'JIA'],
  '丁': ['TING', 'DING'],
  '魏': ['WEI', 'NGAI'],
  '薛': ['HSUEH', 'XUE', 'SIT'],
  '葉': ['YEH', 'YE', 'YIP'],
  '閻': ['YEN', 'YAN'],
  '余': ['YU'],
  '潘': ['PAN', 'POON'],
  '杜': ['TU', 'DU', 'DO'],
  '戴': ['TAI', 'DAI'],
  '夏': ['HSIA', 'XIA'],
  '鍾': ['CHUNG', 'ZHONG'],
  '鐘': ['CHUNG', 'ZHONG'],
  '汪': ['WANG'],
  '田': ['TIEN', 'TIAN'],
  '任': ['JEN', 'REN'],
  '姜': ['CHIANG', 'JIANG', 'KEUNG'],
  '范': ['FAN'],
  '方': ['FANG', 'FONG'],
  '石': ['SHIH', 'SHI', 'SHEK'],
  '姚': ['YAO'],
  '譚': ['TAM', 'TAN'],
  '談': ['TAM', 'TAN'],
  '廖': ['LIAO'],
  '邱': ['CHIU', 'QIU'],
  '柯': ['KE', 'KO'],
  '洪': ['HUNG', 'HONG'],
  '江': ['CHIANG', 'JIANG'],
  '顏': ['YEN', 'YAN'],
  '詹': ['CHAN', 'ZHAN'],
  '侯': ['HOU', 'HAU'],
  '簡': ['CHIEN', 'JIAN', 'KAN'],
  '施': ['SHIH', 'SHI'],
  '康': ['KANG', 'HONG'],
  '龔': ['KUNG', 'GONG'],
  '嚴': ['YEN', 'YAN'],
  '歐': ['OU', 'AU'],
};

const compoundSurnameAliases = {
  '歐陽': ['OUYANG', 'OU YANG', 'AU YEUNG'],
  '司徒': ['SZETO', 'SZE TO', 'SI TU'],
};

const normalizeSeparators = (value) => value
  .trim()
  .replace(/[,.]+/g, ' ')
  .replace(/[-‐‑‒–—]+/g, ' ')
  .replace(/\s+/g, ' ')
  .toUpperCase();

const identityFallback = (player, normalized) => {
  if (!player.identityId || !/^[a-z]+(?:-[a-z]+)+$/i.test(player.identityId)) return normalized;
  const fromId = player.identityId.split('-').map((part) => part.toUpperCase());
  if (fromId.join('') === normalized.replace(/\s+/g, '')) return fromId.join(' ');
  return normalized;
};

const moveSurnameFirst = (player, normalized) => {
  const compoundEntry = Object.entries(compoundSurnameAliases)
    .find(([surname]) => player.name?.startsWith(surname));

  if (compoundEntry) {
    const [, aliases] = compoundEntry;
    for (const alias of aliases) {
      const aliasTokens = alias.split(' ');
      const tokens = normalized.split(' ');
      const index = tokens.findIndex((_, i) =>
        tokens.slice(i, i + aliasTokens.length).join(' ') === alias,
      );
      if (index > 0) {
        return [...tokens.slice(index, index + aliasTokens.length), ...tokens.slice(0, index), ...tokens.slice(index + aliasTokens.length)].join(' ');
      }
      if (index === 0) return normalized;
    }
  }

  const surname = player.name?.charAt(0);
  const aliases = surnameAliases[surname];
  if (!aliases) return normalized;

  const tokens = normalized.split(' ');
  const surnameIndex = tokens.findIndex((token) => aliases.includes(token));
  if (surnameIndex <= 0) return normalized;

  return [tokens[surnameIndex], ...tokens.slice(0, surnameIndex), ...tokens.slice(surnameIndex + 1)].join(' ');
};

const normalizeEnglishName = (player) => {
  if (typeof player.englishName !== 'string' || !player.englishName.trim()) return player.englishName;
  const separated = normalizeSeparators(player.englishName);
  const expanded = identityFallback(player, separated);
  return moveSurnameFirst(player, expanded);
};

const players = JSON.parse(readFileSync(playersPath, 'utf8'));
let changed = 0;

const normalizedPlayers = players.map((player) => {
  const englishName = normalizeEnglishName(player);
  if (englishName && englishName !== player.englishName) changed += 1;
  return englishName ? { ...player, englishName } : player;
});

writeFileSync(playersPath, `${JSON.stringify(normalizedPlayers, null, 2)}\n`);
console.log(`player English names: normalized ${changed} record(s) for ${CURRENT_SEASON_ID}`);
