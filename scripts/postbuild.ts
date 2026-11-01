import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { deckRuntime } from "./deck-runtime.ts";

// marp -I は md → html の変換のみで画像をコピーしないため、ビルド後に静的ファイルを dist/ へ揃える
cpSync("benben/images", "dist/images", { recursive: true });
cpSync("public", "dist", { recursive: true });

for (const file of readdirSync("benben")) {
  if (!file.endsWith(".md")) continue;
  const deck = file.slice(0, -".md".length);
  // Node の型除去は型注釈を空白に置き換えるだけなので、関数のソースはそのまま JS として使える
  const html = readFileSync(`dist/${deck}.html`, "utf8");
  const script = `<script>(${deckRuntime.toString()})()</script>`;
  writeFileSync(
    `dist/${deck}.html`,
    html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${script}</body>`),
  );

  // 旧構成の URL (/<deck>/) を新しい /<deck>.html へ転送する。#N のスライド位置は引き継ぐ
  const target = `../${deck}.html`;
  mkdirSync(`dist/${deck}`, { recursive: true });
  writeFileSync(
    `dist/${deck}/index.html`,
    `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${deck}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.hash)</script>
</head>
</html>
`,
  );
}
