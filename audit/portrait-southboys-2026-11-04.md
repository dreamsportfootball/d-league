# SOUTHBOYS FC｜2026/27 人物頭像原圖及二次裁切（2026-11-04）

## Owner 標準與來源
- 原始登錄資料：Google Drive [south.xlsx](https://docs.google.com/spreadsheets/d/1YYn2C4GPk0J4dFfu0HGUf2HOnZ2bROZX/edit)，從 `xl/media` 提取完整內嵌照片，使用 `xl/drawings/drawing1.xml` 圖像錨點和原始球員登錄列核實名字。不是使用 Excel 預覽縮圖。
- 15 位登錄球員，2 筆隊職員（領隊劉駿輝也是 #15 球員、管理陳美玲另外登錄），實際 **16 位不同人物**。姓名、球隊、級別、賽果及歷史賽季完全不變。
- 使用 Notion 正式規範、`docs/portrait-avatar-framing-standard.md`；KUROMI #16 巫嘉德及台南長青 #21 吳進偉為取景比較基準。應在 48／104／160px 圓形內保留完整髮頂、下巴及面部，不能以「圖片解碼成功」代表視覺合格。
- 全隊逐張對比 Excel 內嵌原圖和本季網站映射，現有頭像均與同隊姓名對應。對長方形或全身照另製 720×720 WebP，只裁切／有限延伸原照背景，不修改五官或任意拉伸面部，避免在 CSS 中以過大倍率和位移截掉頭部。

## 每人決策
| 背號／職員 | 人物 | 來源與結果 |
|---|---|---|
| #1 | 杰菲 | Excel image3.jpeg（334×445），正面人像完整，現有當季映射保留 |
| #2 | 拉非 | Excel image7.png（1203×1361），原圖清楚；現有個別裁切與髮頂完整，保留 |
| #3 | 孺立 | Excel image8.jpeg（612×816），現有放大後臉部可辨、未發現必須更動的髮頂缺失，保留 |
| #4 | 李福祥 | Excel image9.jpeg（315×446）；**重新裁切** 720×720，保留髮頂和下巴，去除舊 1.3 倍取景偏移；來源原本有低解析度限制 |
| #5 | 牙提 | Excel image10.png（1108×1477），舊直式網站素材在 160px 圓形容易壓迫髮型和下巴；**重新裁切**。原照背景延伸僅作用在背景區，未改五官 |
| #6 | 蘇凡迪 | Excel image11.png（449×661）；髮頂與五官可辨，現有 50% 0% 設定保留 |
| #7 | 伊而凡 | Excel image12.jpeg（416×600）；現有 50% 0% 設定保留 |
| #8 | 朴禮薩 | Excel image13.jpeg（569×599）；**重新裁切**，保留髮頂，取代舊 translateY(61%) scale(2.3) 過大移位 |
| #9 | 艾力夫 | Excel image14.jpeg（335×446）；**重新裁切**，髮頂與下巴保留，取代舊偏頂取景 |
| #10 | 孫瑞文 | Excel image15.jpeg（374×374）；原來正方形素材、五官完整，保留 |
| #11 | 迪馬斯 | Excel image16.jpeg（510×435）；**重新裁切**，不再將遠景過度放大 3.1 倍。臉部原始像素有限，仍建議補較清晰單人照 |
| #12 | 亞萬 | Excel image17.jpeg（341×605）；原本 1.9 倍裁切尚可保留完整髮型與五官，保留 |
| #13 | 偉亦 | Excel image18.jpeg（348×619）；**重新裁切**，臉部置中並保留髮頂；原照略柔焦，仍受來源限制 |
| #14 | 立嘉 | Excel image19.jpeg（771×1600）；**重新裁切**，從全身遠景擷取頭肩，避免過大背景／錯誤下移；臉部原像素較少，仍建議補清楚正面單人照 |
| #15／領隊 | 劉駿輝 | Excel image1.jpeg（413×531）；**重新裁切**，讓頭髮和下巴都在圓框安全區。球員及領隊同名最新照片由共用身份映射取得 |
| 管理 | 陳美玲 | Excel image2.jpeg（358×448）；網站目前已使用 `staff/southboys-chen-mei-ling-excel.jpeg`，原圖清楚、髮頂與下巴完整，保留 |

## 修改檔案與範圍
- 新增 8 張 `public/assets/seasons/2026-27/players/sb26-{04,05,08,09,11,13,14,15}-excel-portrait-20261104.webp`。均為 720×720、各別從同人 Excel 原圖處理。
- `data/seasons/2026-27/playerImages.json`：只替換上述 8 人的新照片映射。
- `config/avatarImagePosition.ts`：移除不再適合新正方形照片的七筆舊裁切例外；保留其他 7 名球員、管理陳美玲及其他球隊的全部取景設定。
- `scripts/audit-next-five-portrait-routes.mjs` 與對應 GitHub Actions workflow：將 `t_southboys_2026` 納入真實 TeamPage、PlayerPage、StaffPage 的 Playwright QA，並保存 390px 手機與 1280px 桌面版 48／104／160px 實際圖片對照；舊隊邏輯保留。

## 限制與驗證
- 本地原圖與模擬圓形已做目視比較，但**模擬不等於實際網站 QA**。完成須另確認 TypeScript、賽季資料驗證、production build、GitHub Actions、預覽 commit 與實際截圖。
- 本報告只記錄修正後候選；最終視覺驗收仍以 Owner 確認為準。
- 需補清楚原照優先：#11 迪馬斯、#14 立嘉；#4 李福祥與 #13 偉亦的原圖畫質亦受限。不得用 AI 生成臉部冒充高清原圖。
