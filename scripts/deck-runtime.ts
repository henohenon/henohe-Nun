// ブラウザで実行する。postbuild.ts が関数のソースを丸ごと <script> にしてデッキの HTML (marp --template bare) へ差し込むので、
// 外の変数や import は参照せず、この関数の中だけで完結させる
export function deckRuntime(): void {
  const svgs = [...document.querySelectorAll<SVGSVGElement>("svg[data-marpit-svg]")];

  // cursor-jack は section の外にあり、テーマの --brand が届かないので色を直接書く
  const style = document.createElement("style");
  style.textContent = `
    html, body { overflow: hidden; }
    svg[data-marpit-svg] { height: 100dvh; }
    .cursor-jack {
      position: fixed;
      pointer-events: none;
      width: clamp(64px, 8vmin, 192px);
      height: clamp(64px, 8vmin, 192px);
      border-radius: 50%;
      background: color-mix(in srgb, #5932ff 45%, transparent);
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: none;
    }
    :fullscreen { cursor: none; }
    :fullscreen .cursor-jack { display: block; }
  `;
  document.head.append(style);

  // ---- 画面に合わせる ----
  // スライドの枠 (viewBox / foreignObject / section) を画面と同じ縦横比にする。
  // 枠の面積は 1280×720 に揃えて文字を画面の広さに比例させ、短い辺だけは 720 を下回らせない (横長・スマホで下が溢れるため)
  const fit = (): void => {
    // 非表示のタブなどで画面の大きさが 0 のときは、viewBox が NaN になるので何もしない
    if (!innerWidth || !innerHeight) return;
    let s = Math.sqrt((innerWidth * innerHeight) / (1280 * 720));
    s = Math.min(s, Math.min(innerWidth, innerHeight) / 720);
    const w = innerWidth / s;
    const h = innerHeight / s;
    for (const svg of svgs) {
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
  addEventListener("resize", fit);
  fit();

  // ---- ページ送り (旧 Nun の navigation.ts) ----
  // #N でページを管理し、該当のスライド以外は display: none
  const current = (): number => {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isNaN(n) ? 1 : Math.min(Math.max(n, 1), svgs.length);
  };
  const show = (): void => {
    const page = current();
    const go = (): void => {
      svgs.forEach((svg, i) => {
        svg.style.display = i + 1 === page ? "" : "none";
      });
    };
    if (document.startViewTransition) document.startViewTransition(go);
    else go();
  };
  const goTo = (page: number): void => {
    if (page >= 1 && page <= svgs.length) location.hash = `#${page}`;
  };
  const step = (delta: number): void => goTo(current() + delta);
  addEventListener("hashchange", show);
  show();

  // ---- cursor-jack ----
  // フルスクリーン中だけ、カーソルを半透明の円にして投影画面で指している場所を見せる
  const cursor = document.createElement("div");
  cursor.className = "cursor-jack";
  document.body.append(cursor);

  // <object> の SVG の中で起きた入力はページまで伝わらないので、SVG の文書にも同じ操作を付ける。
  // toPage は、その文書の座標をページの座標に直す
  const FORWARD_KEYS = new Set(["ArrowRight", "ArrowDown", " ", "d", "s"]);
  const BACKWARD_KEYS = new Set(["ArrowLeft", "ArrowUp", "a", "w"]);
  let touchX = 0;
  let touchY = 0;
  let wheelLocked = false;
  const listen = (doc: Document, toPage: (x: number, y: number) => [number, number]): void => {
    doc.addEventListener("keydown", (e) => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        if (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable
        ) {
          return;
        }
      }
      if (FORWARD_KEYS.has(e.key)) step(1);
      else if (BACKWARD_KEYS.has(e.key)) step(-1);
      else if (e.key === "Home") goTo(1);
      else if (e.key === "End") goTo(svgs.length);
      else if (e.key === "Enter") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      } else return;
      e.preventDefault();
    });

    // 横に 50px 以上のスワイプで前後へ
    doc.addEventListener(
      "touchstart",
      (e) => {
        [touchX, touchY] = toPage(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true },
    );
    doc.addEventListener(
      "touchend",
      (e) => {
        const [x, y] = toPage(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        const dx = x - touchX;
        const dy = y - touchY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      },
      { passive: true },
    );

    // ホイールは 30px 以上で 1 枚送り、300ms は次を受け付けない
    doc.addEventListener(
      "wheel",
      (e) => {
        if (wheelLocked || Math.abs(e.deltaY) <= 30) return;
        step(e.deltaY > 0 ? 1 : -1);
        wheelLocked = true;
        setTimeout(() => {
          wheelLocked = false;
        }, 300);
      },
      { passive: true },
    );

    // フルスクリーン中だけ、画面の左半分クリックで前へ・右半分で次へ。リンク等の上では送らない。
    // SVG の文書は別の realm なので instanceof Element では判定できず、closest の有無で見る
    doc.addEventListener("click", (e) => {
      if (!document.fullscreenElement) return;
      const target = e.target as Element | null;
      if (target?.closest?.("a, button, details, input, select, textarea")) return;
      step(toPage(e.clientX, e.clientY)[0] > innerWidth / 2 ? 1 : -1);
    });

    doc.addEventListener("mousemove", (e) => {
      const [x, y] = toPage(e.clientX, e.clientY);
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    });
  };
  listen(document, (x, y) => [x, y]);

  for (const obj of document.querySelectorAll("object")) {
    let attached: Document | null = null;
    const attach = (): void => {
      const doc = obj.contentDocument;
      // file:// などで別オリジン扱いになると中に触れない。読み込み前は about:blank が入っている
      if (!doc || doc === attached || doc.URL === "about:blank") return;
      attached = doc;
      // object の中の 1px は、Marp の拡大縮小ぶん画面上で大きさが変わる
      listen(doc, (x, y) => {
        const r = obj.getBoundingClientRect();
        const k = r.width / obj.clientWidth;
        return [r.left + x * k, r.top + y * k];
      });
      // :fullscreen はページの CSS なので、SVG の中のカーソルは別に消す
      const hideCursor = (): void => {
        doc.documentElement.style.cursor = document.fullscreenElement ? "none" : "";
      };
      document.addEventListener("fullscreenchange", hideCursor);
      hideCursor();
    };
    attach(); // 既に読み込み済みの場合
    obj.addEventListener("load", attach);
  }

  // ---- favicon (旧 Nun の favicon-anim.ts) ----
  // postbuild.ts が埋め込んだ wave01.png の link を起点に、wave01〜04 を 500ms ごとに切り替える。
  // href の書き換えだけでは再取得しないブラウザ (Safari 等) があるので、link ごと差し替える。タブが隠れている間は止める
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-anim]');
  if (icon) {
    const frames = [1, 2, 3, 4].map((i) => new URL(`wave0${i}.png`, icon.href).href);
    for (const src of frames) new Image().src = src; // 1 周目から滑らかに切り替わるよう先読み
    let frame = 0;
    let timer: number | undefined;
    const tick = (): void => {
      frame = (frame + 1) % frames.length;
      document.querySelector('link[rel="icon"][data-anim]')?.remove();
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.dataset.anim = "";
      link.href = frames[frame];
      document.head.append(link);
    };
    const start = (): void => {
      timer ??= window.setInterval(tick, 500);
    };
    const stop = (): void => {
      window.clearInterval(timer);
      timer = undefined;
    };
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    if (!document.hidden) start();
  }
}
