<script setup>
// 圖表 A：排名橫條圖（規格書 §4.2、§4.3）
// 件數 ⇄ 每十萬人犯罪率切換時，長度補間、縣市以 Y 位置轉場重排。
// 第 13 步：犯罪率模式右側寫「~~件數名次~~ → 犯罪率名次」（更正單的記憶點）；件數灰／率青橫條；
// 選取用螢光黃底色帶；未選取時只淡化橫條，文字保持可讀；件數少或名次只差 ±2 的變化用淡色。
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { CARD_CHROME, GRID_GAP, useLayoutWidth } from '../composables/useLayoutWidth.js'
import { emphasis, useViewState } from '../composables/useViewState.js'
import { fmtCount, fmtRate } from '../utils/format.js'
import { COUNT_COLOR, rateColorScale } from '../utils/colors.js'
import RateLegend from './RateLegend.vue'
import { headlineA } from '../utils/headlines.js'
import { dur } from '../utils/motion.js'
import { TILE_CARD_W } from '../utils/tileLayout.js'
import ChartDataTable from './ChartDataTable.vue'

const { counties } = useCrimeData()
const { state, hover, togglePin, setBarMode } = useViewState()

const svgRef = ref(null)
const showTable = ref(false)
const ROW_H = 22
const M = { top: 40, right: 300, bottom: 8, left: 76 }
// 寬度＝內容區 − 間距 − 圖 B 卡片 − 本卡片內距與邊框
const contentW = useLayoutWidth()
const W = computed(() => contentW.value - GRID_GAP - TILE_CARD_W - CARD_CHROME)
const H = M.top + counties.length * ROW_H + M.bottom
const DURATION = 750
const VAL_DX = 24 // 數值欄距離軸線右端
const RANK_DX = 112 // 名次欄距離軸線右端

const TYPE = { 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' }
const typeLabel = computed(() => TYPE[state.crimeType])
// 暴力犯罪的犯罪率模式才畫 95% 區間（規格書 §4.2）
const showCI = computed(() => state.crimeType === '暴力' && state.barMode === 'rate')
const isViolent = computed(() => state.crimeType === '暴力')

const value = (c) => (state.barMode === 'count' ? c[state.crimeType].count : c[state.crimeType].rate)
const headline = computed(() => headlineA(counties, state.crimeType, state.barMode, state.filter))
const MODES = [
	{ key: 'rate', label: '每十萬人犯罪率' },
	{ key: 'count', label: '發生件數' },
]

const fmtValue = (v) => (state.barMode === 'count' ? `${fmtCount(v)} 件` : fmtRate(v, state.crimeType))
/** 名次變化是否「小」：件數少（暴力犯罪）或只差 2 名以內，用淡色、不加粗 */
const isMinor = (r, type) => Math.abs(r.rankDelta) <= 2 || (type === '暴力' && r.smallN)

let g, axisG, headG, x
// 依目前案類的 22 縣市犯罪率建立 5 級色階
const rateColor = (v) => rateColorScale(counties.map((c) => c[state.crimeType].rate))(v)

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
		? d3.max(
				data.filter((d) => d[type].count > 0),
				(d) => d[type].ciHigh,
			)
		: d3.max(data, value)
	x.domain([0, maxV || 1]).nice()
	const clipped = (d) => showCI.value && d[type].ciHigh > x.domain()[1]
	const tieCount = d3.rollup(
		counties,
		(v) => v.length,
		(c) => c[type].rankCount,
	)

	const t = d3
		.transition()
		.duration(animate ? dur(DURATION) : 0)
		.ease(d3.easeCubicOut)

	g.classed('mode-count', state.barMode === 'count').classed('mode-rate', state.barMode === 'rate')
	axisG.transition(t).call(
		d3
			.axisTop(x)
			.ticks(Math.max(3, Math.floor(innerW / 90)))
			.tickSizeOuter(0)
			.tickFormat(state.barMode === 'count' ? d3.format('~s') : d3.format(',')),
	)

	// 右側兩欄的欄名
	headG
		.select('text.h-val')
		.attr('x', innerW + VAL_DX)
		.text(state.barMode === 'count' ? '發生件數' : '每十萬人')
	headG
		.select('text.h-rank')
		.attr('x', innerW + RANK_DX)
		.text(state.barMode === 'count' ? '件數名次（換算後名次）' : '件數名次 → 換算後名次')

	const rows = g
		.selectAll('g.row')
		.data(data, (d) => d.id)
		.join((enter) => {
			const r = enter
				.append('g')
				.attr('class', 'row')
				.attr('tabindex', 0)
				.attr('role', 'button')
				.attr('transform', (d) => `translate(0,${y(d.id)})`)
			r.append('rect').attr('class', 'band').attr('x', -M.left)
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
		// 鍵盤：Tab 移到縣市＝懸停，Enter／空白鍵＝鎖定
		.on('focus', (_, d) => hover(d.id))
		.on('blur', () => hover(null))
		.on('keydown', (e, d) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				togglePin(d.id)
			}
		})
		.attr('aria-label', (d) => {
			const r = d[type]
			return `${d.id}：犯罪率 ${fmtRate(r.rate, type)}（第 ${r.rankRate}），件數 ${fmtCount(r.count)}（第 ${r.rankCount}）`
		})

	const mid = y.bandwidth() / 2
	rows.transition(t).attr('transform', (d) => `translate(0,${y(d.id)})`)
	rows
		.select('rect.band')
		.attr('width', W.value)
		.attr('y', -(ROW_H - y.bandwidth()) / 2)
		.attr('height', ROW_H)
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
		// 犯罪率模式依 5 級區間上色（與圖 B 同一套色階）；件數模式維持灰色
		.attr('fill', (d) => (state.barMode === 'rate' ? rateColor(d[type].rate) : COUNT_COLOR))
	rows
		.select('line.ci')
		.attr('y1', mid)
		.attr('y2', mid)
		.transition(t)
		.attr('x1', (d) => x(showCI.value ? d[type].ciLow : 0))
		.attr('x2', (d) => x(showCI.value ? Math.min(d[type].ciHigh, x.domain()[1]) : 0))
		.style('display', showCI.value ? null : 'none')
	rows
		.select('text.ci-arrow')
		.attr('x', innerW - 4)
		.attr('y', mid)
		.style('display', (d) => (clipped(d) ? null : 'none'))
	rows
		.select('text.val')
		.attr('x', innerW + VAL_DX)
		.attr('y', mid)
		.attr('dy', '0.35em')
		.text((d) => fmtValue(value(d)) + (state.barMode === 'rate' && d[type].count === 0 ? '（0 件）' : ''))
	rows
		.select('text.rank')
		.attr('x', innerW + RANK_DX)
		.attr('y', mid)
		.attr('dy', '0.35em')
		.each(function (d) {
			const r = d[type]
			const el = d3.select(this)
			el.selectAll('tspan').remove()
			// 件數同分時名次並列（competition ranking），標「並列」避免誤會為資料錯誤
			const tie = (tieCount.get(r.rankCount) ?? 0) > 1
			if (state.barMode === 'rate') {
				// 更正單：舊名次（件數）畫刪除線 → 新名次（犯罪率）
				if (r.rankDelta !== 0) {
					el.append('tspan').attr('class', 'old').text(r.rankCount)
					if (tie) el.append('tspan').attr('class', 'tie').text('並列')
					el.append('tspan').attr('class', 'arrow').text(' → ')
				}
				el.append('tspan').attr('class', 'new').text(r.rankRate)
			} else {
				el.append('tspan').attr('class', 'new').text(r.rankCount)
				if (tie) el.append('tspan').attr('class', 'tie').text('並列')
				el.append('tspan').attr('class', 'aux').text(`（${r.rankRate}）`)
			}
			// 名次變動：件數名次 − 率名次；正值＝換算犯罪率後名次往前
			if (r.rankDelta !== 0) {
				el.append('tspan')
					.attr('class', `delta ${isMinor(r, type) ? 'minor' : 'major'}`)
					.attr('dx', 8)
					.text(`${r.rankDelta > 0 ? '▲' : '▼'}${Math.abs(r.rankDelta)}`)
			}
			if (type === '暴力' && r.smallN) el.append('tspan').attr('class', 'small').attr('dx', 8).text('件數少')
		})

	updateEmphasis(animate)
}

/** 淡化只作用在橫條與區間線；文字保持可讀（篩選掉的縣市文字仍較淡） */
function updateEmphasis(animate = true) {
	const d150 = animate ? dur(150) : 0
	const rows = g.selectAll('g.row')
	rows.classed('focused', (d) => d.id === (state.pinned ?? state.hovered))
	rows.classed('pinned', (d) => d.id === state.pinned)
	rows
		.selectAll('rect.bar, line.ci, text.ci-arrow')
		.transition('emphasis')
		.duration(d150)
		.attr('opacity', function () {
			return emphasis(d3.select(this.parentNode).datum(), state)
		})
	rows
		.selectAll('text.name, text.val, text.rank')
		.transition('emphasis')
		.duration(d150)
		.attr('opacity', function () {
			const e = emphasis(d3.select(this.parentNode).datum(), state)
			return e === 1 ? 1 : e <= 0.15 ? 0.45 : 0.75
		})
}

onMounted(() => {
	const svg = d3.select(svgRef.value)
	g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
	axisG = g.append('g').attr('class', 'axis')
	headG = g.append('g').attr('class', 'col-head').attr('transform', 'translate(0,-12)')
	headG.append('text').attr('class', 'h-val')
	headG.append('text').attr('class', 'h-rank')
	x = d3.scaleLinear()
	draw(false)
})

watch(
	() => [state.barMode, state.crimeType],
	() => draw(true),
)
watch(W, () => draw(false))
watch(
	() => [state.hovered, state.pinned, state.filter, state.brushed],
	() => updateEmphasis(),
)
</script>

<template>
	<section class="chart-card">
		<div class="head">
			<div>
				<p class="kicker">A 排名橫條圖・{{ typeLabel }}</p>
				<h2>{{ headline }}</h2>
			</div>
			<button class="table-btn" :aria-pressed="showTable" @click="showTable = !showTable">
				{{ showTable ? '顯示圖表' : '資料表' }}
			</button>
		</div>
		<div class="sort" role="group" aria-label="圖 A 排序依據（只影響這張圖）">
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
			<span class="only">只影響這張圖</span>
		</div>
		<p v-show="!showTable" class="key">
			<RateLegend v-if="state.barMode === 'rate'" :type="state.crimeType" class="ramp" />
			<span v-else class="swatch sw-count" />
			<template v-if="state.barMode === 'rate'"
				><br />青色深淺＝每十萬人犯罪率分 5 級，每級約 4-5 個縣市（與圖 B 同色）。右側「<s>17</s> → 1」：件數排第 17，換算人口後排第 1；▲
				名次往前（犯罪率排名比件數排名高），▼ 往後。</template
			>
			<template v-else>灰色＝發生件數（還沒依人口換算）。括號內是換算成每十萬人犯罪率後的名次。</template>
		</p>
		<ChartDataTable v-if="showTable" kind="A" :style="{ width: `${W}px` }" />
		<svg
			v-show="!showTable"
			ref="svgRef"
			:viewBox="`0 0 ${W} ${H}`"
			:width="W"
			:height="H"
			role="group"
			:aria-label="`${typeLabel}各縣市排名橫條圖，可用 Tab 鍵逐一瀏覽縣市`"
		/>
		<ul v-show="!showTable" class="notes">
			<li>名次只差 2 名以內{{ isViolent ? '，或件數少於 30' : '' }}時，▲▼ 以淡色顯示：差距小，不宜過度解讀。</li>
			<li v-if="showCI">細線為犯罪率的 95% 信賴區間；▸ 表示區間超出座標範圍。</li>
			<li v-if="isViolent">「件數少」：件數少於 30，犯罪率容易因少數案件大幅變動。</li>
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
	margin: 2px 0 0;
}
.sort {
	margin: 10px 0 6px;
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
/* 鍵盤焦點：內側墨色框＋白色細縫，未選取（白底）與已選取（墨底）都看得見 */
.segmented button:focus-visible {
	outline: none;
	box-shadow:
		inset 0 0 0 2px var(--ink),
		inset 0 0 0 4px var(--sheet);
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
	align-items: flex-start;
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
	outline: none;
}
/* 選取（懸停、鍵盤焦點、鎖定）：螢光黃底色帶，文字仍是墨色 */
svg :deep(.band) {
	fill: var(--mark);
	opacity: 0;
}
/* 懸停＝淡黃；鎖定＝實心黃＋粗體（使用者測試：兩者要分得出來） */
svg :deep(.row.focused .band) {
	opacity: 0.3;
}
svg :deep(.row.pinned .band) {
	opacity: 1;
}
svg :deep(.row.pinned text) {
	font-weight: 700;
}
svg :deep(.rank .tie) {
	fill: var(--slate-light);
	font-size: var(--font-min);
}
svg :deep(.row:focus-visible .band) {
	opacity: 1;
	stroke: var(--ink);
	stroke-width: 1.5;
}

svg :deep(.ci) {
	stroke: var(--ink);
	stroke-width: 1.5;
}
svg :deep(.ci-arrow) {
	fill: var(--ink);
}
svg :deep(.val) {
	font-variant-numeric: tabular-nums;
}
svg :deep(.col-head text) {
	fill: var(--slate-light);
}
svg :deep(.rank) {
	fill: var(--ink);
}
svg :deep(.rank .old) {
	fill: var(--slate-light);
	text-decoration: line-through;
}
svg :deep(.rank .arrow),
svg :deep(.rank .aux) {
	fill: var(--slate-light);
}
svg :deep(.rank .new) {
	font-weight: 700;
}
svg :deep(.rank .delta.major) {
	fill: var(--ink);
	font-weight: 700;
}
svg :deep(.rank .delta.minor) {
	fill: var(--slate-light);
}
svg :deep(.rank .small) {
	fill: var(--slate-light);
}
.notes {
	margin: 12px 0 0;
	padding: 0 0 0 1.2em;
	font-size: var(--font-min);
	color: var(--slate-light);
	line-height: 1.6;
}
.key {
	margin: 4px 0 8px;
	font-size: var(--font-min);
	color: var(--ink);
	line-height: 1.6;
}
.key s {
	color: var(--slate-light);
}
.swatch {
	display: inline-block;
	width: 14px;
	height: 10px;
	margin-right: 6px;
	border-radius: 2px;
	vertical-align: 0;
}
.ramp {
	margin-right: 8px;
}
.sw-count {
	background: var(--count);
}
.only {
	font-size: var(--font-min);
	color: var(--slate-light);
}
</style>
