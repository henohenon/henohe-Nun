import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

// marp -I は md → html の変換のみで画像をコピーしないため、ビルド後に静的ファイルを dist/ へ揃える
cpSync("benben/images", "dist/images", { recursive: true });
cpSync("public", "dist", { recursive: true });

// ブラウザで実行する: スライドの枠 (Marp の viewBox と section) を画面と同じ縦横比にする。
// 枠の面積は 1280×720 に揃えて文字を画面の広さに比例させ、短い辺だけは 720 を下回らせない (横長・スマホで下が溢れるため)
function fitSlidesToScreen(): void {
  const apply = (): void => {
    let s = Math.sqrt((innerWidth * innerHeight) / (1280 * 720));
    s = Math.min(s, Math.min(innerWidth, innerHeight) / 720);
    const w = innerWidth / s;
    const h = innerHeight / s;
    for (const svg of document.querySelectorAll<SVGSVGElement>("svg[data-marpit-svg]")) {
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      for (const fo of svg.querySelectorAll(":scope > foreignObject")) {
        fo.setAttribute("width", String(w));
        fo.setAttribute("height", String(h));
      }
      for (const sec of svg.querySelectorAll<HTMLElement>(":scope > foreignObject > section")) {
        sec.style.width = `${w}px`;
        sec.style.height = `${h}px`;
      }
    }
  };
  addEventListener("resize", apply);
  apply();
}

for (const file of readdirSync("benben")) {
  if (!file.endsWith(".md")) continue;
  const deck = file.slice(0, -".md".length);
  // Node の型除去は型注釈を空白に置き換えるだけなので、関数のソースはそのまま JS として使える
  const html = readFileSync(`dist/${deck}.html`, "utf8");
  const script = `<script>(${fitSlidesToScreen.toString()})()</script>`;
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
