<script setup>
// 圖表 B：等積方塊地圖（規格書 §4.2、§4.4）
// 22 縣市各占一格、大小相同，避免面積大的縣市在視覺上被放大。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { fmtRate as fmtRateT } from '../utils/format.js'
import { rateColorScale } from '../utils/colors.js'
import RateLegend from './RateLegend.vue'
import { headlineTile } from '../utils/headlines.js'
import { dur } from '../utils/motion.js'
import ChartDataTable from './ChartDataTable.vue'
import { TILE_CELL as CELL, TILE_COLS, TILE_GAP as GAP, TILE_LAYOUT, TILE_ROWS } from '../utils/tileLayout.js'

const { counties } = useCrimeData()
const { state, hover, togglePin } = useViewState()

const svgRef = ref(null)
const showTable = ref(false)
// 格子尺寸與卡片寬度定義在 utils/tileLayout.js（圖 A 要用它推算自己的寬度）
const ISLAND_GAP = CELL / 2 // 離島欄與本島之間多留半格
const M = { top: 8, right: 8, bottom: 8, left: 8 }
const W = M.left + TILE_COLS * CELL + (TILE_COLS - 1) * GAP + ISLAND_GAP + M.right
const H = M.top + TILE_ROWS * CELL + (TILE_ROWS - 1) * GAP + M.bottom
const DURATION = 750

const headline = computed(() => headlineTile(counties, state.crimeType, state.filter))
const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
const isViolent = computed(() => state.crimeType === '暴力')

const byId = new Map(counties.map((c) => [c.id, c]))
const tiles = TILE_LAYOUT.map((t) => ({ ...t, county: byId.get(t.id) }))
const cellX = (col) => M.left + col * (CELL + GAP) + (col > 0 ? ISLAND_GAP : 0)
const cellY = (row) => M.top + row * (CELL + GAP)

// 率青單一色相明度色階，與圖 A 共用 5 級分級（utils/colors.js）；禁用彩虹色
let color = rateColorScale([0, 1])
const fmtRate = (v) => fmtRateT(v, state.crimeType)

let g

function draw(animate) {
  const type = state.crimeType
  const rates = counties.map((c) => c[type].rate)
  color = rateColorScale(rates)
  const t = d3.transition().duration(animate ? dur(DURATION) : 0).ease(d3.easeCubicOut)

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

/** 依 WCAG 對比度選字色：白字與墨字（#1C2A2E）哪個對比高就用哪個 */
const lum = (c) => {
  const { r, g, b } = d3.rgb(c)
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
const L_WHITE = 1
const L_INK = lum('#1C2A2E')
function isDark(rate) {
  const L = lum(color(rate))
  return contrast(L, L_WHITE) > contrast(L, L_INK)
}

/** 未選取的格子變淡，但格內文字仍要讀得到，所以不低於 0.4 */
function updateEmphasis(animate = true) {
  const focus = state.pinned ?? state.hovered
  g.selectAll('g.tile')
    .classed('focused', (d) => d.id === focus)
    .classed('pinned', (d) => d.id === state.pinned)
    .transition('emphasis')
    .duration(animate ? dur(150) : 0)
    .attr('opacity', (d) => {
      const e = emphasis(d.county, state)
      return e === 1 ? 1 : e <= 0.15 ? 0.3 : 0.45
    })
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
  zero.append('rect').attr('width', 8).attr('height', 8).attr('fill', '#E3E9E8')
  zero.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8).attr('stroke', '#9AA7AB').attr('stroke-width', 2)
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
    // 鍵盤：Tab 移到格子＝懸停，Enter／空白鍵＝鎖定
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d) => d.id)
    .on('focus', (_, d) => hover(d.id))
    .on('blur', () => hover(null))
    .on('keydown', (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        togglePin(d.id)
      }
    })
  // 選取時的螢光黃外框（畫在格子後面，往外多 4px）
  cells.append('rect').attr('class', 'halo').attr('x', -4).attr('y', -4).attr('width', CELL + 8).attr('height', CELL + 8).attr('rx', 9)
  cells.append('rect').attr('class', 'fill').attr('width', CELL).attr('height', CELL).attr('rx', 6)
  cells.append('rect').attr('class', 'small').attr('width', CELL).attr('height', CELL).attr('rx', 6).attr('fill', 'url(#hatch-small)').attr('opacity', 0)
  cells.append('rect').attr('class', 'outline').attr('width', CELL).attr('height', CELL).attr('rx', 6)
  cells
    .append('text')
    .attr('class', 'name')
    .attr('x', CELL / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .text((d) => d.short)
  cells.append('text').attr('class', 'value').attr('x', CELL / 2).attr('y', 44).attr('text-anchor', 'middle')

  draw(false)
})

watch(() => state.crimeType, () => draw(true))
watch(() => [state.hovered, state.pinned, state.filter, state.brushed], () => updateEmphasis())
</script>

<template>
  <section class="chart-card">
    <div class="head">
      <div>
        <p class="kicker">B 等積方塊地圖・{{ typeLabel }}</p>
        <h2>{{ headline }}</h2>
      </div>
      <button class="table-btn" :aria-pressed="showTable" @click="showTable = !showTable">{{ showTable ? '顯示圖表' : '資料表' }}</button>
    </div>
    <p class="caption">每個縣市一格、大小相同；顏色分 5 級，越深每十萬人犯罪率越高（與圖 A 同色）。左欄為離島。</p>
    <ChartDataTable v-if="showTable" kind="B" :style="{ width: `${W}px` }" />
    <svg v-show="!showTable" ref="svgRef" :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" role="img" :aria-label="`${typeLabel}各縣市犯罪率等積方塊地圖`" />
    <div v-show="!showTable" class="legend" aria-hidden="true">
      <RateLegend :type="state.crimeType" />
    </div>
    <p v-if="isViolent" class="note">白色細斜線：件數少於 30，犯罪率容易因少數案件大幅變動；灰色斜線：本年 0 件。</p>
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
  outline: none;
}
svg :deep(.halo) {
  fill: none;
  stroke: var(--mark);
  stroke-width: 4;
  opacity: 0;
}
svg :deep(.tile.focused .halo) {
  opacity: 0.35;
}
svg :deep(.tile.pinned .halo),
svg :deep(.tile:focus-visible .halo) {
  opacity: 1;
}
svg :deep(.outline) {
  fill: none;
  stroke: transparent;
  stroke-width: 3;
}
svg :deep(.tile.focused .outline) {
  stroke: var(--ink);
  stroke-width: 2;
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
  stroke: var(--line);
  stroke-dasharray: 4 4;
}
</style>
