---
paths:
  - "src/**/*.{vue,js}"
  - "scripts/**/*.mjs"
  - "vite.config.js"
  - "package.json"
---

# 技術與程式規則

（只在 Claude 讀取上述檔案時載入。）

1. 技術棧固定為 **Vite 6＋Vue 3（`<script setup>`）＋D3 v7**，新增任何套件前要先問使用者。
2. 資料以 Vite `?raw` 直接匯入 `data/csv/`，不另外複製到 `public/`，也不產生中間 JSON。
3. 三張圖的共用狀態只放在 `src/composables/useViewState.js`，元件之間不直接互相呼叫。
4. D3 只負責繪圖與轉場；懸停時不要對 SVG 元素 `raise()`（會觸發 mouseleave 造成閃爍）。
5. 介面字級最小 14px；顏色要色盲友善，且不能只靠顏色傳達意義；象限、分區不貼「模範區」「警示區」等價值標籤。
6. `node_modules` 由使用者在 Windows 執行 `npm install` 產生，不在 Linux 環境安裝到專案資料夾。
7. `vite.config.js` 的 `base` 維持 `'./'`；不要設定 `build.emptyOutDir: false`。
