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

heading の前にあるコンテンツは、見出しなしの暗黙的な article として扱われる。
テンプレートやキー指定は heading スコープに属するため、暗黙 article ではなく親に適用される。暗黙 article 自体に指定したい場合は、空 heading（`##` 等）で明示的に区切る。

```md
# Page1
ここはh2の前のコンテンツ
## Article1
```

```html
<section>
   <h1>Page1</h1>
   <div>
      <article>
         ここはh2の前のコンテンツ
      </article>
      <article>
         <h2>Article1</h2>
      </article>
   </div>
</section>
```

heading が空白のみの場合でも区切りとして機能する。この場合、見出し要素自体は生成されない。これは h1〜h6 すべてで同様。

```md
#
装飾だけのページ
##
見出しなしのarticle
```

```html
<section>
   <div>
      <article>
         装飾だけのページ
      </article>
      <article>
         見出しなしのarticle
      </article>
   </div>
</section>
```

## 自動フィット
section の body（h2 以下の要素を含むコンテナ）が溢れた場合、zoom で自動 fit される。対象は section 直下の body のみで、ネストした article 内の個別 fit は行わない。zoom 適用後の再レイアウトで収束しない場合があるため、最大10回繰り返し実行する。10回で収束しない場合はその時点の zoom 値をそのまま使用する。

## テンプレート一覧
- default
   - titleの下に左寄せbody。通常の
   - 空白や`🌊`だけなど省略もこれ。
- title
  - 中央左にtitle、その下にsub。
  - bodyはなく、代わりに固定画像（`/henoheno.svg`）が1枚表示される（差し替え不可、意図的な固定）
- me
  - titleが上、その下に独自コンテナ
  - 独自コンテナ左にicon
  - 右にbody
- message
  - title (h1) と body 内の見出し要素 (h2 等) は default と同じ位置 — 上端、左寄せ、brand 色
  - body は縦横中央寄せ
  - lead テキストは下中央 (`!lead~text` で指定)
- solo
  - headのテキスト、タイトルだけが中央寄せ
  - bodyはなし

## スライドデザイン
スライド全体の共通デザインとして、白背景+黒フッターがある。各 nwyt prop の解釈レベルは記法仕様を参照。

### フッター
黒い一本線と、その上の両端のテキストによって構成される。
両端テキストは、`!fl~<text>`と`!fr~<text>`によって指定できる。
(このテキストもMarkdown記法が使える。`**b***i*~~d~~`みたいな。)

### 背景画像指定
nwyt prop で設定可能。レイヤーは下から `!bg` → フッター → `!fbg` の順で重なる。

- `!bg~[alt](url)` — スライド全体の背景画像（最背面）
- `!fbg~[alt](url)` — フッター部分がマスクされた背景画像。フッター要素を SVG 化し、`mask: url(#footer-mask)` で切り抜く。フッターの線・テキスト形状を通して画像が見える

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
