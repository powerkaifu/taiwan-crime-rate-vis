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
  <main class="app" @click="onClick">
    <h1>同一份資料，排序差多少？</h1>
    <p class="subtitle">台灣 22 縣市犯罪率與破獲率｜資料：{{ meta.source }}</p>
    <StoryCards />
    <ControlBar />
    <p class="howto">滑鼠移到縣市上看詳細數字；點一下鎖定，三張圖同步標示，點空白處或按 Esc 取消。</p>
    <div class="charts">
      <RankBarChart class="chart-a" />
      <ScatterPlot class="chart-b" />
      <TileMap class="chart-c" />
    </div>
    <SiteFooter />
    <ChartTooltip />
  </main>
</template>

<style scoped>
.app {
  padding: 40px 48px;
}
h1 {
  margin: 0 0 4px;
  font-size: 30px;
}
.subtitle {
  margin: 0;
  color: var(--color-ink-soft);
}
.howto {
  margin: 0 0 16px;
  font-size: var(--font-min);
  color: var(--color-muted);
}
/* 版面：A 單獨一列，B、C 並排（最小寬度 1280px 也放得下） */
.charts {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 24px;
  align-items: start;
}
.chart-a {
  grid-column: 1 / -1;
}
</style>
