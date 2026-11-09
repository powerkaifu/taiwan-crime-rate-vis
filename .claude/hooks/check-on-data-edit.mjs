// PostToolUse hook：Claude 編輯資料處理相關檔案後，自動執行 npm run check。
// 通過：exit 0（不打擾）；失敗：把驗收結果寫到 stderr 並 exit 2，Claude 會看到並修正。
import { execSync } from 'node:child_process'

// 會影響驗收數字的檔案（路徑相對於專案根目錄）
const WATCHED = [
  /^data\/csv\//,
  /^src\/utils\/(crimeModel|stats|tileLayout)\.js$/,
  /^src\/composables\/useCrimeData\.js$/,
  /^scripts\/check-data\.mjs$/,
]

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let input
  try {
    input = JSON.parse(raw)
  } catch {
    process.exit(0) // 讀不到輸入就不處理，避免干擾
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const filePath = String(input?.tool_input?.file_path ?? '')
  if (!filePath) process.exit(0)

  // 統一斜線並轉成相對路徑（Windows 會是反斜線）
  const norm = (p) => p.replace(/\\/g, '/')
  const root = norm(projectDir).replace(/\/$/, '') + '/'
  const abs = norm(filePath)
  const rel = abs.toLowerCase().startsWith(root.toLowerCase()) ? abs.slice(root.length) : abs
  if (!WATCHED.some((re) => re.test(rel))) process.exit(0)

  try {
    execSync('npm run check', { cwd: projectDir, stdio: 'pipe', encoding: 'utf8' })
    process.exit(0)
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    process.stderr.write(`修改 ${rel} 後，npm run check 未通過，請修正：\n${out}`)
    process.exit(2)
  }
})
