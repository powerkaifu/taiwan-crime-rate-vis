<script setup>
// 圖表 C：犯罪率 × 破獲率散佈圖（規格書 §4.2）
// 以 22 縣市中位數分區；象限只寫位置描述，不貼價值標籤。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { fmtPct, fmtRate } from '../utils/format.js'
import { headlineScatter, scatterHits } from '../utils/headlines.js'
import { dur } from '../utils/motion.js'
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


// 各案類的 Y 軸範圍（規格書 §4.2 預期值）
const Y_DOMAIN = { 全般: [50, 100], 暴力: [75, 120], 竊盜: [50, 100] }

// 人口圖例：半徑用和圓點相同的比例尺計算（最大推估人口 → 22px，最小 4px）
const R_MAX = 22
const maxPop = d3.max(counties, (d) => d.pop)
const legendR = (pop) => Math.max(4, R_MAX * Math.sqrt(pop / maxPop))
const popLegend = [
  { label: '10 萬', r: legendR(1e5) },
  { label: '100 萬', r: legendR(1e6) },
  { label: '400 萬', r: legendR(4e6) },
]
const headline = computed(() => headlineScatter(counties, meta, state.crimeType, state.filter))
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

/**
 * 要常駐標名稱的縣市（第 13 步，審查意見「六都找不到」）：
 * 六都＋犯罪率最高＋破獲率最高與最低。依序擺放，避開已放的標籤與圖框。
 */
function labelledIds(data, type) {
  const byRate = [...data].sort((a, b) => b[type].rate - a[type].rate)
  const byClr = [...data].sort((a, b) => a[type].clearance - b[type].clearance)
  const extremes = [byRate[0], byClr[0], byClr[byClr.length - 1]]
  // 標題點名的縣市（最多 3 個）也一定要標出名字
  const hits = scatterHits(counties, meta, type, state.filter)
  const named = hits.length <= 4 ? hits : hits.slice(0, 3)
  return [...new Set([...extremes, ...named, ...data.filter((d) => d.isSixCity)].map((d) => d.id))]
}

/** 簡單的標籤擺放：每個標籤試 6 個位置，選第一個不與其他標籤、圖框重疊的 */
function placeLabels(data, type, ids) {
  const byIdLocal = new Map(data.map((d) => [d.id, d]))
  // 所有圓點都當障礙物，標籤不要壓到別的點
  const boxes = data.map((d) => {
    const rr = r(d.pop)
    return { x: x(d[type].rate) - rr, y: y(d[type].clearance) - rr, w: rr * 2, h: rr * 2, id: d.id }
  })
  const place = new Map()
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  for (const id of ids) {
    const d = byIdLocal.get(id)
    const cx = x(d[type].rate)
    const cy = y(d[type].clearance)
    const rr = r(d.pop)
    const w = id.length * 14 + 4
    const h = 16
    const cands = []
    // 由近到遠兩圈，各試 8 個方向
    for (const gap of [4, 18]) {
      cands.push(
        { dx: rr + gap, dy: 0, anchor: 'start' },
        { dx: -rr - gap, dy: 0, anchor: 'end' },
        { dx: 0, dy: -rr - gap - 6, anchor: 'middle' },
        { dx: 0, dy: rr + gap + 8, anchor: 'middle' },
        { dx: rr + gap - 2, dy: -rr - gap, anchor: 'start' },
        { dx: rr + gap - 2, dy: rr + gap + 4, anchor: 'start' },
        { dx: -rr - gap + 2, dy: -rr - gap, anchor: 'end' },
        { dx: -rr - gap + 2, dy: rr + gap + 4, anchor: 'end' },
      )
    }
    const boxOf = (c) => {
      const left = c.anchor === 'start' ? cx + c.dx : c.anchor === 'end' ? cx + c.dx - w : cx + c.dx - w / 2
      return { x: left, y: cy + c.dy - h / 2, w, h }
    }
    const inside = (b) => b.x >= 0 && b.x + b.w <= innerW && b.y >= 0 && b.y + b.h <= innerH
    const free = (c) => !boxes.some((b) => b.id !== id && overlap(b, boxOf(c)))
    const pick = cands.find((c) => inside(boxOf(c)) && free(c)) ?? cands[0]
    boxes.push(boxOf(pick))
    place.set(id, pick)
  }
  return place
}

function draw(animate) {
  const type = state.crimeType
  // 破獲率無法計算（連江暴力 0 件）的縣市不畫
  const data = counties.filter((c) => c[type].clearance !== null)
  const t = d3.transition().duration(animate ? dur(DURATION) : 0).ease(d3.easeCubicOut)

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
  g.select('text.over100-label')
    .transition(t)
    .attr('y', top + 18)
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
    .text(`中位數 ${fmtRate(medians.value.medianRate, type)}`)
  // 暴力犯罪的破獲率中位數剛好是 100%，與參考線重合：標籤改放右側並說明
  g.select('text.med-y-label')
    .attr('text-anchor', isViolent.value ? 'end' : 'start')
    .transition(t)
    .attr('x', isViolent.value ? innerW - 6 : 6)
    .attr('y', y(medians.value.medianClearance) - 6)
    .text(
      isViolent.value
        ? `中位數 ${fmtPct(medians.value.medianClearance)}（與參考線重合）`
        : `中位數 ${fmtPct(medians.value.medianClearance)}`,
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
        e.append('circle').attr('class', 'halo').attr('r', (d) => r(d.pop) + 4)
        e.append('circle').attr('class', 'pt')
          .attr('r', (d) => r(d.pop))
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
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d) => `${d.id}：犯罪率 ${fmtRate(d[type].rate, type)}，破獲率 ${fmtPct(d[type].clearance)}`)
    .on('focus', (_, d) => hover(d.id))
    .on('blur', () => hover(null))
    .on('keydown', (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        togglePin(d.id)
      }
    })
  dots.transition(t).attr('transform', (d) => `translate(${x(d[type].rate)},${y(d[type].clearance)})`)
  const place = placeLabels(data, type, labelled)
  const always = new Set(labelled)
  const defaultPos = (d) => ({ dx: r(d.pop) + 4, dy: 0, anchor: 'start' })
  dots
    .select('text.label')
    .attr('x', (d) => (place.get(d.id) ?? defaultPos(d)).dx)
    .attr('y', (d) => (place.get(d.id) ?? defaultPos(d)).dy)
    .attr('text-anchor', (d) => (place.get(d.id) ?? defaultPos(d)).anchor)
    .text((d) => d.id)
    .classed('always', (d) => always.has(d.id))

  updateEmphasis(animate)
}

function updateEmphasis(animate = true) {
  const focus = state.pinned ?? state.hovered
  g.selectAll('g.dot')
    .select('circle.pt')
    .transition('emphasis')
    .duration(animate ? dur(150) : 0)
    .attr('opacity', (d) => emphasis(d, state))
  // 不在懸停時調整 DOM 順序（raise 會觸發 mouseleave，造成閃爍）
  g.selectAll('g.dot')
    .classed('focused', (d) => d.id === focus)
    .classed('pinned', (d) => d.id === state.pinned)
    .select('text.label')
    .transition('emphasis-label')
    .duration(animate ? dur(150) : 0)
    // 圓點淡化，但常駐標籤保持可讀
    .attr('fill-opacity', (d) => {
      const e = emphasis(d, state)
      return e === 1 ? 1 : e <= 0.15 ? 0.45 : 0.75
    })
  g.selectAll('g.cis line')
    .transition('emphasis')
    .duration(animate ? dur(150) : 0)
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
  const rScale = d3.scaleSqrt().domain([0, maxPop]).range([0, R_MAX])
  r = (pop) => Math.max(4, rScale(pop))

  g.append('rect').attr('class', 'over100').attr('x', 0).attr('width', innerW).attr('opacity', 0)
  g.append('line').attr('class', 'ref100').attr('x1', 0).attr('x2', innerW).attr('opacity', 0)
  g.append('text')
    .attr('class', 'ref100-label')
    .attr('x', innerW - 6)
    .attr('text-anchor', 'end')
    .attr('opacity', 0)
    .text('100% 參考線')
  g.append('text')
    .attr('class', 'ref100-label over100-label')
    .attr('x', innerW / 2)
    .attr('text-anchor', 'middle')
    .attr('opacity', 0)
    .text('灰色區：破獲率超過 100%，因為破獲數包含往年積案，不是算錯')
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
// 篩選會改變標題點名的縣市，標籤要重新擺放
watch(() => state.filter, () => draw(false))
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
    <div class="caption-row">
      <p class="caption">虛線為 22 縣市中位數；點越大代表推估人口越多；固定標出六都與極端值，其他縣市移上去看名稱。</p>
      <span v-show="!showTable" class="pop-legend" aria-hidden="true">
        <span>推估人口：</span>
        <template v-for="l in popLegend" :key="l.label">
          <svg :width="l.r * 2 + 2" :height="l.r * 2 + 2" :viewBox="`0 0 ${l.r * 2 + 2} ${l.r * 2 + 2}`">
            <circle :cx="l.r + 1" :cy="l.r + 1" :r="l.r" />
          </svg>
          <span>{{ l.label }}</span>
        </template>
      </span>
    </div>
    <ChartDataTable v-if="showTable" kind="C" :style="{ width: `${svgW}px` }" />
    <svg v-show="!showTable" ref="svgRef" :viewBox="`0 0 ${svgW} ${H}`" :width="svgW" :height="H" role="img" :aria-label="`${typeLabel}各縣市犯罪率與破獲率散佈圖`" />
    <ul v-show="!showTable" class="notes">
      <li>破獲率＝破獲件數 ÷ 發生件數；破獲數包含往年積案，所以可能超過 100%，不能當成「當年案件被破獲的比例」。</li>
      <li v-if="isViolent">細線為犯罪率的 95% 信賴區間；暴力犯罪件數少，區間很寬的縣市，位置不宜過度解讀。</li>
      <li v-if="isViolent">連江縣 2025 年暴力犯罪 0 件，破獲率無法計算，未畫入本圖。</li>
    </ul>
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
.caption-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px 24px;
  margin: 8px 0 4px;
}
.caption,
.note {
  color: var(--color-ink-soft);
  font-size: var(--font-min);
  margin: 0;
}
.pop-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-min);
  color: var(--slate-light);
}
.pop-legend svg {
  display: inline-block;
  overflow: visible;
}
.pop-legend circle {
  fill: var(--rate);
  fill-opacity: 0.25;
  stroke: var(--rate);
  stroke-width: 1.5;
}
.notes {
  margin: 12px 0 0;
  padding: 0 0 0 1.2em;
  font-size: var(--font-min);
  color: var(--slate-light);
  line-height: 1.6;
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
  fill: var(--slate-light);
  opacity: 0.8;
}
svg :deep(.med) {
  stroke: #9aa7ab;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}
svg :deep(.med-label) {
  fill: var(--color-muted);
}
/* 超過 100% 的區域用中性灰（黃色只留給選取） */
svg :deep(.over100) {
  fill: var(--paper-deep);
}
svg :deep(.ref100) {
  stroke: var(--slate);
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}
svg :deep(.ref100-label) {
  fill: var(--slate);
}
svg :deep(.cis line) {
  stroke: var(--color-ink-soft);
  stroke-width: 1.5;
}
svg :deep(.dot) {
  cursor: pointer;
  outline: none;
}
/* 單一顏色：率青（與圖 A 犯罪率橫條、圖 B 色階同一個量） */
svg :deep(.dot .pt) {
  fill: var(--rate);
  fill-opacity: 0.75;
  stroke: var(--sheet);
  stroke-width: 1.5;
}
svg :deep(.dot.focused .pt) {
  fill-opacity: 1;
  stroke: var(--ink);
  stroke-width: 2;
}
svg :deep(.dot .halo) {
  fill: none;
  stroke: var(--mark);
  stroke-width: 5;
  opacity: 0;
}
svg :deep(.dot.focused .halo) {
  opacity: 0.35;
}
svg :deep(.dot.pinned .halo),
svg :deep(.dot:focus-visible .halo) {
  opacity: 1;
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
