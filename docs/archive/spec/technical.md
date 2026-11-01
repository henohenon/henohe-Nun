# 技術仕様

## パイプライン全体像

```
md
 | micromark + extensions
tokens
 | mdast-util (template/nwyt prop -> mdast node, content -> mdast node)
mdast
 | remark plugins (gfm, math, breaks, mark, meta, extract: template/nwyt prop mdast → vfile.data)
mdast
 | remark-rehype
hast (flat)
 | rehype plugins (katex, code pre-process, shiki, code block extensions + embed SSR)
 | fn参照 → sup プレースホルダー変換
hast (flat, content converted)
 | Scope extraction
Scope tree
 | template application + footer generation + fn定義マーク (recursive)
hast (structured: section/article/div)
 | fn参照解決 (tooltip挿入, href設定)
 | page shell (html/head/body)
hast (complete)
 | rehype-stringify
HTML
```

### パイプライン構成

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import remarkMark from 'remark-mark'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'

// custom plugins
import { remarkNunSyntax } from './remark-nun-syntax'   // micromark ext 登録
import { remarkNunMeta } from './remark-nun-meta'        // ~~~meta 抽出
import { remarkNunExtract } from './remark-nun-extract'  // template/nwyt prop mdast ノード → vfile.data に移動＆ツリーから削除
import { rehypeNunCodePre } from './rehype-nun-code-pre'  // diff_*/embed_* 前処理（shiki 前）
import { rehypeNunCodeBlock } from './rehype-nun-code'   // embed SSR, diff スタイル, header（shiki 後）
import { rehypeNunCard } from './rehype-nun-card'        // !card OGP fetch (async)
import { rehypeNunFnRef } from './rehype-nun-fn-ref'     // !fn[id] → sup placeholder
import { rehypeNunStructure } from './rehype-nun-structure' // Scope抽出 → テンプレート適用 → fn解決 → shell

const processor = unified()
  .use(remarkParse)
  .use(remarkNunSyntax)       // micromark extensions を remarkParse に登録（template, nwyt, admonition）
  .use(remarkGfm)             // strikethrough, table, checklist, autolink
  .use(remarkMath)            // $...$ / $$...$$
  .use(remarkBreaks)          // 改行 → <br>
  .use(remarkMark)            // ==highlight==
  .use(remarkNunMeta)         // ~~~meta → vfile.data.meta
  .use(remarkNunExtract)      // nunTemplate/nunNwytProp mdast ノード → vfile.data に移動＆ツリーから削除
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeNunCodePre)      // diff_* → ベース言語に書き換え + diff フラグ保存
  .use(rehypeShiki, { theme: 'nord', langs: [/* ... */] })  // embed_* は rehypeNunCodePre で退避済み → スキップ
  .use(rehypeNunCodeBlock)    // embed SSR, diff スタイル, header 追加
  .use(rehypeNunCard)         // !card → OGP fetch → card 要素 (async)
  .use(rehypeNunFnRef)        // !fn[id] → <sup data-fn="id">
  .use(rehypeNunStructure)    // Scope化 → テンプレート → fn解決 → shell

const result = await processor.process(markdown)
const html = String(result)
```

## micromark extensions

独自記法を tokenizer レベルで認識する。コードフェンス内の誤マッチやエスケープを構造的に防ぐ。

### remarkNunSyntax（micromark extensions の登録）

```ts
import type { Extension as MicromarkExtension } from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'

/** remark plugin: micromark extensions を登録 */
function remarkNunSyntax() {
  const data = this.data()
  // micromark syntax extensions
  data.micromarkExtensions ??= []
  data.micromarkExtensions.push(nunTemplateSyntax())
  data.micromarkExtensions.push(nunNwytPropSyntax())     // flow: !key~value
  data.micromarkExtensions.push(nunNwytContentSyntax())  // text: !key[value]
  data.micromarkExtensions.push(nunAdmonitionSyntax())   // flow: ::: admonition
  // mdast-util fromMarkdown extensions
  data.fromMarkdownExtensions ??= []
  data.fromMarkdownExtensions.push(nunTemplateFromMarkdown())
  data.fromMarkdownExtensions.push(nunNwytPropFromMarkdown())
  data.fromMarkdownExtensions.push(nunNwytContentFromMarkdown())
  data.fromMarkdownExtensions.push(nunAdmonitionFromMarkdown())
}
```

### template (`🌊`)

段落先頭の `🌊` から行末まで1トークンとして認識。

- micromark: flow レベル。`🌊`（UTF-16 サロゲートペア `0xD83C 0xDF0A`）で開始し、行末まで `nunTemplateValue` として取得
- mdast-util: `nunTemplate` mdast ノードを生成。value を `.` で分割し、先頭がテンプレート名、残りがクラス

```ts
// mdast ノード
{ type: 'nunTemplate', template: 'me' | undefined, classes: ['dark', 'wide'], position }
```

- `🌊.dark` のようにテンプレート名なし（クラスのみ）も可（template = undefined）
- 1スコープにつき1つ。2つ以上ある場合は後勝ち（最後のものを採用）

### nwyt prop (`!key~value`) — flow

段落先頭の `!key.class~` を認識。value は `contentType: 'string'`（raw テキスト）として取得し、パースはテンプレート適用時に key に応じて実行する。

- micromark: flow レベル。`!` で開始、key (`[a-zA-Z0-9]+`)、任意の `.class` 列、`~` セパレータ、行末まで value
- mdast-util: `nunNwytProp` mdast ノードを生成

```ts
// mdast ノード
{ type: 'nunNwytProp', key: 'fl', classes: ['bold'], rawValue: 'テキスト', position }
// 脚注定義の場合
{ type: 'nunNwytProp', key: 'fn', classes: [], rawValue: '[1]', position }
```

### nwyt content (`!key[value]`) — text

インラインレベルで `!key.class[value]` / `!key.class[value](url)` を認識。段落途中でも使える。

- micromark: text レベル。`!` で開始、key、任意の `.class` 列、`[value]` 必須、`(url)` 任意
- mdast-util: `nwytContent` mdast ノードを生成（ツリーに残るインライン要素）

```ts
// mdast ノード
{ type: 'nwytContent', data: { key: 'card', classes: ['v'], url: 'https://...' }, children: [...], position }
// url は (url) 部分。省略時は undefined（!fn[id] など）
```

### 各記法の処理フロー

- **template / nwyt prop**: mdast ノード → `remarkNunExtract` が mdast を走査して vfile.data に移動＆ツリーから削除
- **nwyt content**: mdast ノードとしてツリーに残る → remark-rehype 経由で hast に変換
- `!card.v[alt](url)` → OGP カード要素
- `!fn[id]` → 脚注参照マーク (`<sup>`)
- その他の未知キー → warning を出力し、`<span class="nwyt-{key}" data-nwyt="{key}">` としてそのまま残す

## vfile.data とスコープ紐付け

template と nwyt prop は vfile.data に position 付きで格納される。構造化（Scope 抽出）時に、heading の position 範囲と比較して各スコープに紐付ける。

position は micromark のトークナイズ時に確定した元テキストの行番号であり、AST の変換で増減しても不変。

### 紐付けアルゴリズム

**収集フェーズ**（remarkNunExtract）: mdast ツリーから `nunTemplate` / `nunNwytProp` ノードを収集し、position 付きで `vfile.data.templates` / `vfile.data.nwyts` に格納してツリーから削除する。脚注定義（key=fn）は `vfile.data.footnotes` に id をキーとして格納。この段階ではスコープとの対応は未確定。

**適用フェーズ**（Scope 抽出時）: `extractScopes` が hast を heading で再帰分割する過程で、各 Scope の行範囲（heading の行 〜 次の同レベル以上 heading の行）が自然に確定する。`buildScope` 内でその行範囲を使い、`vfile.data.templates` / `vfile.data.nwyts` から該当 entry をフィルタして紐付ける。

暗黙 article（heading 前コンテンツ）は heading を持たないため、template / nwyt prop は紐付けられない。暗黙 article の直前に書かれた template / nwyt prop は親 Scope に属する（親の heading 行範囲に含まれるため）。

### グローバル指定

最初の h1 の position より前にある entry は全体のデフォルト値。

- テンプレート名: グローバルに書いても無視（各 section/article で明示指定、省略時は `default`）
- クラス: 全 section・全 article に継承され、ローカルクラスとマージ
- nwyt prop: 全 section・全 article に継承。ローカルに同じ key があればローカルが優先。継承された prop をどう解釈するかは各テンプレート次第（例: `!bg` は section レベルのテンプレートでのみ使用、article で継承されても無視される）

## Scope 構造

hast（フラット）から heading 境界で再帰的に分割して構築する中間データ構造。

```ts
type TemplateName = 'default' | 'title' | 'me' | 'message' | 'solo'

type NwytProp = {
  key: string
  classes: string[]
  rawValue: string            // raw テキスト。テンプレート適用時に parseNwytValue で key に応じてパース
  position: Position
}

type TemplateEntry = {
  template: TemplateName | undefined  // undefined = クラスのみ指定
  classes: string[]
  position: Position
}

type FootnoteEntry = {
  position: Position
}

type FootnoteLocation = {
  page: number        // section のページ番号（1-origin）
}

type VFileData = {
  templates: TemplateEntry[]
  nwyts: NwytProp[]
  footnotes: Record<string, FootnoteEntry>        // 収集フェーズで構築
  footnoteLocs: Record<string, FootnoteLocation>   // Scope 抽出時に構築
  meta: Record<string, string>  // ~~~meta の内容
}

type Scope = {
  tag: 'section' | 'article'   // h1 -> section, h2+ -> article
  depth: number                 // heading depth
  heading: Element | null       // null = implicit article (heading前コンテンツ)
  template: TemplateName        // default fallback
  classes: string[]             // template classes
  nwyts: NwytProp[]             // scoped nwyt props
  body: (ElementContent | Scope)[]  // hast nodes and child scopes
  fnDef?: string                // この Scope が脚注定義である場合の id
}
```

### 構造化ルール

- h1 で `<section>` を切る（ページ）
- h2 以降で `<article>` を切る（heading depth に応じてネスト）
- heading 前のコンテンツは `heading: null` の暗黙 Scope として扱う
- 空白 heading は区切りとして機能するが heading 要素は生成しない

### Scope 抽出

`extractScopes(nodes, depth, vfileData)` が hast の子ノード列を指定 depth の heading で分割し、Scope ツリーを構築する。

1. 同 depth の heading で分割 → 各 heading が1つの Scope になる
2. heading 前のコンテンツは `heading: null` の暗黙 Scope（template/nwyt 紐付けなし）
3. 空白 heading は区切りとして機能するが heading 要素は生成しない（`heading: null`）
4. 各 Scope の body 内に `depth+1` の heading があれば再帰的に分割
5. `buildScope` 内で、heading の行〜次の同レベル以上 heading の行を行範囲として、`vfile.data` から template/nwyt をフィルタ＆紐付け

## テンプレート

テンプレートは Scope を受け取って hast を返す関数。hastscript `h()` で記述。

```ts
const me = (scope: Scope): Element =>
  h(`${scope.tag}.me`, { className: scope.classes }, [
    scope.heading,
    h('div.container', [
      h('div.icon', [resolveNwyt(scope, 'icon')]),
      h('div.body', renderChildren(scope.body)),
    ]),
  ])
```

- ルート要素のタグ名は `scope.tag`（section or article）
- テンプレート名をクラスとして付与（`.me`, `.title` 等）
- `scope.classes` をルート要素に追加
- `renderChildren` が子 Scope に出会ったら再帰的にテンプレート適用

### テンプレート一覧

| 名前 | 構造 | body |
|---|---|---|
| default | heading + body | あり |
| title | heading(center) + sub + logo | なし |
| me | heading + [icon, body] | あり |
| message | heading + body(center) + lead | あり |
| solo | heading(center) | なし |

全テンプレートは section（h1）・article（h2+）の両方で使用可能。`scope.tag` に応じてルート要素のタグ名が変わるだけで、構造は同じ。body なしテンプレート（title, solo）では子 Scope は構造化されても表示されない。

### テンプレート適用（再帰）

```ts
type TemplateFn = (scope: Scope) => Element

const templates: Record<string, TemplateFn> = {
  default: defaultTemplate,
  title: titleTemplate,
  me: meTemplate,
  message: messageTemplate,
  solo: soloTemplate,
}

/** Scope を再帰的にテンプレート適用して hast に変換 */
function render(scope: Scope): Element {
  const templateFn = templates[scope.template]
  const el = templateFn(scope)
  // 脚注定義 Scope の場合: heading に [^id] マーク挿入 + 属性付与
  if (scope.fnDef) {
    addFnMark(el, scope.fnDef)
    el.properties ??= {}
    el.properties['dataFnDef'] = scope.fnDef
  }
  return el
}

/** body 内の要素を処理。子 Scope があれば再帰、hast ノードはそのまま */
function renderChildren(body: (ElementContent | Scope)[]): (Element | ElementContent)[] {
  return body.map(child =>
    isScope(child) ? render(child) : child
  )
}

/** nwyt prop を key で検索し、key に応じて rawValue をパースして hast 化 */
function resolveNwyt(scope: Scope, key: string): Element | null {
  const nwyt = scope.nwyts.find(n => n.key === key)
  if (!nwyt) return null
  // key に応じて rawValue の解釈を変える
  const children = parseNwytValue(nwyt.key, nwyt.rawValue)
  return h('span', { className: nwyt.classes }, children)
}

/** rawValue を key に応じてパース */
function parseNwytValue(key: string, raw: string): ElementContent[] {
  // bg, fbg, icon: Markdown 画像記法としてパース → img 要素
  // fl, fr, sub, lead: Markdown インラインとしてパース → inline hast nodes
  // その他: プレーンテキストとして扱う
}
```

### 各テンプレート実装

```ts
function defaultTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderChildren(scope.body)))
  }
  return h(`${scope.tag}.default`, { className: scope.classes }, children)
}

function titleTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const sub = resolveNwyt(scope, 'sub')
  if (sub) children.push(h('div.sub', [sub]))
  children.push(h('svg.henoheno', { src: '/henoheno.svg', alt: '' }))
  // body なし — 子 Scope は無視される
  return h(`${scope.tag}.title`, { className: scope.classes }, children)
}

function meTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const icon = resolveNwyt(scope, 'icon')
  children.push(
    h('div.container', [
      h('div.icon', icon ? [icon] : []),
      h('div.body', renderChildren(scope.body)),
    ])
  )
  return h(`${scope.tag}.me`, { className: scope.classes }, children)
}

function messageTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderChildren(scope.body)))
  }
  const lead = resolveNwyt(scope, 'lead')
  if (lead) children.push(h('div.lead', [lead]))
  return h(`${scope.tag}.message`, { className: scope.classes }, children)
}

function soloTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  // body なし — 子 Scope は無視される
  return h(`${scope.tag}.solo`, { className: scope.classes }, children)
}
```

### rehypeNunStructure（統合 plugin）

```ts
/** Scope 抽出 → テンプレート適用 → フッター → fn 解決 → シェル */
function rehypeNunStructure(options: { meta: Meta }) {
  return (tree: Element, file: VFile) => {
    const data = file.data as VFileData

    // 1. フラット hast → Scope ツリー + 脚注位置マップ構築
    const scopes = extractScopes(tree.children, 1, data)

    // 2. 各 Scope を再帰的にテンプレート適用して hast 化
    const sections = scopes.map(scope => {
      const el = render(scope)
      // 3. section レベルならフッター追加
      if (scope.tag === 'section') {
        appendFooter(el, scope, data)
      }
      return el
    })

    // 4. 脚注の一括解決（footnoteLocs を使用）
    resolveFootnotes(sections, data.footnoteLocs)

    // 5. ページシェルで包む (sections は body 直下、 wrapper div は使わない)
    return shell(sections, options.meta)
  }
}
```

## フッター

section（h1）レベルのみ。`!fl`/`!fr` の nwyt prop から生成。

```ts
h('footer', [
  h('span.fl', { className: flValue.classes }, parseNwytValue('fl', flValue.rawValue)),
  h('hr'),
  h('span.fr', { className: frValue.classes }, parseNwytValue('fr', frValue.rawValue)),
])
```

- rawValue は `parseNwytValue` で Markdown インラインとしてパースされる（装飾が効く）
- グローバル指定は全 section に適用、ローカル指定で上書き
- Scope -> hast の再帰で `tag === 'section'` のときだけ追加

### 背景画像とフッターマスク

レイヤー構成（下から）: `!bg` → フッター → `!fbg`

- `!bg`: section の `background-image` として設定（最背面）
- `!fbg`: フッター形状を SVG で再現し、その SVG を `mask` として `!fbg` 画像を切り抜く。フッターの線・テキスト形状を通して画像が見える

#### fbg マスク用 SVG の構築

フッターの HTML 要素とは別に、マスク専用の SVG をインラインで生成する。フッターテキストの Markdown インライン装飾は、簡易的に SVG `<text>` / `<tspan>` 属性にマッピングする:

| Markdown | SVG tspan 属性 |
|---|---|
| `**太字**` | `font-weight="bold"` |
| `*斜体*` | `font-style="italic"` |
| `~~打ち消し~~` | `text-decoration="line-through"` |

フッターの線（`<hr>` 相当）は SVG `<line>` または `<rect>` で描画。フォントサイズ・位置はフッター CSS と同じ定数を共有する。

完全な Markdown 再現は目指さず、フッターで実用的に使われる範囲の装飾のみ対応する。HTML 側のフッターとマスク SVG は同じ rawValue から生成するが、パース結果の出力先が異なる（HTML hast vs SVG hast）。

```
footer 構造（!fbg あり）:

<footer class="masked">
  <svg>                          ← マスク定義（非表示）
    <defs>
      <mask id="footer-mask">
        <line ... />             ← hr 相当
        <text x="left">         ← !fl テキスト（SVG 簡易レンダリング）
          <tspan font-weight="bold">...</tspan>
        </text>
        <text x="right">        ← !fr テキスト
        </text>
      </mask>
    </defs>
  </svg>
  <div class="fbg-layer" />     ← !fbg 画像 + mask: url(#footer-mask)
  <span class="fl">...</span>   ← 通常の HTML フッターテキスト
  <hr>
  <span class="fr">...</span>
</footer>
```

`!fbg` がない場合は通常の `<footer>` のみ（SVG なし）。

## 脚注

4段階で処理する。

### 1. 定義の収集（mdast-util）

`!fn~[id]` を nwyt prop として vfile.data.footnotes に id をキーとしたマップで格納。value は id のみ（脚注の内容は定義側 article の body 全体）:

```ts
// vfile.data.footnotes
{
  '1': { position: {...} },
  '2': { position: {...} },
}
```

### 2. 参照のプレースホルダー変換（rehype, Scope前）

`!fn[id]` ノードを `<sup data-fn="id">` に変換。tooltip も href もこの段階では未設定:

```html
<sup data-fn="1"></sup>
```

### 3. 定義位置の解決（Scope 抽出時）+ render での処理

`extractScopes` で Scope ツリーを構築する過程で、各 Scope の行範囲が確定する。この時点で `vfile.data.footnotes` の position と照合し、該当 Scope に `fnDef = id` をセットする。同時に脚注 id → ページ番号のマップ（`footnoteLocs`）を構築する。

```ts
// Scope 抽出時に構築
type FootnoteLocation = {
  page: number        // section のページ番号（1-origin）
}
// vfile.data.footnoteLocs: Record<string, FootnoteLocation>
```

`render()` が `scope.fnDef` を検出した場合、以下を自動処理する:
- heading に `[^id]` マーク挿入（`addFnMark`）
  - heading あり → heading の子の先頭に `<span class="fn-def-mark">[^id]</span>` を挿入
  - heading なし（暗黙 article）→ 空の heading 要素を生成し、その子としてマークを挿入
- ルート要素に `data-fn-def="id"` 属性を付与

### 4. 参照側の一括解決（テンプレート適用後）

テンプレート適用済み hast に対して、参照側をまとめて処理:

1. `[data-fn-def="id"]` セレクタで定義側 article を特定し、body content から tooltip 用 hidden 要素を生成して参照側に挿入
2. `<sup data-fn="id">` に `<a href="#n">` を設定（n = `footnoteLocs[id].page`）

```html
<!-- 定義側 article の heading（完成形） -->
<h2><span class="fn-def-mark">[^1]</span>脚注タイトル</h2>

<!-- 参照箇所（完成形） -->
<sup data-fn="1"><a href="#3">1</a></sup>
<aside class="fn-tooltip" data-fn="1" hidden>
  <!-- 定義 article の body content -->
</aside>
```

- ホバーで tooltip 表示（JS）
- クリックで定義側スライドページに遷移

## コードブロック拡張

2段階で処理する。

### rehypeNunCodePre（shiki 前）

info string を解析し、shiki が正しく動作するよう前処理する。

- `diff_<lang>` → info string を `<lang>` に書き換え、diff フラグを node data に保存
- `embed_*` → ノードを一時的に別タイプに退避し、shiki の処理対象から除外する
- `<lang>:<name>#<n>` → info string を `<lang>` に書き換え、name / startLine を node data に保存

### rehypeNunCodeBlock（shiki 後）

shiki 処理後のコードブロックを種別ごとに処理する。

- `embed_*`（退避ノード）→ SSR 変換（描画要素に差し替え）
- diff フラグあり → 行頭 `+`/`-` に差分スタイル追加
- 通常 → name / startLine を data から取得してヘッダー・行番号追加

### embed

| 種別 | 処理 |
|---|---|
| embed_html | `hast-util-from-html` で hast 化 |
| embed_svg | 同上 |
| embed_mermaid | クライアントサイドレンダリング（後述） |
| embed_math | KaTeX API で HTML レンダリング -> hast 化 |

#### embed_mermaid: クライアントサイドレンダリング採用の経緯

当初仕様では「mermaid API で SVG レンダリング → hast 化」(SSR) を想定していた。
調査の結果、Mermaid の SSR には DOM 環境が必要で、実用的な手段は以下の3択になる：

| 手段 | 問題 |
|---|---|
| `@mermaid-js/mermaid-cli` | 内部で Puppeteer (Chromium バイナリ ~100MB+) を使用。公式ツールだが重い |
| jsdom + mermaid | 軽量だが全ダイアグラム型の動作は保証されない |
| Playwright headless | ビルドのたびにブラウザ起動。PDF 出力用途とは分離したい |

**決定**: `<pre class="mermaid">` を出力し、`mermaid` npm パッケージをクライアントで動的 import して非同期レンダリングする。
- ナビゲーション初期化はブロックしない（`initMermaid` は fire-and-forget）
- レンダリング完了後に現在スライドを `fitSlide` で再調整
- Mermaid は Vite の code splitting により別チャンクに分離される

### コードブロックヘッダー

rehype-shiki が `<pre><code>` を生成した後、ラッパーを追加:

```ts
h('figure.code-block', [
  h('figcaption', [
    h('span.lang', name ?? lang),
    h('button.copy', 'copy'),
  ]),
  pre,  // #<n> 指定時は各行に行番号を付与（開始番号 = n）
])
```

## `!card` OGP fetch

async rehype plugin として実装。

1. hast 内の card ノードを全収集
2. URL を並列 fetch して OGP データ取得
3. card ノードを hast に差し替え

OGP キャッシュは dev サーバーのプロセス内メモリに保持（再起動で消える）。build は毎回 fetch する。並列 fetch で速度を緩和。

## ページシェル

スライド本体の hast を `<html>` で包む。hastscript `h()` で構築し一括 stringify。

```ts
const shell = (content: Element, meta: ShellMeta): Element =>
  h('html', { lang: 'ja' }, [
    h('head', [
      h('meta', { charset: 'utf-8' }),
      h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      h('title', meta.title),
      h('meta', { property: 'og:title', content: meta.title }),
      h('meta', { name: 'description', content: meta.description }),
      h('meta', { property: 'og:description', content: meta.description }),
      h('meta', { property: 'og:type', content: 'website' }),
      h('meta', { property: 'og:url', content: meta.ogUrl }),
      h('meta', { property: 'og:image', content: meta.ogImage }),
      h('meta', { name: 'twitter:card', content: 'summary_large_image' }),
    ]),
    h('body', [
      content,
      h('script', { type: 'module', src: meta.jsPath }),
    ]),
  ])
```

OGP メタは `~~~meta` ブロックの値 + Vite `base` + デッキ名から組み立てる:

- `og:title` / `og:description` / `<title>` / `<meta name=description>` ← `meta.title` / `meta.description`
- `og:image` ← `meta.ogImage` / `meta.image` 明示指定があれば優先、無ければ `{base}{deck}/thumb.webp` に自動派生
- `og:url` ← `meta.url` 明示指定があれば優先、無ければ `{base}{deck}/` に自動派生
- `og:type` は `website` 固定。`twitter:card` は og:image がある時のみ `summary_large_image` を出す

`base` がフル URL (`https://example.com/`) なら絶対 URL が出る。GitHub Pages 等でパスのみ (`/repo-name/`) の場合は同 origin の絶対パス URL になり、scraper はページ URL に対して解決する。

## `~~~meta`

remark plugin で `{ type: 'code', lang: 'meta' }` を検出し、`key: value` をパースして vfile.data.meta に格納。ツリーからは削除。

```yaml
date: 2024-01-15
title: スライドタイトル
description: 説明文
```

## remark plugins（既存）

| plugin | 用途 |
|---|---|
| remark-gfm | strikethrough `~~`, table, checklist, autolink（remarkNunSyntax の後に配置し、nwyt の `~` との衝突を回避） |
| remark-math | `$...$` / `$$...$$` 数式 |
| remark-breaks | 改行 -> `<br>` |
| remark-mark | `==highlight==` |
| ~~remark-directive~~ | 装飾ブロックは自前 micromark extension で実装 (ネスト用に colon 数を増やせる必要があるため) |

### 装飾ブロック

自前 micromark extension でパース、rehype 変換で hast 化。スライドという静的メディアの性質に合わせ、折りたたみ (動的 toggle) は提供しない。

#### HTML 出力構造

```html
<div class="admonition note">
  <div class="admonition-title">Note</div>
  <div class="admonition-body">本文</div>
</div>
```

CSS は `.admonition` / `.admonition-title` / `.admonition-body` で構成。type 別の色は `.admonition.<type>` の `--admonition-accent` で当てる。

#### デフォルトタイトル

デフォルトは英語。タイトルを変えたい場合は記法で直接指定する（`:::note 補足`）。

| 種類 | デフォルトタイトル |
|---|---|
| `note` | Note |
| `info` | Info |
| `tip` | Tip |
| `warning` | Warning |
| `alert` | Alert |

## rehype plugins（既存）

| plugin | 用途 |
|---|---|
| rehype-katex | 数式レンダリング |
| rehype-shiki | コードハイライト + diff |

## クライアント JS

vanilla TS で実装。フレームワークなし。

### ナビゲーション

- 各 section を `display: none` / `block` で切り替え、URL は `#<n>` で管理
- キーボード、タッチスワイプ、マウスホイール、フルスクリーン時のクリックで移動
- `View Transition API` 対応（`document.startViewTransition` があれば使用）

### 自動フィット（zoom-fit）

section の body 内容が溢れた場合、CSS `zoom` で縮小して収める。

- body の子要素の実サイズと body のサイズを比較してスケールを算出
- `zoom` を適用すると再レイアウトが発生するため、収束するまで最大10回繰り返す
- スライド表示時、リサイズ時に実行
- 印刷時（`beforeprint`）は全スライドに対して実行（`@media print` で全 section が `display: block` になるため）

```ts
function adjustZoom(body: HTMLElement, children: HTMLElement[], iteration: number, currentZoom: number): void {
  if (iteration >= 10) return;
  const csx = Math.max(...children.map((c) => c.offsetLeft + c.offsetWidth - body.offsetLeft), 0);
  const csy = Math.max(...children.map((c) => c.offsetTop + c.offsetHeight - body.offsetTop), 0);
  const sx = body.offsetWidth / csx;
  const sy = body.offsetHeight / csy;
  const scale = Math.min(sx, sy);
  if (scale >= 1 && currentZoom >= 1) return;
  const newZoom = currentZoom * scale;
  body.style.zoom = String(newZoom);
  adjustZoom(body, children, iteration + 1, newZoom);
}

function fitSlide(slide: HTMLElement) {
  for (const body of slide.querySelectorAll<HTMLElement>(':scope > .body')) {
    const children = Array.from(body.children) as HTMLElement[];
    if (children.length === 0) continue;
    body.style.zoom = '';
    adjustZoom(body, children, 0, 1);
  }
}
```

### 脚注 tooltip

脚注参照（`<sup data-fn>`）のホバーで、事前生成済みの `<aside class="fn-tooltip" hidden>` を表示する。

- `mouseenter` / `mouseleave` で `hidden` 属性をトグル
- 参照要素の直後にある `aside.fn-tooltip` を対象とする

### コードブロック コピー

`button.copy` のクリックで、同じ `figure.code-block` 内の `<code>` テキストをクリップボードにコピーする。

- `navigator.clipboard.writeText()` を使用
- コピー成功時にボタンテキストを一時的に変更（例: "copied"）

## PDF / WebP 出力

詳細は **[`docs/spec/export.md`](./export.md)** に分離。コマンド (`capture`, `pdf`)、画像形式の選定、Chromium PDF と mutool の関係、CI 設定までまとめてある。

## ディレクトリ構成

```
benben/                   # デッキ用 Markdown（サブディレクトリ可）
  deck-a.md
  2024/
    deck-b.md
public/                   # 静的アセット
  henoheno.svg
src/
  plugin/                 # Vite plugin
    index.ts              # plugin エントリ
    pipeline.ts           # unified パイプライン構築
  micromark/              # 自前 micromark extensions
    template.ts           # 🌊 テンプレート
    nwyt-prop.ts          # !key~value (flow)
    nwyt-content.ts       # !key[value] (text)
    admonition.ts         # ::: 装飾ブロック
  remark/                 # remark plugins
    nun-syntax.ts         # micromark extensions 登録
    nun-meta.ts           # ~~~meta 抽出
    nun-extract.ts        # template/nwyt prop → vfile.data
  rehype/                 # rehype plugins
    nun-code-pre.ts       # diff_* → ベース言語書き換え（shiki 前）
    nun-code-block.ts     # embed SSR, diff スタイル, header（shiki 後）
    nun-card.ts           # !card OGP fetch
    nun-fn-ref.ts         # !fn[id] → sup placeholder
    nun-structure.ts      # Scope → テンプレート → fn解決 → shell
  styles/                 # CSS
    index.css             # エントリ（全 import）
    base.css              # リセット, スライド枠, CSS変数
    theme.css             # 配色プリセット (.dark 等)
    footer.css            # フッター
    admonition.css        # 装飾ブロック
    code-block.css        # コードブロック + ヘッダー
    templates/            # テンプレート別スタイル
      default.css
      title.css
      me.css
      message.css
      solo.css
  client/                 # ブラウザ JS（vanilla TS）
    index.ts              # エントリ
    navigation.ts         # ナビゲーション
    zoom-fit.ts           # 自動フィット
    tooltip.ts            # 脚注 tooltip 表示
    copy.ts               # コードブロック コピー
dist/                     # ビルド出力
  index.html              # インデックスページ
  <deck>/                 # benben/ のディレクトリ構造を維持
    index.html            # スライド HTML
    thumb.webp            # サムネイル（OGP 用）
    slide.pdf             # PDF
```

## CSS 構成

CSS / JS は全デッキ共通で1つ。UnoCSS で処理し、`@apply` によるユーティリティ取り込みを活用。UnoCSS のスキャン対象は全デッキの生成 HTML。

テンプレートが増えてサイズが気になった場合、base + 使用テンプレート CSS のみに絞る分割が可能（パイプラインが vfile.data.templates から使用一覧を取れるため）。現時点では不要。

### エントリ（`src/styles/index.css`）

```css
@import './base.css';
@import './theme.css';
@import './footer.css';
@import './admonition.css';
@import './code-block.css';
@import './templates/default.css';
@import './templates/title.css';
@import './templates/me.css';
@import './templates/message.css';
@import './templates/solo.css';
```

### テーマ（`src/styles/base.css`）

CSS 変数をルートに定義。配色プリセットはクラスで上書き。

```css
:root {
  --base: #ffffff;
  --main: #1a1a1a;
  --sub: #6b7280;
  --strong: #111827;
  --brand: #3b82f6;
}
```

### 配色プリセット（`src/styles/theme.css`）

```css
.dark {
  --base: #1a1a1a;
  --main: #f3f4f6;
  --sub: #9ca3af;
  --strong: #ffffff;
  --brand: #60a5fa;
}
```

テンプレート CSS は `.default`, `.title`, `.me` 等のクラスセレクタでスコープする。`🌊default.dark` と指定すれば `.default.dark` が適用される。

## Vite plugin

### 概要

`benben/**/*.md` を検出し、unified パイプラインで HTML に変換してサーブ/出力する。

### 開発サーバー（`configureServer`）

```ts
configureServer(server) {
  // benben/**/*.md を監視対象に追加
  server.watcher.add('benben')

  server.middlewares.use(async (req, res, next) => {
    const url = req.url ?? ''

    // /index → インデックスページ
    if (url === '/' || url === '/index.html') {
      const html = await buildIndex(deckList)
      res.end(html)
      return
    }

    // /<deck-name> → スライドページ
    const deckName = url.replace(/^\//, '').replace(/\/?(index\.html)?$/, '')
    const mdPath = resolve('benben', `${deckName}.md`)
    if (existsSync(mdPath)) {
      const md = await readFile(mdPath, 'utf-8')
      const raw = await pipeline.process(md, {
        cssPath: '/src/styles/index.css',
        jsPath: '/src/client/index.ts',
      })
      // Vite の HTML 変換を通す（CSS/JS 解決、HMR クライアント注入）
      const html = await server.transformIndexHtml(url, String(raw))
      res.end(html)
      return
    }

    next()
  })
}
```

### HMR（`hotUpdate`）

`.md` ファイル変更時にフルリロードをトリガー。スライドは完全な HTML なので partial HMR は不要。

```ts
hotUpdate({ file, server }) {
  if (file.endsWith('.md') && file.includes('benben')) {
    server.ws.send({ type: 'full-reload' })
    return []  // Vite のデフォルト HMR を抑制
  }
}
```

CSS / クライアント JS の変更は Vite 標準の HMR が処理する。

### ビルド（`config` + `resolveId` + `load`）

Vite の HTML エントリとして登録し、CSS/JS のバンドル・ハッシュ・パス解決を Vite に任せる。

```ts
/** 'benben/2024/deck.md' → '2024/deck' */
const deckName = (mdPath: string) => mdPath.replace(/^benben\//, '').replace(/\.md$/, '')

config() {
  const decks = globSync('benben/**/*.md').map(deckName)
  return {
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          ...Object.fromEntries(decks.map(d => [d, `${d}/index.html`]))
        }
      }
    }
  }
},

resolveId(id) {
  if (id === 'index.html' || id.endsWith('/index.html')) return id
},

async load(id) {
  if (id === 'index.html') return await buildIndex(globSync('benben/**/*.md'))
  const match = id.match(/^(.+)\/index\.html$/)
  if (match) {
    const md = await readFile(`benben/${match[1]}.md`, 'utf-8')
    return String(await pipeline.process(md, {
      cssPath: '/src/styles/index.css',
      jsPath: '/src/client/index.ts',
    }))
  }
},
```

dev / build ともにソースパス（`/src/styles/index.css` 等）を指定し、Vite が解決する。

### インデックスページ

`benben/**/*.md` の `~~~meta` から `title` / `date` を収集し、日付降順でソート。hastscript `h()` で一覧 HTML を生成。サムネイルは `<deck>/thumb.webp` を参照。
