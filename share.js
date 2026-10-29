(async () => {
  'use strict';
  const app = document.getElementById('app');
  const V = window.SiteMarkerViewer;

  const style = document.createElement('style');
  style.textContent = V.CSS;
  document.head.appendChild(style);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const note = (html) => { app.innerHTML = '<div class="sv"><div class="sv-empty">' + html + '</div></div>'; };

  const m = /^#\/s\/([a-z0-9]+)$/i.exec(location.hash);

  if (!m) {
    const idx = (await chrome.storage.local.get('shareIndex')).shareIndex || [];
    if (!idx.length) return note('No shared pages yet.<br>Place a sign, then press <b>Share</b> in the SiteMarker popup.');
    const items = idx.map((d) => '<p><a href="#/s/' + esc(d.id) + '">' + esc(d.title || d.url) + '</a> · ' + (d.tour ? 'tour · ' : '') + d.count + (d.count === 1 ? ' sign' : ' signs') + ' · ' + esc(new Date(d.created).toLocaleString()) + '</p>').join('');
    note('<h2>Your shared pages</h2>' + items);
    window.addEventListener('hashchange', () => location.reload());
    return;
  }

  const id = m[1];
  const data = (await chrome.storage.local.get('share:' + id))['share:' + id];
  if (!data) return note('This share link was not found in this browser.<br>Ask the sender for the downloaded feedback file, which opens anywhere.');

  async function buildHtml() {
    const [core, viewer] = await Promise.all(['core.js', 'viewer.js'].map((f) => fetch(chrome.runtime.getURL(f)).then((r) => r.text())));
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>SiteMarker feedback</title></head><body><div id="app"></div>' +
      '<script>' + core + '<\/script><script>' + viewer + '<\/script>' +
      '<script>SiteMarkerViewer.mount(document.getElementById("app"), ' + json + ', { standalone: true });<\/script></body></html>';
  }

  async function download() {
    const blob = new Blob([await buildHtml()], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sitemarker-feedback-' + id + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  document.title = 'SiteMarker feedback: ' + (data.title || data.url);
  V.mount(app, data, { link: location.href, onDownload: download });
})();
