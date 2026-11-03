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
  '/assets/seasons/2026-27/staff/southboys-chen-mei-ling-excel.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/pw26-08.': { objectPosition: '50% 85%' },
  '/assets/seasons/2026-27/players/pw26-11.': { transform: 'scale(1.18)' }, // 屏東野狼 林瑶璇：取消向下位移，令臉部重新置中

  // Individually reviewed in the 104px / 48px circular portrait QA sheets.
  '/assets/seasons/2026-27/players/sf26-01.': { transform: 'translateY(16%) scale(1.4)' }, // SF 陳欣敏：半身照讓臉部比例清楚
  '/assets/seasons/2026-27/players/sf26-13.': { objectPosition: '50% 85%' },
  '/assets/seasons/2026-27/players/sf26-15.': { objectPosition: '50% 0%' },
  '/assets/seasons/2026-27/players/sf26-18.': { objectPosition: '50% 20%', transform: 'translateY(-8%) scale(2.7)' }, // SF 鄭詠翰：放大球場遠景中的臉部
  '/assets/seasons/2026-27/players/sf26-19.': { objectPosition: '50% 63%', transform: 'translate(28%, -18%) scale(1.7)' },
  '/assets/seasons/2026-27/players/sf26-20.': { transform: 'translateY(67%) scale(3)' }, // SF 呂承燁：全身照拉近至頭肩
  '/assets/seasons/2026-27/players/ka26-02.': { objectPosition: '50% 0%', transform: 'translateY(37%) scale(2.9) scaleX(1.56)' }, // 高雄業餘 #3 李昆鴻：依 Excel 內嵌圖片的橫向拉伸比例
  '/assets/seasons/2026-27/players/tq26-06.': { objectPosition: '50% 0%', transform: 'translateY(50%) scale(2)' },
  '/assets/seasons/2026-27/players/ku26-04.': { objectPosition: '50% 0%', transform: 'translate(4%, -30%) scale(2)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/kbk26-01.': { objectPosition: '50% 0%', transform: 'translate(-28%, 28%) scale(1.6)' }, // #10 Joel Vega：保留髮頂，單獨聚焦本人，避免頂部露底
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
  'assets/seasons/2026-27/players/khk26-02.': { transform: 'translate(-35%, 29%) scale(1.75)' }, // 高雄香港人 謝俊杰：以人物頭臉為中心，避開前景貓咪
  '/assets/seasons/2026-27/players/khk26-06.': { transform: 'translate(4%, -3%) scale(1.9)' },
  '/assets/seasons/2026-27/players/khk26-11.': { transform: 'translate(-11%, 24%) scale(2)' },
  '/assets/seasons/2026-27/players/kbk26-12.': { transform: 'translate(19%, 38%) scale(1.85)' }, // #7 姜斌：保留髮頂，聚焦合照左側本人
  '/assets/seasons/2026-27/players/ka26-38.': { transform: 'translateY(34%) scale(2.5) scaleX(1.49)' }, // 高雄業餘 #7 潘晨維：依 Excel 內嵌圖片的橫向拉伸比例

  // Second-pass 104px / 48px face and hairline review (2026-10-30).
  '/assets/seasons/2026-27/players/sf26-05.': { objectPosition: '50% 0%' }, // 廖新凱：避免裁掉髮頂
  '/assets/seasons/2026-27/players/sf26-12.': { objectPosition: '50% 0%' }, // 洪家庭：維持照片完整頂部
  '/assets/seasons/2026-27/players/lz26-17.': { objectPosition: '50% 0%' }, // 林宜蓁：維持照片完整頂部
  '/assets/seasons/2026-27/players/wa26-04.': { objectPosition: '50% 0%' }, // 蔡羿丞：避免裁掉髮頂
  '/assets/seasons/2026-27/players/lz26-05.': { objectPosition: '50% 0%' }, // 李修沛：避開原始照片下方其他畫面
  '/assets/seasons/2026-27/players/sb26-04.': { objectPosition: '50% 0%', transform: 'translateY(13%) scale(1.3)' }, // 李福祥：保留完整頭髮並突出五官
  '/assets/seasons/2026-27/players/sb26-07.': { objectPosition: '50% 0%' }, // 伊而凡：避免裁掉頭髮
  '/assets/seasons/2026-27/players/sb26-11.': { transform: 'translateY(95%) scale(3.1)' }, // 迪馬斯：全身照聚焦頭肩
  '/assets/seasons/2026-27/players/sb26-15.': { objectPosition: '50% 0%' }, // 劉駿輝：保留完整髮頂，同步套用球員及領隊頭像
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
  '/assets/seasons/2026-27/players/khk26-07.': { objectPosition: '50% 0%', transform: 'translateY(10%) scale(1.55)' }, // #17 高義莉：減少過度放大、讓臉部居中
  '/assets/seasons/2026-27/players/khk26-09.': { transform: 'translateY(35%) scale(2)' }, // 站立半身照
  '/assets/seasons/2026-27/players/khk26-14.': { transform: 'translateY(17%) scale(1.5)' }, // 隊服半身照
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
  'assets/seasons/2026-27/players/bw26-01.': { objectPosition: '50% 22%' }, // 黑狼 王浩誠：上移取景，保留髮頂、臉與下巴
  'assets/seasons/2026-27/players/bw26-02.': { objectPosition: '50% 0%' }, // 黑狼 王瑞淯：保留帽頂，避免居中裁去上緣
  'assets/seasons/2026-27/players/bw26-07.': { objectPosition: '50% 18%' }, // 黑狼 #7 張智勇：取景上移、髮頂與下巴完整
  'assets/seasons/2026-27/players/bw26-10.': { objectPosition: '50% 12%' }, // 黑狼 #20 朱天灝：由置中改為略偏上取景、保留完整髮頂
  '/assets/seasons/2026-27/players/bw26-08.': { objectPosition: '50% 0%', transform: 'translateY(55%) scale(2.2)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/bw26-12.': { objectPosition: '50% 0%', transform: 'translateY(15%) scale(1.35)' }, // 戶外半身照
  '/assets/seasons/2026-27/players/bw26-13.': { transform: 'translateY(19%) scale(1.6)' }, // 隊服全身照
  '/assets/seasons/2026-27/players/lz26-06.': { objectPosition: '50% 0%' }, // 避免頭頂二次裁切
  '/assets/seasons/2026-27/players/lz26-13.': { transform: 'translate(14%, -1%) scale(2.4)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/wa26-06.': { transform: 'translateY(19%) scale(1.6)' }, // 手持球衣
  '/assets/seasons/2026-27/players/kbk26-04.': { transform: 'translate(30%, 90%) scale(3)' }, // #36 PATRICK HAINES：從遠距離合照聚焦本人頭肩，原圖清晰度仍有限
  '/assets/seasons/2026-27/players/kbk26-11.': { objectPosition: '50% 0%', transform: 'scale(1.2)' }, // #35 DICKSON：保留髮頂與下巴；原照僅 163×279，需更高清來源
  '/assets/seasons/2026-27/players/holy26-07.': { objectPosition: '50% 0%', transform: 'translateY(-24%) scale(1.85)' }, // 第二輪實圖回歸校正
  '/assets/seasons/2026-27/players/sb26-02.': { transform: 'translateY(19%) scale(1.7)' }, // SOUTHBOYS 拉非：去除過多背景、放大臉部
  '/assets/seasons/2026-27/players/sb26-09.': { objectPosition: '50% 15%' }, // SOUTHBOYS 艾力夫：保留頭髮頂部
  '/assets/seasons/2026-27/players/sb26-03.': { transform: 'translateY(47%) scale(2.1)' }, // SOUTHBOYS 孺立：原圖人頭位置偏上，放大至清楚可辨
  '/assets/seasons/2026-27/players/sb26-08.': { objectPosition: '50% 0%', transform: 'translateY(61%) scale(2.3)' }, // 朴禮薩：臉部置中、保留頭頂
  '/assets/seasons/2026-27/players/sb26-06.': { objectPosition: '50% 0%' }, // 蘇凡迪：保留 2026/27 原照頭頂
  '/assets/players/PPI TAINAN FC/蘇凡迪.': { objectPosition: '50% 0%' }, // 蘇凡迪：2025/26 歷史原照也保留頭頂
  '/assets/seasons/2026-27/players/sb26-12.': { transform: 'translateY(33%) scale(1.9)' }, // 室內半身照
  '/assets/seasons/2026-27/players/sb26-13.': { transform: 'translateY(30%) scale(2)' }, // 人像半身照
  '/assets/seasons/2026-27/players/sb26-14.': { transform: 'translateY(66%) scale(2.7)' }, // 室內全身照
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
