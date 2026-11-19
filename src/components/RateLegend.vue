<script setup>
// 每十萬人犯罪率 5 級分位數圖例：圖 A、圖 B 共用（依老師建議以顏色顯示區間）
import { computed } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { rateLegend } from '../utils/colors.js'
import { fmtRate } from '../utils/format.js'

const props = defineProps({ type: { type: String, required: true } })
const { counties } = useCrimeData()
const items = computed(() => rateLegend(counties.map((c) => c[props.type].rate)))
const f = (v) => fmtRate(v, props.type)
</script>

<template>
  <span class="rate-legend" aria-hidden="true">
    <span class="num">{{ f(items[0].from) }}</span>
    <template v-for="it in items" :key="it.color">
      <span class="step" :style="{ background: it.color }" />
      <span class="num">{{ f(it.to) }}</span>
    </template>
    <span class="unit">（每十萬人）</span>
  </span>
</template>

<style scoped>
.rate-legend {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: var(--font-min);
  color: var(--color-ink-soft);
  font-variant-numeric: tabular-nums;
}
.step {
  display: inline-block;
  width: 22px;
  height: 12px;
  border-radius: 2px;
}
.unit {
  color: var(--color-muted);
}
</style>
