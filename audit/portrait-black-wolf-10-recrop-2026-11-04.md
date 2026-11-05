# 黑狼 FC｜#10 王廷夫頭像重裁（2026-11-04）

## 要求與問題
Owner 明確判定 #10 王廷夫的大頭照不合格。原本本季網站使用 `bw26-16.png`（214×285），是低解析度直式縮圖，在 48／104／160px 圓形中人物比例過大，會切去髮頂和下巴；先前影像已解碼和圓形遮罩通過並不等於 Owner 驗收通過。

## 原始來源
[黑狼 FC 2026/27 登錄 Excel](https://docs.google.com/spreadsheets/d/138qYWAFXyJ9Y8YNM2RTbTX02iZWSs6gc/edit)，工作表球員 #10 對應第 29 列、`xl/media/` JPEG 內嵌原圖 1108×1477。同人原圖比現有網站 214×285 缩圖清晰，使用 Excel 嵌入 JPEG，不是儲存格預覽截圖。

## 實際修改
- 新增 `public/assets/seasons/2026-27/players/bw26-16-excel-portrait-20261104.webp`（720×720 WebP；59,300 bytes）。
- 從原圖等比例縮小，完整保留髮頂、五官與下巴；只在背景/肩膀外側以同源圖像邊緣柔焦延伸補滿正方形，未修飾五官、未生成新的臉、不水平拉伸。
- `data/seasons/2026-27/playerImages.json` 只替換王廷夫當季路徑；其餘球員、兼任領隊及其他球隊完全不變。
- `config/avatarImagePosition.ts` 原本對 #10 無特殊覆蓋；新正方形照直接使用既有預設 `50% 50%`。
- 在本地用原圖、720px 正方形、48／104／160px 圓形並排視覺比對；新照片髮頂和下巴有空間。實際 TeamPage／PlayerPage 的結果仍以本次 GitHub Actions 真實瀏覽器截圖為準。

## 驗證邊界
需要查核 TypeScript、資料驗證、production build、真實頁面（390px／1280px）及 preview 部署版本與 Commit 一致；**在 CI 完成前不能宣稱部署或最終視覺合格**。Owner 未重新驗收前保持待確認狀態。

修改分支 `season/2026-27`；不得直接修改 `master`。
