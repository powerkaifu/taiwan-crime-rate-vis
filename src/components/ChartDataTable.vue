<script setup>
// 資料表替代檢視（規格書 §4.1）：每張圖都能切換成可讀表格，供無法看圖或需要精確數字的人使用。
import * as d3 from 'd3'
import { computed } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { useViewState } from '../composables/useViewState.js'

const props = defineProps({
  kind: { type: String, required: true }, // 'A' 排名橫條圖 | 'B' 等積方塊地圖 | 'C' 散佈圖
})

const { counties } = useCrimeData()
const { state } = useViewState()
const f2 = d3.format(',.2f')
const f0 = d3.format(',')
const isViolent = computed(() => state.crimeType === '暴力')

const rows = computed(() => {
  const type = state.crimeType
  const key = props.kind === 'A' && state.barMode === 'count' ? 'count' : 'rate'
  return [...counties].sort((a, b) => b[type][key] - a[type][key] || a.id.localeCompare(b.id, 'zh-Hant')).map((c) => {
    const d = c[type]
    return {
      id: c.id,
      region: c.region,
      six: c.isSixCity ? '是' : '',
      count: `${f0(d.count)} 件`,
      rankCount: d.rankCount,
      rate: f2(d.rate),
      rankRate: d.rankRate,
      delta: d.rankDelta === 0 ? '0' : `${d.rankDelta > 0 ? '上升' : '下降'} ${Math.abs(d.rankDelta)}`,
      ci: isViolent.value ? `${f2(d.ciLow)}～${f2(d.ciHigh)}` : '',
      clearance: d.clearance === null ? '—（無案件）' : `${d.clearance}%`,
      pop: `${d3.format(',.1f')(c.pop / 1e4)} 萬`,
      note: isViolent.value && d.count === 0 ? '本年 0 件' : isViolent.value && d.smallN ? '件數少於 30' : '',
    }
  })
})

const caption = computed(() => {
  const t = { 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' }[state.crimeType]
  if (props.kind === 'A') return `${t}：依${state.barMode === 'count' ? '發生件數' : '每十萬人犯罪率'}由高到低`
  return `${t}：依每十萬人犯罪率由高到低`
})
</script>

<template>
  <div class="table-wrap">
    <table>
      <caption>{{ caption }}（2025 年，名次為全國 22 縣市）</caption>
      <thead>
        <tr>
          <th scope="col">縣市</th>
          <th v-if="kind !== 'A'" scope="col">區域</th>
          <th v-if="kind === 'A'" scope="col">六都</th>
          <th scope="col">發生件數</th>
          <th v-if="kind === 'A'" scope="col">件數名次</th>
          <th scope="col">每十萬人犯罪率</th>
          <th scope="col">率名次</th>
          <th v-if="kind === 'A'" scope="col">換算後名次</th>
          <th v-if="isViolent" scope="col">95% 信賴區間</th>
          <th v-if="kind === 'C'" scope="col">破獲率</th>
          <th v-if="kind === 'C'" scope="col">推估人口</th>
          <th v-if="isViolent" scope="col">備註</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id" :class="{ focused: r.id === (state.pinned ?? state.hovered) }">
          <th scope="row">{{ r.id }}</th>
          <td v-if="kind !== 'A'">{{ r.region }}</td>
          <td v-if="kind === 'A'">{{ r.six }}</td>
          <td>{{ r.count }}</td>
          <td v-if="kind === 'A'">{{ r.rankCount }}</td>
          <td>{{ r.rate }}</td>
          <td>{{ r.rankRate }}</td>
          <td v-if="kind === 'A'">{{ r.delta }}</td>
          <td v-if="isViolent">{{ r.ci }}</td>
          <td v-if="kind === 'C'">{{ r.clearance }}</td>
          <td v-if="kind === 'C'">{{ r.pop }}</td>
          <td v-if="isViolent">{{ r.note }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  max-height: 560px;
  overflow: auto;
  margin-top: 8px;
}
table {
  border-collapse: collapse;
  font-size: var(--font-min);
  font-variant-numeric: tabular-nums;
  width: 100%;
}
caption {
  text-align: left;
  color: var(--color-ink-soft);
  padding-bottom: 6px;
}
th,
td {
  padding: 5px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: right;
  white-space: nowrap;
}
th[scope='row'],
thead th:first-child {
  text-align: left;
}
thead th {
  position: sticky;
  top: 0;
  background: var(--color-bg-alt);
}
tr.focused {
  background: #fdf0e3;
}
</style>
