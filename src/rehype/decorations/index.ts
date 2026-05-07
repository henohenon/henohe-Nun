/**
 * section に追加される装飾レイヤー (bg / fbg / footer) の barrel export。
 *
 * spec docs/spec/structure.md 「装飾レイヤーの DOM 配置」 通り、 全て section
 * 直下の子要素として配置される。 wrapper-div を使わず、 各 appender が
 * `el.children.unshift` / `push` で section に直接挿入する。
 */

export { appendBackground } from './bg.ts'
export { appendFooter } from './footer.ts'
export { appendFooterBackground } from './fbg.ts'
