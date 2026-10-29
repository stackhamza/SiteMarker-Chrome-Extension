'use strict';

const MENU_PICK = 'ba-pick';
const MENU_CLEAR = 'ba-clear';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_PICK, title: 'SiteMarker: point at something…', contexts: ['all'] });
    chrome.contextMenus.create({ id: MENU_CLEAR, title: 'SiteMarker: remove all arrows', contexts: ['all'] });
  });
});

async function savedOpts() {
  const { opts } = await chrome.storage.sync.get('opts');
  // settings saved by an older version are ignored so the new all-off defaults apply
  return opts && opts.v === 2 ? opts : {};
}

async function pick(tabId, opts) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['core.js', 'content.js'] });
    await chrome.tabs.sendMessage(tabId, { type: 'ba:pick', opts: opts || (await savedOpts()) });
    return { ok: true };
  } catch (e) {
    flagError(tabId);
    return { ok: false, error: "Chrome doesn't allow extensions on this page. Try a regular website." };
  }
}

async function clear(tabId) {
  try { await chrome.tabs.sendMessage(tabId, { type: 'ba:clear' }); } catch (e) { /* nothing injected */ }
  return { ok: true };
}

function flagError(tabId) {
  chrome.action.setBadgeBackgroundColor({ color: '#FF453A', tabId });
  chrome.action.setBadgeText({ text: '!', tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 2500);
}

async function activeTabId(tab) {
  if (tab && tab.id) return tab.id;
  const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return t && t.id;
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  const id = await activeTabId(tab);
  if (!id) return;
  if (command === 'pick-target') pick(id);
  if (command === 'clear-arrows') clear(id);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === MENU_PICK) pick(tab.id);
  if (info.menuItemId === MENU_CLEAR) clear(tab.id);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'pick') { pick(msg.tabId, msg.opts).then(sendResponse); return true; }
  if (msg.type === 'clear') { clear(msg.tabId).then(sendResponse); return true; }
});
