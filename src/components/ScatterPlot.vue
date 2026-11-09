<script setup>
// 圖表 C：犯罪率 × 破獲率散佈圖（規格書 §4.2）
// 以 22 縣市中位數分區；象限只寫位置描述，不貼價值標籤。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { REGION_COLORS } from '../utils/colors.js'
import { headlineScatter } from '../utils/headlines.js'
import { CARD_CHROME, useLayoutWidth } from '../composables/useLayoutWidth.js'
import ChartDataTable from './ChartDataTable.vue'

const { counties, meta } = useCrimeData()
const { state, hover, togglePin } = useViewState()

const svgRef = ref(null)
const showTable = ref(false)
// 第 12 步：B 單獨一列、全寬；寬度隨內容區調整，改變時整張重建
const contentW = useLayoutWidth()
const svgW = computed(() => contentW.value - CARD_CHROME)
let W = svgW.value
const H = 480
const M = { top: 24, right: 28, bottom: 56, left: 64 }
let innerW = W - M.left - M.right
const innerH = H - M.top - M.bottom
const DURATION = 750

const regions = Object.keys(REGION_COLORS)

// 各案類的 Y 軸範圍（規格書 §4.2 預期值）
const Y_DOMAIN = { 全般: [50, 100], 暴力: [75, 120], 竊盜: [50, 100] }

const headline = computed(() => headlineScatter(counties, meta, state.crimeType))
const typeLabel = computed(() => ({ 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' })[state.crimeType])
const isViolent = computed(() => state.crimeType === '暴力')
const medians = computed(() => meta.types[state.crimeType])
const fmt = d3.format(',.2f')

let g, x, y, r, xAxisG, yAxisG
const QUADS = [
  { key: 'tr', text: '高犯罪率・高破獲率' },
  { key: 'tl', text: '低犯罪率・高破獲率' },
  { key: 'br', text: '高犯罪率・低破獲率' },
  { key: 'bl', text: '低犯罪率・低破獲率' },
]

/** 要常駐標名稱的縣市：犯罪率第 1 名、破獲率最高與最低（標太多會互相重疊） */
function labelledIds(data, type) {
  const byRate = [...data].sort((a, b) => b[type].rate - a[type].rate).slice(0, 1)
  const byClr = [...data].sort((a, b) => a[type].clearance - b[type].clearance)
  return new Set([...byRate, byClr[0], byClr[byClr.length - 1]].map((d) => d.id))
}

function draw(animate) {
  const type = state.crimeType
  // 破獲率無法計算（連江暴力 0 件）的縣市不畫
  const data = counties.filter((c) => c[type].clearance !== null)
  const t = d3.transition().duration(animate ? DURATION : 0).ease(d3.easeCubicOut)

  const xMax = d3.max(data, (d) => (isViolent.value ? d[type].ciHigh : d[type].rate))
  const xMin = isViolent.value ? 0 : d3.min(data, (d) => d[type].rate)
  x.domain([xMin * 0.9, xMax * 1.04]).nice()
  y.domain(Y_DOMAIN[type])

  xAxisG.transition(t).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(',')))
  yAxisG.transition(t).call(d3.axisLeft(y).ticks(6).tickFormat((v) => `${v}%`))

  // 100% 參考線與「超過 100%」底色：只在暴力犯罪顯示
  const top = y(Y_DOMAIN[type][1])
  g.select('rect.over100')
    .transition(t)
    .attr('y', top)
    .attr('height', Math.max(0, y(100) - top))
    .attr('opacity', isViolent.value ? 1 : 0)
  g.select('line.ref100')
    .transition(t)
    .attr('y1', y(100))
    .attr('y2', y(100))
    .attr('opacity', isViolent.value ? 1 : 0)
  g.select('text.ref100-label')
    .transition(t)
    .attr('y', y(100) + 18)
    .attr('opacity', isViolent.value ? 1 : 0)

  // 中位數分區線
  g.select('line.med-x')
    .transition(t)
    .attr('x1', x(medians.value.medianRate))
    .attr('x2', x(medians.value.medianRate))
  g.select('line.med-y')
    .transition(t)
    .attr('y1', y(medians.value.medianClearance))
    .attr('y2', y(medians.value.medianClearance))
  g.select('text.med-x-label')
    .transition(t)
    .attr('x', x(medians.value.medianRate) + 4)
    .text(`中位數 ${d3.format(',.4~f')(medians.value.medianRate)}`)
  // 暴力犯罪的破獲率中位數剛好是 100%，與參考線重合：標籤改放右側並說明
  g.select('text.med-y-label')
    .attr('text-anchor', isViolent.value ? 'end' : 'start')
    .transition(t)
    .attr('x', isViolent.value ? innerW - 6 : 6)
    .attr('y', y(medians.value.medianClearance) - 6)
    .text(
      isViolent.value
        ? `中位數 ${d3.format('.4~f')(medians.value.medianClearance)}%（與參考線重合）`
        : `中位數 ${d3.format('.4~f')(medians.value.medianClearance)}%`,
    )

  // 暴力犯罪：犯罪率的 95% 信賴區間（水平線）
  g.select('g.cis')
    .selectAll('line')
    .data(isViolent.value ? data : [], (d) => d.id)
    .join(
      (enter) =>
        enter
          .append('line')
          .attr('x1', (d) => x(d[type].rate))
          .attr('x2', (d) => x(d[type].rate))
          .attr('y1', (d) => y(d[type].clearance))
          .attr('y2', (d) => y(d[type].clearance)),
      (update) => update,
      (exit) => exit.transition(t).attr('opacity', 0).remove(),
    )
    .transition(t)
    .attr('opacity', 1)
    .attr('x1', (d) => x(d[type].ciLow))
    .attr('x2', (d) => x(d[type].ciHigh))
    .attr('y1', (d) => y(d[type].clearance))
    .attr('y2', (d) => y(d[type].clearance))

  const labelled = labelledIds(data, type)
  const dots = g
    .select('g.dots')
    .selectAll('g.dot')
    .data(data, (d) => d.id)
    .join(
      (enter) => {
        const e = enter
          .append('g')
          .attr('class', 'dot')
          .attr('transform', (d) => `translate(${x(d[type].rate)},${y(d[type].clearance)})`)
        e.append('circle')
          .attr('r', (d) => r(d.pop))
          .attr('fill', (d) => REGION_COLORS[d.region])
        e.append('text').attr('class', 'label').attr('dy', '0.35em')
        return e
      },
      (update) => update,
      (exit) => exit.transition(t).attr('opacity', 0).remove(),
    )
  // 大泡泡畫在下層，避免蓋住小縣市
  dots.sort((a, b) => b.pop - a.pop)
  dots
    .on('mouseenter', (_, d) => hover(d.id))
    .on('mouseleave', () => hover(null))
    .on('click', (_, d) => togglePin(d.id))
  dots.transition(t).attr('transform', (d) => `translate(${x(d[type].rate)},${y(d[type].clearance)})`)
  dots
    .select('text.label')
    .attr('x', (d) => r(d.pop) + 4)
    .text((d) => d.id)
    .classed('always', (d) => labelled.has(d.id))

  updateEmphasis(animate)
}

function updateEmphasis(animate = true) {
  const focus = state.pinned ?? state.hovered
  g.selectAll('g.dot')
    .transition('emphasis')
    .duration(animate ? 150 : 0)
    .attr('opacity', (d) => emphasis(d, state))
  // 不在懸停時調整 DOM 順序（raise 會觸發 mouseleave，造成閃爍）
  g.selectAll('g.dot').classed('focused', (d) => d.id === focus)
  g.selectAll('g.cis line')
    .transition('emphasis')
    .duration(animate ? 150 : 0)
    .attr('opacity', (d) => emphasis(d, state))
}

function build() {
  W = svgW.value
  innerW = W - M.left - M.right
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
  x = d3.scaleLinear().range([0, innerW])
  y = d3.scaleLinear().range([innerH, 0])
  // 面積對應人口；最小半徑 4px，避免連江（約 1.4 萬人）小到看不見
  const rScale = d3.scaleSqrt().domain([0, d3.max(counties, (d) => d.pop)]).range([0, 22])
  r = (pop) => Math.max(4, rScale(pop))

  g.append('rect').attr('class', 'over100').attr('x', 0).attr('width', innerW).attr('opacity', 0)
  g.append('line').attr('class', 'ref100').attr('x1', 0).attr('x2', innerW).attr('opacity', 0)
  g.append('text')
    .attr('class', 'ref100-label')
    .attr('x', innerW - 6)
    .attr('text-anchor', 'end')
    .attr('opacity', 0)
    .text('100% 參考線：破獲數含往年積案')
  g.append('line').attr('class', 'med med-x').attr('y1', 0).attr('y2', innerH)
  g.append('line').attr('class', 'med med-y').attr('x1', 0).attr('x2', innerW)
  g.append('text').attr('class', 'med-label med-x-label').attr('y', innerH - 6)
  g.append('text').attr('class', 'med-label med-y-label').attr('x', 6)

  // 象限位置描述（淡字，置於四角）
  const pad = 8
  const pos = {
    tr: [innerW - pad, pad + 10, 'end'],
    tl: [pad, pad + 10, 'start'],
    br: [innerW - pad, innerH - pad - 18, 'end'],
    bl: [pad, innerH - pad - 18, 'start'],
  }
  g.selectAll('text.quad')
    .data(QUADS)
    .join('text')
    .attr('class', 'quad')
    .attr('x', (d) => pos[d.key][0])
    .attr('y', (d) => pos[d.key][1])
    .attr('text-anchor', (d) => pos[d.key][2])
    .text((d) => d.text)

  xAxisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`)
  yAxisG = g.append('g').attr('class', 'axis')
  g.append('text')
    .attr('class', 'axis-title')
    .attr('x', innerW / 2)
    .attr('y', innerH + 44)
    .attr('text-anchor', 'middle')
    .text('每十萬人犯罪率（件）')
  g.append('text')
    .attr('class', 'axis-title')
    .attr('transform', `translate(-48,${innerH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .text('破獲率')

  g.append('g').attr('class', 'cis')
  g.append('g').attr('class', 'dots')
  draw(false)
}

onMounted(build)
watch(svgW, build)

watch(() => state.crimeType, () => draw(true))
watch(() => [state.hovered, state.pinned, state.filter], () => updateEmphasis())
</script>

<template>
  <section class="chart-card">
    <div class="head">
      <div>
        <p class="kicker">C 散佈圖・{{ typeLabel }}犯罪率 × 破獲率</p>
        <h2>{{ headline }}</h2>
      </div>
      <button class="table-btn" :aria-pressed="showTable" @click="showTable = !showTable">{{ showTable ? '顯示圖表' : '資料表' }}</button>
    </div>
    <p class="caption">
      虛線為 22 縣市中位數；點越大代表推估人口越多。
      <span v-if="isViolent">細線為犯罪率 95% 信賴區間。</span>
    </p>
    <ChartDataTable v-if="showTable" kind="C" />
    <svg v-show="!showTable" ref="svgRef" :viewBox="`0 0 ${svgW} ${H}`" :width="svgW" :height="H" role="img" :aria-label="`${typeLabel}各縣市犯罪率與破獲率散佈圖`" />
    <ul v-show="!showTable" class="legend" aria-label="區域圖例">
      <li v-for="reg in regions" :key="reg">
        <span class="swatch" :style="{ background: REGION_COLORS[reg] }" />{{ reg }}
      </li>
    </ul>
    <p v-if="isViolent" class="note">連江縣 2025 年暴力犯罪 0 件，破獲率無法計算，未畫入本圖。</p>
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
}
.legend {
  display: flex;
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  font-size: var(--font-min);
  color: var(--color-ink-soft);
}
.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: -1px;
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
svg :deep(text) {
  font-size: 14px;
  fill: var(--color-ink);
}
svg :deep(.axis text),
svg :deep(.axis-title) {
  fill: var(--color-muted);
}
svg :deep(.axis path),
svg :deep(.axis line) {
  stroke: var(--color-border);
}
svg :deep(.quad) {
  fill: #a3acb8;
}
svg :deep(.med) {
  stroke: #9aa8b8;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}
svg :deep(.med-label) {
  fill: var(--color-muted);
}
svg :deep(.over100) {
  fill: #f6ecc9;
}
svg :deep(.ref100) {
  stroke: #b8901a;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}
svg :deep(.ref100-label) {
  fill: #8a6a0c;
}
svg :deep(.cis line) {
  stroke: var(--color-ink-soft);
  stroke-width: 1.5;
}
svg :deep(.dot) {
  cursor: pointer;
}
svg :deep(.dot circle) {
  stroke: #fff;
  stroke-width: 1.5;
  fill-opacity: 0.85;
}
svg :deep(.dot.focused circle) {
  stroke: var(--color-ink);
  stroke-width: 2.5;
}
svg :deep(.dot .label) {
  opacity: 0;
  pointer-events: none;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 3px;
}
svg :deep(.dot .label.always),
svg :deep(.dot.focused .label) {
  opacity: 1;
}
</style>
