// 網站用的資料來源：建置時以 ?raw 直接打包 data/csv 的原始檔（規格書 §2）
import countyCsv from '../../data/csv/各縣市刑案數據.csv?raw'
import nationalCsv from '../../data/csv/01_表1_主要警政指標_全國歷年走勢_2005_2025.csv?raw'
import { buildCrimeData } from '../utils/crimeModel.js'

const { counties, meta } = buildCrimeData(countyCsv, nationalCsv)

export function useCrimeData() {
  return { counties, meta }
}
