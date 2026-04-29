const slides = Array.from(document.querySelectorAll<HTMLElement>('.slide'));
const total = slides.length;

function currentIndex(): number {
  const hash = location.hash.replace('#', '');
  const n = Number.parseInt(hash, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(total - 1, n));
}

function adjustZoom(body: HTMLElement, children: HTMLElement[], iteration: number, currentZoom: number): void {
  if (iteration >= 10) return;
  const csx = Math.max(...children.map((c) => c.offsetLeft + c.offsetWidth - body.offsetLeft), 0);
  const csy = Math.max(...children.map((c) => c.offsetTop + c.offsetHeight - body.offsetTop), 0);
  const sx = body.offsetWidth / csx;
  const sy = body.offsetHeight / csy;
  const scale = Math.min(sx, sy);
  console.log(iteration, csx, csy, sx, sy, scale, currentZoom);
  if (scale >= 1 && currentZoom >= 1) return;
  const newZoom = currentZoom * scale;
  body.style.zoom = String(newZoom);
  adjustZoom(body, children, iteration + 1, newZoom);
}

function fitSlide(slide: HTMLElement) {
  for (const body of slide.querySelectorAll<HTMLElement>('.slide-content > .body')) {
    const children = Array.from(body.children) as HTMLElement[];
    if (children.length === 0) continue;
    body.style.zoom = '';
    adjustZoom(body, children, 0, 1);
  }
}

function show(i: number) {
  const apply = () => {
    slides.forEach((s, idx) => {
      s.style.display = idx === i ? 'block' : 'none';
    });
    fitSlide(slides[i]);
  };
  if (document.startViewTransition) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

function go(delta: number) {
  const next = Math.max(0, Math.min(total - 1, currentIndex() + delta));
  location.hash = String(next);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

window.addEventListener('hashchange', () => show(currentIndex()));

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (
    e.key === 'ArrowRight' ||
    e.key === 'ArrowDown' ||
    e.key === ' ' ||
    e.key === 'PageDown' ||
    k === 'd' ||
    k === 's'
  ) {
    e.preventDefault();
    go(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || k === 'a' || k === 'w') {
    e.preventDefault();
    go(-1);
  } else if (e.key === 'Home') {
    location.hash = '0';
  } else if (e.key === 'End') {
    location.hash = String(total - 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    toggleFullscreen();
  }
});

window.addEventListener('click', (e) => {
  if (!document.fullscreenElement) return;
  if ((e.target as HTMLElement).closest('a')) return;
  const x = e.clientX;
  if (x < window.innerWidth / 2) go(-1);
  else go(1);
});

let wheelLock = 0;
window.addEventListener(
  'wheel',
  (e) => {
    const d = e.deltaY || e.deltaX;
    if (Math.abs(d) < 10) return;
    const now = Date.now();
    if (now < wheelLock) return;
    wheelLock = now + 400;
    go(d > 0 ? 1 : -1);
  },
  { passive: true },
);

let touchStartX = 0;
let touchStartY = 0;
window.addEventListener(
  'touchstart',
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);
window.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
  go(dx < 0 ? 1 : -1);
});

let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    fitSlide(slides[currentIndex()]);
  }, 150);
});

window.addEventListener('beforeprint', () => {
  for (const s of slides) s.style.display = 'block';
  for (const s of slides) fitSlide(s);
});
window.addEventListener('afterprint', () => show(currentIndex()));

show(currentIndex());
