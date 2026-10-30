/* oslal — assets/main.js */

/* Grid config — keep in sync with .page-grid + :root in assets/style.css */
const GRID = { cols: 10, rows: 6, gutter: 16, margin: 24 };

/* ---------- Persistent state (carries across pages) ---------- */
const store = {
  guidesOn:  () => localStorage.getItem('oslal-guides') === 'on',
  setGuides: (on) => localStorage.setItem('oslal-guides', on ? 'on' : 'off')
};

/* ---------- Row height: square-ish cells, exactly fills landing ---------- */
/* rowH = (100vh - 2*margin - (rows-1)*gutter) / rows. Mirrors --row-h in CSS. */
function setRowHeightVar() {
  const H = window.innerHeight;
  const rowH = (H - 2 * GRID.margin - (GRID.rows - 1) * GRID.gutter) / GRID.rows;
  document.documentElement.style.setProperty('--row-h', rowH + 'px');
  return rowH;
}

/* ---------- Grid overlay (full document height) ---------- */
function drawGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;

  /* Height = the page-grid's full height (grows with content on scroll pages). */
  const grid = document.querySelector('.page-grid');
  const H = grid ? Math.max(grid.offsetHeight, window.innerHeight) : window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 0.75;
  ctx.globalAlpha = 0.85;

  const m = GRID.margin, g = GRID.gutter;
  const colW = (W - 2 * m - (GRID.cols - 1) * g) / GRID.cols;
  const rowH = (window.innerHeight - 2 * m - (GRID.rows - 1) * g) / GRID.rows;

  const seg = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  /* Vertical column edges — full document height */
  for (let i = 0; i < GRID.cols; i++) {
    const x1 = m + i * (colW + g);
    const x2 = x1 + colW;
    seg(x1, m, x1, H - m);
    seg(x2, m, x2, H - m);
  }

  /* Horizontal row edges — repeat down the full document height */
  const step = rowH + g;
  let r = 0;
  while (true) {
    const top = m + r * step;
    if (top > H - m + 1) break;
    const bottom = Math.min(top + rowH, H - m);
    seg(m, top, W - m, top);
    if (bottom > top) seg(m, bottom, W - m, bottom);
    r++;
  }
}

function applyGuides() {
  const canvas = document.getElementById('grid-canvas');
  if (canvas) canvas.classList.toggle('visible', store.guidesOn());
}
function toggleGuides() {
  store.setGuides(!store.guidesOn());
  applyGuides();
}

/* ---------- Navigation: active circle + click-on-current toggles guides ---------- */
function initNav() {
  const page = document.body.getAttribute('data-page');
  document.querySelectorAll('[data-nav]').forEach(el => {
    if (el.getAttribute('data-nav') === page) {
      el.classList.add('active');
      el.addEventListener('click', e => { e.preventDefault(); toggleGuides(); });
    }
  });
}

/* ---------- Archives: hover preview ---------- */
/* Each row carries data-preview="/archives/<slug>/<slug>_img-00.webp" (set in archives/archives.html). */
function initPreview() {
  const list = document.getElementById('project-list');
  const preview = document.getElementById('list-preview');
  if (!list || !preview) return;

  const img = preview.querySelector('img');
  const hide = () => preview.classList.remove('visible');

  list.querySelectorAll('.project-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const src = row.getAttribute('data-preview');
      if (!src) return hide();
      img.src = src;
      preview.classList.add('visible');
    });
  });
  list.addEventListener('mouseleave', hide);
}

/* ---------- Project pages: lazy-load gallery images ---------- */
function initImages() {
  document.querySelectorAll('.project-gallery img').forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
}

/* ---------- Footer © toggle (expand / collapse) ---------- */
function initFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;
  footer.addEventListener('click', (e) => {
    e.stopPropagation();
    footer.classList.toggle('open');
  });
  document.addEventListener('click', () => footer.classList.remove('open'));
}

/* ---------- Reveal on scroll (archive rows) ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in-view'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  els.forEach(el => io.observe(el));
}

/* ---------- Keep canvas in sync with content height ---------- */
function watchHeight() {
  const grid = document.querySelector('.page-grid');
  if (!grid || !('ResizeObserver' in window)) return;
  let raf = null;
  const ro = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(drawGrid);
  });
  ro.observe(grid);
}

/* ---------- Init ---------- */
window.addEventListener('DOMContentLoaded', () => {
  setRowHeightVar();
  initNav();
  initFooter();
  applyGuides();
  initPreview();
  initImages();
  drawGrid();
  initReveal();
  watchHeight();
  requestAnimationFrame(drawGrid);
});
window.addEventListener('load', drawGrid);
window.addEventListener('resize', () => { setRowHeightVar(); drawGrid(); });
