// spike: 画面の縦横比に合わせて Marp のスライドキャンバスを組み直す。短辺を 720px に固定
(() => {
  const SHORT = 720;
  const MIN_RATIO = 0.5; // これ以上は縮めない (溢れたら諦める)

  // 本文 (header/footer/絶対配置を除く子) の下端・右端が、padding の内側に収まっているか
  function fits(sec: HTMLElement): boolean {
    const cs = getComputedStyle(sec);
    const bottom = sec.clientHeight - parseFloat(cs.paddingBottom);
    const right = sec.clientWidth - parseFloat(cs.paddingRight);
    for (const c of sec.children) {
      if (!(c instanceof HTMLElement)) continue;
      if (c.tagName === "HEADER" || c.tagName === "FOOTER" || c.tagName === "STYLE") continue;
      if (getComputedStyle(c).position === "absolute") continue;
      if (c.offsetTop + c.offsetHeight > bottom + 0.5) return false;
      // 幅 100% の表などは中身が入りきらないと要素ごと横に広がる
      if (c.offsetLeft + Math.max(c.offsetWidth, c.scrollWidth) > right + 0.5) return false;
    }
    return true;
  }

  // 縮める値は section の font-size 1 つだけ。テーマ・<style scoped> 由来の値を上限に二分探索
  function fit(sec: HTMLElement): void {
    sec.style.fontSize = "";
    if (fits(sec)) return;
    const base = parseFloat(getComputedStyle(sec).fontSize);
    let lo = base * MIN_RATIO;
    let hi = base;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      sec.style.fontSize = `${mid}px`;
      if (fits(sec)) lo = mid;
      else hi = mid;
    }
    sec.style.fontSize = `${lo}px`;
  }

  function apply(): void {
    const a = innerWidth / innerHeight;
    const [w, h] = a >= 1 ? [Math.round(SHORT * a), SHORT] : [SHORT, Math.round(SHORT / a)];
    for (const svg of document.querySelectorAll<SVGSVGElement>("svg[data-marpit-svg]")) {
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      for (const fo of svg.querySelectorAll<SVGForeignObjectElement>(":scope > foreignObject")) {
        fo.setAttribute("width", String(w));
        fo.setAttribute("height", String(h));
      }
      for (const sec of svg.querySelectorAll<HTMLElement>(":scope > foreignObject > section")) {
        sec.style.width = `${w}px`;
        sec.style.height = `${h}px`;
        fit(sec);
      }
    }
  }

  let raf = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  });
  // Web フォント読み込みで行の高さが変わるので、読み込み後にもう一度
  void document.fonts.ready.then(apply);
  apply();
})();
