/*! SiteMarker – shared geometry + rendering (used by the page overlay and the popup preview). MIT. */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const COLORS = {
    red: '#FF453A', orange: '#FF9F0A', yellow: '#FFD60A', green: '#30D158',
    teal: '#40C8E0', blue: '#0A84FF', purple: '#BF5AF2', pink: '#FF5FA2',
    black: '#1C1C1E', white: '#FFFFFF'
  };

  const DEFAULTS = Object.freeze({
    text: 'Click here',
    color: 'red',
    style: 'arrow',      // arrow | ring | box
    shape: 'curve',      // curve | straight | zigzag | spiral
    size: 'M',           // S | M | L
    from: 'auto',        // auto | top | bottom | left | right | top-left | ...
    border: 'shadow',    // shadow | contrast | black
    closeButton: false,  // every toggle is OFF by default
    untilClick: false,
    say: false,
    stay: true,          // keep on screen until dismissed (hide-after-delay is OFF)
    duration: 10,        // seconds when stay is off
    scale: 1,
    fontScale: 1,        // global text size multiplier
    arrowScale: 1,       // global arrow size multiplier
    flip: false,         // flip the bulge side of curved shafts
    signOffset: null,    // [dx,dy] sign centre relative to the target (set by dragging)
    tgtOffset: null,     // [dx,dy] shifts what the arrow points at (set by dragging)
    change: false,       // rich note block under the sign (free-form text)
    changeFrom: '',      // legacy
    changeTo: '',        // legacy
    richNote: '',        // free-form multi-line note under the sign
    steps: false,        // step-through mode: one sign at a time with next/prev
    inlineEdit: false    // allow inline text editing on page and on shared links
  });

  const S2 = Math.SQRT1_2;
  const DIRS = {
    top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0],
    'top-left': [-S2, -S2], 'top-right': [S2, -S2],
    'bottom-left': [-S2, S2], 'bottom-right': [S2, S2]
  };

  const SIZES = {
    S: { stroke: 7, head: 26, dist: 105, font: 15 },
    M: { stroke: 10, head: 36, dist: 145, font: 18 },
    L: { stroke: 14, head: 48, dist: 195, font: 23 }
  };

  /* ---------- helpers ---------- */

  const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  const num = (n) => (Math.round(n * 10) / 10).toString();

  function resolveColor(c) {
    if (COLORS[c]) return COLORS[c];
    return /^#[0-9a-f]{6}$/i.test(c || '') ? c : COLORS.red;
  }

  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255) > 0.4;
  }

  function sanitize(input) {
    const o = input || {};
    const d = DEFAULTS;
    const oneOf = (v, list, def) => (list.indexOf(v) > -1 ? v : def);
    const bool = (v, def) => (v === undefined ? def : !!v);
    const dur = Number(o.duration);
    const scale = Number(o.scale);
    const sc = (v) => { v = Number(v); return isFinite(v) && v > 0 ? clamp(v, 0.4, 3) : 1; };
    const vec = (v) => (Array.isArray(v) && v.length === 2 && isFinite(v[0]) && isFinite(v[1]) ? [Number(v[0]), Number(v[1])] : null);
    return {
      text: typeof o.text === 'string' ? o.text.slice(0, 140) : d.text,
      color: COLORS[o.color] || /^#[0-9a-f]{6}$/i.test(o.color || '') ? o.color : d.color,
      style: oneOf(o.style, ['arrow', 'ring', 'box'], d.style),
      shape: oneOf(o.shape, ['curve', 'straight', 'zigzag', 'spiral'], d.shape),
      size: oneOf(o.size, ['S', 'M', 'L'], d.size),
      from: oneOf(o.from, ['auto'].concat(Object.keys(DIRS)), d.from),
      border: oneOf(o.border, ['shadow', 'contrast', 'black'], d.border),
      closeButton: bool(o.closeButton, d.closeButton),
      untilClick: bool(o.untilClick, d.untilClick),
      say: bool(o.say, d.say),
      stay: bool(o.stay, d.stay),
      duration: isFinite(dur) ? clamp(Math.round(dur), 0, 300) : d.duration,
      scale: isFinite(scale) && scale > 0 ? clamp(scale, 0.3, 2) : d.scale,
      fontScale: sc(o.fontScale),
      arrowScale: sc(o.arrowScale),
      flip: !!o.flip,
      signOffset: vec(o.signOffset),
      tgtOffset: vec(o.tgtOffset),
      change: bool(o.change, d.change),
      changeFrom: typeof o.changeFrom === 'string' ? o.changeFrom.slice(0, 140) : d.changeFrom,
      changeTo: typeof o.changeTo === 'string' ? o.changeTo.slice(0, 140) : d.changeTo,
      richNote: (function () {
        if (typeof o.richNote === 'string' && o.richNote) return o.richNote.slice(0, 500);
        // migrate legacy from/to into one note
        const a = typeof o.changeFrom === 'string' ? o.changeFrom : '';
        const b = typeof o.changeTo === 'string' ? o.changeTo : '';
        if (a && b) return (a + ' \u2192 ' + b).slice(0, 500);
        return (a || b || d.richNote || '').slice(0, 500);
      })(),
      steps: bool(o.steps, d.steps),
      inlineEdit: bool(o.inlineEdit, d.inlineEdit)
    };
  }

  function spec(o) {
    const b = SIZES[o.size] || SIZES.M;
    const k = o.scale || 1;
    const a = o.arrowScale || 1;
    const f = o.fontScale || 1;
    return {
      k,
      stroke: b.stroke * k * a,
      head: b.head * k * a,
      dist: b.dist * k * a,
      font: b.font * k * f,
      gap: 10 * k,
      ringPad: 9 * k,
      ringStroke: Math.max(3, b.stroke * 0.6 * k * a)
    };
  }

  /* ---------- geometry ---------- */

  function shaftPath(shape, Q, u, side, Ls, S, view) {
    const n = [-u[1] * side, u[0] * side];
    const at = (a, b) => [Q[0] + u[0] * a + n[0] * b, Q[1] + u[1] * a + n[1] * b];
    const fmt = (p) => num(p[0]) + ' ' + num(p[1]);
    const poly = (pts) => 'M' + pts.map(fmt).join(' L');

    if (shape === 'spiral' && Ls < 140 * S.k) shape = 'curve';
    if (shape === 'zigzag' && Ls < 110 * S.k) shape = 'straight';
    if (shape === 'curve' && Ls < 40 * S.k) shape = 'straight';

    if (shape === 'curve') {
      const c1 = at(Ls * 0.12, Ls * 0.38);
      const c2 = at(Ls * 0.58, 0);
      return 'M' + fmt(Q) + ' C' + fmt(c1) + ' ' + fmt(c2) + ' ' + fmt(at(Ls, 0));
    }
    if (shape === 'zigzag') {
      const A = S.stroke * 1.2 + 3 * S.k;
      const pts = [at(0, 0)];
      [0.26, 0.42, 0.58, 0.74].forEach((t, i) => pts.push(at(Ls * t, A * (i % 2 ? -1 : 1))));
      pts.push(at(Ls * 0.88, 0), at(Ls, 0));
      return poly(pts);
    }
    if (shape === 'spiral') {
      const loop = Ls * 0.55, a = loop / (2 * Math.PI), b = a * 2.2, start = Ls * 0.18;
      const pts = [at(0, 0)];
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const ph = -Math.PI + (2 * Math.PI * i) / N;
        pts.push(at(start + a * ph - b * Math.sin(ph) + a * Math.PI, b * (1 + Math.cos(ph))));
      }
      pts.push(at(Ls, 0));
      return poly(pts);
    }
    return 'M' + fmt(Q) + ' L' + fmt(at(Ls, 0));
  }

  function layout(rect, view, sw, sh, o, S) {
    let r = rect;
    if (r.w > view.w * 0.7 || r.h > view.h * 0.7) {
      const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      r = { x: c.x - 14 * S.k, y: c.y - 14 * S.k, w: 28 * S.k, h: 28 * S.k };
    }
    const c0 = [r.x + r.w / 2, r.y + r.h / 2];
    const to = o.tgtOffset || [0, 0];
    r = { x: r.x + to[0], y: r.y + to[1], w: r.w, h: r.h };
    const isArrow = o.style === 'arrow';
    let outline = null;
    let box = r;
    if (!isArrow) {
      const minSide = 34 * S.k;
      const w = Math.max(r.w, minSide), h = Math.max(r.h, minSide);
      const cx0 = r.x + r.w / 2, cy0 = r.y + r.h / 2;
      box = { x: cx0 - w / 2 - S.ringPad, y: cy0 - h / 2 - S.ringPad, w: w + 2 * S.ringPad, h: h + 2 * S.ringPad };
      outline = {
        x: box.x, y: box.y, w: box.w, h: box.h,
        rx: o.style === 'ring' ? Math.min(box.w, box.h) / 2 : 10 * S.k
      };
    }

    const M = 14 * S.k;
    const hw = sw / 2, hh = sh / 2;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;

    let dir = DIRS[o.from];
    if (!o.signOffset && !dir) {
      const room = { top: box.y, bottom: view.h - box.y - box.h, left: box.x, right: view.w - box.x - box.w };
      const need = { top: S.dist + sh, bottom: S.dist + sh, left: S.dist + sw, right: S.dist + sw };
      let best = 'bottom', score = -Infinity;
      ['bottom', 'top', 'right', 'left'].forEach((k) => {
        const s = room[k] - need[k];
        if (s > score + 0.5) { score = s; best = k; }
      });
      dir = DIRS[best];
    }

    let sx, sy;
    if (o.signOffset) {
      sx = clamp(c0[0] + o.signOffset[0], M + hw, view.w - M - hw);
      sy = clamp(c0[1] + o.signOffset[1], M + hh, view.h - M - hh);
    } else {
      const ext = Math.abs(dir[0]) * (box.w / 2 + hw) + Math.abs(dir[1]) * (box.h / 2 + hh);
      sx = clamp(cx + dir[0] * (ext + S.dist), M + hw, view.w - M - hw);
      sy = clamp(cy + dir[1] * (ext + S.dist), M + hh, view.h - M - hh);
    }

    let vx = sx - cx, vy = sy - cy;
    let vl = Math.hypot(vx, vy);
    if (vl < 1) { vx = dir[0] || 0; vy = dir[1] || 1; vl = Math.hypot(vx, vy); }
    vx /= vl; vy /= vl;

    const pad = isArrow ? S.gap : 0;
    const hx = box.w / 2 + pad, hy = box.h / 2 + pad;
    const t = Math.min(vx ? hx / Math.abs(vx) : Infinity, vy ? hy / Math.abs(vy) : Infinity);
    const P = [cx + vx * t, cy + vy * t];

    let dx = P[0] - sx, dy = P[1] - sy;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl; dy /= dl;
    const ts = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    const qd = Math.max(ts - 12 * S.k, 0);
    const Q = [sx + dx * qd, sy + dy * qd];
    const u = [dx, dy];
    const L = Math.max(Math.hypot(P[0] - Q[0], P[1] - Q[1]), 1);

    // bulge toward the side that stays on screen
    const probe = (side) => {
      const p = [Q[0] + u[0] * L * 0.4 + -u[1] * side * L * 0.3, Q[1] + u[1] * L * 0.4 + u[0] * side * L * 0.3];
      return p[0] > 0 && p[0] < view.w && p[1] > 0 && p[1] < view.h;
    };
    const side = (!probe(1) && probe(-1) ? -1 : 1) * (o.flip ? -1 : 1);

    const out = { sx, sy, u, outline, head: null, shaft: '', c0, sw, sh };
    if (isArrow) {
      const h = Math.min(S.head, L * 0.6);
      const B = [P[0] - u[0] * h, P[1] - u[1] * h];
      const E = [B[0] + u[0] * h * 0.25, B[1] + u[1] * h * 0.25];
      const Ls = Math.max(Math.hypot(E[0] - Q[0], E[1] - Q[1]), 1);
      const hwd = h * 0.62;
      const n = [-u[1], u[0]];
      out.head = [P, [B[0] + n[0] * hwd, B[1] + n[1] * hwd], [B[0] - n[0] * hwd, B[1] - n[1] * hwd]]
        .map((p) => num(p[0]) + ',' + num(p[1])).join(' ');
      out.shaft = shaftPath(o.shape, Q, u, side, Ls, S, view);
    } else {
      out.shaft = 'M' + num(Q[0]) + ' ' + num(Q[1]) + ' L' + num(P[0]) + ' ' + num(P[1]);
    }
    return out;
  }

  /* ---------- DOM ---------- */

  const CSS = `
.ba{position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;animation:ba-in .26s cubic-bezier(.2,.9,.3,1.12) both}
.ba.static{animation:none}
.ba.out{animation:ba-out .18s ease-in both}
.ba svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.ba .drop{filter:drop-shadow(0 6px 9px rgba(0,0,0,.38))}
.ba .nudge{animation:ba-nudge 1.15s ease-in-out infinite}
.ba .breathe{transform-box:fill-box;transform-origin:center;animation:ba-breathe 1.5s ease-in-out infinite}
.ba .sign{position:absolute;left:0;top:0;display:flex;align-items:center;gap:.6em;width:max-content;padding:.55em .95em;border-radius:1em;font-weight:800;line-height:1.22;letter-spacing:-.012em;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
.ba .sign:active{cursor:grabbing}
.ba .sign.editing{cursor:text}
.ba .sign.editing .txt{user-select:text;-webkit-user-select:text;outline:none;min-width:2ch;cursor:text}
.ba .grab{pointer-events:visiblePainted;cursor:grab;touch-action:none}
.ba.sel .sign{outline:2px solid #0A84FF;outline-offset:5px}
.ba .txt{min-width:0;overflow-wrap:anywhere}
.ba .chip{display:inline-flex;align-items:center;gap:.4em;margin:0 .1em;padding:.08em .5em;border:0;border-radius:.55em;font:inherit;font-weight:800;background:var(--tx);color:var(--sg);cursor:copy;box-shadow:0 1px 0 rgba(0,0,0,.25);vertical-align:baseline}
.ba .chip svg{position:static;width:.95em;height:.95em;flex:none}
.ba .x{flex:none;display:grid;place-items:center;width:1.5em;height:1.5em;margin-right:-.4em;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--tx) 22%,transparent);color:var(--tx);cursor:pointer}
.ba .x svg{position:static;width:.8em;height:.8em}
.ba .body{min-width:0}
.ba .chg{display:block;margin-top:.55em;padding-top:.5em;border-top:1.5px solid color-mix(in srgb,var(--tx) 30%,transparent);font-size:.82em;font-weight:700;line-height:1.35;white-space:pre-wrap;max-width:28em}
.ba .chg .chip{margin:.1em .15em}
.ba .chg .tg{opacity:.8;text-transform:uppercase;letter-spacing:.06em;font-size:.78em}
.ba .chg .to{opacity:.85}
.ba .chip.old span{text-decoration:line-through;text-decoration-thickness:.12em}
@keyframes ba-in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
@keyframes ba-out{to{opacity:0;transform:scale(.97)}}
@keyframes ba-nudge{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx,0),var(--dy,0))}}
@keyframes ba-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
@media (prefers-reduced-motion:reduce){.ba,.ba .nudge,.ba .breathe{animation:none!important}}
`;

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
    return e;
  }
  function icon(kind) {
    const s = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    if (kind === 'copy') {
      s.appendChild(svgEl('rect', { x: 9, y: 9, width: 13, height: 13, rx: 2 }));
      s.appendChild(svgEl('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }));
    } else if (kind === 'check') {
      s.appendChild(svgEl('polyline', { points: '20 6 9 17 4 12' }));
    } else {
      s.appendChild(svgEl('line', { x1: 18, y1: 6, x2: 6, y2: 18 }));
      s.appendChild(svgEl('line', { x1: 6, y1: 6, x2: 18, y2: 18 }));
    }
    return s;
  }

  function fallbackCopy(text) {
    const ta = el('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    (document.body || document.documentElement).appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function makeChip(value) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.title = 'Copy';
    const v = el('span');
    v.textContent = value;
    b.append(v, icon('copy'));
    let timer = 0;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyText(value).then(() => {
        b.lastChild.replaceWith(icon('check'));
        clearTimeout(timer);
        timer = setTimeout(() => { b.lastChild.replaceWith(icon('copy')); }, 1600);
      });
    });
    return b;
  }

  function create(options) {
    const o = sanitize(options);
    const S = spec(o);
    const color = resolveColor(o.color);
    const tx = isLight(color) ? '#0B0F14' : '#FFFFFF';
    const isArrow = o.style === 'arrow';
    const dismiss = () => { if (options && typeof options.onDismiss === 'function') options.onDismiss(); };

    const root = el('div', 'ba' + (options && options.animateIn === false ? ' static' : ''));

    // graphics
    const svg = svgEl('svg', { 'aria-hidden': 'true' });
    const motion = svgEl('g', o.border === 'shadow' ? { class: 'drop' } : {});
    svg.appendChild(motion);
    const k = S.k;
    const passes = o.border === 'contrast' ? [['#000', 10 * k], ['#fff', 6 * k], [color, 0]]
      : o.border === 'black' ? [['#000', 5 * k], [color, 0]]
      : [['#fff', 6 * k], [color, 0]];

    const shafts = [], heads = [], outlines = [];
    passes.forEach((p) => {
      const c = p[0], add = p[1];
      const w = isArrow ? S.stroke : S.stroke * 0.55;
      const shaft = svgEl('path', { fill: 'none', stroke: c, 'stroke-width': num(w + add), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      if (isArrow) shaft.setAttribute('class', 'nudge');
      motion.appendChild(shaft);
      shafts.push(shaft);
      if (isArrow) {
        const head = svgEl('polygon', { fill: c, stroke: c, 'stroke-width': num(add), 'stroke-linejoin': 'round', class: 'nudge grab' });
        motion.appendChild(head);
        heads.push(head);
      } else {
        const ring = svgEl('rect', { fill: 'none', stroke: c, 'stroke-width': num(S.ringStroke + add), class: 'breathe' });
        motion.appendChild(ring);
        outlines.push(ring);
      }
    });

    let grabEls = heads;
    if (!isArrow) {
      const hit = svgEl('rect', { fill: 'none', stroke: 'transparent', 'stroke-width': num(S.ringStroke + 18 * k), class: 'grab' });
      hit.style.pointerEvents = 'stroke';
      motion.appendChild(hit);
      outlines.push(hit);
      grabEls = [hit];
    }

    // sign
    const sign = el('div', 'sign');
    sign.setAttribute('role', 'note');
    const edge = o.border === 'contrast' ? '0 0 0 ' + 3 * k + 'px #fff,0 0 0 ' + 4.5 * k + 'px #000'
      : o.border === 'black' ? '0 0 0 ' + 2 * k + 'px #000'
      : '0 0 0 ' + 3 * k + 'px #fff,0 10px 24px rgba(0,0,0,.35)';
    sign.style.cssText = 'background:' + color + ';color:' + tx + ';font-size:' + num(S.font) + 'px;box-shadow:' + edge + ';';
    sign.style.setProperty('--tx', tx);
    sign.style.setProperty('--sg', color);

    const label = el('span', 'txt');
    String(o.text || 'Look here').split(/(\{\{[^{}]+\}\})/).forEach((part) => {
      const m = /^\{\{([^{}]+)\}\}$/.exec(part);
      if (m) label.appendChild(makeChip(m[1].trim()));
      else if (part) label.appendChild(document.createTextNode(part));
    });
    const body = el('div', 'body');
    body.appendChild(label);
    if (o.change && o.richNote) {
      const chg = el('div', 'chg');
      // free-form note: preserve lines; turn {{code}} into copy chips
      String(o.richNote).split(/\n/).forEach((line, li) => {
        if (li) chg.appendChild(document.createElement('br'));
        String(line).split(/(\{\{[^{}]+\}\})/).forEach((part) => {
          const m = /^\{\{([^{}]+)\}\}$/.exec(part);
          if (m) chg.appendChild(makeChip(m[1].trim()));
          else if (part) chg.appendChild(document.createTextNode(part));
        });
      });
      body.appendChild(chg);
    } else if (o.change && (o.changeFrom || o.changeTo)) {
      const chg = el('div', 'chg');
      if (o.changeFrom) {
        const old = makeChip(o.changeFrom);
        old.classList.add('old');
        chg.appendChild(old);
      }
      if (o.changeFrom && o.changeTo) {
        const to = el('span', 'to');
        to.textContent = '\u2192';
        chg.appendChild(to);
      }
      if (o.changeTo) chg.appendChild(makeChip(o.changeTo));
      body.appendChild(chg);
    }
    sign.appendChild(body);
    if (o.closeButton) {
      const x = el('button', 'x');
      x.type = 'button';
      x.setAttribute('aria-label', 'Dismiss arrow');
      x.appendChild(icon('x'));
      x.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); dismiss(); });
      sign.appendChild(x);
    }

    root.append(svg, sign);

    const state = { signOffset: o.signOffset, tgtOffset: o.tgtOffset };
    let geom = null;
    let cache = { w: 0, h: 0, max: -1 };
    function update(rect, view) {
      if (!root.isConnected) return;
      const maxW = Math.max(100, Math.min(view.w * 0.8, 380 * S.k));
      if (cache.max !== maxW || !cache.w) {
        sign.style.maxWidth = num(maxW) + 'px';
        cache = { w: sign.offsetWidth, h: sign.offsetHeight, max: maxW };
      }
      const g = layout(rect, view, cache.w, cache.h, Object.assign({}, o, state), S);
      geom = g;
      sign.style.transform = 'translate(' + num(g.sx - cache.w / 2) + 'px,' + num(g.sy - cache.h / 2) + 'px)';
      shafts.forEach((p) => p.setAttribute('d', g.shaft));
      if (isArrow) {
        heads.forEach((p) => p.setAttribute('points', g.head));
        svg.style.setProperty('--dx', num(g.u[0] * 7 * S.k) + 'px');
        svg.style.setProperty('--dy', num(g.u[1] * 7 * S.k) + 'px');
      } else if (g.outline) {
        outlines.forEach((r) => {
          r.setAttribute('x', num(g.outline.x)); r.setAttribute('y', num(g.outline.y));
          r.setAttribute('width', num(g.outline.w)); r.setAttribute('height', num(g.outline.h));
          r.setAttribute('rx', num(g.outline.rx));
        });
      }
    }

    function edit(cb) {
      sign.classList.add('editing');
      label.textContent = o.text || '';
      // Prefer plaintext-only; fall back to true for older Chromium
      try { label.contentEditable = 'plaintext-only'; } catch (e) { label.contentEditable = 'true'; }
      if (label.contentEditable !== 'plaintext-only' && label.contentEditable !== 'true') {
        label.setAttribute('contenteditable', 'true');
      }
      label.spellcheck = false;
      // focus after a tick so shadow DOM + pointer handlers settle
      setTimeout(() => {
        try {
          label.focus();
          const range = document.createRange();
          range.selectNodeContents(label);
          const sel = (root.getRootNode && root.getRootNode().getSelection)
            ? root.getRootNode().getSelection()
            : window.getSelection();
          if (sel) { sel.removeAllRanges(); sel.addRange(range); }
        } catch (e) { try { label.focus(); } catch (e2) { /* ignore */ } }
      }, 0);
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        label.contentEditable = 'false';
        label.removeAttribute('contenteditable');
        sign.classList.remove('editing');
        cb.onDone(ok ? label.textContent.replace(/\s+/g, ' ').trim() : null);
      };
      label.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      label.addEventListener('keyup', (e) => e.stopPropagation());
      label.addEventListener('pointerdown', (e) => e.stopPropagation());
      label.addEventListener('mousedown', (e) => e.stopPropagation());
      label.addEventListener('input', () => { cache.max = -1; if (cb.onInput) cb.onInput(); });
      label.addEventListener('blur', () => finish(true));
    }

    return {
      el: root,
      options: o,
      signEl: sign,
      grabEls,
      state,
      get geom() { return geom; },
      setSelected(v) { root.classList.toggle('sel', !!v); },
      edit,
      update,
      setVisible(v) { root.style.visibility = v ? '' : 'hidden'; },
      destroy() { root.remove(); }
    };
  }

  global.BigArrow = { COLORS, DEFAULTS, DIRS, SIZES, CSS, create, sanitize, resolveColor, isLight, _layout: layout, _spec: spec };
})(typeof window !== 'undefined' ? window : globalThis);
