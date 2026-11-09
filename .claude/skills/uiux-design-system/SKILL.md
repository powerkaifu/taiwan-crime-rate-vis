---
name: uiux-design-system
description: 現代資料視覺化儀表板 UI/UX 設計系統，提供現代 Clean SaaS 樣板、KPI 指標摘要卡、精緻控制元件、微互動與毛玻璃 Tooltip 構建技能。
---

# 🎨 UI/UX Design System Skill (現代資料視覺化儀表板設計系統)

當需要重構或升級作業專案（如 hw01, hw02）的視覺介面美感、建立頂級 Dashboard 儀表板排版、整合精緻的 KPI 指標摘要卡（Stat Cards）、設計毛玻璃微互動 Tooltip、或是升級現代化表單控制元件時使用。

---

## 1. 核心設計代碼庫（Design Tokens）

在專案的 CSS 或主組件中推薦採用的核心 CSS 變數：

```css
:root {
  /* 背景與表面 */
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-subtle: #f1f5f9;
  
  /* 邊框與分割線 */
  --border-subtle: #e2e8f0;
  --border-medium: #cbd5e1;
  
  /* 🔤 全域字階原生變數系統（最小字體 14px） */
  --font-xs: 14px;      /* 基準底線：座標軸刻度、圖例、Tooltip 細項、微型標籤、頁尾 */
  --font-sm: 15px;      /* 次要正文：控制項輸入文字、下拉選單、卡片描述、頁面副標 */
  --font-base: 16px;    /* 主要正文：導讀文章、操作標籤 Label、膠囊按鈕 */
  --font-md: 18px;      /* 卡片標題、重點區塊標題 */
  --font-lg: 20px;      /* 強調標題、次級大標 */
  --font-xl: 30px;      /* 頁面大標題 (Page Title) */
  --font-stat: 36px;    /* KPI 指標核心大數值 */

  /* 文字色彩階層 */
  --text-primary: #0f172a;    /* Slate 900 */
  --text-secondary: #475569;  /* Slate 600 */
  --text-muted: #94a3b8;      /* Slate 400 */
  
  /* 語意色彩 */
  --color-primary: #2563eb;   /* Blue 600 */
  --color-primary-light: #eff6ff;
  --color-danger: #ef4444;    /* Red 500 */
  --color-danger-light: #fef2f2;
  --color-warning: #f59e0b;   /* Amber 500 */
  --color-warning-light: #fffbeb;
  --color-success: #10b981;   /* Emerald 500 */
  --color-success-light: #ecfdf5;

  /* 視覺化專用分類色標（色盲友善） */
  --vis-public: #3b82f6;      /* 公立 - 藍色 */
  --vis-private: #f97316;     /* 私立 - 暖橘 */

  /* 現代多層次陰影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
  --shadow-tooltip: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  
  /* 圓角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 2. 核心元件樣板（Core UI Components）

### A. 關鍵指標摘要卡（Hero KPI Stat Cards）
```vue
<template>
  <div class="kpi-grid">
    <div class="kpi-card" v-for="item in stats" :key="item.label">
      <div class="kpi-header">
        <span class="kpi-label">{{ item.label }}</span>
        <span class="kpi-badge" :class="item.badgeType">{{ item.badgeText }}</span>
      </div>
      <div class="kpi-value">{{ item.value }}<span class="kpi-unit">{{ item.unit }}</span></div>
      <div class="kpi-desc">{{ item.description }}</div>
    </div>
  </div>
</template>
```

### B. 現代深色半透明毛玻璃 Tooltip
```css
.modern-tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: var(--shadow-tooltip);
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease;
  z-index: 1000;
  max-width: 260px;
}
```

### C. 現代控制欄位（Control Bar）
包含：
- 自訂風格下拉選單（Custom Styled Select）
- 狀態 Pills / 標籤切換器
- 學年度計數器與動態微動效

---

## 3. 容器邊框規範（Border Standards）
- **區塊左側皆不得有單邊邊框（No Left Border Accents）**：所有卡片、工具列、提示框、控制項均保持全對稱、均勻的細邊框（如 `border: 1px solid var(--border-subtle)`），禁止使用 `border-left` 作為突出或裝飾手段。

