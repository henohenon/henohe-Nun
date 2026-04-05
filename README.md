# へのへ Nun

Nun > エジプト神話の原初の水の神。
らしい。

# 機能要件
## md2slide
- markdownによる入力をHTML(1ファイル完結)で出力する。
- ナビゲーションは `←`/`→` キー、Space(次へ)、画面左右クリックで前後移動。
- PDF出力は将来対応 (HTMLを playwright で page.pdf に流す想定)。
## hotreload
- mdを編集・保存すると自動でリロードされるdevモード。
- `bun run dev slides.md` で起動 (Astro dev server + HMR に相乗り)。

## スライド仕様
- キャンバス: **1920x1080 (16:9)** 固定。フォントサイズ等はこの解像度を基準にする。
- スライド区切り: `#` (H1) ごとに新しいスライド。空の `#` だけの見出しも区切りとして有効 (本文なしスライド)。
- H1 の直後 (同じスライド内) は、テンプレが参照する「タイトル」として扱われる。
- H1 以降の本文はテンプレ側で解釈され、以下の markdown 記法はレンダリングされる:
    - リスト (`- item`)、番号付きリスト
    - 強調 (`**bold**`, `*italic*`)
    - インラインコード (`` `code` ``)、コードブロック
    - リンク (`[text](url)`)
- 独自タグ (`<>xxx`, `<fr>`, `<txt>` など) は **行頭** に書く。タグ行は markdown としては解釈されない。
- `<>テンプレ名` はスライド内のどこに書いてもよい (1スライドに1つ、省略時は `default`)。
## template, tag, styles
### 記法ルール
- `<>name` — そのスライドに適用するテンプレート指定 (1スライドに1つ)。
- `<name>value` — 単一値タグ (行末まで value)。例: `<fr>フッター右`
- `<name attr=... attr=...>children</name>` — 属性つきブロックタグ。`<row>`, `<col>`, `<txt>`, `<img>` など。閉じタグ必須。
- 属性値はスペースを含まなければクォート不要 (`<txt size=200>`)、含む場合は `"..."` で囲む。
- タグ名・属性名は小文字。

### template
各テンプレは H1 と本文 (H1 以降の非タグ行) を受け取り、固有のレイアウトに流し込む。
「本文」= 独自タグ行を除いた markdown 本体。

- `<>title`
    - タイトルスライド用。
    - マッピング: H1 = タイトル、本文1行目 = サブタイトル。
    - レイアウト: bg → title → subtitle → へのへの (`/images/henoheno.svg`) → footer の縦積み。
- `<>me`
    - 自己紹介用。
    - マッピング: H1 = ラベル、`<icon>` = アイコン画像、本文 = 内容 (複数行)。
    - デフォルトで背景がちょっと横になってる。
- `<>default`
    - 汎用。`<>` 省略時はこれ。
    - マッピング: H1 = タイトル、本文 = 内容 (markdown解釈されてタイトル直下に配置)。
- `<>big`
    - マッピング: H1 = 中央にでかく表示するテキスト。本文は無視。
- `<>thx`
    - 固定で中央に小さく "Thank you for listening" を表示。H1・本文は無視。
- `<>note`
    - マッピング: H1 = タイトル、本文 = 下中央に大きめで配置。`<txt size=...>` で個別サイズ上書き可。

### tag
- <>{テンプレ名。デフォルト省略}
- <fr>{フッター右テキスト}
- <fl>{フッター左テキスト}
    - `<fr>`/`<fl>` は**最初のスライドより前**(ファイル冒頭) に書いた場合は**全スライドのデフォルト**。
    - スライド内に書いた場合は**そのスライドだけ上書き** (次のスライドは元のデフォルトに戻る)。
- <icon>{アイコンのパス。me限定}
- <bg>{背景のパス。全テンプレで使用可、スライド単位で指定}
- <row>, <col>。レイアウト用
- <txt ...>{テキスト}</txt> — 明示的なテキスト要素。スタイル属性付与用 (`<txt b size=128>...</txt>`)。
- <img ...>{画像パス}</img> — 画像要素。中身にパスを書く (`<img w=400>./images/foo.png</img>`)。

### style
スタイル属性は任意タグに付与可能。数値単位は基本 **px** (1920x1080 基準)。
- `w`, `h`, `l`, `t` — 幅/高さ/left/top。`w`,`h` はデフォルト auto。`l`,`t` を指定した要素は親に対する絶対配置。
- `m`, `mt`, `mb`, `ml`, `mr` — margin (全方向/個別)。
- `p`, `pt`, `pb`, `pl`, `pr` — padding (全方向/個別)。
- `size` — フォントサイズ (px)。
- `color` — 文字色 (CSS color)。
- `b`, `i` — 太字 / 斜体 (bool、値なしでtrue)。

## アセット
- `<icon>`, `<bg>`, `<img>` のパスは **md ファイルからの相対パス** で解決する。
- ビルド時、参照されたアセットは出力物の隣にコピー (または dataURI 埋め込み)。
- 「でかいへのへの」(title/me の自動背景) は固定で `/images/henoheno.svg` を使用。リポジトリに同梱。

## エラーハンドリング
- 未定義のテンプレート名 → `default` にフォールバック + 警告ログ。
- 未定義のタグ/属性 → 無視 + 警告ログ。
- 存在しないアセットパス → 警告ログ + プレースホルダ表示。
- ビルドは警告があっても失敗させない (dev体験優先)。

# サンプル
完成形イメージ: [./template.pdf](./template.pdf)

以下の md が上記PDFの元ネタ。

```md
<fr>すらいどてんぷれーと
<fl>へのへのん

# Template
<>title
へのへのん
<fl>2025/02/07

# 自己紹介
へのへのん-北村 尊瑠
フリーランス(もどき)
ゲーム主軸に色々つくる人
ミクとヌオーが好き
<>me
<icon>./images/icon.png
<bg>./images/tgs.png

# お品書き
- 色々紹介
- 企画説明
- タスク割

# チワワズ
<>note
<txt size=200>🌍♾️⚡</txt>
私主体でやるときのグループ名

# ん！？
<bg>./images/circle.png

# 概要
<row>
    <col>
        <col>
            <txt b>made by</txt>
            <img>./images/tukurttyan.png</img>
        </col>
        <col>
            <txt b>made with</txt>
            <img>./images/siv3d.png</img>
        </col>
    </col>
    <txt b size=128>▶</txt>
    <col>
        <txt b>be adopted</txt>
        <img>./images/igi.png</img>
    </col>
  </row>

# 質問とか
<>big
#
<>thx
```

# 技術スタック
- TypeScript
- Bun (パッケージマネージャ / ランタイム)
- Astro (dev server, HMR, ビルド、テンプレを `.astro` コンポーネントとして実装)
- UnoCSS (スタイル短縮記号 `w/h/m/p/size/...` を Uno のショートカットにマップ)
- remark / unified (md パース + 独自タグを扱うプラグイン)
- (将来) Playwright — PDF 出力用

# CLI
- `bun run dev <slides.md>` — 開発サーバ起動。md を watch してHMR。
- `bun run build <slides.md>` — `dist/` に HTML + アセットを出力。
- `bun run preview` — ビルド結果をローカル配信。
