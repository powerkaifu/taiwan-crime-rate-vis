---
name: task-abstraction
description: >-
  Tamara Munzner 任務抽象化設計技能。
  當使用者需要將具體的領域商業/社會問題轉譯為通用視覺化任務 {Action, Target}、
  並決定採用何種圖表類型與視覺通道映射時使用。
---

# 任務抽象化設計技能（Task Abstraction）

本技能引導 Agent 協助使用者完成 Tamara Munzner 的 **Level 2 任務抽象化（Why: Task Abstraction）** 與 **Level 3 視覺編碼映射（How: Visual Encoding）**。

---

## 一、標準分析工作流程

### 步驟 1：領域問題提煉（Domain Questions）
- 訪談使用者，記錄 1~3 個使用者想要透過圖表回答的「領域真實問題」。
- 例如：
  - 「哪一個縣市的高齡化速度最快？」
  - 「各國所得與平均壽命之間是否存在正向相關性？」

### 步驟 2：行為層級拆解（Actions Hierarchy）
檢驗使用者的認知行為：
1. **Analyze 層級**：
   - 資訊消耗：`Discover`（開放探索新假說）還是 `Present`（向大眾/老師匯報結論）？
2. **Search 層級（四象限檢查）**：
   - 目標知否？位置知否？
   - 判定是 `Lookup`（查閱特定項）、`Locate`（搜尋已知特徵項）、`Browse`（瀏覽感興趣區）還是 `Explore`（漫遊未知）？
3. **Query 層級**：
   - 是 `Identify`（看單一數據）、`Compare`（比對兩組）還是 `Summarize`（綜觀全體趨勢）？

### 步驟 3：{Action, Target} 配對表產出
產出標準格式任務表：

| 任務編號 | 領域原始問題 | 抽象動作 (Action) | 抽象目標 (Target) | 核心任務語法 |
| :---: | :--- | :--- | :--- | :--- |
| **Task 1** | 觀察整體經濟與壽命關聯 | `Discover` + `Compare` | `Correlation` (多屬性相關) | `Discover Correlation` |
| **Task 2** | 找出人均所得極高但壽命落後的國家 | `Locate` + `Identify` | `Outliers` (離群點) | `Locate Outliers` |
| **Task 3** | 比對各大洲的預期壽命平均水準 | `Compare` | `Distribution` (屬性分佈) | `Compare Distribution` |

---

## 二、圖表類型與通道決策檢查（Idiom Decision）

根據 Task 與 Key/Value 數量鎖定圖表：
- **0 Key, 2 Values** $\implies$ **散佈圖（Scatterplot）**：適合 Task 1 & 2。
- **1 Key, 1 Value** $\implies$ **長條圖（Bar Chart）**：適合排行與比對大小（Y 軸必含 0）。
- **1 Ordered Key, 1 Value** $\implies$ **折線圖（Line Chart）**：適合時間趨勢（45度傾斜原則）。
- **多維度矩陣** $\implies$ **SPLOM** 或 **平行坐標圖（Parallel Coordinates）**。
