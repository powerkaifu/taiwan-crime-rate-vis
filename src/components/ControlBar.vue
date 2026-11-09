<script setup>
import { useViewState } from '../composables/useViewState.js'

const { state, setCrimeType } = useViewState()
const types = [
  { key: '全般', label: '全般刑案' },
  { key: '暴力', label: '暴力犯罪' },
  { key: '竊盜', label: '竊盜' },
]
</script>

<template>
  <div class="control-bar" role="group" aria-label="案類">
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
</template>

<style scoped>
.control-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
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
</style>
