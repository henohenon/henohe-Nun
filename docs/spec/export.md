# 出力 (Export) — WebP / PDF

スライド HTML をビルド済み (`dist/`) の状態から、**Playwright (Chromium)** で開いてキャプチャする工程の仕様と運用ガイド。

技術仕様 `docs/spec/technical.md` の §「PDF / WebP 出力」を本書に移管・拡張する。technical.md 側はリンクのみ残す。

---

## コマンド

| コマンド | 役割 | 出力 |
|---|---|---|
| `bun run build` | HTML ビルド (Vite) | `dist/<deck>/index.html` ほか |
| `bun run capture` | 全デッキ → 全スライド → webp | `dist/captures/<deck>/<n>.webp` |
| `bun run capture --thumb` | 各デッキ slide#1 → サムネ webp (OGP 用) | `dist/<deck>/thumb.webp` |
| `bun run pdf` | 各デッキ → PDF (`page.pdf` + `mutool clean`) | `dist/<deck>/slide.pdf` |

`build` だけは Vite の慣例に従い無接頭辞。`capture` / `pdf` は build とは独立した出力工程として並列に置く。

### 共通フラグ

`capture` / `pdf` 両方:

| フラグ | 既定値 | 用途 |
|---|---|---|
| `--deck <name>` | 全デッキ | 特定デッキだけ処理 |
| `--width <px>` | `1920` | ビューポート横幅 |
| `--height <px>` | `1080` | ビューポート縦幅 |

`capture` 専用:

| フラグ | 既定値 | 用途 |
|---|---|---|
| `--slide <n>` | 全スライド | 1 枚だけキャプチャ |
| `--thumb` | off | OGP サムネモード (slide#1 → `dist/<deck>/thumb.webp`) |
| `--quality <n>` | `85` | webp 品質 (0-100) |

### 内部フロー

1. `dist/` が無ければ `bun run build` を内部実行
2. `vite preview --port 5176` で配信開始 (URL: `http://localhost:5176/henohe-Nun/...`)
3. Chromium 起動 (1 インスタンス使い回し)
4. デッキごとに新規ページ → `${baseUrl}/${deck}/` へ navigate
5. `document.fonts.ready` + `networkidle` 待ち
6. スライド単位で `location.hash = '#N'` → `section.active` の id 確認 → 150ms wait → screenshot / pdf
7. browser + preview を片付け

`base: '/henohe-Nun/'` (ビルド時設定) と整合させるため `file://` 直開きではなく vite preview 経由で配信する。`file://` だと `<script src="/henohe-Nun/...">` が解決できない。

---

## 画像形式

### WebP 固定 (2026 時点)

| 候補 | 採否 | 理由 |
|---|---|---|
| **WebP** | ✅ default | 全ブラウザ標準対応、サイズ/品質/互換のバランス◎ |
| AVIF | △ 将来 | webp より 20-30% 小さいが**エンコードが 5-10 倍遅い**。CI コスト見合わず |
| PNG | ✕ | テキスト主体スライドだと webp lossy q85 でも視覚差なし。サイズだけ膨らむ |
| JPEG | ✕ | 文字エッジが滲む。透過なし |
| JPEG XL | ✕ | Chrome が 2022 に却下、エコシステムが死んだ |

`--format png` 等の切替フラグは置かない (将来 avif 統一の検討余地は残す)。

### Playwright のスクショは PNG 限定

`page.screenshot({ type: 'png' })` で取得 → `sharp` で webp 変換、という 2 段階。Playwright は webp 直接出力に非対応。

サムネ品質は `quality: 85` (capture default)、サムネモードでは `75` 程度に落とす方針 (OGP は小さく軽くが正義)。

---

## PDF 生成

### Chromium の落とし穴

`page.pdf()` は Chromium の印刷エンジンで PDF 化するが、**画像を非圧縮で埋め込む**仕様。スライドに画像が 1 枚でも入ると PDF サイズが急激に膨らむ (例: 1MB の PNG が PDF 上で 1MB のまま)。

テキスト主体スライドではフォント埋め込みが大半を占め、Chromium 出力でも実用範囲のサイズに収まる (実測: サンプル 13 枚で約 420 KB)。

### 圧縮の段階

`pdf` スクリプトはランタイム環境に応じて以下を選ぶ:

| 条件 | 使用ツール | 期待値 | 備考 |
|---|---|---|---|
| `mutool` が PATH にある | `mutool clean -gggg` | **50-70% off** | 画像/フォント再エンコード込みの本命 |
| 無い | `pdf-lib` (純 JS) | ~10% off | object stream + dedupe のみ |
| `--no-compress` 指定 | (圧縮なし) | 0% | 検証用 |

mutool は OS 依存だが必須ではなく、無くてもスクリプトは動く。CI には install ステップを入れて常に最大圧縮を効かせる。

`mutool clean` の段階意味:

- `-g` 単発: garbage collect 未参照オブジェクト
- `-gg`: 加えて重複オブジェクトを統合
- `-ggg`: 加えてオブジェクト圧縮 (object stream)
- `-gggg`: 加えて画像/フォントの再エンコード

### 全スライド 1 PDF 化の方法

`page.pdf()` は表示中の DOM を縦に流し込んで分割する。スライド表示は `.active` クラスで 1 枚ずつ切替なので、PDF 化前に **全 section を強制表示** + **page-break-after** を CSS で注入する。

```css
@page { size: 1920px 1080px; margin: 0; }
section { display: flex !important; opacity: 1 !important; page-break-after: always; }
section:last-child { page-break-after: auto; }
```

`zoom-fit` (オーバーフロー縮小) は印刷モードで全 section を回す実装になっているため、PDF 化時もそのまま動く想定。

---

## 出力ディレクトリ構成

```
dist/
  index.html                # インデックスページ
  <deck>/
    index.html              # スライド本体
    thumb.webp              # OGP 用 (capture --thumb で生成)
    slide.pdf               # PDF (pdf で生成)
  captures/
    <deck>/
      1.webp                # capture (全スライド) で生成
      2.webp
      ...
```

`dist/` 全体が `.gitignore` 済み。Pages デプロイは `dist/` をそのまま push artifact にするので、CI で `capture --thumb` と `pdf` を build の後に走らせれば公開物に thumb / PDF も含められる。

`captures/<deck>/*.webp` は OGP やデプロイには使わない、Discord 共有や README 用の派生成果物という位置付け。

---

## 依存と CI

### ローカル

```bash
bun add -d playwright sharp
bunx playwright install chromium    # 初回のみ Chromium バイナリ取得
```

mutool は **OS パッケージ**:

| OS | 入手 |
|---|---|
| Ubuntu/Debian | `sudo apt-get install mupdf-tools` |
| macOS | `brew install mupdf-tools` |
| Windows | https://mupdf.com/releases/ から `mupdf-x.y.z-windows.zip` を取得し PATH に通す |

### GitHub Actions

`build:pdf` を CI に組み込む場合は workflow に以下を追加:

```yaml
- name: Install MuPDF tools
  run: sudo apt-get update && sudo apt-get install -y mupdf-tools

- name: Install Playwright Chromium
  run: bunx playwright install --with-deps chromium

- name: Capture thumbs
  run: bun run capture --thumb

- name: Generate PDFs
  run: bun run pdf
```

`--with-deps` で Chromium 実行に必要な glibc 系 lib も自動 install される。

---

## 設計判断ログ

### なぜ全スライドキャプチャをデフォルトにしたか

spec 当初は「OGP 用 thumb.webp 1 枚 + slide.pdf 1 本」だけだった。これを拡張した理由:

1. Discord/Slack 共有時に「N 枚目だけ画像で見せたい」需要が頻出
2. README/ブログ用に全スライドサムネ一覧を貼りたい
3. 内部実装は thumb 専用化と全スライド対応で大差ない (同じ Playwright インスタンスを使い回す)

OGP モードは `--thumb` で明示的に呼び出す形に分離し、commit したときの自動再生成負担は変わらないようにした。

### なぜ `format` 切替を置かないか

webp 単一で実用十分。PNG が必要になるケース (印刷物の入稿等) は別途 sharp スクリプトで対処すれば良く、CLI を膨らませる動機が弱い。avif 統一は将来検討するが、その時は default を webp → avif にスイッチする (`--format` ではなく)。

### なぜ `vite preview` 経由か

`base: '/henohe-Nun/'` をビルドに焼き込んでいるため、生成 HTML 内の `<script src="/henohe-Nun/...">` 等の絶対パスが `file://` で解決できない。Playwright route インターセプトで書き換える手もあるが、ロジックを増やすより preview 起動の方が単純で確実。
