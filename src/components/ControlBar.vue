<script setup>
// 固定在頂端的控制列：案類、篩選（套用到 A、B、C）＋目前狀態＋懸停或鎖定縣市的摘要
// 「排序依據」只影響圖 A，放在圖 A 的標題列（第 12 步）
import { computed } from 'vue'
import { useCrimeData } from '../composables/useCrimeData.js'
import { useViewState } from '../composables/useViewState.js'
import { countySummary } from '../utils/headlines.js'

const { counties, meta } = useCrimeData()
const { state, setCrimeType, setFilter } = useViewState()

const groups = computed(() => [
  {
    label: '案類',
    current: state.crimeType,
    set: setCrimeType,
    options: [
      { key: '全般', label: '全般刑案' },
      { key: '暴力', label: '暴力犯罪' },
      { key: '竊盜', label: '竊盜' },
    ],
  },
  {
    label: '篩選',
    current: state.filter,
    set: setFilter,
    options: [
      { key: 'all', label: '全部 22 縣市' },
      { key: 'six', label: '只看六都' },
      { key: 'nonSix', label: '非六都' },
    ],
  },
])

const TYPE = { 全般: '全般刑案', 暴力: '暴力犯罪', 竊盜: '竊盜' }
const FILTER = { all: '全部 22 縣市', six: '只看六都', nonSix: '只看非六都' }
const status = computed(() => `目前：${TYPE[state.crimeType]}，${FILTER[state.filter]}。`)

const byId = new Map(counties.map((c) => [c.id, c]))
const focusId = computed(() => state.pinned ?? state.hovered)
const summary = computed(() => (focusId.value ? countySummary(byId.get(focusId.value), meta, state.crimeType) : null))
</script>

<template>
  <div class="control-bar">
    <div class="inner">
      <div class="groups">
        <div v-for="g in groups" :key="g.label" class="group" role="group" :aria-label="g.label">
          <span class="label">{{ g.label }}</span>
          <div class="segmented">
            <button
              v-for="o in g.options"
              :key="o.key"
              :class="{ active: g.current === o.key }"
              :aria-pressed="g.current === o.key"
              @click="g.set(o.key)"
            >
              {{ o.label }}
            </button>
          </div>
        </div>
        <span class="applies">套用到 A、B、C 三張圖</span>
      </div>
      <p class="status live" aria-live="polite">
        <span>{{ status }}</span>
        <span v-if="summary" class="summary">
          <span class="pin-tag">{{ state.pinned ? '已鎖定' : '游標所在' }}</span>
          <b>{{ summary[0] }}</b>
          <span v-for="(part, i) in summary.slice(1)" :key="i" class="part">{{ part }}</span>
        </span>
        <span v-else class="hint">滑鼠移到縣市上，這裡會顯示它的數字；點一下鎖定，點空白處或按 Esc 取消。</span>
      </p>
      <p v-if="state.filter !== 'all'" class="status note">其他縣市變淡但保留；名次與中位數仍以全國 22 縣市計算。</p>
    </div>
  </div>
</template>

<style scoped>
/* 捲動時固定在頂端，看下方圖表時也能切換；底色與分隔線延伸到整個視窗寬，內容與頁面同寬置中 */
.control-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  margin-bottom: 24px;
}
.inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 14px 48px 10px;
}
.groups {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 28px;
}
.group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  font-size: 15px;
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
  font-size: 15px;
  padding: 5px 14px;
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
.segmented button:focus-visible {
  outline-offset: -3px;
  outline-color: var(--mark);
}
.status {
  margin: 8px 0 0;
  font-size: var(--font-min);
  color: var(--ink);
}
.applies {
  font-size: var(--font-min);
  color: var(--slate-light);
}
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  min-height: 1.6em;
}
.hint {
  color: var(--slate-light);
}
/* 懸停時摘要與提示文字互換，這一列固定高度、不換行，避免控制列長高把整頁往下推（畫面抖動） */
.live {
  flex-wrap: nowrap;
  align-items: center;
  height: 28px;
  min-height: 28px;
  line-height: 28px;
  white-space: nowrap;
  overflow: hidden;
}
.live .summary {
  flex-wrap: nowrap;
  line-height: 24px;
}
.live .summary b {
  font-size: var(--font-min);
}
.summary {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 16px;
  padding: 0 10px;
  border-radius: var(--radius);
  background: var(--mark);
}
.summary b {
  font-size: 16px;
}
.pin-tag {
  font-size: var(--font-min);
  color: var(--ink);
}
.note {
  color: var(--slate-light);
}
</style>
