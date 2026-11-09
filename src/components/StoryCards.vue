<script setup>
// 發現卡（規格書 §6）：文字中的數字一律由資料計算，不寫死。
import * as d3 from 'd3'
import { useCrimeData } from '../composables/useCrimeData.js'
import { useViewState } from '../composables/useViewState.js'

const { counties, meta } = useCrimeData()
const { state, applyStory } = useViewState()
const f2 = d3.format(',.2f')

// 卡 1：件數第 1 與犯罪率第 1
const topCount = counties.find((c) => c.全般.rankCount === 1)
const topRate = counties.find((c) => c.全般.rankRate === 1)

// 卡 2：六都的犯罪率名次範圍與破獲率是否都高於中位數
const six = counties.filter((c) => c.isSixCity)
const sixWorstRank = d3.max(six, (c) => c.全般.rankRate)
const sixAboveMedian = six.every((c) => c.全般.clearance > meta.types.全般.medianClearance)

// 卡 3：暴力犯罪率第 1 名與其件數、區間
const topViolent = counties.find((c) => c.暴力.rankRate === 1)

// 卡 4：暴力犯罪破獲率超過 100% 的縣市數
const over100 = counties.filter((c) => c.暴力.clearance !== null && c.暴力.clearance > 100).length

const stories = [
  {
    id: 'count-vs-rate',
    title: `件數第 1 ≠ 最危險`,
    body: `${topCount.id}件數全國第 1，換算每十萬人後是第 ${topCount.全般.rankRate}；${topRate.id}件數第 ${topRate.全般.rankCount}，犯罪率卻是全國第 1。`,
    crimeType: '全般',
    barMode: 'rate',
    filter: 'all',
    pinned: topRate.id,
    target: '.chart-a',
  },
  {
    id: 'six-cities',
    title: '六都換算後仍偏高',
    body: `六都的犯罪率都在全國前 ${sixWorstRank} 名${sixAboveMedian ? '，但破獲率也都高於 22 縣市中位數' : ''}。`,
    crimeType: '全般',
    barMode: 'rate',
    filter: 'six',
    pinned: null,
    target: '.chart-b',
  },
  {
    id: 'small-n',
    title: `暴力犯罪第 1，只有 ${topViolent.暴力.count} 件`,
    body: `${topViolent.id}暴力犯罪率全台最高（${f2(topViolent.暴力.rate)}），但只有 ${topViolent.暴力.count} 件，95% 區間 ${f2(topViolent.暴力.ciLow)}～${f2(topViolent.暴力.ciHigh)}，排名並不可靠。`,
    crimeType: '暴力',
    barMode: 'rate',
    filter: 'all',
    pinned: topViolent.id,
    target: '.chart-a',
  },
  {
    id: 'over-100',
    title: '破獲率可以超過 100%',
    body: `暴力犯罪有 ${over100} 個縣市破獲率超過 100%，因為破獲數包含往年的積案。`,
    crimeType: '暴力',
    barMode: 'rate',
    filter: 'all',
    pinned: null,
    target: '.chart-b',
  },
]

function choose(story) {
  applyStory(story)
  document.querySelector(story.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

</script>

<template>
  <section class="stories" aria-label="發現卡">
    <button
      v-for="(s, i) in stories"
      :key="s.id"
      class="card"
      :class="{ active: state.activeStory === s.id }"
      :aria-pressed="state.activeStory === s.id"
      @click="choose(s)"
    >
      <span class="num">發現 {{ i + 1 }}</span>
      <span class="title">{{ s.title }}</span>
      <span class="body">{{ s.body }}</span>
      <span class="go">看圖表 →</span>
    </button>
  </section>
</template>

<style scoped>
.stories {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0 8px;
  max-width: 1136px;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font: inherit;
  color: var(--color-ink);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
}
.card:hover {
  border-color: var(--color-accent);
}
.card.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: #f7f6f2;
}
.card:focus-visible {
  outline: 3px solid var(--color-accent-2);
  outline-offset: 2px;
}
.num {
  font-size: var(--font-min);
  font-weight: 700;
  color: var(--color-accent-2);
}
.title {
  font-size: 17px;
  font-weight: 700;
}
.body {
  font-size: var(--font-min);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
.card.active .body {
  color: #c9d3de;
}
.go {
  margin-top: auto;
  font-size: var(--font-min);
  color: var(--color-accent);
}
.card.active .go {
  color: #9cc0e8;
}
</style>
