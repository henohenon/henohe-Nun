~~~meta
title: Mobile diagnostic
description: cqmin / container-type / calc / color-mix が iOS Chrome で機能してるか確認用
~~~

# cqmin / calc / color-mix
🌊default
!fl~mobile-diag (fl)
!fr~2026/05/09 (fr)
!fbg~[fbg](/images/tgs.jpg)

各 bar の幅・色を比較。 期待値は **100px (ref) と 5cqmin と 5vmin が iPhone portrait でほぼ同じ幅** (画面幅の 5%、 ~20px 前後)。 もし cqmin だけ消えて見えない / clamp と calc が 50px (floor) で固定されてたら **container queries が機能していない**。

```embed_html
<style>
  .diag { display: grid; grid-template-columns: 14ch 1fr; gap: 6px 12px; font-family: monospace; font-size: 13px; align-items: center; margin-top: 8px; }
  .diag-label { color: #555; white-space: nowrap; }
  .diag-bar { background: #5932ff; color: white; height: 1.6em; padding: 0 6px; display: flex; align-items: center; border-radius: 4px; min-width: 1px; box-sizing: border-box; }
  .bar-100px   { width: 100px; }
  .bar-5vmin   { width: 5vmin; }
  .bar-5cqmin  { width: 5cqmin; }
  .bar-clamp   { width: clamp(50px, 5cqmin, 200px); }
  .bar-calc    { width: calc(50px + 5cqmin); }
  .bar-cm      { width: 100px; background: color-mix(in srgb, #5932ff 50%, white); }
  @supports (container-type: size) { .sup-cq::before { content: "OK "; } .sup-cq { color: green; } }
  @supports not (container-type: size) { .sup-cq::before { content: "NG "; } .sup-cq { color: red; } }
  @supports (color: color-mix(in srgb, red, blue)) { .sup-cm::before { content: "OK "; } .sup-cm { color: green; } }
  @supports not (color: color-mix(in srgb, red, blue)) { .sup-cm::before { content: "NG "; } .sup-cm { color: red; } }
</style>

<div class="diag">
  <div class="diag-label">100px (ref)</div>     <div class="diag-bar bar-100px">100px</div>
  <div class="diag-label">5vmin</div>           <div class="diag-bar bar-5vmin">vmin</div>
  <div class="diag-label">5cqmin</div>          <div class="diag-bar bar-5cqmin">cqmin</div>
  <div class="diag-label">clamp(50,5cq,200)</div><div class="diag-bar bar-clamp">clamp</div>
  <div class="diag-label">calc(50+5cqmin)</div> <div class="diag-bar bar-calc">calc</div>
  <div class="diag-label">color-mix bg</div>    <div class="diag-bar bar-cm">color-mix</div>
  <div class="diag-label">@supports cq</div>    <div class="sup-cq">container-type: size</div>
  <div class="diag-label">@supports cm</div>    <div class="sup-cm">color-mix()</div>
</div>
```

# SVG text 位置決め test
🌊default
!fl~svg-test (fl)
!fr~2026/05/09 (fr)

footer 重なりの原因切り分け。 各 box の text が **右端** に来るのが期待。 **左端 / 中央 / 重なる** ならその手法は iOS で壊れてる。

```embed_html
<style>
  .svgtest { display: block; width: 100%; height: 32px; border: 1px solid #5932ff; margin-block: 6px; background: #f8f8f8; }
  .svgtest text { font-size: 14px; font-family: monospace; fill: #5932ff; }
  .t2 text { x: 100%; }
  .t3 text { translate: calc(100% - 8px) 0; }
  .t4 text { translate: calc(100% - 8px) 0; transform-box: view-box; }
  .t5 text { x: 100%; translate: calc(100% - 8px) 0; }
</style>

<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest"><text x="100%" y="22" text-anchor="end">T1: SVG attr x=100%</text></svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest t2"><text y="22" text-anchor="end">T2: CSS x: 100%</text></svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest t3"><text y="22" text-anchor="end">T3: CSS translate calc(100%-8)</text></svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest t4"><text y="22" text-anchor="end">T4: T3 + transform-box view-box</text></svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest t5"><text y="22" text-anchor="end">T5: CSS x + CSS translate (現 footer)</text></svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="svgtest"><text x="100%" y="22" text-anchor="end" transform="translate(-8 0)">T6: SVG attr x + SVG transform</text></svg>
```

判定: T1/T6 が右端なら SVG attribute は OK。 T2-T5 のうち左端 / 重なるのが iOS で壊れる手法 → footer fix で避けるべき構成。

# SVG attribute calc test
🌊default
!fl~svg-attr-calc (fl)
!fr~2026/05/09 (fr)

fbg mask の `<use y="calc(100% - var(...))">` が iOS で効かない件。 SVG attribute での calc バリエーションを切り分ける。 各 box の **垂直方向の縦線** が **右側 (x= 期待値) に出る** か確認。 **左端 (x=0) なら calc が効いてない**。

```embed_html
<style>
  .calctest { display: block; width: 100%; height: 32px; border: 1px solid #5932ff; margin-block: 6px; background: #f8f8f8; --p: 8px; }
  .calctest line { stroke: #5932ff; stroke-width: 2; }
</style>

<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="calctest">
  <line x1="100%" y1="0" x2="100%" y2="100%" />
  <text x="100%" y="22" text-anchor="end" font-size="14" font-family="monospace" fill="#5932ff" transform="translate(-4 0)">T7: x1=100% (基準、 右端の縦線)</text>
</svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="calctest">
  <line x1="calc(100% - 50px)" y1="0" x2="calc(100% - 50px)" y2="100%" />
  <text x="100%" y="22" text-anchor="end" font-size="14" font-family="monospace" fill="#5932ff" transform="translate(-4 0)">T8: calc(100% - 50px)</text>
</svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="calctest">
  <line x1="calc(100% - 5cqmin)" y1="0" x2="calc(100% - 5cqmin)" y2="100%" />
  <text x="100%" y="22" text-anchor="end" font-size="14" font-family="monospace" fill="#5932ff" transform="translate(-4 0)">T9: calc(100% - 5cqmin)</text>
</svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="calctest">
  <line x1="calc(100% - var(--p))" y1="0" x2="calc(100% - var(--p))" y2="100%" />
  <text x="100%" y="22" text-anchor="end" font-size="14" font-family="monospace" fill="#5932ff" transform="translate(-4 0)">T10: calc(100% - var(--p))</text>
</svg>
<svg viewBox="0 0 400 32" preserveAspectRatio="none" class="calctest">
  <line x1="calc(100% - 1em)" y1="0" x2="calc(100% - 1em)" y2="100%" />
  <text x="100%" y="22" text-anchor="end" font-size="14" font-family="monospace" fill="#5932ff" transform="translate(-4 0)">T11: calc(100% - 1em)</text>
</svg>
```

判定:
- **T7** (基準) — 右端 line が見える、 SVG attr の % 自体は OK
- **T8 (literal px calc)** 効くなら → calc + 純 literal 単位は OK
- **T9 (cqmin calc)** 効くなら → cqmin 経由で responsive 維持可能
- **T10 (var calc)** 効くなら → var() route も生きてる
- **T11 (em calc)** 効くなら → em で font-size 連動 fix 可能

どれかが効けば fbg の use y を **その route に書き換えて JS 撤廃** できる。 全滅なら JS が唯一の解 (= 現状維持)。
