<script setup>
// 圖表 A：排名橫條圖（規格書 §4.2、§4.3）
// 件數 ⇄ 每十萬人犯罪率切換時，長度補間、縣市以 Y 位置轉場重排。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'

const { counties } = useCrimeData()
const { state, setBarMode, hover, togglePin } = useViewState()

const svgRef = ref(null)
const ROW_H = 26
const M = { top: 32, right: 340, bottom: 8, left: 76 }
const W = 900
const H = M.top + counties.length * ROW_H + M.bottom
const innerW = W - M.left - M.right
const DURATION = 750

const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
// 暴力犯罪的犯罪率模式才畫 95% 區間（規格書 §4.2）
const showCI = computed(() => state.crimeType === '暴力' && state.barMode === 'rate')

const value = (c) => (state.barMode === 'count' ? c[state.crimeType].count : c[state.crimeType].rate)
const fmtValue = (v) => (state.barMode === 'count' ? `${d3.format(',')(v)} 件` : d3.format(',.2f')(v))

let g, axisG, x

function draw(animate) {
  const type = state.crimeType
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
      r.append('rect').attr('class', 'hit').attr('x', -M.left).attr('width', W).attr('fill', 'transparent')
      r.append('text').attr('class', 'name').attr('x', -10).attr('text-anchor', 'end')
      r.append('rect').attr('class', 'bar').attr('width', 0).attr('rx', 2)
      r.append('line').attr('class', 'ci')
      r.append('text').attr('class', 'ci-arrow').attr('dy', '0.35em').text('▸')
      r.append('text').attr('class', 'val').attr('x', innerW + 12)
      r.append('text').attr('class', 'rank').attr('x', innerW + 112)
      return r
    })

  rows
    .on('mouseenter', (_, d) => hover(d.id))
    .on('mouseleave', () => hover(null))
    .on('click', (_, d) => togglePin(d.id))

  const mid = y.bandwidth() / 2
  rows.transition(t).attr('transform', (d) => `translate(0,${y(d.id)})`)
  rows.select('rect.hit').attr('y', -(ROW_H - y.bandwidth()) / 2).attr('height', ROW_H)
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
    .attr('y', mid)
    .attr('dy', '0.35em')
    .text((d) => fmtValue(value(d)) + (state.barMode === 'rate' && d[type].count === 0 ? '（0 件）' : ''))
  rows
    .select('text.rank')
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
  x = d3.scaleLinear().range([0, innerW])
  draw(false)
})

watch(() => [state.barMode, state.crimeType], () => draw(true))
watch(() => [state.hovered, state.pinned, state.filter], () => updateEmphasis())
</script>

<template>
  <section class="chart-card">
    <header class="chart-header">
      <h2>A 排名橫條圖：{{ typeLabel }}</h2>
      <div class="toggle" role="group" aria-label="排序依據">
        <button :class="{ active: state.barMode === 'count' }" :aria-pressed="state.barMode === 'count'" @click="setBarMode('count')">
          發生件數
        </button>
        <button :class="{ active: state.barMode === 'rate' }" :aria-pressed="state.barMode === 'rate'" @click="setBarMode('rate')">
          每十萬人犯罪率
        </button>
      </div>
    </header>
    <p class="caption">
      {{ state.barMode === 'count' ? '依發生件數排序' : '依每十萬人犯罪率排序' }}；右側為全國名次，▲▼ 為換算犯罪率後的名次變化。
      <span v-if="showCI">細線為 95% 信賴區間，▸ 表示區間超出座標範圍。</span>
    </p>
    <svg ref="svgRef" :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" role="img" :aria-label="`${typeLabel}各縣市排名橫條圖`" />
  </section>
</template>

<style scoped>
.chart-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px 24px;
  display: inline-block;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
h2 {
  font-size: 18px;
  margin: 0;
}
.caption {
  color: var(--color-ink-soft);
  font-size: var(--font-min);
  margin: 8px 0 4px;
}
.toggle button {
  font: inherit;
  font-size: 15px;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-ink);
  cursor: pointer;
}
.toggle button:first-child {
  border-radius: 999px 0 0 999px;
}
.toggle button:last-child {
  border-radius: 0 999px 999px 0;
  border-left: none;
}
.toggle button.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: #fff;
}
.toggle button:focus-visible {
  outline: 3px solid var(--color-accent-2);
  outline-offset: 2px;
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
