# SOUTHBOYS FC｜#12 亞萬頭像重裁（2026-11-04）

- Owner 明確判定前版 #12 頭像不合格，先前「全隊通過」的結論不適用於此人物。
- 從原始 [south.xlsx](https://docs.google.com/spreadsheets/d/1YYn2C4GPk0J4dFfu0HGUf2HOnZ2bROZX/edit) 的 `xl/media/image17.jpeg` 直接讀取 341×605 原始 JPEG（對照登錄 #12 亞萬），**非 Excel 預覽縮圖**。
- 現用本季圖片 `sb26-12.png` 長方形照片搭配 `translateY(33%) scale(1.9)`，實際 48／104／160px 圓形取景過度放大，下巴與髮頂餘裕不足。圖片可解碼／遮罩完整不代表人像構圖合格。
- 新圖片 `public/assets/seasons/2026-27/players/sb26-12-excel-portrait-20261104.webp`：在原圖座標擷取 x45–295、y148–398，等比放大為 720×720 WebP（53,378 bytes）。保留原人像的髮頂、五官、下巴與部分肩膀；不生成五官、不拉伸人物。
- 僅更新 `data/seasons/2026-27/playerImages.json` 中「亞萬」的路徑，並移除 `config/avatarImagePosition.ts` 對此舊長方形照片的過時 CSS。其餘 SOUTHBOYS、各隊職員與其他球隊照片、歷史賽季皆不更動。
- 已本地模擬檢視 48／104／160px 圓形；仍須以本次 Commit 的 GitHub Actions 驗證 TypeScript、資料、Build 與 SOUTHBOYS 真實 Team／Player／Staff 路由（390px／1280px）及 GitHub Pages 預覽部署。**自動測試通過不等於 Owner 已核准視覺。**
