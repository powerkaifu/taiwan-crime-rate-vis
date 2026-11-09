<script setup>
// 故事帶（規格書 §6；設計見 docs/前端設計方向_更正單.md）：文字中的數字一律由資料計算，不寫死。
import * as d3 from 'd3'
import { useCrimeData } from '../composables/useCrimeData.js'
import { useViewState } from '../composables/useViewState.js'

const { counties, meta } = useCrimeData()
const { state, applyStory } = useViewState()
const f2 = d3.format(',.2f')

// 故事 1：件數第 1 與犯罪率第 1
const topCount = counties.find((c) => c.全般.rankCount === 1)
const topRate = counties.find((c) => c.全般.rankRate === 1)

// 故事 2：六都的犯罪率名次範圍與破獲率是否都高於中位數
const six = counties.filter((c) => c.isSixCity)
const sixWorstRank = d3.max(six, (c) => c.全般.rankRate)
const sixAboveMedian = six.every((c) => c.全般.clearance > meta.types.全般.medianClearance)

// 故事 3：暴力犯罪率第 1 名與其件數、區間
const topViolent = counties.find((c) => c.暴力.rankRate === 1)

// 故事 4：暴力犯罪破獲率超過 100% 的縣市數
const over100 = counties.filter((c) => c.暴力.clearance !== null && c.暴力.clearance > 100).length

const stories = [
  {
    id: 'count-vs-rate',
    title: '件數第 1 不等於最危險',
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
    target: '.chart-c',
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
    target: '.chart-c',
  },
]

function choose(story) {
  applyStory(story)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.querySelector(story.target)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <section class="stories" aria-label="四個發現，點選後圖表會切換到對應狀態">
    <button
      v-for="s in stories"
      :key="s.id"
      class="story"
      :class="{ active: state.activeStory === s.id }"
      :aria-pressed="state.activeStory === s.id"
      @click="choose(s)"
    >
      <span class="title">{{ s.title }}</span>
      <span class="body">{{ s.body }}</span>
    </button>
  </section>
</template>

<style scoped>
/* 一條分段的故事帶：共用一個外框，選取的那段以墨色填滿 */
.stories {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 28px 0 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--sheet);
  overflow: hidden;
}
.story {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font: inherit;
  color: var(--ink);
  background: transparent;
  border: none;
  border-left: 1px solid var(--line);
  padding: 16px 18px 18px;
  cursor: pointer;
}
.story:first-child {
  border-left: none;
}
.story:hover {
  background: var(--paper);
}
.story.active {
  background: var(--ink);
  color: var(--paper);
}
.story:focus-visible {
  outline-offset: -4px;
}
.title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 18px;
  line-height: 1.4;
}
.body {
  font-size: var(--font-min);
  line-height: 1.65;
  color: var(--slate);
}
.story.active .body {
  color: #c9d4d6;
}
</style>
