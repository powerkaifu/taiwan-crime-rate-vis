# HW03 專案 Skills

這個資料夾放**只給 hw03 使用**的 skills。課程共用的 skills 在 `../../../.agents/skills/`，不需要複製過來。

## 新增一個 skill

每個 skill 一個資料夾，裡面放 `SKILL.md`：

```
.agents/skills/
└── <skill 名稱>/          # 小寫英文與連字號，例如 step-commit
    ├── SKILL.md            # 必要
    └── （需要的參考檔或腳本）
```

`SKILL.md` 開頭要有 frontmatter，格式與課程層級的 skills 相同：

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

- 內容必須符合 `../rules/00-hw03-project-rules.md`（資料鐵律、工作流程等）。
- 只寫可重複使用的流程，一次性的操作不需要做成 skill。
- 涉及數字時，指向 `data/csv/` 與 `npm run check`，不要把數字寫死在 skill 裡。

## 目前的 skills

（尚無）
