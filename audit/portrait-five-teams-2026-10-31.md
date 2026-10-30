# D LEAGUE 2026/27｜接續 KUROMI 的五隊人物頭像逐隊驗收

驗收日期：2026-10-31。分支：`season/2026-27`。原圖／104px／48px 圓形裁切均納入；實際路由用 Chromium 在 390px 與 1280px 下逐個打開 TeamPage、PlayerPage、StaffPage，保留頁面截圖及 DOM 圖片自然尺寸／裁切資訊。1280px 球員頁為 160px 圓形頭像。未實測的 375、768、1024、1440px 不宣稱已逐人驗收。

## 實際檢查量

| 球隊 | 球員 | 隊職員登錄 | 實際隊職員個人頁（同人合併） | 390px／1280px 個人頁進入 | 已修正 | 仍受原圖限制 |
|---|---:|---:|---:|---:|---|---|
| 台南鳥仕足球俱樂部 | 17 | 3 | 2 | 38 | 魏嘉成：原圖存在但資料漏連結，已補 | 無明顯必須重拍者 |
| SF足球俱樂部 | 20 | 3 | 3 | 46 | 陳欣敏、呂承燁、鄭詠翰：縮放／位移 | 杜睿博畫面泛白、洪家庭原照有反光遮臉 |
| 高雄業餘足球俱樂部 | 17 | 3 | 1 | 36 | 李昆鴻、潘晨維：縮放／位移 | 吳詠祥原照較模糊泛白 |
| 銅雀 | 17 | 2 | 2 | 38 | 0；沿用已有個別裁切 | 無明顯必須重拍者 |
| 屏東野狼足球俱樂部 | 15 | 3 | 3 | 36 | 林瑶璇：小幅放大及垂直定位 | 無明顯必須重拍者 |
| **合計** | **86** | **14** | **11** | **194** | **7 位（6 項裁切、1 項資料修復）** | **3 位建議日後提供品質更好的原照** |

此外每隊球隊頁 390px／1280px 各 1 次，合計 10 次，**204 次實際路由進入**。所有五隊 194 筆個人頁／影像載入資料，實測沒有錯誤、沒有水平溢出。這是「實際 React 頁面開啟與 48px／104px／160px 圓形裁切」檢查，並不表示原圖模糊與反光已經復原。

## 五隊逐張對照（均為實際頁面截圖）

每張對照圖：左原圖縮圖，中球隊頁實際 48px 圓形頭像，右球員／職員個人頁實際圓形頭像。

| 球隊 | 手機 390px（個人頁 104px） | 電腦 1280px（個人頁 160px） | 逐人 DOM 驗證 |
|---|---|---|---|
| 台南鳥仕 | [照片對照](./niaoshi-actual-mobile-390.jpg) | [照片對照](./niaoshi-actual-desktop-1280.jpg) | [JSON](./niaoshi-actual-route-review.json) |
| SF | [照片對照](./sf-actual-mobile-390.jpg) | [照片對照](./sf-actual-desktop-1280.jpg) | [JSON](./sf-actual-route-review.json) |
| 高雄業餘 | [照片對照](./kaohsiung-amateur-actual-mobile-390.jpg) | [照片對照](./kaohsiung-amateur-actual-desktop-1280.jpg) | [JSON](./kaohsiung-amateur-actual-route-review.json) |
| 銅雀 | [照片對照](./tongque-actual-mobile-390.jpg) | [照片對照](./tongque-actual-desktop-1280.jpg) | [JSON](./tongque-actual-route-review.json) |
| 屏東野狼 | [照片對照](./pingtung-wolves-actual-mobile-390.jpg) | [照片對照](./pingtung-wolves-actual-desktop-1280.jpg) | [JSON](./pingtung-wolves-actual-route-review.json) |

## 修正內容及證據

1. **台南鳥仕／魏嘉成** (`ns26-16`)：確認原圖 `public/assets/seasons/2026-27/players/ns26-16.jpg` 可讀且畫質清楚，但圖片索引 `playerImages.json` 遺漏；已補回正確名稱／路徑。不是照片品質問題。
2. **SF／陳欣敏** (`sf26-01`)：半身照原本臉太小，調為 `translateY(27%) scale(1.4)`。
3. **SF／呂承燁** (`sf26-20`)：遠景全身照原本臉偏小，由 2.2x 調成 3x，重新安排垂直位置。
4. **SF／鄭詠翰** (`sf26-18`)：球場遠景，2.1x 調至 2.7x 並微調上下。
5. **高雄業餘／李昆鴻** (`ka26-02`)：全身照 2.3x 改為 2.9x 並調整垂直位置。
6. **高雄業餘／潘晨維** (`ka26-38`)：室外半身照 1.8x 改為 2.5x 並調整垂直位置。
7. **屏東野狼／林瑶璇** (`pw26-11`)：臉稍小，微放大至 1.18x，調整垂直位置。

**原圖限制（未冒險以 CSS 解決）**：SF 杜睿博 (`sf26-04`) 原圖有褪色泛白、SF 洪家庭 (`sf26-12`) 臉部有反光斑、KA 吳詠祥 (`ka26-30`) 原照片清晰度偏低。這三位頭像仍能辨識，沒有替換未經驗證照片，建議日後補高清正面單人照。

**QA 過程修正**：同人兼任多個隊職員角色時，網頁以一個職員個人頁呈現；故 14 筆登錄不是 14 個不同職員頁。逐張等待圖片解碼、避免固定 Header 遮擋後才截圖，避免把 QA 截圖拍太早誤判缺圖。

## 驗證及部署證據

- [最新 5 隊實際頁面 QA：五個子工作皆通過、證據已提交](https://github.com/dreamsportfootball/d-league/actions/runs/41123333433)
- [相同頭像程式版本的預覽部署成功](https://github.com/dreamsportfootball/d-league/actions/runs/41123333421)
- [TypeScript／資料驗證／production build 狀態](https://github.com/dreamsportfootball/d-league/actions/runs/41123333399)
- [響應式 UI 測試狀態](https://github.com/dreamsportfootball/d-league/actions/runs/41123333494)

**範圍限制**：僅對這五隊的 2026/27 人物索引／必要裁切作修改；沒有擅自更換原照、調整其他隊伍或更動 `master`。如 CI 或 RWD 流程仍執行中，以最新 Workflow 實際結論為準。
