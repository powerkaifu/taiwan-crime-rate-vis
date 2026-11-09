---
name: d3-chart-builder
description: >-
  D3.js 與 Vue 3 現代化圖表元件構建技能。
  當需要為 hw01 或 hw02 產生強健、自解釋（Self-documenting）、
  響應式且具備生命週期清理的 D3 元件代碼時使用。
---

# D3.js 圖表元件構建技能（D3 Chart Builder）

本技能提供標準的 Vue 3 Composition API (`<script setup>`) + D3.js 圖表實作範本與最佳實踐。

---

## 一、標準 D3 Vue 元件骨架

```vue
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'

// 1. 定義 Props 與 Emits
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select-item'])

// 2. DOM 容器 Ref
const containerRef = ref(null)

// 3. 邊界與尺寸約定 (Margin Convention)
const margin = { top: 40, right: 40, bottom: 60, left: 70 }
const width = 800 - margin.left - margin.right
const height = 500 - margin.top - margin.bottom

// 4. 繪製圖表核心函式
function renderChart() {
  if (!containerRef.value || !props.data.length) return

  // 清空舊視圖
  d3.select(containerRef.value).selectAll('*').remove()

  // 建立 SVG 容器 (響應式 viewBox)
  const svg = d3.select(containerRef.value)
    .append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'w-full h-auto')

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 5. 比例尺設定 (Scales)
  const xScale = d3.scaleLinear()
    .domain(d3.extent(props.data, d => d.xVal)).nice()
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.yVal)]).nice() // ⚠️ 柱狀圖/量值強制包含 0
    .range([height, 0])

  // 6. 繪製 X/Y 坐標軸與標籤 (Self-documenting)
  g.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', '#333')
    .attr('font-size', '14px')
    .attr('text-anchor', 'middle')
    .text('X 軸屬性標籤 (單位)')

  g.append('g')
    .call(d3.axisLeft(yScale))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -50)
    .attr('fill', '#333')
    .attr('font-size', '14px')
    .attr('text-anchor', 'middle')
    .text('Y 軸屬性標籤 (單位)')

  // 7. 資料綁定 (Data Join 現代語法)
  g.selectAll('circle.data-point')
    .data(props.data, d => d.id)
    .join('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.xVal))
    .attr('cy', d => yScale(d.yVal))
    .attr('r', d => Math.sqrt(d.sizeVal)) // ⚠️ 面積半徑開根號
    .attr('fill', '#3b82f6')
    .attr('opacity', 0.8)
    .attr('stroke', '#1d4ed8')
    .attr('stroke-width', 1.5)
}

// 生命週期監聽
onMounted(() => renderChart())
watch(() => props.data, () => renderChart(), { deep: true })

onUnmounted(() => {
  if (containerRef.value) {
    d3.select(containerRef.value).selectAll('*').remove()
  }
})
</script>

<template>
  <div ref="containerRef" class="chart-container"></div>
</template>
```
