// 等積方塊地圖的格子座標（規格書 §4.4 v1）。col 0 為離島欄。
export const TILE_LAYOUT = [
  { id: '連江縣', short: '連江', col: 0, row: 0 },
  { id: '臺北市', short: '臺北', col: 3, row: 0 },
  { id: '基隆市', short: '基隆', col: 4, row: 0 },
  { id: '金門縣', short: '金門', col: 0, row: 1 },
  { id: '桃園市', short: '桃園', col: 2, row: 1 },
  { id: '新北市', short: '新北', col: 3, row: 1 },
  { id: '宜蘭縣', short: '宜蘭', col: 4, row: 1 },
  { id: '新竹市', short: '竹市', col: 1, row: 2 },
  { id: '新竹縣', short: '竹縣', col: 2, row: 2 },
  { id: '苗栗縣', short: '苗栗', col: 1, row: 3 },
  { id: '臺中市', short: '臺中', col: 2, row: 3 },
  { id: '澎湖縣', short: '澎湖', col: 0, row: 4 },
  { id: '彰化縣', short: '彰化', col: 1, row: 4 },
  { id: '南投縣', short: '南投', col: 2, row: 4 },
  { id: '花蓮縣', short: '花蓮', col: 3, row: 4 },
  { id: '雲林縣', short: '雲林', col: 1, row: 5 },
  { id: '嘉義市', short: '嘉市', col: 2, row: 5 },
  { id: '臺東縣', short: '臺東', col: 3, row: 5 },
  { id: '嘉義縣', short: '嘉縣', col: 1, row: 6 },
  { id: '臺南市', short: '臺南', col: 1, row: 7 },
  { id: '高雄市', short: '高雄', col: 2, row: 7 },
  { id: '屏東縣', short: '屏東', col: 2, row: 8 },
]

export const TILE_COLS = 5
export const TILE_ROWS = 9

/** 檢查座標：不可重複、縣市不可遺漏或多出；回傳錯誤訊息陣列 */
export function validateTileLayout(countyIds) {
  const errors = []
  const seen = new Set()
  for (const t of TILE_LAYOUT) {
    const key = `${t.col},${t.row}`
    if (seen.has(key)) errors.push(`座標重複：${key}`)
    seen.add(key)
  }
  const ids = new Set(TILE_LAYOUT.map((t) => t.id))
  for (const id of countyIds) if (!ids.has(id)) errors.push(`地圖缺少：${id}`)
  for (const id of ids) if (!countyIds.includes(id)) errors.push(`資料沒有：${id}`)
  return errors
}
