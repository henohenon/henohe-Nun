/**
 * 全画面表示中、 native cursor を非表示にして brand 半透明円のカスタム
 * カーソルを mouse position に追随させる (cursor jack)。
 *
 * 通常表示中は何もしない (CSS の `:fullscreen .cursor-jack` 配下でのみ可視化)。
 * mouse 移動の度に `transform: translate(...)` で円の中心を cursor 位置に合わせる。
 *
 * presenter mode (full screen) でカーソルを大きく可視化することで、 投影画面で
 * 観客から「今どこを指してるか」が分かりやすくなる用途。
 */

export function initCursorJack(): void {
  const cursor = document.createElement('div')
  cursor.className = 'cursor-jack'
  document.body.appendChild(cursor)

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`
    cursor.style.top = `${e.clientY}px`
  })
}
