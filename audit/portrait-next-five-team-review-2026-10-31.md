# D LEAGUE 2026/27｜KUROMI 之後第二批五隊人像驗收
日期：2026-10-31｜目標分支：`season/2026-27`

## 驗收標準
逐個檢視登錄原圖、球隊頁 48px 圓形頭像、球員／隊職員個人頁手機 104px 與電腦 160px 圓形頭像；實際開啟路由、檢查圖片解碼、資料對應、截圖和有無溢出。每隊手機 390px／桌面 1280px。原圖模糊不能因為自動測試通過就認定品質良好。

## 五隊結果

| 球隊 | 球員 | 隊職員 | 實際頁面檢查 | 實際裁切修正 | 原圖限制／待補照 |
|---|---:|---:|---:|---|---|
| 高雄香港人足球俱樂部 | 15 | 1 | 32 次個人頁＋2 次球隊頁 | 謝俊杰：已修正頭像中心，從貓咪轉向人物臉部；兼任隊職員同時生效 | 游淙瑋：遠景模糊；陳宇翔：距離遠、臉部模糊 |
| 屏東野猿足球俱樂部 | 19 | 3 | 44 次個人頁＋2 次球隊頁 | 0；保留目前能辨識頭臉的既有裁切 | 部分舊式證件照畫質略低，暫無必須只靠裁切修復個案 |
| 陳公舘 | 20 | 3 | 46 次個人頁＋2 次球隊頁 | 0；保留原有取景 | 洪品丞：全身遠景，臉部細節不足，建議換較近照片 |
| 台南長青足球俱樂部 | 20 | 3 | 46 次個人頁＋2 次球隊頁 | 0；保留原有清楚人像 | 未找到明顯必須補照個案 |
| 黑狼 FC | 16 | 1 | 34 次個人頁＋2 次球隊頁 | 王浩誠：保留髮頂；王瑞淯：保留帽頂；王浩誠隊職員頁同步 | 未找到明顯必須補照個案 |
| **合計** | **90** | **11** | **202 個人頁＋10 球隊頁** | **3 位人物、5 個顯示位置（含兼任職員）** | **3 位原圖需改善** |

## 真實對照圖

每張：左側登錄原圖縮圖；中間球隊頁 48px 真實頭像；右側球員／職員個人頁真實頭像。以下圖是程序產物，不等同自動化「審美通過」。

| 球隊 | 手機 390px | 電腦 1280px | DOM 檢查明細 |
|---|---|---|---|
| 高雄香港人 | [104px](./next-kaohsiung-hk-actual-mobile-390.jpg) | [160px](./next-kaohsiung-hk-actual-desktop-1280.jpg) | [JSON](./next-kaohsiung-hk-actual-route-review.json) |
| 屏東野猿 | [104px](./next-pingtung-wild-ape-actual-mobile-390.jpg) | [160px](./next-pingtung-wild-ape-actual-desktop-1280.jpg) | [JSON](./next-pingtung-wild-ape-actual-route-review.json) |
| 陳公舘 | [104px](./next-chen-actual-mobile-390.jpg) | [160px](./next-chen-actual-desktop-1280.jpg) | [JSON](./next-chen-actual-route-review.json) |
| 台南長青 | [104px](./next-tainan-evergreen-actual-mobile-390.jpg) | [160px](./next-tainan-evergreen-actual-desktop-1280.jpg) | [JSON](./next-tainan-evergreen-actual-route-review.json) |
| 黑狼 FC | [104px](./next-black-wolf-actual-mobile-390.jpg) | [160px](./next-black-wolf-actual-desktop-1280.jpg) | [JSON](./next-black-wolf-actual-route-review.json) |

## 重大根因、修復與檢查缺陷

原始裁切設定的 key 為 `'/assets/seasons/...'`，而實際球員資料存的值是 `'assets/seasons/...'`。因此即使 CI 能打開所有頭像，三張新規則也沒有生效。這次將高雄香港人 `khk26-02`、黑狼 `bw26-01` 和 `bw26-02` 的**三條 key** 改成與資料相符的格式，實際 DOM 讀回確認分別為 `transform:matrix(...)`、`object-position: 50% 22%`、`object-position: 50% 0%`。並新增測試斷言，避免再出現「有寫設定卻未套用」的假通過。

**範圍控制：** 這是只修三張規則的安全變更。其他年份或球隊仍有類似 key 格式，尚未完成逐張比對前不會全站打開舊規則，避免意外改動過去已確認的畫面。

第一輪截圖產生程序會錯誤地把不屬於目前隊伍的舊圖也一併上傳，可能覆蓋更新後截圖；已修正 workflow matrix 輸出模式，僅上傳當隊檔案，並重新產出證據。

## 變更與驗證
- [原圖路徑修正 Commit](https://github.com/dreamsportfootball/d-league/commit/64e2b7bab8fb9a77b7dea0f9d3011feb4e63bc14)
- [逐張規則實際生效驗證 Commit](https://github.com/dreamsportfootball/d-league/commit/269992baae235c2fa858a56c312272898d55b330)
- [五隊真實頁面驗證 Action](https://github.com/dreamsportfootball/d-league/actions/runs/41170225910)
- [預覽部署 Action](https://github.com/dreamsportfootball/d-league/actions/runs/41170225896)

最後兩個 Action 的成功與否以 GitHub 最新回傳結果為準。本報告**不宣稱**全站及尚未逐人實測的 375px、768px、1024px、1440px 均已通過，也不代表需補照者已修復。
