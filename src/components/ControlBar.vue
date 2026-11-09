<script setup>
import { useViewState } from '../composables/useViewState.js'

const { state, setCrimeType, setFilter } = useViewState()
const types = [
  { key: '全般', label: '全般刑案' },
  { key: '暴力', label: '暴力犯罪' },
  { key: '竊盜', label: '竊盜' },
]
const filters = [
  { key: 'all', label: '全部 22 縣市' },
  { key: 'six', label: '只看六都' },
  { key: 'nonSix', label: '非六都' },
]
</script>

<template>
  <div class="control-bar">
    <div class="group" role="group" aria-label="案類">
      <span class="label">案類</span>
      <button
        v-for="t in types"
        :key="t.key"
        class="pill"
        :class="{ active: state.crimeType === t.key }"
        :aria-pressed="state.crimeType === t.key"
        @click="setCrimeType(t.key)"
      >
        {{ t.label }}
      </button>
    </div>
    <div class="group" role="group" aria-label="篩選">
      <span class="label">篩選</span>
      <button
        v-for="f in filters"
        :key="f.key"
        class="pill"
        :class="{ active: state.filter === f.key }"
        :aria-pressed="state.filter === f.key"
        @click="setFilter(f.key)"
      >
        {{ f.label }}
      </button>
    </div>
    <p v-if="state.filter !== 'all'" class="hint">其他縣市變淡但保留；名次與中位數仍以全國 22 縣市計算。</p>
  </div>
</template>

<style scoped>
.control-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 32px;
  margin: 16px 0;
}
.group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  color: var(--color-ink-soft);
  margin-right: 4px;
}
.pill {
  font: inherit;
  font-size: 15px;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-ink);
  cursor: pointer;
}
.pill.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
.pill:focus-visible {
  outline: 3px solid var(--color-accent-2);
  outline-offset: 2px;
}
.hint {
  margin: 0;
  font-size: var(--font-min);
  color: var(--color-ink-soft);
}
</style>
