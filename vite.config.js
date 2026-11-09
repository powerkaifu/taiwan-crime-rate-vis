import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base 用相對路徑，部署到任何 GitHub repo 名稱都能運作（repo 名稱尚未決定）
export default defineConfig({
  base: './',
  plugins: [vue()],
})
