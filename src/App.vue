<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import ChartTooltip from './components/ChartTooltip.vue'
import ControlBar from './components/ControlBar.vue'
import RankBarChart from './components/RankBarChart.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import SiteFooter from './components/SiteFooter.vue'
import StoryCards from './components/StoryCards.vue'
import TileMap from './components/TileMap.vue'
import { useCrimeData } from './composables/useCrimeData.js'
import { useViewState } from './composables/useViewState.js'

const { meta } = useCrimeData()
const { clearPin, clearBrush } = useViewState()

// 取消鎖定：點空白處或按 Esc（規格書 §5.2）
function onClick(e) {
  if (e.target.closest('g.row, g.dot, g.tile, button')) return
  clearPin()
}
const onKey = (e) => {
  if (e.key !== 'Escape') return
  clearPin()
  clearBrush()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page" @click="onClick">
    <header class="wrap intro">
      <h1>同一份資料，排序差多少？</h1>
      <p class="subtitle">台灣 22 縣市 2025 年刑案：用件數排、用每十萬人犯罪率排，名次各是多少。資料：{{ meta.source }}</p>
      <p class="caveat">每十萬人犯罪率＝警察紀錄的案件數 ÷ 戶籍人口 × 10 萬，只能比較縣市之間的差異，不代表個人遇害的風險。</p>
      <StoryCards />
    </header>
    <ControlBar />
    <main class="wrap">
      <div class="charts">
        <RankBarChart class="chart-a" />
        <TileMap class="chart-b" />
        <ScatterPlot class="chart-c" />
      </div>
      <SiteFooter />
    </main>
    <ChartTooltip />
  </div>
</template>

<style scoped>
/* 內容區置中：最寬 1440px（左右各 48px）；圖 A、B 依可用寬度調整（composables/useLayoutWidth.js）；文字仍靠左對齊 */
.wrap {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 48px;
}
.intro {
  padding-top: 40px;
  padding-bottom: 24px;
}
main.wrap {
  padding-bottom: 40px;
}
h1 {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 40px;
  line-height: 1.25;
  letter-spacing: 0.02em;
}
.subtitle {
  margin: 0;
  max-width: 64em;
  color: var(--slate);
}
/* 使用者測試：第一眼容易把犯罪率讀成「危險程度」，提醒放在首屏 */
.caveat {
  margin: 6px 0 0;
  font-size: var(--font-min);
  color: var(--ink);
}
/* 版面（第 12 步）：第一列 A 排名橫條圖＋B 等積方塊地圖並排，名次與地理同時看得到；第二列 C 散佈圖全寬 */
.charts {
  display: grid;
  grid-template-columns: max-content max-content;
  justify-content: space-between;
  gap: 24px;
  align-items: stretch;
}
.chart-c {
  grid-column: 1 / -1;
}
/* A、B 的寬度由圖表 svg 決定，圖說文字跟著換行，不把卡片撐寬 */
.chart-a,
.chart-b {
  width: min-content;
}
/* 從發現卡捲動過來時，避開固定在頂端的控制列 */
.chart-a,
.chart-b,
.chart-c {
  scroll-margin-top: calc(var(--bar-h, 142px) + 16px); /* --bar-h 由 ControlBar 量測 */
}
</style>
