// 內容區寬度（第 12 步追加）：頁面最寬 1440px，左右各留 48px；視窗較窄時跟著縮。
// 圖 A、B 的 svg 寬度由這裡推算，C 固定寬度。用 clientWidth（不含捲軸），避免出現水平捲軸。
import { ref } from 'vue'

export const PAGE_MAX = 1440
export const PAGE_PAD = 48
export const CARD_CHROME = 50 // 卡片左右內距 24×2＋邊框 1×2
export const GRID_GAP = 24
const MIN_CONTENT = 1164 // 舊版寬度；更窄時改出水平捲軸，不再壓縮圖表

function calc() {
  const vw = typeof document === 'undefined' ? PAGE_MAX : document.documentElement.clientWidth
  return Math.max(MIN_CONTENT, Math.min(PAGE_MAX, vw) - PAGE_PAD * 2)
}

const contentW = ref(calc())
if (typeof window !== 'undefined') {
  let timer
  window.addEventListener('resize', () => {
    clearTimeout(timer)
    timer = setTimeout(() => (contentW.value = calc()), 120)
  })
}

export function useLayoutWidth() {
  return contentW
}
