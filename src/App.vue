<script setup>
import * as d3 from 'd3'
import { version as vueVersion } from 'vue'

// 環境檢查用：確認 Vue 與 D3 都已正確載入，第 2 步開始會換成正式內容
const d3Version = d3.version
</script>

<template>
  <main class="app">
    <h1>同一份資料，排序差多少？</h1>
    <p>環境已就緒：Vue {{ vueVersion }}、D3 {{ d3Version }}</p>
  </main>
</template>

<style scoped>
.app {
  padding: 48px;
}
</style>
