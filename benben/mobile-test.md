~~~meta
title: Mobile diagnostic
description: cqmin / container-type / calc / color-mix が iOS Chrome で機能してるか確認用
~~~

# Mobile diagnostic
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
  .check { color: green; font-weight: bold; }
  .ng    { color: red;   font-weight: bold; }
  @supports (container-type: size) { .sup-cq::before { content: "✓ "; } .sup-cq { color: green; } }
  @supports not (container-type: size) { .sup-cq::before { content: "✗ "; } .sup-cq { color: red; } }
  @supports (color: color-mix(in srgb, red, blue)) { .sup-cm::before { content: "✓ "; } .sup-cm { color: green; } }
  @supports not (color: color-mix(in srgb, red, blue)) { .sup-cm::before { content: "✗ "; } .sup-cm { color: red; } }
</style>

<div class="diag">
  <div class="diag-label">100px (ref)</div>     <div class="diag-bar bar-100px">100px</div>
  <div class="diag-label">5vmin</div>           <div class="diag-bar bar-5vmin">vmin</div>
  <div class="diag-label">5cqmin</div>          <div class="diag-bar bar-5cqmin">cqmin</div>
  <div class="diag-label">clamp(50,5cq,200)</div><div class="diag-bar bar-clamp">clamp</div>
  <div class="diag-label">calc(50+5cqmin)</div> <div class="diag-bar bar-calc">calc</div>
  <div class="diag-label">color-mix bg</div>    <div class="diag-bar bar-cm">薄紫=OK / 濃紫=NG</div>
  <div class="diag-label">@supports cq</div>    <div class="sup-cq">container-type: size</div>
  <div class="diag-label">@supports cm</div>    <div class="sup-cm">color-mix()</div>
</div>
```

## 判定の見方

- **正常**: 5cqmin と 5vmin の bar 幅がほぼ同じ。 clamp/calc の bar も視覚的に大きく違わない。 color-mix bg は薄紫
- **container queries 死亡**: 5cqmin の bar が 1px (= ほぼ消える)、 clamp の bar が 50px (= 短い floor)、 calc の bar が 50px (cqmin 部分が 0)。 色は普通
- **color-mix 死亡**: color-mix bar が `#5932ff` (濃紫) のまま、 もしくは消える
- **@supports** 行が ✗ なら該当機能が UA 側で未対応 / disabled
