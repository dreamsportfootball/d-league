# SF 足球俱樂部｜2026/27 全隊頭像第二輪逐人驗收（2026-11-04）

## 驗收來源及基準
- 原始球隊登錄：[SF 足球俱樂部.xlsx](https://docs.google.com/spreadsheets/d/1AbNhjfgtDhz_aGRLWTlTpMTNLT5QUVTa/edit)，直接讀取 `xl/media/` 內嵌圖片，依 `xl/drawings/drawing1.xml` 的儲存格錨點核對本人，不使用 Excel 預覽縮圖。
- 20 名球員、3 筆隊職員；管理許凱昱為 #6、教練鄭詠翰為 #12，領隊吳孟容另外登錄，**21 位不同人物**。
- 核對 2026/27 `players.json`、`teams.json`、`playerImages.json` 與網站 2026-10-30／31 實際 390px、1280px 人像稽核截圖，依 Notion 人物頭像 SOP、`docs/portrait-avatar-framing-standard.md` 與 Owner 已核准的 KUROMI #16 巫嘉德／台南長青 #21 吳進偉構圖標準，髮頂與下巴優先。
- 本批照片只做裁切、單純旋轉或等比例縮放，**不生成或改變五官**。沒有更換球員身份、球衣背號、賽事數據，保護已核准其他球隊與 2025/26 歷史資料。

## 逐人結果
| 2026/27 背號／職員 | 人物 | Excel 嵌入圖片 | 本次判定 |
|---|---|---|---|
| #19 | 陳欣敏 | image1.jpeg，357×432 | 保留既有小幅放大，髮頂／下巴可辨 |
| #21 | 謝昊哲 | image2.jpeg，308×420 | 保留 |
| #17 | 林暐濠 | image3.jpeg，285×401 | 保留 |
| #48 | 杜睿博 | image4.jpeg，328×437 | **原圖泛白／細節不足，需要補清晰正面照；不以濾鏡假裝修復** |
| #23 | 廖新凱 | image5.jpeg，317×426 | 保留 |
| #3 | 陳宥成 | image6.jpeg，295×352 | 保留；髮型貼近原圖上界，建議日後更新更完整的原圖 |
| #26 | 潘俐言 | image7.jpeg，331×420 | 保留 |
| #37 | 黃晨崴 | image8.jpeg，330×423 | 保留 |
| #22 | 林博宇 | image9.jpeg，327×421 | 保留 |
| #5 | 魏信宇 | image10.jpg，263×316 | 保留 |
| #10 | 蔡仲恩 | image11.jpeg，321×431 | 保留 |
| #89 | 洪家庭 | image12.jpeg，311×415 | **來源圖片反光斑遮臉，需補照；無法由 CSS 修復** |
| #7 | 趙苡翔 | image13.jpeg，252×448 | 保留既有取景；自拍照片有眼鏡反光，不能以裁切消除 |
| #9 | 黃嵩崴 | image14.jpeg，324×417 | 保留 |
| #13 | 林亮昀 | image15.jpeg，288×432 | 保留 |
| #16 | 楊哲銘 | image16.jpeg，344×344 | **重新裁切**：從原始 344×344 抽取頭肩區並輸出 720×720 WebP，減少白色背景、保留完整頭髮和下巴 |
| #6／管理 | 許凱昱 | image17.jpeg，262×465 | 保留原圖；管理與球員須共用同一人物來源 |
| #12／教練 | 鄭詠翰 | image19.jpeg，287×431 | **重新裁切**：遠景中取頭肩範圍，輸出 720×720 WebP，移除過去 `scale(2.7)` 位移；教練與球員同步使用。臉部原始像素較少，仍受畫質限制 |
| #82 | 蔡銘洧 | image18.jpeg，283×377 | **重新裁切**：原照片向斜角拍攝，從來源照片擷取後逆向旋正 20°，視覺置中，保留髮頂、五官與下巴；不拉伸五官、不變更人物 |
| #11 | 呂承燁 | image20.jpeg，364×364 | **重新裁切**：屋頂遠景取完整頭肩，輸出 720×720 WebP；原照臉部像素不足，若需高清仍須補照 |
| 領隊 | 吳孟容 | image23.jpeg，229×407 | 保留與 Excel 來源一致的 `sf-wu-meng-rong.jpg`。人物部分頭髮緊貼原圖上界，無更好原始照片，必要時補照 |

## 只修改的檔案
1. 新增 `public/assets/seasons/2026-27/players/sf26-{16,18,19,20}-excel-portrait-20261104.webp` 4 張同人原照製作的正方形圖片。
2. `data/seasons/2026-27/playerImages.json`：只更改楊哲銘、鄭詠翰、蔡銘洧、呂承燁四人的當季圖片索引。
3. `config/avatarImagePosition.ts`：移除 sf26-18／19／20 三筆僅適用於舊全身照的特例，其他所有設定保留。
4. `.github/workflows/five-team-portrait-route-qa.yml`：把球員原圖／映射變更加入現有 Playwright 真實頁面 QA 觸發條件，矩陣仍是原有五隊，不變更 QA 內容。
5. 本核對報告 `audit/portrait-sf-2026-11-04.md`。

## QA 與驗收邊界
- 本地完成 Excel 原圖／48px／104px／160px 模擬圓形逐張目視，新 4 張均無明顯露白或切髮頂。模擬圖不是網站實際截圖；先前 `audit/five-team-sf-actual-desktop-1280.jpg` 等為修改前 baseline。
- 必須獨立核對本次 GitHub Actions 的 TypeScript、資料驗證、production build、390px／1280px 真實 TeamPage／PlayerPage／StaffPage，及 GitHub Pages 預覽實際 Commit／資產後，才能聲稱原始碼、QA、部署各自完成。
- **通過自動 QA 不等於照片視覺已獲 Owner 最終驗收**，建議優先補照 #48 杜睿博與 #89 洪家庭；#12 鄭詠翰、#11 呂承燁仍受原照遠景像素限制。
