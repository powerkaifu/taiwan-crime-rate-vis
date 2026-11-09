// 純資料處理（不依賴 Vue／Vite），網站與 scripts/check-data.mjs 共用（規格書 §3）
import { csvParse } from 'd3'
import { competitionRank, median, poissonCI } from './stats.js'

/** 三類案件：程式內代號 → CSV 欄位前綴 */
export const CRIME_TYPES = {
  全般: '全般刑案',
  暴力: '暴力犯罪',
  竊盜: '竊盜',
}

const SMALL_N = 30 // 暴力犯罪件數少於此值即標示小數警示

/** 去掉 UTF-8 BOM 後解析 CSV */
function parse(text) {
  return csvParse(text.replace(/^﻿/, ''))
}

/** 數字欄位：空白回傳 null（破獲率空白代表無法計算，不可當 0） */
function num(value) {
  if (value === undefined || value === null || value.trim() === '') return null
  return Number(value)
}

/**
 * @param {string} countyCsv  data/csv/各縣市刑案數據.csv 的文字
 * @param {string} nationalCsv data/csv/01_表1_主要警政指標_全國歷年走勢_2005_2025.csv 的文字
 * @returns {{ counties: object[], meta: object }}
 */
export function buildCrimeData(countyCsv, nationalCsv) {
  const rows = parse(countyCsv)

  const counties = rows.map((r) => {
    const totalCount = num(r['全般刑案_發生數_件'])
    const totalRate = num(r['全般刑案_犯罪率_每十萬人'])
    const county = {
      id: r['機關別_中文'],
      en: r['機關別_英文'],
      region: r['區域'],
      isSixCity: r['是否六都'] === '是',
      // 人口不在原始資料中：由全般刑案「件數 ÷ 犯罪率 × 100,000」反推（推估人口）
      pop: Math.round((totalCount / totalRate) * 1e5),
    }
    for (const [key, prefix] of Object.entries(CRIME_TYPES)) {
      county[key] = {
        count: num(r[`${prefix}_發生數_件`]) ?? 0,
        rate: num(r[`${prefix}_犯罪率_每十萬人`]) ?? 0,
        clearance: num(r[`${prefix}_破獲率_百分比`]),
      }
    }
    return county
  })

  // 排名與中位數一律以全國 22 縣市計算（規格書 §5.2 第 4 點）
  const meta = { types: {} }
  for (const key of Object.keys(CRIME_TYPES)) {
    const rankCount = competitionRank(counties.map((c) => c[key].count))
    const rankRate = competitionRank(counties.map((c) => c[key].rate))
    counties.forEach((c, i) => {
      c[key].rankCount = rankCount[i]
      c[key].rankRate = rankRate[i]
      c[key].rankDelta = rankCount[i] - rankRate[i] // 正值＝換算犯罪率後名次上升
    })
    meta.types[key] = {
      medianRate: median(counties.map((c) => c[key].rate)),
      medianClearance: median(counties.map((c) => c[key].clearance)),
    }
  }

  // 暴力犯罪件數少：加上 95% 信賴區間（換算成每十萬人）與小數警示
  for (const c of counties) {
    const [lo, hi] = poissonCI(c.暴力.count)
    c.暴力.ciLow = (lo / c.pop) * 1e5
    c.暴力.ciHigh = (hi / c.pop) * 1e5
    c.暴力.smallN = c.暴力.count < SMALL_N
  }

  // 全國值取自表 1 的 2025 列（縣市加總 ≠ 全國，不可自行加總）
  const nat = parse(nationalCsv).find((r) => r['西元年'] === '2025')
  meta.national = {}
  for (const [key, prefix] of Object.entries(CRIME_TYPES)) {
    meta.national[key] = {
      count: num(nat[`${prefix}_發生數_件`]),
      rate: num(nat[`${prefix}_犯罪率_每十萬人`]),
      clearance: num(nat[`${prefix}_破獲率_百分比`]),
    }
  }
  meta.year = 2025
  meta.source = '內政部警政署《警政統計年報》2025 年（民國 114 年）'

  return { counties, meta }
}
