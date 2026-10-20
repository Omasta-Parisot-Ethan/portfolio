/**
 * EOP. — Carnet de dessin
 * Ouverture en CSS 3D (le carnet quitte l'introduction, se ferme, traverse l'écran, grandit, puis s'ouvre)
 * et vraie surface de dessin (souris, tactile, stylet, clavier) sur canvas 2D.
 *
 * Toute la mise en scène est une fonction pure de la progression P (0 → 1) : ouvrir = faire avancer P,
 * fermer = la faire reculer. Aucune dépendance.
 */
(() => {
  const root = document.getElementById('nb-overlay');
  const openBtn = document.getElementById('nb-open');
  if (!root || !openBtn) return;
  if (!(window.CSS && CSS.supports && CSS.supports('transform-style', 'preserve-3d'))) {
    openBtn.hidden = true;
    return;
  }

  const html = document.documentElement;
  const book = root.querySelector('[data-nb-book]');
  const surface = root.querySelector('[data-nb-surface]');
  const kbdDot = root.querySelector('[data-nb-kbd]');
  const live = root.querySelector('[data-nb-live]');
  const closeBtn = root.querySelector('[data-nb-close]');
  const undoBtn = root.querySelector('[data-nb-undo]');
  const clearBtn = root.querySelector('[data-nb-clear]');
  const canvases = Array.from(root.querySelectorAll('[data-nb-canvas]')).sort(
    (a, b) => Number(a.dataset.nbCanvas) - Number(b.dataset.nbCanvas)
  );
  const ctxs = canvases.map((c) => c.getContext('2d'));
  const intro = document.getElementById('intro-scene');
  const introBox = document.getElementById('intro-canvas-container');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DURATION_OPEN = 3600;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let phase = 'closed'; // closed | opening | ready | closing
  let P = 0;
  let rafId = 0;
  let lastFocus = null;
  let L = null; // mise en page courante
  let start = { x: 0, y: 0, s: 0.4 };
  let strokes = [];
  let history = [];
  let current = null;
  let strokeCount = 0;

  /* ------------------------------------------------------------------ mise en page */
  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const portrait = W / H < 0.9;
    const aspect = 0.76; // largeur / hauteur d'une page
    let ph;
    if (portrait) ph = Math.min(W * 0.92, (H * 0.8) / (2 * aspect));
    else ph = Math.min(H * 0.74, (W * 0.94) / (2 * aspect));
    const pw = ph * aspect;
    L = {
      W,
      H,
      portrait,
      pw,
      ph,
      rzFinal: portrait ? 90 : 0,
      yOff: -H * (portrait ? 0.045 : 0.035),
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    root.classList.toggle('nb--portrait', portrait);
    root.style.setProperty('--pw', `${pw.toFixed(1)}px`);
    root.style.setProperty('--ph', `${ph.toFixed(1)}px`);
    canvases.forEach((c) => {
      const w = Math.round(pw * L.dpr);
      const h = Math.round(ph * L.dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    });
  }

  function measureStart() {
    const r = (introBox || openBtn).getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // le carnet 3D occupe environ 62 % de la largeur de sa scène
    const s = clamp((r.width * 0.62) / (2 * L.pw), 0.18, 0.6);
    start = { x: cx - L.W / 2, y: cy - L.H / 2, s };
  }

  /* ------------------------------------------------------------------ mise en scène (fonction de P) */
  function apply(p) {
    // charnière de la couverture : se ferme, voyage fermée, puis s'ouvre (avec un léger dépassement)
    const closeT = ease(seg(p, 0.06, 0.24));
    const openRaw = seg(p, 0.58, 0.8);
    let c = closeT * (1 - ease(openRaw));
    c -= 0.035 * Math.sin(Math.PI * seg(p, 0.7, 0.86));

    // voyage : de la position de l'introduction vers le centre de l'écran
    const f = ease(seg(p, 0.2, 0.58));
    // tilt qui se redresse et rotation finale
    const g = ease(seg(p, 0.56, 0.92));

    const sMid = 0.96;
    const x = lerp(start.x, 0, f);
    const y = lerp(start.y, L.yOff, f);
    const s = lerp(lerp(start.s, sMid, f), 1, g);
    const rx = lerp(lerp(56, 8, f), 0, g);
    const ry = lerp(lerp(0, -26, f), 0, g) + Math.sin(Math.PI * f) * 8;
    const rz = lerp(lerp(-12, 0, f), L.rzFinal, g);
    const z = Math.sin(Math.PI * f) * 140;

    book.style.setProperty('--x', `${x.toFixed(1)}px`);
    book.style.setProperty('--y', `${y.toFixed(1)}px`);
    book.style.setProperty('--z', `${z.toFixed(1)}px`);
    book.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    book.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    book.style.setProperty('--rz', `${rz.toFixed(2)}deg`);
    book.style.setProperty('--s', s.toFixed(4));
    root.style.setProperty('--c', c.toFixed(4));
    root.style.setProperty('--lf2', ease(seg(p, 0.74, 0.9)).toFixed(4));
    root.style.setProperty('--lf1', ease(seg(p, 0.8, 0.96)).toFixed(4));
    root.style.setProperty('--desk', seg(p, 0.02, 0.5).toFixed(3));
    root.style.opacity = seg(p, 0, 0.05).toFixed(3);
  }

  function tween(to, duration, done) {
    cancelAnimationFrame(rafId);
    const from = P;
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / Math.max(duration, 1));
      P = lerp(from, to, t);
      apply(P);
      if (t < 1) rafId = requestAnimationFrame(step);
      else if (done) done();
    };
    rafId = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ ouverture / fermeture */
  function setInert(on) {
    document.querySelectorAll('main, #site-header, footer').forEach((el) => {
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  function announce(msg) {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => {
      live.textContent = msg;
    }, 40);
  }

  function open() {
    if (phase !== 'closed') return;
    lastFocus = document.activeElement;
    layout();
    measureStart();
    redrawAll();
    root.hidden = false;
    html.classList.add('nb-open');
    setInert(true);
    if (intro) intro.classList.add('nb-away');
    root.classList.remove('nb--ready');
    closeBtn.focus({ preventScroll: true });

    if (reduceMotion.matches) {
      P = 1;
      apply(1);
      becomeReady();
      return;
    }
    phase = 'opening';
    P = 0;
    apply(0);
    tween(1, DURATION_OPEN, becomeReady);
  }

  function becomeReady() {
    phase = 'ready';
    root.classList.add('nb--ready');
    announce('Carnet ouvert. Dessinez sur les pages. Échap pour fermer.');
  }

  function fastForward() {
    if (phase !== 'opening') return;
    tween(1, 320, becomeReady);
  }

  function close() {
    if (phase === 'closed' || phase === 'closing') return;
    endStroke();
    phase = 'closing';
    root.classList.remove('nb--ready');
    layout();
    measureStart();
    redrawAll();
    const finish = () => {
      phase = 'closed';
      root.hidden = true;
      html.classList.remove('nb-open');
      setInert(false);
      if (intro) intro.classList.remove('nb-away');
      announce('Carnet fermé.');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (reduceMotion.matches) {
      P = 0;
      apply(0);
      finish();
      return;
    }
    tween(0, Math.max(500, DURATION_OPEN * 0.6 * P), finish);
  }

  /* ------------------------------------------------------------------ dessin */
  const mulberry = (a) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Coordonnées écran → coordonnées « double page » normalisées : x ∈ [0, 2] (largeur d'une page = 1), y ∈ [0, 1]
  function toSpread(clientX, clientY) {
    const th = (L.rzFinal * Math.PI) / 180;
    const vx = clientX - L.W / 2;
    const vy = clientY - (L.H / 2 + L.yOff);
    const lx = vx * Math.cos(th) + vy * Math.sin(th);
    const ly = -vx * Math.sin(th) + vy * Math.cos(th);
    return { x: (lx + L.pw) / L.pw, y: (ly + L.ph / 2) / L.ph };
  }

  // Dessine le segment (a → b, contrôle c) sur les deux pages ; le canvas rogne ce qui sort de sa page
  function paintSegment(a, c, b, width, rand) {
    const base = Math.max(1.5, L.pw * 0.0042);
    const w = base * width;
    for (let k = 0; k < 2; k += 1) {
      const minX = Math.min(a.x, b.x, c.x) - 0.05;
      const maxX = Math.max(a.x, b.x, c.x) + 0.05;
      if (maxX < k || minX > k + 1) continue;
      const ctx = ctxs[k];
      const cw = canvases[k].width;
      const ch = canvases[k].height;
      const px = (pt) => [(pt.x - k) * cw, pt.y * ch];
      const [ax, ay] = px(a);
      const [cx, cy] = px(c);
      const [bx, by] = px(b);
      const dpr = L.dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      // halo de graphite, puis trait net
      ctx.strokeStyle = 'rgba(35, 40, 54, 0.11)';
      ctx.lineWidth = w * dpr * 2.1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(35, 40, 54, 0.88)';
      ctx.lineWidth = w * dpr;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.stroke();
      // grain du papier : de petits éclats effacés le long du trait
      const len = Math.hypot(bx - ax, by - ay);
      const dots = Math.ceil(len / 1.8) + 1;
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < dots; i += 1) {
        const t = i / dots;
        const ox = (rand() - 0.5) * w * dpr * 1.1;
        const oy = (rand() - 0.5) * w * dpr * 1.1;
        ctx.globalAlpha = 0.35 + rand() * 0.4;
        ctx.beginPath();
        ctx.arc(lerp(ax, bx, t) + ox, lerp(ay, by, t) + oy, (0.25 + rand() * 0.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  // Dessine ce qui n'a pas encore été tracé du trait ; final = true trace la fin jusqu'au dernier point
  function paintStroke(stroke, final) {
    const pts = stroke.pts;
    const rand = stroke.rand;
    if (pts.length === 1 && final) {
      const p0 = pts[0];
      paintSegment(p0, p0, { x: p0.x + 0.0004, y: p0.y }, p0.w, rand);
      stroke.done = 1;
      return;
    }
    while (stroke.done < pts.length - 1) {
      const i = stroke.done;
      const from = i === 0 ? pts[0] : mid(pts[i - 1], pts[i]);
      const to = mid(pts[i], pts[i + 1]);
      paintSegment(from, pts[i], to, (pts[i].w + pts[i + 1].w) / 2, rand);
      stroke.done += 1;
    }
    if (final && pts.length > 1 && !stroke.closed) {
      const n = pts.length;
      paintSegment(mid(pts[n - 2], pts[n - 1]), pts[n - 1], pts[n - 1], pts[n - 1].w, rand);
      stroke.closed = true;
    }
  }

  function redrawAll() {
    ctxs.forEach((ctx, k) => ctx.clearRect(0, 0, canvases[k].width, canvases[k].height));
    strokes.forEach((s) => {
      s.rand = mulberry(s.seed);
      s.done = 0;
      s.closed = false;
      paintStroke(s, true);
    });
    root.classList.toggle('nb--drawn', strokes.length > 0);
    syncButtons();
  }

  function syncButtons() {
    undoBtn.disabled = history.length === 0;
    clearBtn.disabled = strokes.length === 0;
    undoBtn.style.opacity = undoBtn.disabled ? '0.45' : '';
    clearBtn.style.opacity = clearBtn.disabled ? '0.45' : '';
  }

  function widthFor(e, prev, pt) {
    if (e.pointerType === 'pen' && e.pressure > 0) return clamp(0.55 + e.pressure * 1.15, 0.5, 1.8);
    if (!prev) return 1.05;
    const dt = Math.max(pt.t - prev.t, 1);
    const speed = (Math.hypot((pt.x - prev.x) * L.pw, (pt.y - prev.y) * L.ph) / dt) * 16; // px par image
    const target = clamp(1.3 - speed * 0.035, 0.6, 1.3);
    return lerp(prev.w, target, 0.25);
  }

  function beginStroke(e) {
    const p = toSpread(e.clientX, e.clientY);
    const pt = { x: p.x, y: p.y, t: e.timeStamp, w: widthFor(e, null, p) };
    strokeCount += 1;
    current = { pts: [pt], seed: 7919 * strokeCount + 13, done: 0, closed: false, pointerId: e.pointerId };
    current.rand = mulberry(current.seed);
    paintStroke(current, false);
    root.classList.add('nb--drawn');
  }

  function extendStroke(e) {
    if (!current) return;
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const list = events.length ? events : [e];
    list.forEach((ev) => {
      const p = toSpread(ev.clientX, ev.clientY);
      const prev = current.pts[current.pts.length - 1];
      if (Math.hypot((p.x - prev.x) * L.pw, (p.y - prev.y) * L.ph) < 0.7) return;
      const pt = { x: p.x, y: p.y, t: ev.timeStamp || e.timeStamp, w: 1 };
      pt.w = widthFor(ev, prev, pt);
      current.pts.push(pt);
    });
    paintStroke(current, false);
  }

  function endStroke() {
    if (!current) return;
    paintStroke(current, true);
    strokes.push(current);
    history.push({ type: 'stroke' });
    current = null;
    syncButtons();
  }

  surface.addEventListener('pointerdown', (e) => {
    if (phase !== 'ready') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    surface.dataset.kbd = '0';
    try {
      surface.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture indisponible : le tracé continue tant que le pointeur reste sur la surface */
    }
    beginStroke(e);
    e.preventDefault();
  });
  surface.addEventListener('pointermove', (e) => {
    if (current && e.pointerId === current.pointerId) extendStroke(e);
  });
  const finish = (e) => {
    if (current && e.pointerId === current.pointerId) endStroke();
  };
  surface.addEventListener('pointerup', finish);
  surface.addEventListener('pointercancel', finish);
  surface.addEventListener('lostpointercapture', finish);

  function undo() {
    const last = history.pop();
    if (!last) return;
    if (last.type === 'stroke') strokes.pop();
    else if (last.type === 'clear') strokes = last.strokes;
    redrawAll();
    announce(last.type === 'clear' ? 'Dessin restauré.' : 'Dernier trait annulé.');
  }

  function clearAll() {
    if (strokes.length === 0) return;
    history.push({ type: 'clear', strokes });
    strokes = [];
    redrawAll();
    announce('Page effacée. Vous pouvez recommencer, ou annuler pour retrouver votre dessin.');
  }

  undoBtn.addEventListener('click', undo);
  clearBtn.addEventListener('click', clearAll);
  closeBtn.addEventListener('click', close);
  openBtn.addEventListener('click', open);
  root.addEventListener('pointerdown', fastForward);

  /* ------------------------------------------------------------------ clavier */
  let kbd = { x: 1, y: 0.5, down: false };
  function placeDot() {
    const th = (L.rzFinal * Math.PI) / 180;
    const lx = kbd.x * L.pw - L.pw;
    const ly = kbd.y * L.ph - L.ph / 2;
    const sx = L.W / 2 + lx * Math.cos(th) - ly * Math.sin(th);
    const sy = L.H / 2 + L.yOff + lx * Math.sin(th) + ly * Math.cos(th);
    kbdDot.style.left = `${sx}px`;
    kbdDot.style.top = `${sy}px`;
  }

  function kbdMove(dx, dy) {
    const step = 12;
    kbd.x = clamp(kbd.x + dx * (step / L.pw), 0, 2);
    kbd.y = clamp(kbd.y + dy * (step / L.ph), 0, 1);
    placeDot();
    if (kbd.down && current) {
      const prev = current.pts[current.pts.length - 1];
      current.pts.push({ x: kbd.x, y: kbd.y, t: prev.t + 16, w: 1 });
      paintStroke(current, false);
    }
  }

  surface.addEventListener('keydown', (e) => {
    if (phase !== 'ready') return;
    const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (move) {
      surface.dataset.kbd = '1';
      const k = e.shiftKey ? 3 : 1;
      kbdMove(move[0] * k, move[1] * k);
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Enter') {
      surface.dataset.kbd = '1';
      e.preventDefault();
      if (!kbd.down) {
        kbd.down = true;
        surface.dataset.pen = '1';
        strokeCount += 1;
        current = { pts: [{ x: kbd.x, y: kbd.y, t: 0, w: 1 }], seed: 7919 * strokeCount + 13, done: 0, closed: false, pointerId: -1 };
        current.rand = mulberry(current.seed);
        root.classList.add('nb--drawn');
        placeDot();
      } else {
        kbd.down = false;
        surface.dataset.pen = '0';
        if (current && current.pointerId === -1) endStroke();
      }
    }
  });
  surface.addEventListener('focus', () => {
    if (phase === 'ready') {
      placeDot();
    }
  });
  surface.addEventListener('blur', () => {
    if (kbd.down) {
      kbd.down = false;
      surface.dataset.pen = '0';
      if (current && current.pointerId === -1) endStroke();
    }
  });

  /* ------------------------------------------------------------------ clavier global : fermeture et piège à focus */
  document.addEventListener('keydown', (e) => {
    if (phase === 'closed') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (phase === 'opening' && e.key !== 'Tab') fastForward();
    if (e.key === 'Tab') {
      const items = [closeBtn, undoBtn, clearBtn, surface].filter((el) => el && !el.disabled);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!items.includes(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (phase === 'closed') return;
    layout();
    measureStart();
    redrawAll();
    apply(P);
    placeDot();
  });

  syncButtons();
})();
