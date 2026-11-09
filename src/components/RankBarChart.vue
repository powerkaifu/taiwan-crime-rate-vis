<script setup>
// 圖表 A：排名橫條圖（規格書 §4.2、§4.3）
// 件數 ⇄ 每十萬人犯罪率切換時，長度補間、縣市以 Y 位置轉場重排。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { headlineA } from '../utils/headlines.js'
import { CARD_CHROME, GRID_GAP, useLayoutWidth } from '../composables/useLayoutWidth.js'
import ChartDataTable from './ChartDataTable.vue'

const { counties } = useCrimeData()
const { state, hover, togglePin, setBarMode } = useViewState()

const svgRef = ref(null)
const showTable = ref(false)
const ROW_H = 20 // 第 12 步：壓縮列高，讓 A 與 C 並排時一屏看得完
const M = { top: 28, right: 336, bottom: 8, left: 76 } // 右側要放得下「件數第 17／率第 1 ▲16 件數少」
// 寬度＝內容區 − 間距 − 圖 C 卡片（376）− 本卡片內距與邊框
const contentW = useLayoutWidth()
const W = computed(() => contentW.value - GRID_GAP - 376 - CARD_CHROME)
const H = M.top + counties.length * ROW_H + M.bottom
const DURATION = 750

const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
// 暴力犯罪的犯罪率模式才畫 95% 區間（規格書 §4.2）
const showCI = computed(() => state.crimeType === '暴力' && state.barMode === 'rate')

const value = (c) => (state.barMode === 'count' ? c[state.crimeType].count : c[state.crimeType].rate)
const headline = computed(() => headlineA(counties, state.crimeType, state.barMode))
const MODES = [
  { key: 'rate', label: '每十萬人犯罪率' },
  { key: 'count', label: '發生件數' },
]

const fmtValue = (v) => (state.barMode === 'count' ? `${d3.format(',')(v)} 件` : d3.format(',.2f')(v))

let g, axisG, x

function draw(animate) {
  const type = state.crimeType
  const innerW = W.value - M.left - M.right
  x.range([0, innerW])
  // 由高到低；數值相同時依縣市名稱，讓順序穩定
  const data = [...counties].sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id, 'zh-Hant'))
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.id))
    .range([0, counties.length * ROW_H])
    .padding(0.22)
  // 區間上限可能很大（連江 0 件、人口約 1.4 萬，上限約 26.8），
  // 座標只取「有案件縣市」的區間上限，超出的區間在邊界截斷並畫箭頭
  const maxV = showCI.value
    ? d3.max(data.filter((d) => d[type].count > 0), (d) => d[type].ciHigh)
    : d3.max(data, value)
  x.domain([0, maxV || 1]).nice()
  const clipped = (d) => showCI.value && d[type].ciHigh > x.domain()[1]

  const t = d3.transition().duration(animate ? DURATION : 0).ease(d3.easeCubicOut)

  axisG
    .transition(t)
    .call(d3.axisTop(x).ticks(5).tickSizeOuter(0).tickFormat(state.barMode === 'count' ? d3.format('~s') : d3.format(',')))

  const rows = g
    .selectAll('g.row')
    .data(data, (d) => d.id)
    .join((enter) => {
      const r = enter
        .append('g')
        .attr('class', 'row')
        .attr('transform', (d) => `translate(0,${y(d.id)})`)
      r.append('rect').attr('class', 'hit').attr('x', -M.left).attr('fill', 'transparent')
      r.append('text').attr('class', 'name').attr('x', -10).attr('text-anchor', 'end')
      r.append('rect').attr('class', 'bar').attr('width', 0).attr('rx', 2)
      r.append('line').attr('class', 'ci')
      r.append('text').attr('class', 'ci-arrow').attr('dy', '0.35em').text('▸')
      r.append('text').attr('class', 'val')
      r.append('text').attr('class', 'rank')
      return r
    })

  rows
    .on('mouseenter', (_, d) => hover(d.id))
    .on('mouseleave', () => hover(null))
    .on('click', (_, d) => togglePin(d.id))

  const mid = y.bandwidth() / 2
  rows.transition(t).attr('transform', (d) => `translate(0,${y(d.id)})`)
  rows.select('rect.hit').attr('width', W.value).attr('y', -(ROW_H - y.bandwidth()) / 2).attr('height', ROW_H)
  rows
    .select('text.name')
    .attr('y', mid)
    .attr('dy', '0.35em')
    .text((d) => d.id)
  rows
    .select('rect.bar')
    .attr('height', y.bandwidth())
    .transition(t)
    .attr('width', (d) => x(value(d)))
  rows
    .select('line.ci')
    .attr('y1', mid)
    .attr('y2', mid)
    .transition(t)
    .attr('x1', (d) => x(showCI.value ? d[type].ciLow : 0))
    .attr('x2', (d) => x(showCI.value ? Math.min(d[type].ciHigh, x.domain()[1]) : 0))
    .attr('opacity', showCI.value ? 1 : 0)
  rows
    .select('text.ci-arrow')
    .attr('x', innerW - 4)
    .attr('y', mid)
    .attr('opacity', (d) => (clipped(d) ? 1 : 0))
  rows
    .select('text.val')
    .attr('x', innerW + 12)
    .attr('y', mid)
    .attr('dy', '0.35em')
    .text((d) => fmtValue(value(d)) + (state.barMode === 'rate' && d[type].count === 0 ? '（0 件）' : ''))
  rows
    .select('text.rank')
    .attr('x', innerW + 100)
    .attr('y', mid)
    .attr('dy', '0.35em')
    .each(function (d) {
      const r = d[type]
      const el = d3.select(this)
      el.selectAll('tspan').remove()
      el.append('tspan').text(`件數第 ${r.rankCount}／率第 ${r.rankRate}`)
      // 名次變動：件數名次 − 率名次；正值＝換算犯罪率後名次上升
      if (r.rankDelta !== 0) {
        el.append('tspan')
          .attr('class', r.rankDelta > 0 ? 'up' : 'down')
          .attr('dx', 6)
          .text(`${r.rankDelta > 0 ? '▲' : '▼'}${Math.abs(r.rankDelta)}`)
      }
      if (type === '暴力' && r.smallN) el.append('tspan').attr('class', 'small').attr('dx', 6).text('件數少')
    })

  updateEmphasis(animate)
}

function updateEmphasis(animate = true) {
  g.selectAll('g.row')
    .transition('emphasis')
    .duration(animate ? 150 : 0)
    .attr('opacity', (d) => emphasis(d, state))
  g.selectAll('g.row').classed('focused', (d) => d.id === (state.pinned ?? state.hovered))
}

onMounted(() => {
  const svg = d3.select(svgRef.value)
  g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
  axisG = g.append('g').attr('class', 'axis')
  x = d3.scaleLinear()
  draw(false)
})

watch(() => [state.barMode, state.crimeType], () => draw(true))
watch(W, () => draw(false))
watch(() => [state.hovered, state.pinned, state.filter], () => updateEmphasis())
</script>

<template>
  <section class="chart-card">
    <p class="kicker">A 排名橫條圖・{{ typeLabel }}</p>
    <h2>{{ headline }}</h2>
    <div class="chart-header">
      <div class="sort" role="group" aria-label="圖 A 排序依據">
        <span class="label">排序依據</span>
        <div class="segmented">
          <button
            v-for="o in MODES"
            :key="o.key"
            :class="{ active: state.barMode === o.key }"
            :aria-pressed="state.barMode === o.key"
            @click="setBarMode(o.key)"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
      <button class="table-btn" :aria-pressed="showTable" @click="showTable = !showTable">{{ showTable ? '顯示圖表' : '資料表' }}</button>
    </div>
    <p class="caption">
      右側為全國名次，▲▼ 為換算犯罪率後的名次變化。
      <span v-if="showCI">細線為 95% 信賴區間，▸ 表示區間超出座標範圍。</span>
    </p>
    <ChartDataTable v-if="showTable" kind="A" />
    <svg v-show="!showTable" ref="svgRef" :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" role="img" :aria-label="`${typeLabel}各縣市排名橫條圖`" />
  </section>
</template>

<style scoped>
.chart-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 20px 24px;
  display: inline-block;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.kicker {
  margin: 0;
  font-size: var(--font-min);
  color: var(--slate-light);
}
h2 {
  font-size: 20px;
  line-height: 1.4;
  margin: 2px 0 10px;
}
.sort {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  font-size: var(--font-min);
  color: var(--slate);
}
.segmented {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--sheet);
  overflow: hidden;
}
.segmented button {
  font: inherit;
  font-size: var(--font-min);
  padding: 4px 12px;
  border: none;
  border-left: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}
.segmented button:first-child {
  border-left: none;
}
.segmented button:hover {
  background: var(--paper);
}
.segmented button.active {
  background: var(--ink);
  color: var(--paper);
}
.caption {
  color: var(--color-ink-soft);
  font-size: var(--font-min);
  margin: 8px 0 4px;
}

.table-btn {
  flex: none;
  white-space: nowrap;
  font: inherit;
  font-size: var(--font-min);
  padding: 4px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-ink-soft);
  cursor: pointer;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.head-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
svg {
  display: block;
  font-family: var(--font-sans);
}
svg :deep(text) {
  font-size: 14px;
  fill: var(--color-ink);
}
svg :deep(.axis text) {
  fill: var(--color-muted);
}
svg :deep(.axis path),
svg :deep(.axis line) {
  stroke: var(--color-border);
}
svg :deep(.row) {
  cursor: pointer;
}
svg :deep(.bar) {
  fill: var(--color-accent);
}
svg :deep(.row.focused .bar) {
  fill: var(--color-accent-2);
}
svg :deep(.ci) {
  stroke: var(--color-ink);
  stroke-width: 1.5;
}
svg :deep(.ci-arrow) {
  fill: var(--color-ink);
}
svg :deep(.val) {
  font-variant-numeric: tabular-nums;
}
svg :deep(.rank) {
  fill: var(--color-ink-soft);
}
svg :deep(.rank .up) {
  fill: #b8641e;
  font-weight: 700;
}
svg :deep(.rank .down) {
  fill: var(--color-accent);
  font-weight: 700;
}
svg :deep(.rank .small) {
  fill: var(--color-muted);
}
</style>
