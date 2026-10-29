/* SiteMarker – page overlay. Injected on demand (activeTab), draws arrows in a closed Shadow DOM. */
(() => {
  'use strict';
  if (window.__sitemarkerLoaded) return;
  window.__sitemarkerLoaded = true;

  const BA = window.BigArrow;

  const CONTENT_CSS = `
:host{all:initial}
.layer{position:fixed;inset:0;pointer-events:none}
.pick{position:fixed;inset:0;pointer-events:auto;cursor:crosshair;background:rgba(10,132,255,.04)}
.hl{position:fixed;pointer-events:none;border:2px solid #0A84FF;background:rgba(10,132,255,.14);border-radius:4px}
.hl.area{border-style:dashed;border-radius:6px}
.hl .tag{position:absolute;left:-2px;bottom:100%;margin-bottom:4px;background:#0A84FF;color:#fff;font:600 11px/1 ui-monospace,Menlo,Consolas,monospace;padding:4px 6px;border-radius:5px;white-space:nowrap}
.hl.below .tag{bottom:auto;top:100%;margin:4px 0 0}
.hint{position:fixed;top:14px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;padding:9px 16px;border-radius:999px;background:rgba(13,21,35,.94);color:#fff;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap}
.hint kbd{font:700 11px ui-monospace,Menlo,Consolas,monospace;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.18)}
.tb{position:fixed;left:0;top:0;display:grid;gap:2px;padding:5px;max-width:92vw;border-radius:13px;background:rgba(13,21,35,.97);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08);pointer-events:auto;user-select:none;-webkit-user-select:none;font:600 12px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.tb[hidden],.tbcolors[hidden]{display:none}
.tbrow{display:flex;flex-wrap:wrap;align-items:center;gap:2px}
.tb button{display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:8px;background:transparent;color:#fff;cursor:pointer}
.tb button:hover{background:rgba(255,255,255,.15)}
.tb button:disabled{opacity:.3;cursor:default;background:transparent}
.tb button:focus-visible{outline:2px solid #0A84FF}
.tb svg{width:17px;height:17px}
.tb .lbl{display:grid;place-items:center;width:20px;height:30px;opacity:.6}
.tb .sep{width:1px;height:18px;margin:0 4px;background:rgba(255,255,255,.22)}
.tb .dot{width:18px;height:18px;border-radius:50%;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7)}
.tb .del:hover{background:rgba(255,69,58,.85)}
.tbcolors{display:flex;gap:7px;padding:7px 6px 5px;border-top:1px solid rgba(255,255,255,.14);margin-top:3px}
.tbcolors button{width:20px;height:20px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
.tbcolors button:hover{background:var(--c);transform:scale(1.15)}
.tbcolors button[aria-pressed="true"]{box-shadow:0 0 0 2px #0D1523,0 0 0 4px #fff}
.stepsbar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(13,21,35,.96);color:#fff;font:600 13px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.1);pointer-events:auto;z-index:1;user-select:none}
.stepsbar[hidden]{display:none}
.stepsbar button{display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font:700 16px/1 system-ui}
.stepsbar button:hover{background:rgba(255,255,255,.22)}
.stepsbar button:disabled{opacity:.35;cursor:default}
.stepsbar .label{min-width:4.2em;text-align:center;font-variant-numeric:tabular-nums}
.stepsbar .exit{margin-left:4px;font-size:12px;padding:0 10px;width:auto;border-radius:999px;background:rgba(255,255,255,.1)}
.edit-overlay{position:absolute;z-index:2147483646;display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:rgba(13,21,35,.98);box-shadow:0 12px 36px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.12);pointer-events:auto !important;min-width:260px;max-width:min(440px,92vw)}
.edit-overlay textarea{display:block;width:100%;box-sizing:border-box;min-height:64px;padding:8px 10px;border:1.5px solid rgba(255,255,255,.25);border-radius:8px;background:#1a2233;color:#fff;font:600 14px/1.35 system-ui,sans-serif;resize:vertical;outline:none;pointer-events:auto}
.edit-overlay textarea:focus{border-color:#0A84FF;box-shadow:0 0 0 3px rgba(10,132,255,.35)}
.edit-overlay .row{display:flex;gap:6px;justify-content:flex-end;pointer-events:auto}
.edit-overlay button{height:32px;padding:0 14px;border:0;border-radius:8px;font:700 12px system-ui,sans-serif;cursor:pointer;pointer-events:auto}
.edit-overlay .save{background:#0A84FF;color:#fff}
.edit-overlay .cancel{background:rgba(255,255,255,.14);color:#fff}
.edit-overlay .note{color:rgba(255,255,255,.6);font:500 11px system-ui,sans-serif}
.edit-backdrop{position:absolute;inset:0;z-index:2147483645;background:rgba(0,0,0,.25);pointer-events:auto !important}
.inline-hint{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;background:rgba(13,21,35,.96);color:#fff;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto;white-space:nowrap}
.inline-hint button{height:28px;padding:0 12px;border:0;border-radius:999px;background:rgba(255,255,255,.15);color:#fff;font:700 12px system-ui,sans-serif;cursor:pointer}
.inline-hint button:hover{background:rgba(255,255,255,.25)}
`;

  const host = document.createElement('sitemarker-overlay');
  host.style.cssText = 'all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = BA.CSS + CONTENT_CSS;
  const layer = document.createElement('div');
  layer.className = 'layer';
  shadow.append(style, layer);
  document.documentElement.appendChild(host);

  const arrows = new Set();
  const stepOrder = []; // ordered list of arrow refs for steps mode
  let raf = 0;
  let picking = null;
  let selected = null;
  let stepsOn = false;
  let currentStep = 0;
  let stepsBar = null;
  let inlineEditOn = false;
  let lastOpts = null;           // last style used when placing a sign
  let inlineHint = null;         // floating hint while click-to-edit mode is on
  let inlineClickBound = false;

  const div = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };
  const clampN = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  const round2 = (n) => Math.round(n * 100) / 100;

  // Keep page scripts from reacting to interaction with SiteMarker's own UI.
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'keydown', 'keyup', 'contextmenu'].forEach((t) => {
    shadow.addEventListener(t, (e) => e.stopPropagation());
  });

  /* ---------- arrows ---------- */

  function rectOf(t) {
    if (t.el) {
      if (!t.el.isConnected) return null;
      const r = t.el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    return { x: t.x - window.scrollX, y: t.y - window.scrollY, w: t.w, h: t.h };
  }

  function schedule() { if (!raf && arrows.size) raf = requestAnimationFrame(tick); }

  function tick() {
    raf = 0;
    if (!host.isConnected) document.documentElement.appendChild(host);
    const view = { w: host.clientWidth || window.innerWidth, h: host.clientHeight || window.innerHeight };
    arrows.forEach((a) => {
      const r = rectOf(a.target);
      if (!r) { removeArrow(a); return; }
      const visible = r.w + r.h > 0 && r.x < view.w && r.y < view.h && r.x + r.w > 0 && r.y + r.h > 0;
      a.inst.setVisible(visible);
      if (!visible) return;
      const x1 = Math.max(r.x, 0), y1 = Math.max(r.y, 0);
      const x2 = Math.min(r.x + r.w, view.w), y2 = Math.min(r.y + r.h, view.h);
      const c = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      const key = [c.x, c.y, c.w, c.h, view.w, view.h].map((n) => Math.round(n * 2)).join();
      if (key !== a.key) { a.key = key; a.inst.update(c, view); }
    });
    placeToolbar(view);
    schedule();
  }

  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/\{\{([^}]*)\}\}/g, '$1'));
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  function build(a) {
    const inst = BA.create(Object.assign({}, a.o, { animateIn: a.fresh, onDismiss: () => removeArrow(a) }));
    a.fresh = false;
    a.inst = inst;
    a.key = '';
    a._lastTap = 0;
    inst.signEl.addEventListener('pointerdown', (e) => beginDrag(a, e, 'sign'));
    // Manual double-tap detection — browser dblclick is often killed by pointer capture/drag
    inst.signEl.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || a.editing) return;
      if (e.target.closest && e.target.closest('.chip,.x')) return;
      if (a._didDrag) { a._didDrag = false; return; }
      const now = Date.now();
      if (now - (a._lastTap || 0) < 400) {
        a._lastTap = 0;
        e.preventDefault();
        e.stopPropagation();
        startEdit(a);
        return;
      }
      a._lastTap = now;
      // Single click: edit when inline mode is on
      if (inlineEditOn) {
        setTimeout(() => {
          if (a._lastTap && Date.now() - a._lastTap >= 380 && !a._didDrag && !a.editing) {
            startEdit(a);
          }
        }, 390);
      }
    });
    inst.grabEls.forEach((g) => g.addEventListener('pointerdown', (e) => beginDrag(a, e, 'target')));
    inst.setSelected(selected === a);
    return inst;
  }

  function syncState(a) {
    a.o.signOffset = a.inst.state.signOffset;
    a.o.tgtOffset = a.inst.state.tgtOffset;
  }

  // Changing any of these resizes the sign, and for auto-placed signs the position
  // depends on size. Pin the sign where it is first so resizing never moves it.
  const RESIZE_KEYS = ['fontScale', 'arrowScale', 'size', 'style'];

  function rebuild(a, patch) {
    syncState(a);
    if (patch) {
      const p = Object.assign({}, patch);
      const resetSign = p._resetSign;
      delete p._resetSign;
      if (!resetSign && !a.o.signOffset && a.inst.geom && RESIZE_KEYS.some((k) => p[k] !== undefined && p[k] !== a.o[k])) {
        const g = a.inst.geom;
        a.o.signOffset = [g.sx - g.c0[0], g.sy - g.c0[1]];
      }
      a.o = BA.sanitize(Object.assign({}, a.o, p));
      if (resetSign) a.o.signOffset = null;
    }
    const old = a.inst;
    const inst = build(a);
    layer.insertBefore(inst.el, old.el);
    old.destroy();
  }

  function addArrow(target, rawOpts) {
    const o = BA.sanitize(rawOpts);
    lastOpts = Object.assign({}, o);
    const a = { target, o, key: '', timer: 0, inst: null, fresh: true, editing: false };
    build(a);
    layer.appendChild(a.inst.el);
    arrows.add(a);
    stepOrder.push(a);
    while (arrows.size > 12) removeArrow(arrows.values().next().value, true);
    if (!o.stay && o.duration > 0) a.timer = setTimeout(() => removeArrow(a), o.duration * 1000);
    if (o.say) speak(o.text);
    select(a);
    if (stepsOn) {
      currentStep = stepOrder.length - 1;
      applyStepsVisibility();
    }
    schedule();
  }

  function removeArrow(a, immediate) {
    if (!arrows.has(a)) return;
    clearTimeout(a.timer);
    arrows.delete(a);
    const idx = stepOrder.indexOf(a);
    if (idx > -1) stepOrder.splice(idx, 1);
    if (selected === a) select(null);
    if (stepsOn) {
      if (currentStep >= stepOrder.length) currentStep = Math.max(0, stepOrder.length - 1);
      applyStepsVisibility();
    }
    if (immediate) { a.inst.destroy(); return; }
    a.inst.el.classList.add('out');
    const inst = a.inst;
    setTimeout(() => inst.destroy(), 200);
  }

  function clearAll() {
    stopPick();
    Array.from(arrows).forEach((a) => removeArrow(a));
    stepOrder.length = 0;
    currentStep = 0;
    if (stepsOn) applyStepsVisibility();
  }

  /* ---------- dragging ---------- */

  function beginDrag(a, e, mode) {
    if (e.button !== 0 || a.editing) return;
    if (e.target.closest && e.target.closest('.chip,.x')) return;
    // When inline editor is on, clicking text opens the editor — don't start a drag
    if (inlineEditOn && mode === 'sign' && e.target.closest && e.target.closest('.txt,.chg,.body')) {
      return;
    }
    e.stopPropagation();
    clearTimeout(a.timer); // touching an arrow keeps it on screen
    select(a);
    const g = a.inst.geom;
    if (!g) return;
    const st = a.inst.state;
    if (!st.signOffset) st.signOffset = [g.sx - g.c0[0], g.sy - g.c0[1]];
    const start = { x: e.clientX, y: e.clientY, so: st.signOffset.slice(), to: (st.tgtOffset || [0, 0]).slice() };
    const el = e.currentTarget;
    let moved = false;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

    const move = (ev) => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) {
        moved = true;
        a._didDrag = true;
        ev.preventDefault(); // only once we actually drag
      }
      if (mode === 'sign') st.signOffset = [start.so[0] + dx, start.so[1] + dy];
      else st.tgtOffset = [start.to[0] + dx, start.to[1] + dy];
      a.key = '';
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  /* ---------- inline text editing (overlay — reliable in closed shadow DOM) ---------- */

  let editOverlay = null;

  function closeEditOverlay() {
    if (editOverlay) {
      if (editOverlay._backdrop) editOverlay._backdrop.remove();
      editOverlay.remove();
      editOverlay = null;
    }
  }

  function readTargetText(target) {
    const el = target && target.el;
    if (!el || !el.isConnected) return '';
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return String(el.value || '');
    if (el.isContentEditable) return String(el.innerText || '').trim();
    return String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function writeTargetText(target, text) {
    const el = target && target.el;
    if (!el || !el.isConnected) return false;
    const tag = (el.tagName || '').toUpperCase();
    try {
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        el.value = text;
        try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* ignore */ }
        try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { /* ignore */ }
        return true;
      }
      if (tag === 'SELECT') return false;
      if (el.isContentEditable) {
        el.innerText = text;
        return true;
      }
      // Safe tags: replace text content; arrow still points at the same element
      el.textContent = text;
      return true;
    } catch (e) {
      return false;
    }
  }

  function fieldLabel(text) {
    const l = document.createElement('div');
    l.className = 'note';
    l.style.marginTop = '2px';
    l.textContent = text;
    return l;
  }

  function startEdit(a) {
    if (!a || !a.inst) return;
    // Close any other open editor first
    if (editOverlay) {
      arrows.forEach((x) => { if (x.editing && x !== a) x.editing = false; });
      closeEditOverlay();
    }
    a.editing = true;
    a._lastTap = 0;
    clearTimeout(a.timer);
    select(a);

    const o = a.o || {};
    const hasPageTarget = !!(a.target && a.target.el && a.target.el.isConnected);
    const pageTextNow = hasPageTarget ? readTargetText(a.target) : '';

    const backdrop = div('edit-backdrop');
    const box = div('edit-overlay');

    // --- Sign label (what the arrow says) ---
    box.appendChild(fieldLabel('Sign label (arrow text)'));
    const ta = document.createElement('textarea');
    ta.value = o.text || '';
    ta.setAttribute('maxlength', '140');
    ta.rows = 2;
    ta.placeholder = 'Text on the sitemarker';
    box.appendChild(ta);

    // --- Page text (what the arrow points at on the real page) ---
    let pageTa = null;
    if (hasPageTarget) {
      box.appendChild(fieldLabel('Page text (element the arrow points at)'));
      pageTa = document.createElement('textarea');
      pageTa.value = pageTextNow;
      pageTa.setAttribute('maxlength', '2000');
      pageTa.rows = 3;
      pageTa.placeholder = 'Update the live page text here';
      box.appendChild(pageTa);
    }

    // --- Optional rich note ---
    let noteTa = null;
    if (o.change || o.richNote) {
      box.appendChild(fieldLabel('Rich note under the sign'));
      noteTa = document.createElement('textarea');
      noteTa.value = o.richNote || '';
      noteTa.setAttribute('maxlength', '500');
      noteTa.rows = 2;
      noteTa.placeholder = 'Optional note';
      box.appendChild(noteTa);
    }

    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = hasPageTarget
      ? 'Save updates the sign and the page text. The arrow keeps pointing at it.'
      : 'Enter to save · Esc to cancel';
    box.appendChild(note);

    const row = div('row');
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.textContent = 'Cancel';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'save';
    save.textContent = 'Save';
    row.append(cancel, save);
    box.appendChild(row);

    // Position near the sign
    let top = 80, left = 24;
    try {
      const sr = a.inst.signEl.getBoundingClientRect();
      top = Math.min(window.innerHeight - 280, Math.max(12, sr.bottom + 10));
      left = Math.min(window.innerWidth - 300, Math.max(12, sr.left));
    } catch (e) { /* ignore */ }
    box.style.top = top + 'px';
    box.style.left = left + 'px';

    host.style.pointerEvents = 'auto';
    layer.style.pointerEvents = 'auto';

    const finish = (ok) => {
      if (!a.editing) return;
      a.editing = false;
      host.style.pointerEvents = 'none';
      layer.style.pointerEvents = '';
      closeEditOverlay();
      if (ok) {
        const patch = { text: (ta.value || '').replace(/\s+/g, ' ').trim().slice(0, 140) };
        if (noteTa) {
          patch.richNote = (noteTa.value || '').trim().slice(0, 500);
          patch.change = !!patch.richNote || !!o.change;
        }
        // Update the real page element so the arrow points at the new text
        if (pageTa && a.target && a.target.el) {
          const newPageText = (pageTa.value || '').trim();
          writeTargetText(a.target, newPageText);
        }
        rebuild(a, patch);
      }
      if (selected === a) {
        tb.hidden = false;
        try { placeToolbar({ w: window.innerWidth, h: window.innerHeight }); } catch (e) { /* ignore */ }
      }
    };

    cancel.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); finish(false); });
    save.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); finish(true); });
    backdrop.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); finish(false); });
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    const keyHandler = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      if (e.key === 'Enter' && !e.shiftKey && e.target === ta) { e.preventDefault(); finish(true); }
    };
    ta.addEventListener('keydown', keyHandler);
    if (pageTa) pageTa.addEventListener('keydown', keyHandler);
    if (noteTa) noteTa.addEventListener('keydown', keyHandler);

    shadow.appendChild(backdrop);
    shadow.appendChild(box);
    editOverlay = box;
    editOverlay._backdrop = backdrop;

    // Focus after the current pointer event finishes
    setTimeout(() => {
      try { ta.focus(); ta.setSelectionRange(0, ta.value.length); } catch (e) {
        try { ta.focus(); } catch (e2) { /* ignore */ }
      }
    }, 50);
  }

  /* ---------- selection toolbar ---------- */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function ico(paths) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    paths.forEach((d) => { const p = document.createElementNS(SVG_NS, 'path'); p.setAttribute('d', d); s.appendChild(p); });
    return s;
  }

  const ICONS = {
    font: ['M4 19L12 4l8 15', 'M7.5 14h9'],
    arrow: ['M4 12h14', 'M13 6l6 6-6 6'],
    minus: ['M6 12h12'],
    plus: ['M12 6v12', 'M6 12h12'],
    shape: ['M3 17C6 5 13 5 21 11'],
    style: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'],
    flip: ['M7 7h13', 'M16 3l4 4-4 4', 'M17 17H4', 'M8 13l-4 4 4 4'],
    rotate: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
    edit: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
    reset: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5'],
    trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3']
  };

  const tb = div('tb');
  tb.hidden = true;
  const tbRow = div('tbrow');
  const tbColors = div('tbcolors');
  tbColors.hidden = true;
  tb.append(tbRow, tbColors);
  layer.appendChild(tb);

  const tbBtn = (title, icon, fn, cls) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    if (cls) b.className = cls;
    b.appendChild(typeof icon === 'string' ? ico(ICONS[icon]) : icon);
    b.addEventListener('click', () => { if (selected) fn(selected); });
    return b;
  };
  const sep = () => div('sep');
  const label = (icon) => { const d = div('lbl'); d.appendChild(ico(ICONS[icon])); return d; };
  const step = (key, delta) => (a) => rebuild(a, { [key]: round2(clampN(a.o[key] + delta, 0.5, 3)) });
  const cycle = (key, list) => (a) => rebuild(a, { [key]: list[(list.indexOf(a.o[key]) + 1) % list.length] });

  const shapeBtn = tbBtn('Change arrow shape', 'shape', cycle('shape', ['curve', 'straight', 'zigzag', 'spiral']));
  const dot = div('dot');
  const colorBtn = tbBtn('Change color', dot, () => { tbColors.hidden = !tbColors.hidden; });

  Object.keys(BA.COLORS).forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = name;
    b.setAttribute('aria-label', name);
    b.dataset.value = name;
    b.style.setProperty('--c', BA.COLORS[name]);
    b.addEventListener('click', () => { if (selected) rebuild(selected, { color: name }); });
    tbColors.appendChild(b);
  });

  tbRow.append(
    label('font'), tbBtn('Smaller text', 'minus', step('fontScale', -0.1)), tbBtn('Larger text', 'plus', step('fontScale', 0.1)),
    sep(),
    label('arrow'), tbBtn('Smaller arrow', 'minus', step('arrowScale', -0.1)), tbBtn('Larger arrow', 'plus', step('arrowScale', 0.1)),
    sep(),
    colorBtn, shapeBtn,
    tbBtn('Switch between arrow, ring and box', 'style', cycle('style', ['arrow', 'ring', 'box'])),
    tbBtn('Flip the curve', 'flip', (a) => rebuild(a, { flip: !a.o.flip })),
    tbBtn('Rotate the sign around the target', 'rotate', (a) => {
      const g = a.inst.geom;
      const so = a.inst.state.signOffset || (g ? [g.sx - g.c0[0], g.sy - g.c0[1]] : [0, 120]);
      const t = Math.PI / 4, cs = Math.cos(t), sn = Math.sin(t);
      a.inst.state.signOffset = [so[0] * cs - so[1] * sn, so[0] * sn + so[1] * cs];
      a.key = '';
    }),
    sep(),
    tbBtn('Edit text (or double-click the sign)', 'edit', startEdit),
    tbBtn('Reset position', 'reset', (a) => { a.inst.state.signOffset = null; a.inst.state.tgtOffset = null; a.key = ''; }),
    tbBtn('Delete', 'trash', (a) => removeArrow(a), 'del')
  );

  function refreshToolbar() {
    if (!selected) return;
    dot.style.background = BA.resolveColor(selected.o.color);
    shapeBtn.disabled = selected.o.style !== 'arrow';
    tbColors.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === selected.o.color)));
  }

  function select(a) {
    if (selected && selected !== a && arrows.has(selected)) selected.inst.setSelected(false);
    selected = a;
    if (a) { a.inst.setSelected(true); tbColors.hidden = true; refreshToolbar(); }
    tb.hidden = !a;
  }

  function placeToolbar(view) {
    if (!selected) return;
    tb.hidden = selected.editing;
    refreshToolbar();
    const g = selected.inst.geom;
    if (!g || tb.hidden) return;
    const w = tb.offsetWidth, h = tb.offsetHeight;
    const x = clampN(g.sx - w / 2, 8, view.w - w - 8);
    const above = g.c0[1] >= g.sy; // keep the toolbar on the side away from the target
    let y = above ? g.sy - g.sh / 2 - h - 16 : g.sy + g.sh / 2 + 16;
    if (y < 8) y = g.sy + g.sh / 2 + 16;
    else if (y + h > view.h - 8) y = g.sy - g.sh / 2 - h - 16;
    y = clampN(y, 8, view.h - h - 8);
    tb.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  /* ---------- global updates from the popup ---------- */

  let pending = null, pendingRaf = 0;
  function queueAll(patch) {
    pending = Object.assign(pending || {}, patch);
    if (pendingRaf) return;
    pendingRaf = requestAnimationFrame(() => {
      const p = pending;
      pending = null;
      pendingRaf = 0;
      arrows.forEach((a) => {
        if (p._resetSign) { a.inst.state.signOffset = null; a.inst.state.tgtOffset = null; }
        rebuild(a, p);
      });
    });
  }

  /* ---------- page events ---------- */

  window.addEventListener('pointerdown', (e) => {
    if (!selected || e.composedPath().indexOf(host) > -1) return;
    select(null);
  }, true);

  window.addEventListener('click', (e) => {
    if (e.composedPath().indexOf(host) > -1) return;
    arrows.forEach((a) => {
      if (!a.o.untilClick) return;
      const t = a.target;
      let hit = false;
      if (t.el) hit = e.composedPath().indexOf(t.el) > -1;
      else {
        const r = rectOf(t);
        hit = e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h;
      }
      if (hit) setTimeout(() => removeArrow(a), 120);
    });
  }, true);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !picking && selected && !selected.editing) select(null);
  }, true);

  /* ---------- target picking ---------- */

  function labelFor(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/)[0];
    return s.length > 40 ? s.slice(0, 39) + '…' : s;
  }

  function elementAt(x, y) {
    const list = document.elementsFromPoint(x, y);
    return list.find((e) => e !== host) || document.body || document.documentElement;
  }

  function stopPick() {
    if (!picking) return;
    picking.nodes.forEach((n) => n.remove());
    window.removeEventListener('keydown', picking.onKey, true);
    window.removeEventListener('scroll', picking.onScroll, true);
    picking = null;
  }

  function startPick(opts) {
    stopPick();
    if (opts) lastOpts = BA.sanitize(opts);
    if (opts && opts.steps) setStepsMode(true);
    if (opts && opts.inlineEdit) setInlineEditMode(true);
    const pl = div('pick');
    const hl = div('hl');
    const tag = div('tag');
    hl.appendChild(tag);
    hl.hidden = true;
    const hint = div('hint');
    const kbd = document.createElement('kbd');
    kbd.textContent = 'Esc';
    hint.append(document.createTextNode('Click anything to point at it. Drag to mark an area.'), kbd);
    layer.append(pl, hl, hint);

    let down = null, dragging = false, last = null;

    const show = (r, text, area) => {
      hl.hidden = false;
      hl.classList.toggle('area', !!area);
      hl.classList.toggle('below', r.y < 28);
      hl.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;';
      tag.textContent = text;
    };

    const hover = (x, y) => {
      const el = elementAt(x, y);
      const r = el.getBoundingClientRect();
      show({ x: r.left, y: r.top, w: r.width, h: r.height }, labelFor(el) + '  ' + Math.round(r.width) + '×' + Math.round(r.height));
      return el;
    };

    const dragRect = (x, y) => ({
      x: Math.min(down.x, x), y: Math.min(down.y, y), w: Math.abs(x - down.x), h: Math.abs(y - down.y)
    });

    pl.addEventListener('mousemove', (e) => {
      last = [e.clientX, e.clientY];
      if (down && (dragging || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6)) {
        dragging = true;
        const r = dragRect(e.clientX, e.clientY);
        show(r, Math.round(r.w) + '×' + Math.round(r.h), true);
      } else if (!down) hover(e.clientX, e.clientY);
    });
    pl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      down = { x: e.clientX, y: e.clientY };
    });
    pl.addEventListener('mouseup', (e) => {
      if (e.button !== 0 || !down) return;
      e.preventDefault();
      let target;
      if (dragging) {
        const r = dragRect(e.clientX, e.clientY);
        target = { x: r.x + window.scrollX, y: r.y + window.scrollY, w: Math.max(r.w, 8), h: Math.max(r.h, 8) };
      } else {
        target = { el: elementAt(e.clientX, e.clientY) };
      }
      stopPick();
      addArrow(target, opts);
    });
    pl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
    pl.addEventListener('contextmenu', () => stopPick());

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopPick(); }
    };
    const onScroll = () => { if (last && !down) requestAnimationFrame(() => hover(last[0], last[1])); };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);

    picking = { nodes: [pl, hl, hint], onKey, onScroll };
  }

  /* ---------- steps mode ---------- */

  function ensureStepsBar() {
    if (stepsBar) return stepsBar;
    stepsBar = div('stepsbar');
    stepsBar.innerHTML = `
      <button type="button" data-act="prev" title="Previous step" aria-label="Previous">‹</button>
      <span class="label">1 / 1</span>
      <button type="button" data-act="next" title="Next step" aria-label="Next">›</button>
      <button type="button" class="exit" data-act="exit" title="Exit steps mode">Exit</button>
    `;
    stepsBar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'prev') goStep(-1);
      else if (act === 'next') goStep(1);
      else if (act === 'exit') setStepsMode(false);
    });
    shadow.appendChild(stepsBar);
    return stepsBar;
  }

  function applyStepsVisibility() {
    const bar = ensureStepsBar();
    if (!stepsOn) {
      bar.hidden = true;
      stepOrder.forEach((a) => { if (a.inst && a.inst.el) a.inst.el.style.visibility = ''; });
      return;
    }
    bar.hidden = false;
    if (stepOrder.length === 0) {
      const label = bar.querySelector('.label');
      if (label) label.textContent = '0 signs';
      const prev = bar.querySelector('[data-act="prev"]');
      const next = bar.querySelector('[data-act="next"]');
      if (prev) prev.disabled = true;
      if (next) next.disabled = true;
      return;
    }
    if (currentStep < 0) currentStep = 0;
    if (currentStep >= stepOrder.length) currentStep = stepOrder.length - 1;
    stepOrder.forEach((a, i) => {
      if (a.inst && a.inst.el) a.inst.el.style.visibility = i === currentStep ? '' : 'hidden';
    });
    const label = bar.querySelector('.label');
    if (label) label.textContent = (currentStep + 1) + ' / ' + stepOrder.length;
    const prev = bar.querySelector('[data-act="prev"]');
    const next = bar.querySelector('[data-act="next"]');
    if (prev) prev.disabled = currentStep <= 0;
    if (next) next.disabled = currentStep >= stepOrder.length - 1;
  }

  function goStep(delta) {
    if (!stepsOn || !stepOrder.length) return;
    const next = currentStep + delta;
    if (next < 0 || next >= stepOrder.length) return;
    currentStep = next;
    applyStepsVisibility();
    const a = stepOrder[currentStep];
    if (a && a.target) {
      const el = a.target.el;
      if (el && el.isConnected && typeof el.scrollIntoView === 'function') {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch (e) { /* ignore */ }
      }
    }
  }

  function setStepsMode(on) {
    stepsOn = !!on;
    if (stepsOn) {
      currentStep = 0;
      applyStepsVisibility();
      if (stepOrder.length) goStep(0);
    } else {
      applyStepsVisibility();
    }
  }


  /* ---------- inline editor: click any page text → point + edit ---------- */

  function isOurUi(el) {
    if (!el) return false;
    if (el === host || (host.contains && host.contains(el))) return true;
    try {
      const root = el.getRootNode && el.getRootNode();
      if (root && root === shadow) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function findTextTarget(start) {
    let el = start;
    if (!el || el === document.documentElement || el === document.body) return null;
    // Climb to a meaningful text-bearing element
    const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'HTML', 'BODY', 'HEAD']);
    for (let i = 0; i < 8 && el; i++) {
      if (isOurUi(el)) return null;
      const tag = (el.tagName || '').toUpperCase();
      if (SKIP.has(tag)) { el = el.parentElement; continue; }
      if (tag === 'INPUT' || tag === 'TEXTAREA') return el;
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length > 0 && text.length < 500) {
        // Prefer leaf-ish elements over huge containers
        if (tag === 'DIV' || tag === 'SECTION' || tag === 'MAIN' || tag === 'ARTICLE') {
          if (el.childElementCount > 4) { el = el.parentElement; continue; }
        }
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function findArrowForEl(el) {
    for (const a of arrows) {
      if (a.target && a.target.el === el) return a;
    }
    return null;
  }

  function showInlineHint() {
    if (inlineHint) return;
    inlineHint = div('inline-hint');
    inlineHint.innerHTML = '<span>Click any text on the page to point at it and edit it</span>';
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.textContent = 'Done';
    exit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setInlineEditMode(false);
    });
    inlineHint.appendChild(exit);
    shadow.appendChild(inlineHint);
  }

  function hideInlineHint() {
    if (inlineHint) { inlineHint.remove(); inlineHint = null; }
  }

  function onPageClickForInline(e) {
    if (!inlineEditOn) return;
    if (e.button != null && e.button !== 0) return;
    if (isOurUi(e.target)) return;
    // Don't steal clicks while an editor is already open
    if (editOverlay) return;

    const el = findTextTarget(e.target);
    if (!el) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    let a = findArrowForEl(el);
    if (!a) {
      const base = lastOpts ? Object.assign({}, lastOpts) : {};
      // Default sign text from the page text so the pointer "says" what it points at
      const pageTxt = readTargetText({ el }).slice(0, 140);
      if (!base.text || base.text === 'Click here') base.text = pageTxt || 'Look here';
      base.stay = true; // keep while editing
      addArrow({ el }, base);
      // The arrow we just added is selected
      a = selected;
    }
    if (a) {
      // Open editor so user can change page text + sign label
      setTimeout(() => startEdit(a), 40);
    }
  }

  function setInlineEditMode(on) {
    inlineEditOn = !!on;
    arrows.forEach((a) => {
      if (a.inst && a.inst.signEl) {
        a.inst.signEl.classList.toggle('inline-edit', inlineEditOn);
        if (inlineEditOn) a.inst.signEl.title = 'Click page text to edit & point · double-click sign to edit';
        else a.inst.signEl.removeAttribute('title');
      }
    });
    if (inlineEditOn) {
      showInlineHint();
      if (!inlineClickBound) {
        document.addEventListener('click', onPageClickForInline, true);
        inlineClickBound = true;
      }
    } else {
      hideInlineHint();
      if (inlineClickBound) {
        document.removeEventListener('click', onPageClickForInline, true);
        inlineClickBound = false;
      }
    }
  }

  /* ---------- messages ---------- */


  // 'from' (where the sign sits) is deliberately not here: applying a look never moves signs.
  const LOOK_KEYS = ['color', 'style', 'shape', 'size', 'border', 'closeButton'];

  function exportData() {
    const vw = host.clientWidth || window.innerWidth;
    const vh = host.clientHeight || window.innerHeight;
    const sx = window.scrollX || window.pageXOffset || 0;
    const sy = window.scrollY || window.pageYOffset || 0;
    const docW = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0, vw);
    const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0, vh);
    const signs = [];
    // Prefer placement order so focusSign index matches export index
    const ordered = stepOrder.length ? stepOrder.slice() : Array.from(arrows);
    ordered.forEach((a) => {
      if (!arrows.has(a)) return;
      const rect = rectOf(a.target);
      if (!rect) return;
      syncState(a);
      const pageRect = { x: rect.x + sx, y: rect.y + sy, w: rect.w, h: rect.h };
      let signPage = null;
      try {
        if (a.inst && a.inst.signEl) {
          const sr = a.inst.signEl.getBoundingClientRect();
          if (sr.width || sr.height) {
            signPage = { x: sr.left + sx, y: sr.top + sy, w: sr.width, h: sr.height };
          }
        }
      } catch (e) { /* ignore */ }
      signs.push({
        rect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
        pageRect,
        signPage,
        o: Object.assign({}, a.o)
      });
    });
    return {
      ok: true,
      count: signs.length,
      view: { w: vw, h: vh },
      page: { w: docW, h: docH, scrollX: sx, scrollY: sy, dpr: window.devicePixelRatio || 1 },
      url: location.href,
      title: document.title,
      signs
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, send) => {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ba:export') { send(exportData()); return; }
    if (msg.type === 'ba:visible') { host.style.visibility = msg.value ? 'visible' : 'hidden'; send({ ok: true }); return; }
    if (msg.type === 'ba:focusSign') {
      const list = stepOrder.length ? stepOrder : Array.from(arrows);
      const i = Math.max(0, Math.min(list.length - 1, Number(msg.index) || 0));
      const a = list[i];
      if (!a) { send({ ok: false }); return; }
      const el = a.target && a.target.el;
      if (el && el.isConnected && el.scrollIntoView) {
        try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); }
        catch (e) {
          try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e2) { /* ignore */ }
        }
      } else if (a.target && a.target.x != null) {
        const y = a.target.y - (window.innerHeight / 2) + (a.target.h || 0) / 2;
        const x = a.target.x - (window.innerWidth / 2) + (a.target.w || 0) / 2;
        try { window.scrollTo({ left: Math.max(0, x), top: Math.max(0, y), behavior: 'instant' }); }
        catch (e) { window.scrollTo(Math.max(0, x), Math.max(0, y)); }
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const rect = rectOf(a.target);
            syncState(a);
            send({
              ok: true,
              index: i,
              rect: rect,
              scrollX: window.scrollX || 0,
              scrollY: window.scrollY || 0,
              view: { w: window.innerWidth, h: window.innerHeight },
              o: Object.assign({}, a.o)
            });
          }, 60);
        });
      });
      return true;
    }
    if (msg.type === 'ba:scrollTo') {
      const x = Number(msg.x) || 0;
      const y = Number(msg.y) || 0;
      try { window.scrollTo({ left: x, top: y, behavior: 'instant' }); }
      catch (e) { window.scrollTo(x, y); }
      // two frames + short timeout so lazy layouts settle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            send({
              ok: true,
              scrollX: window.scrollX || window.pageXOffset || 0,
              scrollY: window.scrollY || window.pageYOffset || 0,
              view: { w: window.innerWidth, h: window.innerHeight }
            });
          }, 50);
        });
      });
      return true;
    }
    if (msg.type === 'ba:pick') startPick(msg.opts);
    else if (msg.type === 'ba:clear') clearAll();
    else if (msg.type === 'ba:global') {
      const p = {};
      ['fontScale', 'arrowScale'].forEach((k) => { if (msg[k] !== undefined) p[k] = msg[k]; });
      queueAll(p);
    } else if (msg.type === 'ba:applyAll') {
      const p = {};
      LOOK_KEYS.forEach((k) => { if (msg.look && msg.look[k] !== undefined) p[k] = msg.look[k]; });
      if (p.from !== undefined) p._resetSign = true;
      queueAll(p);
    } else if (msg.type === 'ba:resetPositions') {
      arrows.forEach((a) => { a.inst.state.signOffset = null; a.inst.state.tgtOffset = null; a.key = ''; });
    } else if (msg.type === 'ba:steps') {
      setStepsMode(!!msg.value);
    } else if (msg.type === 'ba:inlineEdit') {
      if (msg.opts) lastOpts = BA.sanitize(msg.opts);
      setInlineEditMode(!!msg.value);
    } else if (msg.type !== 'ba:ping') return;
    send({ ok: true, count: arrows.size });
  });
})();
