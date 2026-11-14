# 🖥️ HW03 網站 Demo 介紹重點與視覺化理論關鍵字指南

> **課程週次（Week xx）待對照課程大綱確認。**
> **用途**：上台展示（Demo）網站或撰寫報告時，快速對照「網站功能特點」、「課堂理論（Munzner Week 01–15）」與「經典視覺化論文關鍵字」。
> **圖表代號（依現行網站閱讀順序）**：**圖 A 排名橫條圖**、**圖 B 等積方塊地圖**、**圖 C 散佈圖（犯罪率 × 破獲率）**。

---

## 一、一句話核心定位（開場先講結論）

本網站以**「排名更正單」**為視覺主軸，將林宗弘〈[六都治理績效比一比](https://www.thinkingtaiwan.net/article/100493)〉（想想論壇，2026-10-23）的純數字六都表格，重製為涵蓋**全國 22 縣市、支援三視圖連動（CMV）與小樣本信賴區間提醒**的 D3.js 互動探索系統。

---

## 二、網站 6 大核心特點與學術論文關鍵字對照

### 1. 多重視圖協同與連動標示（CMV & Linked Highlighting）

- **學術與課堂關鍵字**：
  - **Coordinated Multiple Views (CMV，協同多重視圖)** — _Baldonado et al. (2000)_
  - **Multiform Juxtaposition（同資料、異編碼之並列分面）** — _Munzner (2014) Ch. 12 / 課程 Week 13_
  - **Linked Highlighting（連動標示）**：Bach et al. (2023) 稱為 *Brushing + linking*；本網站是以懸停或點選單一縣市觸發，沒有框選範圍的筆刷
- **網站實作位置**：
  - 圖 A、圖 B、圖 C 共用單一響應式狀態（`src/composables/useViewState.js`）。
  - 滑鼠在**任一張圖**懸停（Hover）或點擊鎖定（Pin）某縣市，三張圖同步以螢光黃（`#F4C542`）標示該縣市（懸停淡黃、鎖定實心黃），其餘縣市在 150ms 內淡化（Dimming）。
- **上台介紹講法**：
  > 「我們採用 Week 13 分面理論中的 **Multiform Juxtaposition（同資料異編碼並列）** 與 **CMV 架構**，三張圖之間做 **Linked Highlighting（連動標示）**。使用者不論從排名、地理方塊還是散佈象限切入，三張圖都會同步標示同一個縣市。」

---

### 2. 「作者引導」結合「讀者探索」的馬丁尼杯敘事（Narrative Visualization）

- **學術與課堂關鍵字**：
  - **Author-driven vs. Reader-driven（作者驅動 vs. 讀者驅動敘事）** — _Segel & Heer (2010), Narrative Visualization: Telling Stories with Data, IEEE TVCG_
  - **Martini Glass Structure（馬丁尼杯結構：先引導關鍵發現，再開放自由探索）**
  - **Data-Driven Headlines（資料驅動動態結論標題）**
- **網站實作位置**：
  - **首屏 4 張故事帶（`StoryCards.vue`）**：扮演 Author-driven 角色，點擊任一發現卡（如「件數第 1 不等於犯罪率第 1」、「暴力犯罪第 1，只有 8 件」），系統自動切換案類、排序、篩選與鎖定縣市，並平滑捲動至目標圖表。
  - **頂部固定控制列（`ControlBar.vue`）與三視圖**：扮演 Reader-driven 角色，開放自由切換，且三張圖的 `h2` 標題（`headlines.js`）皆由資料即時算出結論句，而非死板圖表名稱。
- **上台介紹講法**：
  > 「我們借鏡 Segel & Heer (2010) 的 **Martini Glass 敘事結構**：首屏用 4 張發現卡做 **Author-driven 引導**，讓讀者一鍵跳轉到四大資料洞察；下方則透過共用控制列開放 **Reader-driven 自由探索**。」

---

### 3. 通道有效性最大化與空間面積偏誤校正（Effectiveness & Cartogram）

- **學術與課堂關鍵字**：
  - **Effectiveness Principle（通道有效性原則）& Expressiveness Principle（表達力原則）** — _Munzner (2014) Ch. 5 / 課程 Week 05_
  - **Graphical Perception（圖形感知排序）** — _Cleveland & McGill (1984)_：共同尺度上的位置最精準，其次是長度，面積較差
  - **Stevens' Power Law（史蒂文斯冪定律：長度 $k \approx 1.0$、面積 $k \approx 0.7$，面積差距會被低估）** — _Stevens (1975)_；Munzner (2014) Ch. 5 引用
  - **Area-Size Bias（面積扭曲效應）& Tile Grid Cartogram（等積網格變形統計地圖）** — _課程 Week 08_
- **網站實作位置**：
  - **圖 A（`RankBarChart.vue`）**：以 **Aligned Length（對齊基準線長度）** 呈現數值差距（精準度僅次於共同尺度上的位置），右側搭配「`<s>17</s> → 1 ▲16`」更正單設計，呈現名次翻轉。
  - **圖 B（`TileMap.vue`）**：一般地圖上面積大的縣市會被看得比較重要，但花蓮推估人口只占 22 縣市的 1.35%，臺北占 10.56%（由本專案資料計算）。改用 **Tile Grid Cartogram（等積方塊地圖）** 讓 22 縣市一區一格、面積相等，避免土地面積造成的視覺偏誤。
  - **圖 C（`ScatterPlot.vue`）**：泡泡半徑使用 `d3.scaleSqrt()`，讓**圓面積與推估人口成正比**（若半徑直接對應人口，面積會被平方放大），並附 `10 萬／100 萬／400 萬` 人口圖例，圖例圓與資料點用同一個比例尺。
- **上台介紹講法**：
  > 「依據 Week 05 的 **Effectiveness Principle** 與 Week 08 的空間設計原則，圖 A 用對齊長度呈現真實差距，圖 B 採用 **Tile Grid Cartogram（等積方塊地圖）** 避免土地面積造成的視覺偏誤，圖 C 以 `scaleSqrt` 讓圓面積與人口成正比；不過依 **Stevens' Power Law**，面積差距仍會被低估，所以人口大小只當輔助資訊。」

---

### 4. 篩選但保留脈絡（Filter with Dimming）

- **學術與課堂關鍵字**：
  - **Filter（篩選）** — _Munzner (2014) Ch. 13 Reduce_；本網站不移除項目，而是淡化保留，概念上接近廣義的 **Focus + Context**（Munzner Ch. 14 的 Focus + Context 專指嵌入式技巧，如魚眼、省略，嚴格說不是本網站的做法）
  - **Visual Layering & Desaturation（視覺分層與背景淡化）** — _課程 Week 13_
  - **Visual Information-Seeking Mantra**（_Overview first, zoom and filter, then details-on-demand_）— _Shneiderman (1996)_
- **網站實作位置**：
  - 當控制列選擇「只看六都」或「非六都」時，系統**不會將其他縣市從畫面移除**，而是將非目標縣市透明度降為 `0.15` 保留作為背景脈絡（Context），且**名次（1–22）與散佈圖中位數虛線仍維持全國 22 縣市基準**。
- **上台介紹講法**：
  > 「篩選六都時，我們採用**篩選但保留脈絡**的做法：非六都變淡但不隱藏，名次與中位數維持全國 22 縣市計算，避免局部篩選導致排名基準失真。」

---

### 5. 小樣本不確定性視覺化與統計防雷（Uncertainty Visualization）

- **學術與課堂關鍵字**：
  - **Uncertainty Visualization（不確定性視覺化）**
  - **Small Numbers Problem（小數問題）& Exact Poisson Confidence Interval（Garwood 精確卜瓦松信賴區間）**
  - **Texture / Hatch Pattern Encoding（斜線紋理編碼區分真零值與小樣本）**
- **網站實作位置**：
  - **小樣本信賴區間**：澎湖縣 2025 年暴力犯罪率全台最高（7.46），但實際僅 8 件。切至暴力犯罪時，圖 A 與圖 C 自動繪製 **95% Poisson 信賴區間誤差線（`stats.js`）**，圖 B 疊加**白色細斜線紋理（`#hatch-small`）**，圖 A 將件數 $<30$ 或名次變動 $\le 2$ 的 `▲▼` 轉為淡灰色，提醒讀者排名受隨機波動影響大。
  - **真零值（True Zero）與空值分離**：連江縣暴力犯罪 0 件，犯罪率為 `0`（圖 B 標示灰色斜線 `#hatch-zero`），破獲率因分母為 0 設為 `null`（圖 C 不繪製並於圖下說明）。
  - **破獲率 > 100% 標註**：圖 C 繪製 `100%` 參考線與灰色底區，直接標明「破獲數包含往年積案，不是算錯」。
- **上台介紹講法**：
  > 「針對澎湖暴力犯罪只有 8 件卻排全台第 1 的 **Small Numbers Problem（小數問題）**，我們實作了 **Uncertainty Visualization**，用 Garwood 法畫出 **95% Poisson 信賴區間**，並在地圖上用斜線紋理區分『樣本少於 30 件』與連江縣的『0 件真零值』。」

---

### 6. 對應《Dashboard Design Patterns (IEEE TVCG 2023)》之模式語言

本網站實作了 Bach et al. (2023) [Dashboard Design Patterns](https://doi.org/10.1109/TVCG.2022.3209448) 論文中的核心模式：

1. **Shared color schemes（共用色彩方案）**：一色一義——率青（`#0E6F7A`）跨三圖統一代表每十萬人犯罪率、件數灰（`#7F8C92`）代表未依人口換算的件數、螢光黃（`#F4C542`）只代表選取狀態。
2. **Derived values & Thresholds（衍生值與閾值界線）**：名次變動 `rankDelta`、22 縣市中位數十字虛線、100% 破獲率參考線。
3. **Disclaimers & Annotations（免責聲明與圖內標註）**：首屏戶籍人口分母提醒、圖下統計提醒、頁尾完整研究限制。
4. **Parameterization + Detail on demand**：貼頂控制列（Sticky ControlBar）＋ 具備視窗右緣與底緣防溢出的跟隨式 Tooltip（`ChartTooltip.vue`）。
5. **Tables（表格）**：三張圖右上角皆可一鍵切換為明細表格（`ChartDataTable.vue`）。

> 另外（論文未列為模式，是我們額外的無障礙設計）：鍵盤 `Tab`／`Enter`／`Esc` 操作，以及尊重 `prefers-reduced-motion`。

---

## 三、上台 Demo 實戰 4 步驟腳本（約 90 秒）

1. **Step 1｜展示「更正單記憶點」與重排動畫（圖 A）**
   - 在圖 A 點擊切換「發生件數 ⇄ 每十萬人犯罪率」，展示 750ms 平滑重排與右側 `<s>17</s> → 1 ▲16` 的名次更正效果。
2. **Step 2｜展示三視圖 CMV 雙向連動（圖 A ⇄ 圖 B ⇄ 圖 C）**
   - 滑鼠移到圖 B 等積地圖的「花蓮縣」並點一下鎖定，指出圖 A 橫條、圖 C 散佈點與頂部控制列「已鎖定」摘要同步標示（**Linked Highlighting**）。
3. **Step 3｜點擊第 2 張發現卡展示 Focus + Context**
   - 點擊首屏「六都換算後仍偏高」，展示畫面自動捲動至圖 C，非六都淡化為背景但中位數虛線不變（六都全落在右上象限；新北破獲率 73.31%，只略高於中位數 73.3%）。
4. **Step 4｜點擊第 3 張發現卡展示小樣本 95% 信賴區間**
   - 點擊「暴力犯罪第 1，只有 8 件」，展示圖 A 與圖 C 浮現的 **95% Poisson 信賴區間誤差線**、圖 B 地圖上的斜線紋理，以及圖 C 的 100% 參考線與灰色區說明。
