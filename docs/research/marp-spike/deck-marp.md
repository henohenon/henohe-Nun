---
title: Web技術でイイ感じのゲーム開発
description: Marp spike
theme: nun
headingDivider: 1
fr: 2026/09/20
---

# Web技術でイイ感じのゲーム開発
<!-- _class: title -->

henohenon

# 快適な環境
<!-- _class: solo -->
<!-- _fl: 快適な環境 -->

# Dev Loop
<!-- _fl: 快適な環境 -->

- Unity
  - エディタに戻る → 再コンパイル + ドメインリロード
  - ==数秒〜数十秒==
- 今回の
  - 保存した瞬間、Vite が変更されたモジュールだけ差し替え (HMR) !fn[hmr]
  - 数ms

:::note 補足
Vite 以外でも HMR はある
:::

# それでも軽いのは Web
<!-- _fl: クオリティ -->

| | Three.js | Unity WebGL |
| --- | ---: | ---: |
| 配信サイズ | 109 KB | 4.3 MB |

```ts:main.ts
const scene = new THREE.Scene()
```

#
<!-- _fl: 茶番 -->

```embed_svg
<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><circle cx="60" cy="60" r="50" fill="#5932ff"/><text x="140" y="70" font-size="32">embed_svg</text></svg>
```

!card[Vite](https://vite.dev)

# HMR とは
<!-- _fl: 脚注 -->
!fn~[hmr]

Hot Module Replacement。ページを再読み込みせずにモジュールを差し替える。

# こういう時にイイ感じ
<!-- _class: message -->
<!-- _fl: まとめ -->

<p class="lead">最適ではない。でも、悪くない</p>
