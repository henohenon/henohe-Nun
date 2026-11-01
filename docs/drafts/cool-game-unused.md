<!-- 旧 Nun 記法のまま退避。復活させる時は Marp 記法に書き換える -->

# まだまだある

🌊solo
!fl~その他観点

# AIの話

🌊default
!fl~豊富な資産

## Guiねーじゃん！

## ライブラリの少なさ

### 移行やライブラリも今は簡単になってる

## 言語

### js〜嫌いではないが

- C#とかの方が好み
- mbt-wasmとかもあるけど、すると環境は狭まる

# こういう時にイイ感じ

🌊message
!fl~まとめ
!lead~最適ではない。でも、悪くない

- ゲームジャム、小〜中規模
- 1人〜少人数
- Web で配りたい作品
- 触っていて気持ちよく作りたい時

# ライブラリか、エンジンか

# ライブラリって？

!fl~今回の

基本全部入ってるエンジンに対して、自分で描画, 音声, アニメーションなど各種ライブラリを組み合わせて作るヤツ。

```embed_svg
<svg viewBox="0 0 1000 430" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" fill="none" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:auto">
  <g text-anchor="middle" font-size="26" fill="var(--sub)" stroke="none">
    <text x="270" y="38">メーカー製PC</text>
    <text x="730" y="38">自作PC</text>
  </g>

  <!-- メーカー製PC: 閉じた筐体。中身を知らなくても電源ボタンで動く -->
  <g stroke="var(--main)" stroke-width="3">
    <rect x="170" y="66" width="200" height="284" rx="12" fill="var(--overlay)"/>
    <g stroke="var(--sub)" stroke-width="2">
      <rect x="192" y="102" width="156" height="14" rx="7"/>
      <rect x="192" y="136" width="18" height="8" rx="2"/>
      <rect x="218" y="136" width="18" height="8" rx="2"/>
      <path d="M220 262h100M220 278h100M220 294h100M220 310h100M220 326h100"/>
    </g>
    <circle cx="270" cy="196" r="26" stroke="var(--sub)" stroke-width="2"/>
    <circle cx="270" cy="196" r="9" fill="var(--brand)" stroke="none"/>
  </g>

  <!-- 自作PC: サイドパネルを外した状態。パーツを自分で選んで挿していく -->
  <g stroke="var(--main)" stroke-width="3">
    <rect x="620" y="66" width="200" height="284" rx="12"/>
    <rect x="838" y="92" width="20" height="252" rx="6" stroke="var(--sub)" stroke-width="2" transform="rotate(7 848 218)"/>
    <g stroke="var(--sub)" stroke-width="2">
      <rect x="638" y="88" width="126" height="150" rx="4"/>
      <rect x="702" y="98" width="8" height="62" rx="2"/>
      <rect x="716" y="98" width="8" height="62" rx="2"/>
      <rect x="730" y="98" width="8" height="62" rx="2"/>
      <rect x="638" y="296" width="96" height="44" rx="4"/>
      <circle cx="790" cy="112" r="22"/>
      <path d="M790 90v44M768 112h44"/>
    </g>
    <g stroke="var(--brand)" stroke-width="3">
      <rect x="654" y="104" width="36" height="36" rx="4"/>
      <rect x="636" y="250" width="168" height="40" rx="4"/>
      <circle cx="680" cy="270" r="11"/>
      <circle cx="754" cy="270" r="11"/>
    </g>
  </g>

  <g text-anchor="middle" font-size="30" font-weight="700" fill="var(--brand)" stroke="none">
    <text x="270" y="404">= ゲームエンジン</text>
    <text x="730" y="404">= ライブラリ</text>
  </g>
</svg>
```
