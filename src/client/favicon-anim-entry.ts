/**
 * deck index ページ (`buildIndex` が生成する `/` ルート HTML) 用の薄い entry。
 * slide ページでは `client/index.ts` 経由で `initFaviconAnimation()` が呼ばれるが、
 * deck index は独立した HTML テンプレート (decks.ts) なので個別に entry が必要。
 *
 * favicon アニメだけを起動して、 nav / zoom-fit / tooltip 等の slide 機能は
 * 一切ロードしない。
 */
import { initFaviconAnimation } from './favicon-anim.ts'

initFaviconAnimation()
