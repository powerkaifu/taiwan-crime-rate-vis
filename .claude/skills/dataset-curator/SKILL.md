---
name: dataset-curator
description: >-
  專業資料集探勘、清洗與屬性定性技能。
  當使用者需要尋找適合 D3.js 視覺化的資料集、解析現有 CSV/JSON、
  或評估欄位型態（Categorical/Ordinal/Quantitative）與規劃衍生資料（Derive）時使用。
---

# 資料集策展與屬性定性技能（Dataset Curator）

本技能指導 Agent 協助使用者進行 Tamara Munzner 的 **Level 2 資料抽象化（What: Data Abstraction）** 前期準備。

---

## 一、標準執行步驟

### 步驟 1：資料集審查與輪廓分析（Profiling）
- 讀取資料樣本，統計以下指標：
  - **總資料筆數（Item Count / Rows）**：是否在 50~2,000 筆之黃金區間？
  - **欄位總數（Attribute Count / Columns）**。
  - **缺失值與異常值（Missing / Dirty Data）**。

### 步驟 2：欄位型態定性矩陣（Data Type Classification）
建立欄位定性表格：

| 欄位名稱 | 原始型別 | 視覺化型態 | 語意說明與基數（Cardinality） | 建議視覺通道 |
| :--- | :--- | :--- | :--- | :--- |
| 例：`country` | String | **Categorical (Key)** | 國家名稱（60 個唯一值） | 空間分區、Tooltip 標註 |
| 例：`continent`| String | **Categorical** | 洲別（5 個等級 $\le 10$） | 色相（Color Hue） |
| 例：`year` | Integer | **Ordered / Temporal** | 年份（2000~2024） | X 軸位置或時間軸滑桿 |
| 例：`gdp_per_cap` | Float | **Quantitative** | 人均 GDP（範圍 500~90,000） | X/Y 軸位置（可考慮對數比例尺） |
| 例：`population`| Integer | **Quantitative** | 總人口數 | 圓點面積（⚠️ 半徑開平方根） |

### 步驟 3：資料衍生策略（Data Derivation / Transformation）
思考是否能計算出比原始資料更有價值的衍生指標：
1. **正規化指標（Normalization）**：將絕對總量除以人口數或面積（避免 xkcd 1138 人口分佈陷阱）。
2. **變化率指標（Change Over Time）**：計算相較於基準年的成長百分比（`% Change`）。
3. **分群分組（Binned / Categorized）**：將連續數值依照特定閾值切分為低/中/高三級次序屬性。

---

## 二、推薦開放資料來源清單

1. **全球發展與總經衛生**：
   - [Our World in Data (OWID)](https://ourworldindata.org/)：乾淨且主題明確的 CSV 檔案。
   - [Gapminder Data](https://www.gapminder.org/data/)：包含人口、預期壽命、所得。
2. **台灣本土政府開放資料**：
   - [政府資料開放平台 (data.gov.tw)](https://data.gov.tw/)。
   - 內政部戶政司、主計處、氣象署即時觀測資料。
3. **休閒娛樂與影視生活**：
   - Kaggle 公開資料集（如 TMDB 5000 Movies, Spotify Top Tracks, Video Game Sales）。
