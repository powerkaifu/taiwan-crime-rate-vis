<script setup>
// 頁尾：統計限制說明與出處（規格書 §7）
import { useCrimeData } from '../composables/useCrimeData.js'

const { meta } = useCrimeData()
</script>

<template>
  <footer class="site-footer">
    <h2>閱讀這些數字前要知道的事</h2>
    <ul>
      <li>資料：{{ meta.source }}。各縣市加總與全國數字不同，因為全國數字還包含縣市以外的警察機關。</li>
      <li>自 2024 年 9 月起，部分刑案由「1 案 1 發生數」改為「1 被害人 1 發生數」；2025 全年皆為新制，本頁不做跨年比較。</li>
      <li>破獲數包含往年的積案，所以破獲率可能超過 100%，不能當成「當年案件被破獲的比例」。</li>
      <li>犯罪率以戶籍人口計算，不含在當地活動但未設籍的人口。推估人口由「件數 ÷ 每十萬人犯罪率」反推。</li>
      <li>暴力犯罪各縣市只有 0～64 件，少數幾件就會讓犯罪率大幅變動，所以同時標示件數與 95% 信賴區間（Poisson 精確法）。</li>
      <li>警察紀錄不含未報案的犯罪；數字呈現的是縣市之間的描述性差異，不代表個人遇害的風險，也不代表因果關係。</li>
    </ul>
    <p class="credit">
      重製對象：林宗弘〈<a href="https://www.thinkingtaiwan.net/article/100493" target="_blank" rel="noopener">六都治理績效比一比</a>〉，想想論壇，2026-10-23。<br />
      資料分析與視覺化應用 HW3｜嚴庭亞、張凱富、陳予璇
    </p>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
  max-width: 1136px;
  color: var(--color-ink-soft);
  font-size: var(--font-min);
  line-height: 1.7;
}
h2 {
  font-size: 16px;
  color: var(--color-ink);
  margin: 0 0 8px;
}
ul {
  margin: 0;
  padding-left: 20px;
}
.credit {
  margin-top: 16px;
  color: var(--color-muted);
}
a {
  color: var(--color-accent);
}
</style>
