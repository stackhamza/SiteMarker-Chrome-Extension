(async () => {
  'use strict';
  const BA = window.BigArrow;
  const $ = (s) => document.querySelector(s);
  const PHRASES = ['Click here', 'Look here', 'Start here', 'Type your name', 'Sign here', 'Read this first', 'Not this one', 'Press Allow', 'Copy {{482913}} and paste it'];

  const css = document.createElement('style');
  css.textContent = BA.CSS;
  document.head.appendChild(css);

  // Settings saved by an older version are dropped once, so the new all-off defaults apply.
  const SETTINGS_VERSION = 2;
  const stored = (await chrome.storage.sync.get('opts')).opts;
  let opts = BA.sanitize(Object.assign({}, BA.DEFAULTS, stored && stored.v === SETTINGS_VERSION ? stored : {}));
  opts.v = SETTINGS_VERSION;
  if (opts.duration < 1) { opts.duration = 10; opts.stay = true; }

  const stage = $('#stage');
  const mockBtn = $('#mockBtn');
  const msg = $('#msg');
  let inst = null, saveTimer = 0;

  const persistable = () => Object.assign({}, opts, { signOffset: null, tgtOffset: null });
  const say = (text, err) => { msg.textContent = text || ''; msg.classList.toggle('err', !!err); };

  /* ---------- controls ---------- */

  const swatches = $('#swatches');
  Object.keys(BA.COLORS).forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.value = name;
    b.title = name[0].toUpperCase() + name.slice(1);
    b.setAttribute('aria-label', b.title);
    b.style.setProperty('--c', BA.COLORS[name]);
    swatches.appendChild(b);
  });

  const PAD = [
    ['top-left', 'Sign top left'], ['top', 'Sign above'], ['top-right', 'Sign top right'],
    ['left', 'Sign on the left'], ['auto', 'Auto'], ['right', 'Sign on the right'],
    ['bottom-left', 'Sign bottom left'], ['bottom', 'Sign below'], ['bottom-right', 'Sign bottom right']
  ];
  const pad = $('#pad');
  PAD.forEach(([value, title]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.value = value;
    b.title = title;
    b.setAttribute('aria-label', title);
    if (value === 'auto') b.textContent = 'Auto';
    pad.appendChild(b);
  });

  const groups = [
    { root: swatches, key: 'color' },
    { root: pad, key: 'from' },
    ...Array.from(document.querySelectorAll('.seg')).map((root) => ({ root, key: root.dataset.key }))
  ];
  groups.forEach((g) => g.root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (!b || b.disabled) return;
    opts[g.key] = b.dataset.value;
    changed();
  }));

  document.querySelectorAll('input.switch[data-key]').forEach((i) => i.addEventListener('change', () => {
    opts[i.dataset.key] = i.checked;
    changed();
  }));
  $('#autohide').addEventListener('change', (e) => { opts.stay = !e.target.checked; changed(); });
  $('#outline').addEventListener('change', (e) => { opts.border = e.target.checked ? 'contrast' : 'shadow'; changed(); });
  $('#stepsOn').addEventListener('change', (e) => {
    opts.steps = e.target.checked;
    changed();
    sendToPage({ type: 'ba:steps', value: !!opts.steps });
  });
  $('#text').addEventListener('input', (e) => { opts.text = e.target.value; changed(true); });
  $('#changeOn').addEventListener('change', (e) => { opts.change = e.target.checked; changed(); });
  $('#richNote').addEventListener('input', (e) => { opts.richNote = e.target.value; changed(true); });
  $('#inlineEditOn').addEventListener('change', (e) => {
    opts.inlineEdit = e.target.checked;
    changed();
    // Ensure content script is on the page, then enable click-any-text mode
    sendToPage({ type: 'ba:inlineEdit', value: !!opts.inlineEdit, opts: persistable() }).then((r) => {
      if (opts.inlineEdit && !r) say('Open a normal website tab, then turn Inline editor on again.', true);
      else if (opts.inlineEdit) say('Inline editor on: click any text on the page to point at it and edit it.');
      else say('Inline editor off.');
    });
  });
  const pushGlobal = () => sendToPage({ type: 'ba:global', fontScale: opts.fontScale, arrowScale: opts.arrowScale });
  $('#fontScale').addEventListener('input', (e) => { opts.fontScale = Number(e.target.value) / 100; changed(); pushGlobal(); });
  $('#arrowScale').addEventListener('input', (e) => { opts.arrowScale = Number(e.target.value) / 100; changed(); pushGlobal(); });
  $('#applyAll').addEventListener('click', async () => {
    const look = { color: opts.color, style: opts.style, shape: opts.shape, size: opts.size, border: opts.border, closeButton: opts.closeButton };
    await sendToPage({ type: 'ba:applyAll', look });
    await sendToPage({ type: 'ba:global', fontScale: opts.fontScale, arrowScale: opts.arrowScale });
    refreshCount();
  });
  $('#resetPos').addEventListener('click', () => sendToPage({ type: 'ba:resetPositions' }));
  $('#duration').addEventListener('input', (e) => { opts.duration = Number(e.target.value); changed(); });
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }));
  $('#shuffle').addEventListener('click', () => {
    let next;
    do { next = PHRASES[Math.floor(Math.random() * PHRASES.length)]; } while (next === opts.text && PHRASES.length > 1);
    opts.text = next;
    $('#text').value = next;
    changed();
  });

  /* ---------- render ---------- */

  function syncUI(skipText) {
    const root = document.documentElement.style;
    const mono = opts.color === 'white' || opts.color === 'black';
    root.setProperty('--accent', mono ? 'var(--ink)' : BA.resolveColor(opts.color));
    root.setProperty('--accent-ink', mono ? 'var(--bg)' : (BA.isLight(BA.resolveColor(opts.color)) ? '#0B0F14' : '#FFFFFF'));

    groups.forEach((g) => g.root.querySelectorAll('button[data-value]').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.value === opts[g.key]));
    }));
    $('#shapeSeg').querySelectorAll('button').forEach((b) => { b.disabled = opts.style !== 'arrow'; });
    document.querySelectorAll('input.switch[data-key]').forEach((i) => { i.checked = !!opts[i.dataset.key]; });
    $('#autohide').checked = !opts.stay;
    $('#outline').checked = opts.border === 'contrast';
    $('#stepsOn').checked = !!opts.steps;
    $('#inlineEditOn').checked = !!opts.inlineEdit;
    $('#duration').value = opts.duration;
    $('#durOut').textContent = opts.duration + ' s';
    $('#fontScale').value = Math.round(opts.fontScale * 100);
    $('#arrowScale').value = Math.round(opts.arrowScale * 100);
    $('#fontOut').textContent = Math.round(opts.fontScale * 100) + '%';
    $('#arrowOut').textContent = Math.round(opts.arrowScale * 100) + '%';
    $('#durRow').classList.toggle('off', !!opts.stay);
    $('#changeOn').checked = !!opts.change;
    $('#chgFields').hidden = !opts.change;
    if (!skipText) {
      $('#text').value = opts.text;
      $('#richNote').value = opts.richNote || '';
    }
  }

  function preview() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const dir = BA.DIRS[opts.from] || BA.DIRS.bottom;
    mockBtn.style.left = Math.round(W / 2 - dir[0] * W * 0.24) + 'px';
    mockBtn.style.top = Math.round(H / 2 - dir[1] * H * 0.22) + 'px';
    if (inst) inst.destroy();
    inst = BA.create(Object.assign({}, opts, { scale: 0.62, animateIn: false }));
    stage.appendChild(inst.el);
    const r = mockBtn.getBoundingClientRect(), s = stage.getBoundingClientRect();
    // the button animates to its new spot, so aim at where it is going
    const w = r.width, h = r.height;
    const cx = Math.round(W / 2 - dir[0] * W * 0.24), cy = Math.round(H / 2 - dir[1] * H * 0.22);
    inst.update({ x: cx - w / 2, y: cy - h / 2, w, h }, { w: W, h: H });
  }

  function changed(skipText) {
    syncUI(skipText);
    preview();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => chrome.storage.sync.set({ opts }), 250);
  }

  /* ---------- actions ---------- */

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  async function ensureContent() {
    if (!tab) return false;
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['core.js', 'content.js'] });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function sendToPage(m) {
    if (!tab) return null;
    try {
      return await chrome.tabs.sendMessage(tab.id, m);
    } catch (e) {
      // Content script not yet on the page — inject then retry once.
      if (!(await ensureContent())) return null;
      try { return await chrome.tabs.sendMessage(tab.id, m); } catch (e2) { return null; }
    }
  }
  async function refreshCount() {
    const r = await sendToPage({ type: 'ba:ping' });
    $('#count').textContent = r && r.count
      ? r.count + (r.count === 1 ? ' sign' : ' signs') + ' on this page. Changes apply to all of them live.'
      : 'No signs placed yet. Sizes you set here apply to every new sign.';
  }
  refreshCount();
  if (opts.steps) sendToPage({ type: 'ba:steps', value: true });
  if (opts.inlineEdit) sendToPage({ type: 'ba:inlineEdit', value: true, opts: persistable() });

  $('#pick').addEventListener('click', async () => {
    say('');
    chrome.storage.sync.set({ opts: persistable() });
    if (!tab) return say('No active tab found.', true);
    const res = await chrome.runtime.sendMessage({ type: 'pick', tabId: tab.id, opts: persistable() });
    if (res && res.ok) window.close();
    else say((res && res.error) || 'Something went wrong. Try reloading the page.', true);
  });

  $('#clear').addEventListener('click', async () => {
    if (!tab) return;
    await chrome.runtime.sendMessage({ type: 'clear', tabId: tab.id });
    say('Arrows removed from this page.');
  });

  $('#reset').addEventListener('click', () => {
    opts = BA.sanitize(Object.assign({}, BA.DEFAULTS));
    opts.v = SETTINGS_VERSION;
    changed();
    pushGlobal(); // signs already on the page go back to 100% text and arrow size; positions stay
    sendToPage({ type: 'ba:steps', value: false });
    sendToPage({ type: 'ba:inlineEdit', value: false });
    refreshCount();
    say('Settings reset to defaults. Every toggle is off.');
  });

  /* ---------- share + multi-page tour ---------- */

  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 8);
  const MAX_SHARES = 8;
  const MAX_TOUR_PAGES = 40;

  async function saveShare(share) {
    const idx = (await chrome.storage.local.get('shareIndex')).shareIndex || [];
    const count = share.pages ? share.pages.reduce((n, p) => n + (p.signs ? p.signs.length : 0), 0) : (share.signs || []).length;
    idx.unshift({ id: share.id, created: share.created, title: share.title, url: share.url, count, tour: !!share.pages });
    const drop = idx.splice(MAX_SHARES);
    await chrome.storage.local.set({ ['share:' + share.id]: share, shareIndex: idx });
    if (drop.length) await chrome.storage.local.remove(drop.map((d) => 'share:' + d.id));
  }

  async function capturePage() {
    // Capture ONE viewport section per sign (scroll each into view).
    // Share/tour then steps through these sections — no full-page stitch.
    const data = await sendToPage({ type: 'ba:export' });
    if (!data || !data.signs || !data.signs.length) return null;

    const count = data.signs.length;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const orig = data.page || { scrollX: 0, scrollY: 0 };

    await sendToPage({ type: 'ba:visible', value: false });
    await wait(100);

    const sections = [];
    try {
      for (let i = 0; i < count; i++) {
        const focused = await sendToPage({ type: 'ba:focusSign', index: i });
        await wait(320);
        let shot = null;
        try {
          shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 82 });
        } catch (e) { /* ignore */ }
        if (!shot) continue;

        const vw = (focused && focused.view && focused.view.w) || data.view.w;
        const vh = (focused && focused.view && focused.view.h) || data.view.h;
        const rect = (focused && focused.rect) || data.signs[i].rect;
        const o = (focused && focused.o) || data.signs[i].o;
        const label = (o && o.text) ? String(o.text).replace(/\{\{|\}\}/g, '').slice(0, 48) : ('Sign ' + (i + 1));

        sections.push({
          url: data.url,
          title: data.title,
          view: { w: vw, h: vh },
          shot,
          signs: [{ rect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h }, o: Object.assign({}, o) }],
          stepLabel: label,
          created: Date.now()
        });
      }
    } catch (e) {
      console.warn('SiteMarker section capture failed', e);
    }

    try {
      await sendToPage({ type: 'ba:scrollTo', x: orig.scrollX || 0, y: orig.scrollY || 0 });
    } catch (e) { /* ignore */ }
    await sendToPage({ type: 'ba:visible', value: true });

    if (!sections.length) return null;

    // Always return as a multi-section tour so Next/Prev works even on one page
    return {
      url: data.url,
      title: data.title,
      pages: sections,
      signs: sections[0].signs,
      view: sections[0].view,
      shot: sections[0].shot,
      created: Date.now()
    };
  }

  async function getTour() {
    return (await chrome.storage.local.get('tourDraft')).tourDraft || [];
  }
  async function setTour(pages) {
    await chrome.storage.local.set({ tourDraft: pages });
    refreshTourUI(pages);
  }
  function refreshTourUI(pages) {
    const n = (pages || []).length;
    const st = $('#tourStatus');
    const shareT = $('#shareTour');
    const clearT = $('#clearTour');
    if (n) {
      st.hidden = false;
      st.textContent = n + (n === 1 ? ' section' : ' sections') + ' in tour. Add more, then Share tour.';
      shareT.hidden = false;
      clearT.hidden = false;
      shareT.textContent = 'Share tour (' + n + ')';
    } else {
      st.hidden = true;
      shareT.hidden = true;
      clearT.hidden = true;
    }
  }

  // Flatten capture result into a list of section steps
  function sectionsFromCapture(cap) {
    if (!cap) return [];
    if (cap.pages && cap.pages.length) {
      return cap.pages.map((sec) => ({
        url: sec.url || cap.url,
        title: sec.title || cap.title,
        view: sec.view,
        shot: sec.shot,
        signs: sec.signs || [],
        stepLabel: sec.stepLabel || '',
        created: sec.created || Date.now()
      }));
    }
    if (cap.shot) {
      return [{
        url: cap.url,
        title: cap.title,
        view: cap.view,
        shot: cap.shot,
        signs: cap.signs || [],
        stepLabel: '',
        created: Date.now()
      }];
    }
    return [];
  }
  getTour().then(refreshTourUI);

  $('#share').addEventListener('click', async () => {
    say('Capturing each section…');
    if (!tab) return say('No active tab found.', true);
    const page = await capturePage();
    if (!page) return say('Place at least one sign on this page first, then share.', true);
    const sections = sectionsFromCapture(page);
    const share = {
      id: rid(),
      created: Date.now(),
      title: page.title || page.url,
      url: page.url,
      pages: sections,
      inlineEdit: !!opts.inlineEdit,
      // keep first section at top level for older viewers
      shot: sections[0].shot,
      view: sections[0].view,
      signs: sections[0].signs
    };
    try { await saveShare(share); } catch (e) { return say('Not enough storage to save the share. Try again.', true); }
    const link = chrome.runtime.getURL('share.html') + '#/s/' + share.id;
    try { await navigator.clipboard.writeText(link); } catch (e) { /* ignore */ }
    say('');
    chrome.tabs.create({ url: link });
  });

  $('#addTour').addEventListener('click', async () => {
    say('Capturing sections…');
    if (!tab) return say('No active tab found.', true);
    const page = await capturePage();
    if (!page) return say('Place at least one sign on this page first, then add it to the tour.', true);
    const fresh = sectionsFromCapture(page);
    let pages = await getTour();
    // Drop previous sections from the same URL, then append new ones
    pages = pages.filter((p) => p.url !== page.url);
    if (pages.length + fresh.length > MAX_TOUR_PAGES) {
      return say('Tour would exceed ' + MAX_TOUR_PAGES + ' sections. Clear tour or use fewer signs.', true);
    }
    pages = pages.concat(fresh);
    try { await setTour(pages); } catch (e) { return say('Not enough storage. Try fewer signs.', true); }
    say(fresh.length + ' section(s) added. Tour has ' + pages.length + ' total. Open another page or Share tour.');
  });

  $('#shareTour').addEventListener('click', async () => {
    say('');
    const pages = await getTour();
    if (!pages.length) return say('Add at least one section to the tour first.', true);
    // Flatten if any nested pages slipped in
    const flat = [];
    pages.forEach((p) => {
      if (p.pages && p.pages.length) flat.push.apply(flat, sectionsFromCapture(p));
      else flat.push(p);
    });
    const share = {
      id: rid(),
      created: Date.now(),
      title: 'Tour: ' + (flat[0].title || flat[0].url),
      url: flat[0].url,
      pages: flat,
      inlineEdit: !!opts.inlineEdit,
      shot: flat[0].shot,
      view: flat[0].view,
      signs: flat[0].signs
    };
    try { await saveShare(share); } catch (e) { return say('Not enough storage to save the tour. Try fewer sections.', true); }
    const link = chrome.runtime.getURL('share.html') + '#/s/' + share.id;
    try { await navigator.clipboard.writeText(link); } catch (e) { /* ignore */ }
    chrome.tabs.create({ url: link });
  });

  $('#clearTour').addEventListener('click', async () => {
    await setTour([]);
    say('Tour cleared.');
  });

  const keys = $('#keys');
  try {
    const cmds = await chrome.commands.getAll();
    const c = cmds.find((x) => x.name === 'pick-target');
    keys.textContent = c && c.shortcut ? c.shortcut : 'Set shortcut';
  } catch (e) { keys.textContent = 'Shortcuts'; }
  keys.addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));

  changed();
})();
