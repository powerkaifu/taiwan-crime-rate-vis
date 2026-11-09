<script setup>
// 共用 Tooltip（規格書 §5.3）：滑鼠停在任一圖表的縣市上時顯示，跟著滑鼠移動。
import * as d3 from 'd3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { useViewState } from '../composables/useViewState.js'
import { fmtPct, fmtRate } from '../utils/format.js'

const { counties, meta } = useCrimeData()
const { state } = useViewState()
const byId = new Map(counties.map((c) => [c.id, c]))

const pos = ref({ x: 0, y: 0 })
const OFFSET = 16
const BOX_W = 320
function onMove(e) {
  // 靠近視窗右緣時改放在滑鼠左側
  const x = e.clientX + OFFSET + BOX_W > window.innerWidth ? e.clientX - OFFSET - BOX_W : e.clientX + OFFSET
  pos.value = { x, y: e.clientY + OFFSET }
}
onMounted(() => window.addEventListener('mousemove', onMove))
onBeforeUnmount(() => window.removeEventListener('mousemove', onMove))

const county = computed(() => (state.hovered ? byId.get(state.hovered) : null))
const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
const d = computed(() => county.value?.[state.crimeType])
const rateFmt = (v) => fmtRate(v, state.crimeType)
const popText = computed(() => `約 ${d3.format(',.1f')(county.value.pop / 1e4)} 萬`)
const medianClr = computed(() => fmtPct(meta.types[state.crimeType].medianClearance))
</script>

<template>
  <div
    v-if="county"
    class="tooltip"
    role="status"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${BOX_W}px` }"
  >
    <p class="title">
      {{ county.id }}<span class="sub">（{{ county.region }}・{{ county.isSixCity ? '六都' : '非六都' }}）</span>
    </p>
    <p class="type">{{ typeLabel }}・2025 年</p>
    <dl>
      <dt>每十萬人犯罪率</dt>
      <dd>{{ rateFmt(d.rate) }}（全國第 {{ d.rankRate }}）</dd>
      <template v-if="state.crimeType === '暴力'">
        <dt>95% 信賴區間</dt>
        <dd>{{ rateFmt(d.ciLow) }}～{{ rateFmt(d.ciHigh) }}</dd>
      </template>
      <dt>發生件數</dt>
      <dd>{{ d3.format(',')(d.count) }} 件（全國第 {{ d.rankCount }}）</dd>
      <dt>破獲率</dt>
      <dd>{{ d.clearance === null ? '—（無案件）' : fmtPct(d.clearance) }}（中位數 {{ medianClr }}）</dd>
      <dt>推估人口</dt>
      <dd>{{ popText }}</dd>
    </dl>
    <p v-if="state.crimeType === '暴力' && d.smallN" class="warn">件數少於 30，犯罪率容易因少數案件大幅變動。</p>
    <p v-if="d.clearance !== null && d.clearance > 100" class="warn">破獲率超過 100%：破獲數含往年積案。</p>
  </div>
</template>

<style scoped>
.tooltip {
  position: fixed;
  z-index: 10;
  pointer-events: none;
  background: rgba(31, 42, 58, 0.94);
  color: #f7f6f2;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: var(--font-min);
  line-height: 1.5;
  box-shadow: 0 8px 24px rgba(31, 42, 58, 0.25);
}
p {
  margin: 0;
}
.title {
  font-size: 16px;
  font-weight: 700;
}
.sub {
  font-weight: 400;
  color: #c9d3de;
}
.type {
  color: #c9d3de;
  margin-bottom: 6px;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 12px;
  margin: 0;
}
dt {
  color: #c9d3de;
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.warn {
  margin-top: 6px;
  color: #f3c98b;
}
</style>
