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
  // 陳公舘 2026/27: original Excel photos; use object-position first to avoid exposed circular edges.
  // #13 李秉錦 uses a separately padded square source for full hairline and chin.
  '/assets/seasons/2026-27/players/ch26-02.': { objectPosition: '50% 0%' }, // 陳公舘 林家銘：以相同照片的乾淨裁切來源取代黑邊截圖；完整保留髮頂及五官
  '/assets/seasons/2026-27/players/ch26-03.': { objectPosition: '50% 63.56%', transform: 'translate(-1.45%, 0%) scale(1.04)' }, // 陳公舘 倪柏瑄：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-04.': { objectPosition: '50% 0%', transform: 'translate(-19.12%, 77.94%) scale(3.23)' }, // 陳公舘 張健治：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-05.': { objectPosition: '50% 8.95%', transform: 'translate(-2.5%, 0%) scale(1.3)' }, // 陳公舘 孫裕程：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-06.': { objectPosition: '68.89% 50%', transform: 'translate(0%, 71.76%) scale(3.86)' }, // 陳公舘 洪品丞：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-07.': { objectPosition: '50% 5%', transform: 'translate(-4.92%, 0%) scale(1.11)' }, // 陳公舘 陳立鑫：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-08.': { objectPosition: '50% 0%', transform: 'translate(11.75%, 18.98%) scale(2.09)' }, // 陳公舘 潘志豪：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-09.': { objectPosition: '50% 0%', transform: 'translate(-5.83%, 5%) scale(1.15)' }, // 陳公舘 倪天銘：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-10.': { objectPosition: '50% 0%', transform: 'translate(-7.8%, 9.22%) scale(1.22)' }, // 陳公舘 楊俊雄：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-11.': { objectPosition: '50% 40.25%', transform: 'translate(1.84%, 0%) scale(1.06)' }, // 陳公舘 曾龍盛：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-12.': { objectPosition: '100% 50%', transform: 'translate(0%, 34.48%) scale(2.84)' }, // 陳公舘 洪品宇：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-13.': { objectPosition: '50% 5.5%', transform: 'translate(0%, 0%) scale(1)' }, // 陳公舘 林紀廷：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-14.': { objectPosition: '50% 33.97%', transform: 'translate(0%, 0%) scale(1)' }, // 陳公舘 張誌文：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-15.': { objectPosition: '50% 0.47%', transform: 'translate(25.25%, 0%) scale(3.26)' }, // 陳公舘 吳明威：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-16.': { objectPosition: '50% 2.98%', transform: 'translate(-1.1%, 0%) scale(1.32)' }, // 陳公舘 李家勳：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-17.': { objectPosition: '50% 3.33%', transform: 'translate(-0.15%, 0%) scale(1.04)' }, // 陳公舘 陳俊介：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-18.': { objectPosition: '50% 0%', transform: 'translate(-1.86%, 0.37%) scale(1.05)' }, // 陳公舘 鍾皓弦：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-19.': { objectPosition: '50% 18.64%', transform: 'translate(-0.16%, 0%) scale(1.03)' }, // 陳公舘 黃杰：保留髮頂／完整五官
  '/assets/seasons/2026-27/players/ch26-20.': { objectPosition: '50% 0%', transform: 'translate(-0.37%, 2.59%) scale(1.13)' }, // 陳公舘 林祐丞：保留髮頂／完整五官
  // SOUTHBOYS 2026/27: 2026-11-04 accepted candidate source crops (sb26-04/05/08/09/11/13/14/15)
  // are square 720px photos; avoid reapplying stale transforms from long/full-body originals.
  '/assets/seasons/2026-27/staff/southboys-chen-mei-ling-excel.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/pw26-08.': { objectPosition: '50% 85%' },
  '/assets/seasons/2026-27/players/pw26-11.': { transform: 'scale(1.18)' }, // 屏東野狼 林瑶璇：取消向下位移，令臉部重新置中

  // Individually reviewed in the 104px / 48px circular portrait QA sheets.
  // SF #16, #12 (coach), #82 and #11: individually cropped square WebP from 2026/27 Excel originals.
  // Default 50% 50% framing; do not restore transforms calibrated for full-body photos.
  // 14 SF owner-rejected avatars are already cropped to 720x720. Do not reapply
  // transforms for the old rectangular sources; retain circular overflow clipping.
  // Owner recheck 2026-11-05: SF #82 uses unpadded Excel source; zoom to centre face without blank lower strip.
  '/assets/seasons/2026-27/players/sf26-19.': { objectPosition: '50% 100%', transform: 'translateX(14%) scale(1.3)' },
  // SF manager 吳孟容: portrait source is tall; align at top to retain her hair.
  '/assets/seasons/2026-27/staff/sf-wu-meng-rong.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/sf26-13.': { objectPosition: '50% 85%' },
  // 高雄香港人 #31 謝俊杰（兼領隊）：使用 Excel 內嵌原圖重新直立及裁切的獨立 WebP，
  // 新圖片為正方形，維持預設置中；不再套舊版合照的 1.75 倍位移裁切。
  '/assets/seasons/2026-27/players/khk26-05.': { objectPosition: '50% 20%', transform: 'scale(1.12)' }, // #15 阮文南：臉部比例稍放大，髮頂與下巴完整
  // 高雄業餘 2026/27：逐張比對 Excel xl/media 原圖及 48/104/160px 實際圓形裁切。
  // 只對髮頂受預設垂直置中影響的人物調整；不套用全隊相同倍率或犧牲下巴。
  '/assets/seasons/2026-27/players/ka26-01.': { objectPosition: '50% 30%' }, // #9 劉力瑋：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-29.': { objectPosition: '50% 15%' }, // #6 湯弘君：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-30.': { objectPosition: '50% 0%' }, // #19 吳詠祥：保留整個髮頂；Excel 原圖本身模糊，避免放大造成假清晰度
  '/assets/seasons/2026-27/players/ka26-32.': { objectPosition: '50% 25%' }, // #20 陳建宏：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-34.': { objectPosition: '50% 25%' }, // #14 王劭愷：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-35.': { objectPosition: '50% 25%' }, // #12 曾瀚陞：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-36.': { objectPosition: '50% 25%' }, // #16 林煒哲：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-37.': { objectPosition: '50% 25%' }, // #51 王笙翰：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-39.': { objectPosition: '50% 25%' }, // #17 王文賢：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-40.': { objectPosition: '50% 15%' }, // #8 侯奕賢：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-42.': { objectPosition: '50% 30%' }, // #23 林品華：保留完整髮頂、下巴與五官
  '/assets/seasons/2026-27/players/ka26-41.': { objectPosition: '50% 0%' }, // #2 林郁任：避免預設置中裁掉髮頂，保留自然頭肩比例
  '/assets/seasons/2026-27/players/ka26-02.': { objectPosition: '50% 0%', transform: 'translateY(37%) scale(2.9) scaleX(1.56)' }, // 高雄業餘 #3 李昆鴻：依 Excel 內嵌圖片的橫向拉伸比例
  '/assets/seasons/2026-27/players/tq26-06.': { objectPosition: '50% 0%', transform: 'translateY(50%) scale(2)' },
  '/assets/seasons/2026-27/players/ku26-04.': { objectPosition: '50% 0%', transform: 'translate(4%, -30%) scale(2)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/kbk26-01.': { objectPosition: '50% 0%' }, // #10 Joel Vega：允許合照同框，完整保留髮頂、自然比例，勿強制單人放大
  '/assets/seasons/2026-27/players/kbk26-02.': { objectPosition: '50% 0%' }, // #17 王家偉：恢復完整髮頂
  '/assets/seasons/2026-27/players/kbk26-07.': { objectPosition: '50% 35%' }, // #79 ALI：保留頭頂與下巴
  '/assets/seasons/2026-27/players/kbk26-08.': { objectPosition: '50% 10%' }, // #29 LUCAS ROA：保留完整捲髮
  '/assets/seasons/2026-27/players/kbk26-09.': { objectPosition: '50% 50%', transform: 'translate(60%, 24%) scale(2.8)' }, // #11 連于翔：從 Excel 限制性社群截圖內聚焦本人，仍需補清晰單人照
  '/assets/seasons/2026-27/players/kbk26-13.': { objectPosition: '50% 0%' }, // #2 DOUGLAS：保留髮頂
  '/assets/players/陳公舘/吳明威.': { objectPosition: '50% 0%', transform: 'translateY(30%) scale(1.5)' },
  '/assets/players/酒號矯正署/顏廷邕.': { objectPosition: '50% 0%', transform: 'translateY(28%) scale(1.5)' },
  '/assets/players/酒號矯正署/吳啓明.': { objectPosition: '50% 0%', transform: 'translateY(40%) scale(1.8)' },

  // Rechecked against 2026/27 original team Excel embedded images on 2026-10-30.
  // Preserve the source images; reframe only the circular avatar presentation.
  '/assets/seasons/2026-27/players/khk26-06.': { transform: 'translate(0%, -12%) scale(2.1)' }, // #24 游淙瑋：原圖遠景，保留髮頂且臉部向圓形中央上移；清晰度仍受限
  '/assets/seasons/2026-27/players/khk26-11.': { transform: 'translate(-11%, 24%) scale(2)' },
  '/assets/seasons/2026-27/players/kbk26-12.': { transform: 'translate(19%, 38%) scale(1.85)' }, // #7 姜斌：保留髮頂，聚焦合照左側本人
  '/assets/seasons/2026-27/players/ka26-38.': { transform: 'translateY(34%) scale(2.5) scaleX(1.49)' }, // 高雄業餘 #7 潘晨維：依 Excel 內嵌圖片的橫向拉伸比例

  // Second-pass 104px / 48px face and hairline review (2026-10-30).
  // 鹿逐 2026/27: per-source hairline framing; these portraits have extra canvas height and
  // centred object-fit would cut into the source hair. Keep default size unless noted.
  '/assets/seasons/2026-27/players/lz26-01.': { objectPosition: '50% 0%' }, // #10 陳麒竣
  '/assets/seasons/2026-27/players/lz26-02.': { objectPosition: '50% 0%' }, // #3 宋映德（兼教練）
  '/assets/seasons/2026-27/players/lz26-03.': { objectPosition: '50% 0%' }, // #4 謝詒婷
  '/assets/seasons/2026-27/players/lz26-07.': { objectPosition: '50% 0%' }, // #52 鐘佳勳
  '/assets/seasons/2026-27/players/lz26-08.': { transform: 'translateY(8%) scale(1.25)' }, // #8 王子豪：放大遠景人臉並維持完整髮頂
  '/assets/seasons/2026-27/players/lz26-15.': { objectPosition: '50% 0%' }, // #88 林冠宇：直式照片往上取景，保留完整翹髮
  '/assets/seasons/2026-27/players/lz26-16.': { objectPosition: '50% 20%' }, // #9 古智尹：長型證件照兼顧髮頂及下巴
  '/assets/seasons/2026-27/players/lz26-10.': { objectPosition: '50% 0%' }, // #21 林敬祐
  '/assets/seasons/2026-27/players/lz26-11.': { objectPosition: '50% 0%' }, // #56 陳穧元
  '/assets/seasons/2026-27/players/lz26-14.': { objectPosition: '50% 0%', transform: 'scale(1.4)' }, // #38 方韻雅：去除證件相片外緣背景；保留整顆頭
  '/assets/seasons/2026-27/players/lz26-18.': { objectPosition: '50% 0%' }, // #14 蘇宗霆：長型照片優先完整髮頂
  '/assets/seasons/2026-27/players/lz26-17.': { objectPosition: '50% 0%' }, // 林宜蓁：維持照片完整頂部
  // WANDERERS 2026/27: individually checked against 2026-10-28 Excel embedded portraits.
  // Keep the site's clearer same-person images; Excel xl/media snapshots are only 154x194.
  '/assets/seasons/2026-27/players/sb26-07.': { objectPosition: '50% 0%' }, // 伊而凡：避免裁掉頭髮
  '/assets/seasons/2026-27/players/ku26-14.': { objectPosition: '50% 0%' }, // 翁吉韡：避免裁掉頭髮
  '/assets/seasons/2026-27/players/ku26-15.': { objectPosition: '50% 0%' }, // 陳光禪：避免裁掉髮頂
  // 嘉義 235 FC 2026/27 — 2026-11-02：逐人檢查原圖與既有 104px / 48px 圓形 QA 圖。
  // 以直式證件照髮頂及完整五官為優先；僅修改 Owner 指出的 17 位，不影響其他三位。
  '/assets/seasons/2026-27/players/c23526-01.': { objectPosition: '50% 7%' }, // #1 陳日揚：證件照略上移，保留完整髮頂
  '/assets/seasons/2026-27/players/c23526-02.': { objectPosition: '50% 5%' }, // #2 陳官澤：避免圓形裁切吃掉髮頂
  '/assets/seasons/2026-27/players/c23526-03.': { objectPosition: '50% 2%', transform: 'scale(1.14)' }, // #3 陳柏翰：依原圖視覺比對去除圓框內下緣疊印，保留髮頂／五官；原圖低畫質待補照
  '/assets/seasons/2026-27/players/c23526-05.': { objectPosition: '50% 12%' }, // #7 黃偉倫：向上取景，避免髮頂貼邊
  '/assets/seasons/2026-27/players/c23526-07.': { objectPosition: '50% 12%' }, // #9 唐毓翔：以頭臉為中心，減少下緣佔比
  '/assets/seasons/2026-27/players/c23526-08.': { objectPosition: '50% 34%' }, // #11 何茂彬：眼睛與臉部回正，維持完整髮頂；原圖證件反光不可修復
  '/assets/seasons/2026-27/players/c23526-10.': { objectPosition: '50% 0%' }, // #14 李宇文：證件照上移，保留髮頂
  '/assets/seasons/2026-27/players/c23526-09.': { objectPosition: '50% 24%', transform: 'scale(1.18)' }, // #12 鄭州偉：垂直取景微調至 24%，維持 1.18 倍避開照片黑邊，臉部更居中
  '/assets/seasons/2026-27/players/c23526-11.': { objectPosition: '50% 37%' }, // #17 王建翔：往臉部中心取景並減少證件下緣
  '/assets/seasons/2026-27/players/c23526-12.': { objectPosition: '50% 20%' }, // #18 李裕玄：臉部向圓形中線靠攏，髮頂仍完整
  '/assets/seasons/2026-27/players/c23526-13.': { objectPosition: '50% 0%' }, // #19 陳敬玄：保留頭頂及臉部視覺中心
  '/assets/seasons/2026-27/players/c23526-14.': { objectPosition: '50% 18%', transform: 'scale(1.04)' }, // #26 黃楷堯：縮減過度放大，髮頂完整且五官置中
  '/assets/seasons/2026-27/players/c23526-15.': { objectPosition: '50% 0%' }, // #30 傅韋達：避免直式證件照切髮頂
  '/assets/seasons/2026-27/players/c23526-16.': { objectPosition: '50% 31%' }, // #31 何啟聖：補足下巴、改善臉部垂直中線
  '/assets/seasons/2026-27/players/c23526-17.': { objectPosition: '50% 33%' }, // #32 温立丞：原圖面部與長髮比對後下修取景中心，保留髮頂、完整五官與下巴
  '/assets/seasons/2026-27/players/c23526-18.': { objectPosition: '50% 0%' }, // #69 朱少立：避免證件照切髮頂
  '/assets/seasons/2026-27/players/c23526-19.': { objectPosition: '50% 0%' }, // #71 李俊逵：避免證件照切髮頂
  '/assets/seasons/2026-27/players/c23526-20.': { objectPosition: '50% 0%' }, // #77 黃峻德：上移取景，保留髮頂

  // Full-site second-pass crop review: source-level, one portrait at a time.
  '/assets/seasons/2026-27/players/tq26-08.': { objectPosition: '50% 0%', transform: 'translateY(10%) scale(1.4)' }, // #23 鄭孟育：保留頭頂及臉部大小
  '/assets/seasons/2026-27/players/khk26-04.': { objectPosition: '50% 0%' }, // 高雄香港人 #18 蒲家威：證件照完整髮頂
  '/assets/seasons/2026-27/players/tq26-03.': { objectPosition: '50% 0%' }, // 銅雀 #12 郭博彥：完整髮頂
  '/assets/seasons/2026-27/players/tq26-02.': { objectPosition: '50% 16%' }, // 銅雀 #8 李偉豪：上移取景，髮頂留白且人臉置中
  '/assets/seasons/2026-27/players/tq26-07.': { objectPosition: '50% 15%' }, // 銅雀 #10 李相慶：避免置中裁掉髮頂
  '/assets/seasons/2026-27/players/tq26-17.': { objectPosition: '50% 25%' }, // 銅雀 #15 戴子謙：保留髮頂與臉部比例
  '/assets/seasons/2026-27/players/tq26-13.': { objectPosition: '50% 26%' }, // 銅雀 #58 張斳恩：保留完整髮型、臉維持中央
  '/assets/seasons/2026-27/players/tq26-01.': { objectPosition: '50% 0%' }, // 銅雀 #33 陳揚：頂部取景，避免置中裁去頭髮
  '/assets/seasons/2026-27/players/tq26-10.': { objectPosition: '50% 0%', transform: 'scale(1.08)' }, // 銅雀 #99 葉俊謙：保留髮頂並適度放大
  '/assets/seasons/2026-27/players/tq26-11.': { objectPosition: '50% 15%', transform: 'scale(1.25)' }, // 銅雀 #19 王奕中：保留髮頂並適度放大
  '/assets/seasons/2026-27/players/tq26-12.': { objectPosition: '50% 0%', transform: 'scale(1.05)' }, // 銅雀 #31 吳雄杰：上緣完整、小幅放大
  '/assets/seasons/2026-27/players/tq26-14.': { objectPosition: '50% 0%', transform: 'scale(1.08)' }, // 銅雀 #13 孫進楠：完整髮頂、小幅放大
  '/assets/seasons/2026-27/players/tq26-09.': { transform: 'translate(-27%, 37%) scale(2.1)' }, // 銅雀 #9 陳宗漢：臉部更清楚、保留原本橫向中心
  '/assets/seasons/2026-27/players/tq26-04.': { transform: 'translateY(9%) scale(1.25)' }, // 銅雀 #93 施博允：放大臉部、位置維持中央
  '/assets/seasons/2026-27/players/tq26-15.': { transform: 'translateY(6%) scale(1.15)' }, // 銅雀 #46 林宴丞：小幅放大、置中臉部
  '/assets/seasons/2026-27/players/khk26-07.': { objectPosition: '50% 0%', transform: 'translateY(-6%) scale(1.65)' }, // #17 高義莉：上移偏低的臉與五官，保留髮型及下巴
  '/assets/seasons/2026-27/players/khk26-09.': { transform: 'translateY(28%) scale(2)' }, // #23 李世琦：將人臉置中，保留完整髮頂
  '/assets/seasons/2026-27/players/khk26-14.': { transform: 'translateY(17%) scale(1.5)' }, // 隊服半身照
  // 屏東野猿：依原始 Excel xl/media 與 48/104/160px 實圖逐張檢查。
  // 只修髮頂遭預設置中裁切的照片；#2 比賽截圖特殊裁切及 #88 已確認設定保留。
  '/assets/seasons/2026-27/players/pwa26-02.': { objectPosition: '50% 0%' }, // #44 連哲緯：證件照髮頂接近原始上緣，不再垂直置中截斷
  '/assets/seasons/2026-27/players/pwa26-05.': { objectPosition: '50% 0%' }, // #7 林彥文：證件照優先保留上方髮型；原圖本身帶證件紋路
  '/assets/seasons/2026-27/players/pwa26-06.': { objectPosition: '50% 0%' }, // #9 戴威閎：完整保留上方捲髮及五官
  '/assets/seasons/2026-27/players/pwa26-07.': { objectPosition: '50% 30%' }, // #3 黃浩程：直式生活照上移至自然頭肩比例
  '/assets/seasons/2026-27/players/pwa26-08.': { objectPosition: '50% 0%' }, // #50 吳明興：證件照髮頂完整納入圓框
  '/assets/seasons/2026-27/players/pwa26-09.': { objectPosition: '50% 0%' }, // #8 簡法亦：保留髮頂並同步隊職員領隊頭像
  '/assets/seasons/2026-27/players/pwa26-11.': { objectPosition: '50% 10%' }, // #43 陳奕盛：證件照保留上方髮型並維持下巴空間
  '/assets/seasons/2026-27/players/pwa26-14.': { objectPosition: '50% 0%' }, // #13 張富勝：證件照保留直立髮型
  '/assets/seasons/2026-27/players/pwa26-15.': { objectPosition: '50% 0%' }, // #17 簡罡正：完整保留軍服照上方髮型
  '/assets/seasons/2026-27/players/pwa26-16.': { objectPosition: '50% 0%' }, // #16 吳明遠：證件照保留髮頂及臉部
  '/assets/seasons/2026-27/players/pwa26-17.': { objectPosition: '50% 20%' }, // #5 陳柏諧：原圖長身照調整至頭肩、完整頭髮與下巴
  '/assets/seasons/2026-27/players/pwa26-19.': { objectPosition: '50% 0%' }, // #40 黃震浩：保留髮頂並同步隊職員教練頭像
  '/assets/seasons/2026-27/players/pwa26-04.': { transform: 'translateY(18%) scale(1.45)' }, // 比賽照
  '/assets/seasons/2026-27/players/pwa26-18.': { objectPosition: '50% 0%' }, // 屏東野猿 蔡振偉：上移裁切以保留頭頂與髮型
  // 台南長青第二輪嚴格髮頂驗收：以 #21 吳進偉（本隊）及 KUROMI #16（全站）作參考。
  // 與 2026/27 Excel xl/media 內嵌原圖、48/104/160px 實際路由對照後，逐人保留頭髮與下巴。
  // 某些原圖頂端本身空間極少；禁止用放大犧牲髮頂、誤當合格。
  '/assets/seasons/2026-27/players/te26-01.': { objectPosition: '50% 0%' }, // #5 林昱丞：髮頂／頭皮保留
  '/assets/seasons/2026-27/players/te26-02.': { objectPosition: '50% 0%' }, // #6 陳柏宇：目前髮頂被中央裁切
  '/assets/seasons/2026-27/players/te26-03.': { objectPosition: '50% 0%' }, // #7 劉宗瑋：保留上方髮型
  '/assets/seasons/2026-27/players/te26-04.': { objectPosition: '50% 0%' }, // #8 曹冠祥：取消上一輪過度放大，恢復完整髮頂
  '/assets/seasons/2026-27/players/te26-05.': { objectPosition: '50% 0%' }, // #10 蕭貽陽：保留髮頂與額頭
  '/assets/seasons/2026-27/players/te26-07.': { objectPosition: '50% 0%' }, // #16 毛鎮峰：上移取景完整髮型
  '/assets/seasons/2026-27/players/te26-08.': { objectPosition: '50% 0%' }, // #18 葉博煜：取消上一輪過度放大，保留髮型
  '/assets/seasons/2026-27/players/te26-09.': { objectPosition: '50% 0%' }, // #19 李進豐：保留頭頂
  '/assets/seasons/2026-27/players/te26-10.': { objectPosition: '50% 0%' }, // #20 劉錦鴻：保留完整髮頂
  '/assets/seasons/2026-27/players/te26-12.': { objectPosition: '50% 0%' }, // #23 譚敬耀：保留髮型上緣
  '/assets/seasons/2026-27/players/te26-13.': { objectPosition: '50% 0%' }, // #24 涂旭東：避免灰髮髮頂被切掉
  '/assets/seasons/2026-27/players/te26-14.': { objectPosition: '50% 0%' }, // #29 陳建華：網站已有來源，上方取景保留髮型；Excel 缺原圖
  '/assets/seasons/2026-27/players/te26-15.': { objectPosition: '50% 0%' }, // #33 李鎰昇：保留上方髮頂
  '/assets/seasons/2026-27/players/te26-16.': { objectPosition: '50% 0%' }, // #36 劉允閎：保留前額與上方髮型
  '/assets/seasons/2026-27/players/te26-18.': { objectPosition: '50% 0%' }, // #66 周學廣：取消上一輪過度放大，保留完整頭髮
  '/assets/seasons/2026-27/players/te26-19.': { objectPosition: '50% 0%' }, // #75 鄭俊麟：上移取景保留髮型
  '/assets/seasons/2026-27/players/te26-20.': { objectPosition: '50% 0%' }, // #88 王中更：避免頂部頭髮被切掉
  '/assets/seasons/2026-27/players/te26-06.': { objectPosition: '50% 0%' }, // #14 徐鈺凱：既有合格上緣取景，保留
  '/assets/seasons/2026-27/players/te26-11.': { objectPosition: '50% 0%' }, // #21 吳進偉：Owner 確認的本隊參考範本，保留
  // 黑狼 #67、#9、#18、#22、#12：使用 2026-11-04 Excel 原圖專用 720px 正方形取景；
  // 不再套舊版長方形縮圖的取景偏移，由來源直接保障完整髮頂及下巴。
  'assets/seasons/2026-27/players/bw26-07.': { objectPosition: '50% 18%' }, // 黑狼 #7 張智勇：取景上移、髮頂與下巴完整
  'assets/seasons/2026-27/players/bw26-10.': { objectPosition: '50% 12%' }, // 黑狼 #20 朱天灝：由置中改為略偏上取景、保留完整髮頂
  '/assets/seasons/2026-27/players/bw26-08.': { objectPosition: '50% 0%', transform: 'translateY(55%) scale(2.2)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/bw26-12.': { objectPosition: '50% 0%', transform: 'translate(6%, 15%) scale(1.35)' }, // 黑狼 #28 胡立邦：微向右置中臉部；保留髮頂與原縮放比例
  '/assets/seasons/2026-27/players/bw26-13.': { transform: 'translateY(19%) scale(1.6)' }, // 隊服全身照
  '/assets/seasons/2026-27/players/lz26-06.': { objectPosition: '50% 0%' }, // 避免頭頂二次裁切
  // WANDERERS：已按 Owner 指示用當季 Excel 同一人的高畫質來源重裁；不可把照片像素品質限制稱為待補照。
  '/assets/seasons/2026-27/players/wa26-06.': { transform: 'translateY(19%) scale(1.6)' }, // 手持球衣
  '/assets/seasons/2026-27/players/kbk26-04.': { transform: 'translate(30%, 90%) scale(3)' }, // #36 PATRICK HAINES：從遠距離合照聚焦本人頭肩，原圖清晰度仍有限
  '/assets/seasons/2026-27/players/kbk26-11.': { objectPosition: '50% 0%', transform: 'scale(1.2)' }, // #35 DICKSON：保留髮頂與下巴；原照僅 163×279，需更高清來源
  // 聖騎士 2026/27 — 最新 Excel 19 張內嵌人物照片已核對。
  // 各人物獨立調整，依 KUROMI #16 已核准臉部／髮頂／下巴的構圖比例。
  '/assets/seasons/2026-27/players/holy26-01.': { objectPosition: '50% 20%' }, // #77 林暐傑：髮頂與下巴保留
  '/assets/seasons/2026-27/players/holy26-02.': { objectPosition: '50% 15%' }, // #14 劉子祥：避免中置裁斷分線髮型
  '/assets/seasons/2026-27/players/holy26-03.': { objectPosition: '50% 0%' }, // #13 蘇帟緁：保留完整瀏海和髮頂
  '/assets/seasons/2026-27/players/holy26-05.': { objectPosition: '50% 0%' }, // #23 徐貫評：完整髮頂、學士袍視覺
  // #3 黃柏文：改用相同原圖的獨立方形 WebP，避免舊版髮頂與下巴受裁
  // #79 謝承晉：改用相同原圖的獨立方形 WebP，避免原照太滿
  '/assets/seasons/2026-27/players/holy26-09.': { objectPosition: '50% 0%' }, // #86 周宥廷：避免髮型貼圓框
  '/assets/seasons/2026-27/players/holy26-12.': { objectPosition: '50% 10%' }, // #7 王立任：減少證件相片下半身佔比
  '/assets/seasons/2026-27/players/holy26-13.': { objectPosition: '50% 15%' }, // #9 姚昇宏：留出髮頂
  // #53 范丞佑：改用同人原圖獨立方形 WebP，移除照片底部紙張白邊
  '/assets/seasons/2026-27/players/holy26-17.': { objectPosition: '50% 20%' }, // #33 張至虔：完整頭髮、臉部置中
  // 領隊 詹景森：新一輪真實路由實圖確認 20% 令五官偏低；恢復預設 50% 50%（保留原圖、避免裁到臉部）。
  // #1 陳竑沅的過度放大舊規則已移除，改用同人原圖的獨立方形裁切。
  // 另 #21、#95、#26、#2、#16 已在當季圖片映射切換至同人原圖的個別 WebP；保留舊 PNG 供溯源。
  '/assets/seasons/2026-27/players/sb26-02.': { transform: 'translateY(19%) scale(1.7)' }, // SOUTHBOYS 拉非：去除過多背景、放大臉部
  '/assets/seasons/2026-27/players/sb26-03.': { transform: 'translateY(47%) scale(2.1)' }, // SOUTHBOYS 孺立：原圖人頭位置偏上，放大至清楚可辨
  '/assets/seasons/2026-27/players/sb26-06.': { objectPosition: '50% 0%' }, // 蘇凡迪：保留 2026/27 原照頭頂
  '/assets/players/PPI TAINAN FC/蘇凡迪.': { objectPosition: '50% 0%' }, // 蘇凡迪：2025/26 歷史原照也保留頭頂
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
  '/assets/players/酒號矯正署/鄭詠翰.': { transform: 'translateY(51%) scale(1.7)' }, // 第二輪實圖回歸校正
  '/assets/players/酒號矯正署/何政緯.': { transform: 'translateY(24%) scale(1.6)' }, // 歷史遠景
  '/assets/players/屏東野猿足球俱樂部/尤尚佑.': { transform: 'translateY(22%) scale(1.6)' }, // 歷史球衣照
  '/assets/players/瘋Dog/劉力瑋.': { transform: 'translateY(18%) scale(1.5)' }, // 歷史戶外照
  '/assets/players/鳥仕足球俱樂部/王志誠.': { transform: 'translateY(25%) scale(1.6)' }, // 歷史全身照
  '/assets/players/鳥仕足球俱樂部/高義莉.': { transform: 'translateY(36%) scale(2.0)' }, // 歷史運動照
  '/assets/players/鳥仕足球俱樂部/陳宇翔.': { transform: 'translateY(25%) scale(1.65)' }, // 歷史球場遠景
  '/assets/players/鳥仕足球俱樂部/陳學璋.': { transform: 'translateY(20%) scale(1.5)' }, // 歷史上身照
  '/assets/players/鳥仕足球俱樂部/劉康任.': { transform: 'translateY(22%) scale(1.65)' }, // 歷史隊服照
  '/assets/players/蒼龍FC/李昆鴻.': { transform: 'translateY(38%) scale(1.55)' }, // 第二輪實圖回歸校正

  // Source photos with large empty margins: individually focus on faces.
  // 嘉義 235 FC 隊職員（依已核准 KUROMI #16 人像構圖標準逐人校正）
  // 台南長青隊職員：依 Excel xl/media/image1.png、image2.png 與 48/104/160px 圓形對照，
  // 將偏向原圖頂端的髮型完整保留；曹冠祥沿用球員 #8 te26-04 的既有取景。
  '/assets/seasons/2026-27/staff/evergreen-kung-ping-fang.': { objectPosition: '50% 0%' }, // 領隊 龔炳芳：髮頂保留，避免置中裁切
  '/assets/seasons/2026-27/staff/evergreen-zhuang-jin-sheng.': { objectPosition: '50% 0%' }, // 管理 莊金生：保留灰髮頂部，臉部置中
  '/assets/seasons/2026-27/staff/chiayi235-tsai-meng-hsun.': { objectPosition: '50% 4%' }, // 蔡孟勲：原圖上方取景，避免髮頂被圓形切斷
  '/assets/seasons/2026-27/staff/chiayi235-tsai-ming-han.': { objectPosition: '50% 10%' }, // 蔡明瀚：完整頭髮／眼鼻／下巴於中線，避免預設中央裁掉髮頂
  '/assets/seasons/2026-27/staff/chiayi235-guo-zheng-da.': { objectPosition: '50% 7%' }, // 郭政達：將取景往上移，保留完整髮型
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
