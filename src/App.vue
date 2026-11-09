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
const { clearPin } = useViewState()

// 取消鎖定：點空白處或按 Esc（規格書 §5.2）
function onClick(e) {
  if (e.target.closest('g.row, g.dot, g.tile, button')) return
  clearPin()
}
const onKey = (e) => e.key === 'Escape' && clearPin()
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page" @click="onClick">
    <header class="wrap intro">
      <h1>同一份資料，排序差多少？</h1>
      <p class="subtitle">台灣 22 縣市 2025 年刑案：用件數排、用每十萬人犯罪率排，名次各是多少。資料：{{ meta.source }}</p>
      <StoryCards />
    </header>
    <ControlBar />
    <main class="wrap">
      <div class="charts">
        <RankBarChart class="chart-a" />
        <TileMap class="chart-c" />
        <ScatterPlot class="chart-b" />
      </div>
      <SiteFooter />
    </main>
    <ChartTooltip />
  </div>
</template>

<style scoped>
/* 內容區置中：寬度＝圖表 B＋C 並排（約 1164px）＋左右各 48px；文字仍靠左對齊 */
.wrap {
  max-width: 1260px;
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
/* 版面（第 12 步）：第一列 A＋C 並排，名次與地理同時看得到；第二列 B 全寬 */
.charts {
  display: grid;
  grid-template-columns: max-content max-content;
  justify-content: space-between;
  gap: 24px;
  align-items: stretch;
}
.chart-b {
  grid-column: 1 / -1;
}
/* A、C 的寬度由圖表 svg 決定，圖說文字跟著換行，不把卡片撐寬 */
.chart-a,
.chart-c {
  width: min-content;
}
/* 從發現卡捲動過來時，避開固定在頂端的控制列 */
.chart-a,
.chart-b,
.chart-c {
  scroll-margin-top: 120px;
}
</style>
