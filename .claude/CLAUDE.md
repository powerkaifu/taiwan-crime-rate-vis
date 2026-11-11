# HW03 專案規則（CLAUDE.md）

本檔規範 homework/hw03「同一份資料，排序差多少？」專案。Claude Code 開啟本專案時會自動讀取本檔。文中的路徑皆相對於 hw03 專案根目錄。

課程根目錄（hw03 往上兩層）的 `.agents/` 是另一套工具的設定，可作參考；與本專案 `.claude/` 衝突時以本專案為準。

---

## 一、先讀哪些檔案

| 用途 | 檔案 |
| :-- | :-- |
| 實作的唯一依據（數字、視圖規格、互動規則、步驟） | `docs/HW03_實作規格書.md` |
| 尚未完成的事 | `docs/待辦備忘錄.md` |
| 視覺樣式（顏色、字型、版面、選取方式） | `docs/前端設計方向_更正單.md` |
| 審查意見與模擬使用者測試（改前端前參考） | `docs/第12步_審查意見.md`、`docs/第13步_使用者測試.md` |
| 設計理念與報告論述（期中提案版） | `docs/視覺化系統設計發想書_TamaraMunzner框架.md` |
| 作業說明（對外） | `README.md` |

規格書與發想書衝突時，以規格書為準。圖表代號：A 排名橫條圖、B 等積方塊地圖、C 散佈圖（發想書與簡報為舊代號）。

---

## 二、.claude 設定一覽

| 位置 | 作用 | 何時生效 |
| :-- | :-- | :-- |
| `.claude/rules/data-rules.md` | 資料鐵律 | 每次啟動都載入 |
| `.claude/rules/vue-d3.md` | 技術與程式規則 | 讀取 `src/`、`scripts/` 等程式檔時 |
| `.claude/rules/docs-writing.md` | 文件撰寫規則 | 讀取 `README.md`、`docs/` 時 |
| `.claude/settings.json` | 權限（允許 npm 與 git 指令；禁止改 `data/csv`、`data/raw`、禁止 `git push`）與 hook | 每次啟動 |
| `.claude/hooks/check-on-data-edit.mjs` | Claude 修改資料處理相關檔案後，自動執行 `npm run check`；失敗時把結果回報給 Claude | 每次 Edit／Write 之後 |
| `.claude/skills/step-done/` | `/step-done <步驟>`：步驟完成時的檢查、截圖、更新文件、commit 流程 | 使用者輸入指令時 |
| `.claude/agents/vis-reviewer.md` | 視覺化審查員：依資料鐵律與 Munzner 原則唯讀審查 | 需要審查時由 Claude 委派，或使用者指名 |
| `.claude/skills/`（其他） | 課程複製來的設計與資料 skills，清單見 `.claude/skills/README.md` | 相關任務時由 Claude 叫用 |

個人專用的設定放 `.claude/settings.local.json` 或專案根目錄的 `CLAUDE.local.md`，兩者都不提交到 git。

---

## 三、工作流程

1. **一次只做一個步驟**，完成後停下來回報，等使用者批准再繼續。不要主動擴大範圍或產出使用者沒要求的文件。
2. 每完成一個步驟，照 `/step-done` 的流程：檢查 → 截圖 → 更新規格書與待辦 → git commit（作者 `KaiFu <powerkaifu@gmail.com>`，繁體中文、`類型: 摘要` 格式，只加入本步驟的檔案）。
3. `data/csv/` 若在 git 顯示「已修改」，多半只是換行符號差異，不要提交。
4. 刪除檔案前要先徵得使用者同意；改名、搬移用 `mv -n`，不可覆蓋既有檔案。
5. GitHub 遠端由使用者自行設定，不要自行新增 remote 或 push。
6. 一律使用繁體中文；說明簡潔，先講結論。
7. 修改期中提案簡報時，**直接修改並驗證 `docs/HW03 期中提案：台灣縣市犯罪率與破獲率.pptx`**（python-pptx 修改，轉成 PDF 截圖檢查版面）；線上簡報有改時也要同步到這個檔，不要只改線上版。
