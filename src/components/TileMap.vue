<script setup>
// 圖表 C：等積方塊地圖（規格書 §4.2、§4.4）
// 22 縣市各占一格、大小相同，避免面積大的縣市在視覺上被放大。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { headlineC } from '../utils/headlines.js'
import ChartDataTable from './ChartDataTable.vue'
import { TILE_COLS, TILE_LAYOUT, TILE_ROWS } from '../utils/tileLayout.js'

const { counties } = useCrimeData()
const { state, hover, togglePin } = useViewState()

const svgRef = ref(null)
const showTable = ref(false)
const CELL = 52 // 第 12 步：與圖 A 並排，格子 64→52
const GAP = 6
const ISLAND_GAP = CELL / 2 // 離島欄與本島之間多留半格
const M = { top: 8, right: 8, bottom: 8, left: 8 }
const W = M.left + TILE_COLS * CELL + (TILE_COLS - 1) * GAP + ISLAND_GAP + M.right
const H = M.top + TILE_ROWS * CELL + (TILE_ROWS - 1) * GAP + M.bottom
const DURATION = 750

const headline = computed(() => headlineC(counties, state.crimeType))
const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
const isViolent = computed(() => state.crimeType === '暴力')

const byId = new Map(counties.map((c) => [c.id, c]))
const tiles = TILE_LAYOUT.map((t) => ({ ...t, county: byId.get(t.id) }))
const cellX = (col) => M.left + col * (CELL + GAP) + (col > 0 ? ISLAND_GAP : 0)
const cellY = (row) => M.top + row * (CELL + GAP)

// 色階只用藍色系的中段到深段，最淺的格子仍看得見（禁用彩虹色）
const T0 = 0.12
const T1 = 0.9
const color = d3.scaleSequential((t) => d3.interpolateBlues(T0 + (T1 - T0) * t))
const legend = ref({ min: '', max: '', stops: [] })
const fmtRate = (v) => (state.crimeType === '暴力' ? d3.format(',.2f')(v) : d3.format(',.0f')(v))

let g

function draw(animate) {
  const type = state.crimeType
  const rates = counties.map((c) => c[type].rate)
  color.domain(d3.extent(rates))
  legend.value = {
    min: fmtRate(d3.min(rates)),
    max: fmtRate(d3.max(rates)),
    stops: d3.range(0, 1.01, 0.25).map((t) => d3.interpolateBlues(T0 + (T1 - T0) * t)),
  }
  const t = d3.transition().duration(animate ? DURATION : 0).ease(d3.easeCubicOut)

  const cells = g.selectAll('g.tile')
  // 斜線圖樣（url）無法做顏色補間：0 件與從 0 件換回來的格子直接設定，其餘才做轉場
  const isZero = (d) => d.county[type].count === 0
  cells.select('rect.fill').each(function (d) {
    const el = d3.select(this)
    const wasPattern = String(el.attr('fill')).startsWith('url')
    if (isZero(d)) el.interrupt().attr('fill', 'url(#hatch-zero)')
    else if (wasPattern || !el.attr('fill')) el.interrupt().attr('fill', color(d.county[type].rate))
    else el.transition(t).attr('fill', color(d.county[type].rate))
  })
  // 暴力犯罪件數少於 30：加細斜線（規格書 §4.1）
  cells
    .select('rect.small')
    .transition(t)
    .attr('opacity', (d) => (type === '暴力' && d.county.暴力.smallN && d.county.暴力.count > 0 ? 1 : 0))
  cells
    .selectAll('text')
    .classed('on-dark', (d) => !isZero(d) && isDark(d.county[type].rate))
  cells.select('text.value').text((d) => (d.county[type].count === 0 ? '0 件' : fmtRate(d.county[type].rate)))

  updateEmphasis(animate)
}

/** 色階後段（較深）改用白字 */
function isDark(rate) {
  const [lo, hi] = color.domain()
  return (rate - lo) / (hi - lo || 1) > 0.5
}

function updateEmphasis(animate = true) {
  const focus = state.pinned ?? state.hovered
  g.selectAll('g.tile')
    .classed('focused', (d) => d.id === focus)
    .transition('emphasis')
    .duration(animate ? 150 : 0)
    .attr('opacity', (d) => emphasis(d.county, state))
}

onMounted(() => {
  const svg = d3.select(svgRef.value)
  const defs = svg.append('defs')
  // 0 件：淺灰底加斜線
  const zero = defs
    .append('pattern')
    .attr('id', 'hatch-zero')
    .attr('width', 8)
    .attr('height', 8)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'rotate(45)')
  zero.append('rect').attr('width', 8).attr('height', 8).attr('fill', '#eef1f4')
  zero.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8).attr('stroke', '#a3acb8').attr('stroke-width', 2)
  // 件數少：透明底加白色細斜線，疊在顏色上
  const small = defs
    .append('pattern')
    .attr('id', 'hatch-small')
    .attr('width', 7)
    .attr('height', 7)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'rotate(45)')
  small.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 7).attr('stroke', '#ffffff').attr('stroke-opacity', 0.35).attr('stroke-width', 1)

  g = svg.append('g')

  // 離島欄與本島之間的虛線分隔
  const sepX = cellX(1) - ISLAND_GAP / 2 - GAP / 2
  g.append('line').attr('class', 'island-sep').attr('x1', sepX).attr('x2', sepX).attr('y1', M.top).attr('y2', H - M.bottom)

  const cells = g
    .selectAll('g.tile')
    .data(tiles, (d) => d.id)
    .join('g')
    .attr('class', 'tile')
    .attr('transform', (d) => `translate(${cellX(d.col)},${cellY(d.row)})`)
    .on('mouseenter', (_, d) => hover(d.id))
    .on('mouseleave', () => hover(null))
    .on('click', (_, d) => togglePin(d.id))
  cells.append('rect').attr('class', 'fill').attr('width', CELL).attr('height', CELL).attr('rx', 6)
  cells.append('rect').attr('class', 'small').attr('width', CELL).attr('height', CELL).attr('rx', 6).attr('fill', 'url(#hatch-small)').attr('opacity', 0)
  cells.append('rect').attr('class', 'outline').attr('width', CELL).attr('height', CELL).attr('rx', 6)
  cells
    .append('text')
    .attr('class', 'name')
    .attr('x', CELL / 2)
    .attr('y', 22)
    .attr('text-anchor', 'middle')
    .text((d) => d.short)
  cells.append('text').attr('class', 'value').attr('x', CELL / 2).attr('y', 39).attr('text-anchor', 'middle')

  draw(false)
})

watch(() => state.crimeType, () => draw(true))
watch(() => [state.hovered, state.pinned, state.filter], () => updateEmphasis())
</script>

<template>
  <section class="chart-card">
    <div class="head">
      <div>
        <p class="kicker">C 等積方塊地圖・{{ typeLabel }}</p>
        <h2>{{ headline }}</h2>
      </div>
      <button class="table-btn" :aria-pressed="showTable" @click="showTable = !showTable">{{ showTable ? '顯示圖表' : '資料表' }}</button>
    </div>
    <p class="caption">每個縣市一格、大小相同；顏色越深，每十萬人犯罪率越高。左欄為離島。</p>
    <ChartDataTable v-if="showTable" kind="C" />
    <svg v-show="!showTable" ref="svgRef" :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" role="img" :aria-label="`${typeLabel}各縣市犯罪率等積方塊地圖`" />
    <div v-show="!showTable" class="legend" aria-hidden="true">
      <span>{{ legend.min }}</span>
      <span class="ramp" :style="{ background: `linear-gradient(to right, ${legend.stops.join(',')})` }" />
      <span>{{ legend.max }}</span>
      <span class="unit">（每十萬人）</span>
    </div>
    <p v-if="isViolent" class="note">斜線格：件數少於 30，犯罪率不穩定；灰色斜線：本年 0 件。</p>
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
.kicker {
  margin: 0;
  font-size: var(--font-min);
  color: var(--slate-light);
}
h2 {
  font-size: 20px;
  line-height: 1.4;
  margin: 2px 0 0;
}
.caption,
.note {
  color: var(--color-ink-soft);
  font-size: var(--font-min);
  margin: 8px 0 4px;
  max-width: 400px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: var(--font-min);
  color: var(--color-ink-soft);
  margin-top: 6px;
}
.ramp {
  display: inline-block;
  width: 160px;
  height: 12px;
  border-radius: 6px;
}
.unit {
  color: var(--color-muted);
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
  align-items: flex-start;
  gap: 16px;
}
svg {
  display: block;
  font-family: var(--font-sans);
}
svg :deep(.tile) {
  cursor: pointer;
}
svg :deep(.outline) {
  fill: none;
  stroke: transparent;
  stroke-width: 3;
}
svg :deep(.tile.focused .outline) {
  stroke: var(--color-accent-2);
}
svg :deep(text) {
  font-size: 14px;
  fill: var(--color-ink);
  pointer-events: none;
}
svg :deep(text.name) {
  font-weight: 700;
}
svg :deep(text.on-dark) {
  fill: #ffffff;
}
svg :deep(.island-sep) {
  stroke: #c9d3de;
  stroke-dasharray: 4 4;
}
</style>
