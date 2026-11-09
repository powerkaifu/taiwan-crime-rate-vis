// 使用者在系統設定「減少動態效果」時，D3 轉場改為 0 秒（CSS 轉場由 style.css 的 media query 處理）
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const dur = (ms) => (prefersReducedMotion() ? 0 : ms)
