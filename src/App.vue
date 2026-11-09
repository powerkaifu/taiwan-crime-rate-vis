<script setup>
import { computed } from 'vue'
import { useCrimeData } from './composables/useCrimeData.js'

// 第 2 步：先以資料表確認 22 縣市都正確讀入，第 3 步起換成正式圖表
const { counties, meta } = useCrimeData()

const rows = computed(() => [...counties].sort((a, b) => a.全般.rankRate - b.全般.rankRate))
const fmt = (v, d = 2) => (v === null ? '—' : v.toLocaleString('zh-TW', { maximumFractionDigits: d }))
</script>

<template>
  <main class="app">
    <h1>同一份資料，排序差多少？</h1>
    <p class="note">
      資料檢查：{{ counties.length }} 縣市｜全般犯罪率中位數 {{ fmt(meta.types.全般.medianRate) }}｜
      全般破獲率中位數 {{ fmt(meta.types.全般.medianClearance) }}%｜{{ meta.source }}
    </p>
    <table>
      <thead>
        <tr>
          <th>縣市</th><th>六都</th><th>推估人口</th>
          <th>全般件數</th><th>件數名次</th><th>犯罪率</th><th>率名次</th><th>名次變動</th><th>破獲率</th>
          <th>暴力件數</th><th>暴力犯罪率（95% 區間）</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in rows" :key="c.id">
          <td>{{ c.id }}</td>
          <td>{{ c.isSixCity ? '是' : '' }}</td>
          <td>{{ fmt(c.pop, 0) }}</td>
          <td>{{ fmt(c.全般.count, 0) }}</td>
          <td>{{ c.全般.rankCount }}</td>
          <td>{{ fmt(c.全般.rate) }}</td>
          <td>{{ c.全般.rankRate }}</td>
          <td>{{ c.全般.rankDelta > 0 ? '+' : '' }}{{ c.全般.rankDelta }}</td>
          <td>{{ fmt(c.全般.clearance) }}%</td>
          <td>{{ c.暴力.count }}<span v-if="c.暴力.smallN" class="warn">（件數少）</span></td>
          <td>{{ fmt(c.暴力.rate) }}（{{ fmt(c.暴力.ciLow) }}–{{ fmt(c.暴力.ciHigh) }}）</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.app {
  padding: 48px;
}
.note {
  color: var(--color-ink-soft);
}
table {
  border-collapse: collapse;
  font-size: var(--font-min);
  background: var(--color-card);
}
th,
td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: right;
}
th:first-child,
td:first-child {
  text-align: left;
}
.warn {
  color: var(--color-muted);
}
</style>
