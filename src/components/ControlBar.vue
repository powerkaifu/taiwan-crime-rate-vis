<script setup>
// 固定在頂端的控制列：排序依據、案類、篩選，以及一行「目前狀態」（截圖時也帶著脈絡）
import { computed } from 'vue'
import { useViewState } from '../composables/useViewState.js'

const { state, setBarMode, setCrimeType, setFilter } = useViewState()

const groups = computed(() => [
  {
    label: '排序依據',
    current: state.barMode,
    set: setBarMode,
    options: [
      { key: 'count', label: '發生件數' },
      { key: 'rate', label: '每十萬人犯罪率' },
    ],
  },
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
const MODE = { count: '發生件數', rate: '每十萬人犯罪率' }
const FILTER = { all: '全部 22 縣市', six: '只看六都', nonSix: '只看非六都' }
const status = computed(() => {
  let s = `目前：${TYPE[state.crimeType]}，依${MODE[state.barMode]}排序，${FILTER[state.filter]}`
  if (state.pinned) s += `；鎖定${state.pinned}`
  return s + '。'
})
</script>

<template>
  <div class="control-bar">
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
    </div>
    <p class="status" aria-live="polite">
      {{ status }}
      <span class="hint">滑鼠移到縣市上看數字；點一下鎖定，點空白處或按 Esc 取消。</span>
    </p>
    <p v-if="state.filter !== 'all'" class="status">其他縣市變淡但保留；名次與中位數仍以全國 22 縣市計算。</p>
  </div>
</template>

<style scoped>
/* 捲動時固定在頂端，看圖表 B、C 時也能切換 */
.control-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  margin: 0 -48px 24px;
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
.hint {
  color: var(--slate-light);
  margin-left: 8px;
}
</style>
