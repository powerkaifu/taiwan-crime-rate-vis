# HW03 專案 Skills

這個資料夾放**只給 hw03 使用**的 Claude skills，Claude Code 會自動載入。

課程根目錄（hw03 往上兩層）的 `.agents/skills/` 是另一套工具的 skills，Claude 不會自動讀取；需要的話可以參考內容另外改寫到這裡。

## 新增一個 skill

每個 skill 一個資料夾，裡面放 `SKILL.md`：

```
.claude/skills/
└── <skill 名稱>/          # 小寫英文與連字號，例如 step-commit
    ├── SKILL.md            # 必要
    └── （需要的參考檔或腳本）
```

`SKILL.md` 開頭要有 frontmatter，`name` 與資料夾名稱相同，`description` 寫清楚何時使用（Claude 依此判斷要不要載入）：

```markdown
---
name: <skill 名稱>
description: >-
  一句話說明這個 skill 做什麼、什麼時候該使用。
---

# <skill 標題>

## 一、使用時機
## 二、步驟
## 三、注意事項
```

## 撰寫原則

- 內容必須符合 `.claude/CLAUDE.md`（資料鐵律、工作流程等）。
- 只寫可重複使用的流程，一次性的操作不需要做成 skill。
- 涉及數字時，指向 `data/csv/` 與 `npm run check`，不要把數字寫死在 skill 裡。

## 目前的 skills

與 `.claude/CLAUDE.md`、`.claude/rules/` 衝突時，一律以專案規則為準（特別是資料鐵律）。

| 指令 | 來源 | 用途 |
| :-- | :-- | :-- |
| `/step-done <步驟>` | hw03 專屬 | 步驟完成時的驗收、截圖、更新文件、commit 流程（只能手動呼叫） |
| `/task-abstraction` | 課程 `.agents/skills/` 複製 | Munzner 任務抽象化：領域問題 → {Action, Target} → 視覺編碼 |
| `/d3-chart-builder` | 課程 `.agents/skills/` 複製 | D3 圖表實作 |
| `/dataset-curator` | 課程 `.agents/skills/` 複製 | 資料集整理 |
| `/uiux-design-system` | 課程 `.agents/skills/` 複製 | 視覺化儀表板 UI/UX 設計系統 |
| `/frontend-design` | anthropics/skills（含 LICENSE.txt） | 前端視覺設計方向 |
| `/design-taste-frontend` | leonxlnx/taste-skill | 前端設計品味 |
| `/imagegen-frontend-web` | leonxlnx/taste-skill | 網頁設計參考圖生成 |
| `/imagegen-frontend-mobile` | leonxlnx/taste-skill | 行動 App 設計參考圖生成 |

這些 skills 以 hw03 專案使用為準，可依專案需要直接修改，不需要與課程 `.agents/skills/` 的原檔同步。
