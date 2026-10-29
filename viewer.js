/*! SiteMarker feedback viewer. Shows a captured page with its signs on top and lets anyone copy the text.
    Used by share.html inside the extension and inlined into the downloadable feedback file. MIT. */
(function (global) {
  'use strict';
  const BA = global.BigArrow;

  const CSS = `
:root{color-scheme:light dark;--bg:#F1F4F9;--surface:#FFFFFF;--ink:#0D1523;--muted:#5B6678;--line:#D9DFEA;--blue:#0A84FF}
@media (prefers-color-scheme:dark){:root{--bg:#0A0E15;--surface:#141A26;--ink:#EDF1F8;--muted:#8F9BB0;--line:#252F42}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:500 14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.sv{max-width:1200px;margin:0 auto;padding:20px 18px 40px}
.sv-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
.sv-top h1{margin:0 0 4px;font-size:19px;letter-spacing:-.01em}
.sv-meta{margin:0;color:var(--muted);font-size:12.5px;word-break:break-all}
.sv-btns{display:flex;gap:8px;flex-wrap:wrap}
.sv-btn{height:36px;padding:0 14px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:700 13px system-ui,sans-serif;cursor:pointer}
.sv-btn:hover{border-color:var(--blue)}
.sv-btn.pri{background:var(--blue);border-color:transparent;color:#fff}
.sv-btn.done{background:#30D158;border-color:transparent;color:#0B0F14}
.sv-wrap{position:relative;overflow:hidden;margin:0 auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.sv-stage{position:absolute;left:0;top:0;transform-origin:0 0}
.sv-stage img{display:block;width:100%;height:100%;user-select:none;-webkit-user-select:none}
.sv-stage .ba .sign{user-select:text;-webkit-user-select:text;cursor:text;touch-action:auto}
.sv-stage .ba .x{display:none}
.sv-stage .ba .grab{cursor:default}
.sv h2{margin:24px 0 10px;font-size:15px}
.sv-list{display:grid;gap:10px}
.sv-card{display:grid;gap:8px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.sv-head{display:flex;align-items:center;gap:10px}
.sv-badge{display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;font:800 12px system-ui,sans-serif}
.sv-text{font-weight:700;user-select:text;-webkit-user-select:text;word-break:break-word}
.sv-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid var(--line)}
.sv-row .lbl{flex:none;color:var(--muted);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.sv-row .val{flex:1;min-width:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;user-select:text;-webkit-user-select:text;word-break:break-all}
.sv-row .val.old{text-decoration:line-through;opacity:.75}
.sv-cp{flex:none;height:30px;padding:0 12px;border:1.5px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);font:700 12px system-ui,sans-serif;cursor:pointer}
.sv-cp:hover{border-color:var(--blue)}
.sv-cp.done{background:#30D158;border-color:transparent;color:#0B0F14}
.sv-foot{margin-top:22px;color:var(--muted);font-size:12px;text-align:center}
.sv-empty{padding:40px 10px;text-align:center;color:var(--muted)}
.sv-empty a{color:var(--blue)}
.sv-nav{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 6px}
.sv-nav button{height:36px;min-width:36px;padding:0 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:700 14px system-ui,sans-serif;cursor:pointer}
.sv-nav button:hover:not(:disabled){border-color:var(--blue)}
.sv-nav button:disabled{opacity:.35;cursor:default}
.sv-nav .sv-pg{min-width:5em;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.sv-stage .ba .sign.inline-edit{outline:2px dashed color-mix(in srgb,var(--blue) 55%,transparent);outline-offset:3px}
.sv-stage .ba .sign.inline-edit .txt{cursor:text;user-select:text;-webkit-user-select:text}
.sv-stage .ba .sign.inline-edit .chg{cursor:text;user-select:text;-webkit-user-select:text}
`;

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallback(text));
    }
    fallback(text);
    return Promise.resolve();
  }
  function fallback(text) {
    const ta = h('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  function copyButton(getText, label, cls) {
    const b = h('button', cls || 'sv-cp', label || 'Copy');
    b.type = 'button';
    let t = 0;
    b.addEventListener('click', () => {
      copy(typeof getText === 'function' ? getText() : getText).then(() => {
        const was = label || 'Copy';
        b.textContent = 'Copied';
        b.classList.add('done');
        clearTimeout(t);
        t = setTimeout(() => { b.textContent = was; b.classList.remove('done'); }, 1500);
      });
    });
    return b;
  }

  function row(label, value, old) {
    const r = h('div', 'sv-row');
    r.append(h('span', 'lbl', label), h('span', 'val' + (old ? ' old' : ''), value), copyButton(value));
    return r;
  }

  const plain = (t) => String(t || '').replace(/\{\{([^{}]+)\}\}/g, '$1').trim();
  const codes = (t) => { const out = []; String(t || '').replace(/\{\{([^{}]+)\}\}/g, (_, c) => { out.push(c.trim()); }); return out; };

  function mount(container, data, opts) {
    opts = opts || {};
    const style = document.createElement('style');
    style.textContent = BA.CSS + CSS;
    document.head.appendChild(style);

    const pages = data.pages && data.pages.length ? data.pages : [data];
    let pageIndex = 0;
    const inlineEdit = !!data.inlineEdit;

    const root = h('div', 'sv');
    const top = h('div', 'sv-top');
    const titleBox = h('div');
    const h1 = h('h1', '', pages.length > 1 ? 'SiteMarker tour' : 'SiteMarker feedback');
    if (pages.length > 1) h1.textContent = 'SiteMarker tour (' + pages.length + ' steps)';
    const meta = h('p', 'sv-meta', '');
    titleBox.append(h1, meta);
    const btns = h('div', 'sv-btns');
    if (opts.link) btns.appendChild(copyButton(opts.link, 'Copy share link', 'sv-btn'));
    if (opts.onDownload) {
      const d = h('button', 'sv-btn pri', 'Download page to send');
      d.type = 'button';
      d.addEventListener('click', () => opts.onDownload());
      btns.appendChild(d);
    }
    top.append(titleBox, btns);
    root.appendChild(top);

    let nav = null;
    if (pages.length > 1) {
      nav = h('div', 'sv-nav');
      const prev = h('button', '', '‹ Previous section');
      prev.type = 'button';
      const label = h('span', 'sv-pg', '1 / ' + pages.length);
      const next = h('button', '', 'Next section ›');
      next.type = 'button';
      prev.addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPage(); } });
      next.addEventListener('click', () => { if (pageIndex < pages.length - 1) { pageIndex++; renderPage(); } });
      nav.append(prev, label, next);
      nav._prev = prev;
      nav._next = next;
      nav._label = label;
      root.appendChild(nav);
    }

    const wrap = h('div', 'sv-wrap');
    const stage = h('div', 'sv-stage');
    wrap.appendChild(stage);
    root.appendChild(wrap);

    root.appendChild(h('h2', '', 'Everything you can copy'));
    const list = h('div', 'sv-list');
    root.appendChild(list);
    if (!opts.standalone) root.appendChild(h('p', 'sv-foot', 'Made with SiteMarker. Use “Download page to send” to give this to someone who does not have the extension.'));
    else root.appendChild(h('p', 'sv-foot', 'Made with SiteMarker'));

    container.replaceChildren(root);

    function fit(view) {
      const k = Math.min(1, wrap.clientWidth / view.w) || 1;
      stage.style.transform = 'scale(' + k + ')';
      wrap.style.height = Math.round(view.h * k) + 'px';
      wrap.style.maxWidth = view.w + 'px';
    }

    function renderPage() {
      const page = pages[pageIndex];
      const view = page.view || { w: 1200, h: 800 };
      const stepName = page.stepLabel ? ('“' + page.stepLabel + '” · ') : '';
      meta.textContent = stepName + (page.title ? page.title + ' · ' : '') + (page.url || '') +
        (pages.length > 1 ? '  ·  step ' + (pageIndex + 1) + ' of ' + pages.length : '');
      if (nav) {
        nav._label.textContent = (pageIndex + 1) + ' / ' + pages.length;
        nav._prev.disabled = pageIndex <= 0;
        nav._next.disabled = pageIndex >= pages.length - 1;
      }

      stage.replaceChildren();
      stage.style.width = view.w + 'px';
      stage.style.height = view.h + 'px';
      const img = new Image();
      img.alt = 'Captured page';
      img.draggable = false;
      img.src = page.shot || '';
      stage.appendChild(img);

      list.replaceChildren();
      (page.signs || []).forEach((s, i) => {
        const o = s.o || {};
        const color = BA.resolveColor(o.color);
        const r = s.rect || { x: 0, y: 0, w: 0, h: 0 };
        const x1 = Math.max(r.x, 0), y1 = Math.max(r.y, 0);
        const x2 = Math.min(r.x + r.w, view.w), y2 = Math.min(r.y + r.h, view.h);
        if (x2 > x1 && y2 > y1) {
          const inst = BA.create(Object.assign({}, o, { animateIn: false, closeButton: false }));
          stage.appendChild(inst.el);
          inst.update({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, view);
          if (inlineEdit && inst.signEl) {
            inst.signEl.classList.add('inline-edit');
            const enableEdit = (el, onDone) => {
              if (!el) return;
              try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; }
              if (el.contentEditable !== 'plaintext-only' && el.contentEditable !== 'true') {
                el.setAttribute('contenteditable', 'true');
              }
              el.addEventListener('keydown', (e) => e.stopPropagation());
              el.addEventListener('pointerdown', (e) => e.stopPropagation());
              el.addEventListener('blur', () => onDone(el));
            };
            enableEdit(inst.signEl.querySelector('.txt'), (txt) => {
              o.text = (txt.textContent || '').replace(/\s+/g, ' ').trim();
              const cardText = list.querySelector('[data-sign-i="' + i + '"] .sv-text');
              if (cardText) cardText.textContent = plain(o.text) || '(no text)';
            });
            enableEdit(inst.signEl.querySelector('.chg'), (chg) => {
              o.richNote = (chg.innerText || '').trim();
              o.change = !!o.richNote;
            });
          }
        }

        const card = h('div', 'sv-card');
        card.dataset.signI = String(i);
        const head = h('div', 'sv-head');
        const badge = h('span', 'sv-badge', String(i + 1));
        badge.style.background = color;
        badge.style.color = BA.isLight(color) ? '#0B0F14' : '#FFFFFF';
        const text = h('div', 'sv-text', plain(o.text) || '(no text)');
        text.style.flex = '1';
        head.append(badge, text);
        if (plain(o.text)) head.appendChild(copyButton(() => plain(o.text), 'Copy text'));
        card.appendChild(head);
        codes(o.text).forEach((c) => card.appendChild(row('Code', c)));
        if (o.change && o.richNote) card.appendChild(row('Note', o.richNote));
        else {
          if (o.change && o.changeFrom) card.appendChild(row('Change', o.changeFrom, true));
          if (o.change && o.changeTo) card.appendChild(row('To', o.changeTo));
        }
        list.appendChild(card);
      });

      fit(view);
    }

    renderPage();
    window.addEventListener('resize', () => {
      const page = pages[pageIndex];
      if (page && page.view) fit(page.view);
    });
  }

  global.SiteMarkerViewer = { mount, CSS };
})(window);
