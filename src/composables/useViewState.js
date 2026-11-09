// 三張圖共用的狀態（規格書 §5）。各元件只透過這裡的函式修改狀態，彼此不直接呼叫。
import { reactive, readonly } from 'vue'

const state = reactive({
  crimeType: '全般', // '全般' | '暴力' | '竊盜'
  barMode: 'count', // 'count' | 'rate'（只影響圖表 A）
  filter: 'all', // 'all' | 'six' | 'nonSix'
  hovered: null, // 縣市 id
  pinned: null, // 縣市 id
  activeStory: null, // 目前套用的發現卡 id；使用者手動改控制項時清除
})

export function useViewState() {
  return {
    state: readonly(state),
    setCrimeType: (t) => {
      state.crimeType = t
      state.activeStory = null
    },
    setBarMode: (m) => {
      state.barMode = m
      state.activeStory = null
    },
    setFilter: (f) => {
      state.filter = f
      state.activeStory = null
    },
    // 發現卡：一次設定案類、排序依據、篩選與鎖定縣市（規格書 §5.2 第 6 點）
    applyStory: (story) => {
      state.crimeType = story.crimeType
      state.barMode = story.barMode
      state.filter = story.filter
      state.pinned = story.pinned
      state.hovered = null
      state.activeStory = story.id
    },
    hover: (id) => (state.hovered = id),
    // 再點同一縣市＝取消鎖定
    togglePin: (id) => (state.pinned = state.pinned === id ? null : id),
    clearPin: () => (state.pinned = null),
  }
}

/** 是否符合目前篩選 */
export function passesFilter(county, filter) {
  if (filter === 'six') return county.isSixCity
  if (filter === 'nonSix') return !county.isSixCity
  return true
}

/**
 * 縣市的不透明度（規格書 §5.2）：
 * 不符合篩選 0.15；有鎖定或懸停對象時，其他縣市 0.25；其餘 1。鎖定優先於懸停。
 */
export function emphasis(county, s) {
  if (!passesFilter(county, s.filter)) return 0.15
  const focus = s.pinned ?? s.hovered
  if (focus && focus !== county.id) return 0.25
  return 1
}
