# DOM構造・デザイン

スライドはh1毎にページ/section、h2以降はその階層構造として要素/articleで提供される。

テンプレートやキー指定はスライド(h1)だけでなく、各article(h2以降)にも指定できる。

```md
# Page1
## Article1
### Article2
### Article3
## Article4
# Page2
```

```html
<section>
   <h1>Page1</h1>
   <div>
      <article>
         <h2>Article1</h2>
         <div>
            <article>
               <h3>Article2</h3>
            </article>
            <article>
               <h3>Article3</h3>
            </article>
         </div>
      </article>
      <article>
         <h2>Article4</h2>
      </article>
   </div>
</section>
<section>
   <h1>Page2</h1>
</section>
```

`# `（空白のみ）でもページ区切りとして機能する。この場合、見出し要素(h1)自体は生成されない。

```md
#
装飾だけのページ
```

```html
<section>
   <div>
      装飾だけのページ
   </div>
</section>
```

## 自動フィット
h2以下の要素が溢れた場合、zoomで自動fitされる。この際、改行などで一筋縄ではいかないため、何度か繰り返し実行する。

## テンプレート一覧
- default
   - titleの下に左寄せbody。通常の
   - 空白や`🌊`だけなど省略もこれ。
- title
  - 中央左にtitle、その下にsub。
  - bodyはなく、変わりに固定の画像が1毎
- me
  - titleが上、その下に独自コンテナ
  - 独自コンテナ左にicon
  - 右にbody
- message
  - 通常通りtitle, body
  - bodyが中央寄せで、その下にleadのテキストがある
- solo
  - headのテキスト、タイトルだけが中央寄せ
  - bodyはなし

## スライドデザイン
スライド全体の共通デザインとして、白背景+黒フッターがある適用する。

### フッター
黒い一本線と、その上の両端のテキストによって構成される。
両端テキストは、`!fl~<text>`と`!fr~<text>`によって指定できる。
(このテキストもMarkdown記法が使える。`**b***i*~~d~~`みたいな。)

### 背景画像指定
キー指定画像で設定可能。
`!bg[<alt>](<url>)`
また、フッターマスクの背景画像を同様に設定可能。
`!fbg[<alt>](<url>)`

### テーマ
スライドの配色は少数のCSS変数で制御する。

| 変数 | 用途 |
| --- | --- |
| `--base` | 背景色 |
| `--main` | 本文色 |
| `--sub` | 補助テキスト色 |
| `--strong` | 強調色 |
| `--brand` | アクセント色 |

配色プリセット（`.dark` など）やカスタム配色はクラス経由でCSSファイルにて定義する。
