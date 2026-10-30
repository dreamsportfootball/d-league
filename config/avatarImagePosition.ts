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
  '/assets/seasons/2026-27/players/al26-01.': { objectPosition: '50% 0%', transform: 'translateY(92%) scale(3)' },
  '/assets/seasons/2026-27/players/pw26-08.': { objectPosition: '50% 85%' },

  // Individually reviewed in the 104px / 48px circular portrait QA sheets.
  '/assets/seasons/2026-27/players/sf26-13.': { objectPosition: '50% 85%' },
  '/assets/seasons/2026-27/players/sf26-15.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/sf26-18.': { objectPosition: '50% 20%', transform: 'scale(2.1)' },
  '/assets/seasons/2026-27/players/sf26-19.': { objectPosition: '50% 63%', transform: 'translate(42%, -18%) scale(1.7)' },
  '/assets/seasons/2026-27/players/sf26-20.': { transform: 'translateY(43%) scale(2.2)' },
  '/assets/seasons/2026-27/players/ka26-02.': { objectPosition: '50% 0%', transform: 'translateY(32%) scale(2.3)' }, // 全站逐張二輪裁切驗收
  '/assets/seasons/2026-27/players/tq26-06.': { objectPosition: '50% 0%', transform: 'translateY(55%) scale(1.8)' },
  '/assets/seasons/2026-27/players/ch26-15.': { objectPosition: '50% 0%', transform: 'scale(2.3)' },
  '/assets/seasons/2026-27/players/ch26-20.': { objectPosition: '50% 0%', transform: 'translateY(30%) scale(1.5)' },
  '/assets/seasons/2026-27/players/al26-03.': { transform: 'translateY(32%) scale(2)' },
  '/assets/seasons/2026-27/players/ku26-04.': { objectPosition: '50% 0%', transform: 'translate(4%, 29%) scale(2)' }, // 全站逐張二輪裁切驗收
  '/assets/seasons/2026-27/players/ku26-09.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/kbk26-01.': { objectPosition: '50% 0%', transform: 'translate(-31%, 36%) scale(1.6)' },
  '/assets/players/陳公舘/吳明威.': { objectPosition: '50% 0%', transform: 'translateY(30%) scale(1.5)' },
  '/assets/players/酒號矯正署/顏廷邕.': { objectPosition: '50% 0%', transform: 'translateY(28%) scale(1.5)' },
  '/assets/players/酒號矯正署/吳啓明.': { objectPosition: '50% 0%', transform: 'translateY(40%) scale(1.8)' },

  // Rechecked against 2026/27 original team Excel embedded images on 2026-10-30.
  // Preserve the source images; reframe only the circular avatar presentation.
  '/assets/seasons/2026-27/players/khk26-06.': { transform: 'translate(4%, -3%) scale(1.9)' },
  '/assets/seasons/2026-27/players/khk26-11.': { transform: 'translate(-11%, 24%) scale(2)' },
  '/assets/seasons/2026-27/players/kbk26-12.': { transform: 'translate(19%, 31%) scale(1.85)' },
  '/assets/seasons/2026-27/players/ka26-38.': { transform: 'translateY(21%) scale(1.8)' },

  // Second-pass 104px / 48px face and hairline review (2026-10-30).
  '/assets/seasons/2026-27/players/sf26-05.': { objectPosition: '50% 0%' }, // 廖新凱：避免裁掉髮頂
  '/assets/seasons/2026-27/players/sf26-12.': { objectPosition: '50% 0%' }, // 洪家庭：維持照片完整頂部
  '/assets/seasons/2026-27/players/lz26-17.': { objectPosition: '50% 0%' }, // 林宜蓁：維持照片完整頂部
  '/assets/seasons/2026-27/players/wa26-04.': { objectPosition: '50% 0%' }, // 蔡羿丞：避免裁掉髮頂
  '/assets/seasons/2026-27/players/ch26-04.': { objectPosition: '50% 0%', transform: 'translateY(111%) scale(4)' }, // 張健治：比賽全身照聚焦頭肩
  '/assets/seasons/2026-27/players/ch26-08.': { transform: 'translateY(25%) scale(1.65)' }, // 潘志豪：比賽照放大臉部
  '/assets/seasons/2026-27/players/ch26-09.': { objectPosition: '50% 0%' }, // 倪天銘：減少髮頂二次裁切
  '/assets/seasons/2026-27/players/ch26-18.': { objectPosition: '50% 0%' }, // 鍾皓弦：減少髮頂二次裁切
  '/assets/seasons/2026-27/players/lz26-05.': { objectPosition: '50% 0%' }, // 李修沛：避開原始照片下方其他畫面
  '/assets/seasons/2026-27/players/sb26-04.': { objectPosition: '50% 0%', transform: 'translateY(13%) scale(1.3)' }, // 李福祥：保留完整頭髮並突出五官
  '/assets/seasons/2026-27/players/sb26-07.': { objectPosition: '50% 0%' }, // 伊而凡：避免裁掉頭髮
  '/assets/seasons/2026-27/players/sb26-11.': { transform: 'translateY(80%) scale(2.7)' }, // 迪馬斯：全身照聚焦頭肩
  '/assets/seasons/2026-27/players/sb26-15.': { objectPosition: '50% 0%' }, // 劉駿輝：保留完整髮頂，同步套用球員及領隊頭像
  '/assets/seasons/2026-27/players/ku26-02.': { objectPosition: '50% 0%' }, // 林柏佑：避免裁掉頭髮
  '/assets/seasons/2026-27/players/ku26-14.': { objectPosition: '50% 0%' }, // 翁吉韡：避免裁掉頭髮
  '/assets/seasons/2026-27/players/ku26-15.': { objectPosition: '50% 0%' }, // 陳光禪：避免裁掉髮頂
  '/assets/seasons/2026-27/players/c23526-14.': { objectPosition: '50% 0%' }, // 黃楷堯：避免裁掉髮頂

  // Full-site second-pass crop review: source-level, one portrait at a time.
  '/assets/seasons/2026-27/players/sf26-06.': { objectPosition: '50% 0%' }, // 頭髮完整
  '/assets/seasons/2026-27/players/pw26-01.': { objectPosition: '50% 0%' }, // 避免裁頂
  '/assets/seasons/2026-27/players/pw26-03.': { objectPosition: '50% 0%' }, // 避免裁頂
  '/assets/seasons/2026-27/players/tq26-08.': { transform: 'translateY(19%) scale(1.7)' }, // 半身照
  '/assets/seasons/2026-27/players/tq26-09.': { transform: 'translateY(31%) scale(1.8)' }, // 全身照
  '/assets/seasons/2026-27/players/tq26-17.': { objectPosition: '50% 0%' }, // 頭頂保留
  '/assets/seasons/2026-27/players/khk26-07.': { transform: 'translateY(35%) scale(2.1)' }, // 公園坐姿照
  '/assets/seasons/2026-27/players/khk26-09.': { transform: 'translateY(35%) scale(2)' }, // 站立半身照
  '/assets/seasons/2026-27/players/khk26-14.': { transform: 'translateY(17%) scale(1.5)' }, // 隊服半身照
  '/assets/seasons/2026-27/players/pwa26-04.': { transform: 'translateY(18%) scale(1.45)' }, // 比賽照
  '/assets/seasons/2026-27/players/te26-06.': { objectPosition: '50% 0%' }, // 原圖頭頂靠上
  '/assets/seasons/2026-27/players/te26-11.': { objectPosition: '50% 0%' }, // 原圖頭頂靠上
  '/assets/seasons/2026-27/players/bw26-01.': { objectPosition: '50% 0%' }, // 避免額頭裁切
  '/assets/seasons/2026-27/players/bw26-08.': { transform: 'translateY(33%) scale(2.1)' }, // 隊服全身照
  '/assets/seasons/2026-27/players/bw26-12.': { transform: 'translateY(22%) scale(1.6)' }, // 戶外半身照
  '/assets/seasons/2026-27/players/bw26-13.': { transform: 'translateY(19%) scale(1.6)' }, // 隊服全身照
  '/assets/seasons/2026-27/players/ch26-06.': { transform: 'translateY(63%) scale(2.5)' }, // 比賽遠景
  '/assets/seasons/2026-27/players/ch26-12.': { transform: 'translateY(26%) scale(1.6)' }, // 室內遠景
  '/assets/seasons/2026-27/players/ch26-16.': { transform: 'translateY(20%) scale(1.6)' }, // 球衣全身照
  '/assets/seasons/2026-27/players/lz26-06.': { objectPosition: '50% 0%' }, // 避免頭頂二次裁切
  '/assets/seasons/2026-27/players/lz26-13.': { transform: 'translate(14%, 20%) scale(2.4)' }, // 原圖嵌套相框
  '/assets/seasons/2026-27/players/wa26-06.': { transform: 'translateY(19%) scale(1.6)' }, // 手持球衣
  '/assets/seasons/2026-27/players/al26-02.': { transform: 'translateY(32%) scale(1.9)' }, // 站立隊服照
  '/assets/seasons/2026-27/players/al26-04.': { transform: 'translateY(80%) scale(3.2)' }, // 比賽遠景
  '/assets/seasons/2026-27/players/al26-05.': { transform: 'translateY(80%) scale(3.2)' }, // 比賽遠景
  '/assets/seasons/2026-27/players/al26-13.': { transform: 'translateY(30%) scale(1.7)' }, // 站立半身照
  '/assets/seasons/2026-27/players/al26-14.': { transform: 'translateY(27%) scale(1.9)' }, // 戶外遠景
  '/assets/seasons/2026-27/players/al26-19.': { transform: 'translateY(39%) scale(2.2)' }, // 全身照
  '/assets/seasons/2026-27/players/kbk26-04.': { transform: 'translate(31%, 31%) scale(2)' }, // 雙人照內聚焦左側球員
  '/assets/seasons/2026-27/players/kbk26-11.': { transform: 'translateY(17%) scale(1.55)' }, // 球衣半身照
  '/assets/seasons/2026-27/players/holy26-07.': { objectPosition: '50% 0%', transform: 'translateY(13%) scale(1.85)' }, // 守門員遠景
  '/assets/seasons/2026-27/players/sb26-03.': { transform: 'translateY(20%) scale(1.55)' }, // 球衣半身照
  '/assets/seasons/2026-27/players/sb26-08.': { transform: 'translateY(14%) scale(1.55)' }, // 西裝半身照
  '/assets/seasons/2026-27/players/sb26-12.': { transform: 'translateY(33%) scale(1.9)' }, // 室內半身照
  '/assets/seasons/2026-27/players/sb26-13.': { transform: 'translateY(20%) scale(1.7)' }, // 人像半身照
  '/assets/seasons/2026-27/players/sb26-14.': { transform: 'translateY(53%) scale(2.35)' }, // 室內全身照
  '/assets/seasons/2026-27/players/ku26-20.': { transform: 'translateY(14%) scale(1.55)' }, // 戶外半身照
  '/assets/seasons/2026-27/players/ns26-02.': { transform: 'translateY(25%) scale(1.8)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-03.': { transform: 'translateY(25%) scale(1.8)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-04.': { transform: 'translateY(34%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-05.': { transform: 'translateY(27%) scale(1.9)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-06.': { transform: 'translateY(23%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-07.': { transform: 'translateY(26%) scale(1.8)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-08.': { transform: 'translateY(28%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-09.': { transform: 'translateY(27%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-10.': { transform: 'translateY(27%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-11.': { transform: 'translateY(28%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-12.': { transform: 'translateY(25%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-13.': { transform: 'translateY(24%) scale(1.85)' }, // 球衣定裝照
  '/assets/seasons/2026-27/players/ns26-15.': { transform: 'translateY(20%) scale(1.55)' }, // 人像半身照
  '/assets/players/酒號矯正署/何柏緯.': { transform: 'translateY(25%) scale(2)' }, // 歷史戶外夜景
  '/assets/players/酒號矯正署/李宗翰.': { transform: 'translateY(14%) scale(1.55)' }, // 歷史鏡自拍
  '/assets/players/酒號矯正署/鄭詠翰.': { transform: 'translateY(22%) scale(1.7)' }, // 歷史半身照
  '/assets/players/酒號矯正署/何政緯.': { transform: 'translateY(24%) scale(1.6)' }, // 歷史遠景
  '/assets/players/屏東野猿足球俱樂部/尤尚佑.': { transform: 'translateY(22%) scale(1.6)' }, // 歷史球衣照
  '/assets/players/瘋Dog/劉力瑋.': { transform: 'translateY(18%) scale(1.5)' }, // 歷史戶外照
  '/assets/players/鳥仕足球俱樂部/王志誠.': { transform: 'translateY(25%) scale(1.6)' }, // 歷史全身照
  '/assets/players/鳥仕足球俱樂部/高義莉.': { transform: 'translateY(36%) scale(2.0)' }, // 歷史運動照
  '/assets/players/鳥仕足球俱樂部/陳宇翔.': { transform: 'translateY(25%) scale(1.65)' }, // 歷史球場遠景
  '/assets/players/鳥仕足球俱樂部/陳學璋.': { transform: 'translateY(20%) scale(1.5)' }, // 歷史上身照
  '/assets/players/鳥仕足球俱樂部/劉康任.': { transform: 'translateY(22%) scale(1.65)' }, // 歷史隊服照
  '/assets/players/蒼龍FC/李昆鴻.': { transform: 'translateY(17%) scale(1.55)' }, // 歷史隊服照

  // Source photos with large empty margins: individually focus on faces.
  '/assets/seasons/2026-27/staff/alian-chung-ming-han.': {
    transform: 'translate(-10%, 48%) scale(2)',
  },
  '/assets/seasons/2026-27/staff/alian-lin-yu-ting.': {
    transform: 'translateY(90%) scale(3)',
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
