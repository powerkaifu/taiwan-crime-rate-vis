<script setup>
import ControlBar from './components/ControlBar.vue'
import RankBarChart from './components/RankBarChart.vue'
import { useCrimeData } from './composables/useCrimeData.js'

const { meta } = useCrimeData()
</script>

<template>
  <main class="app">
    <h1>同一份資料，排序差多少？</h1>
    <p class="subtitle">台灣 22 縣市犯罪率與破獲率｜資料：{{ meta.source }}</p>
    <ControlBar />
    <RankBarChart />
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
</style>
