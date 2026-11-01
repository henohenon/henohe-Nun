import { defineConfig } from '@marp-team/marp-cli'

// marp-cli 共通設定。dev (marp -s) / build / pdf すべてがこのファイルを読む。
export default defineConfig({
  html: true,
  themeSet: './themes',
  allowLocalFiles: true,
})
