/* Live Chat Picker
 * - Doc live chat cua YouTube (light DOM: #content / #author-name / #message).
 * - Giavobserver luon bat, tu thu thap tin nhan den real-time.
 * - Nut "Scan chat": tu cuon len dau replay de load them tin cu (max 30p),
 *   thu thap toan bo history roi loc danh sach ten unique.
 * - Loc theo tu khoa (contain, non case-sensitive) trong noi dung tin nhan.
 * - Lay danh sach ten author, dedup, copy paste vao wheelofnames.com.
 * - Nut tiem vao header cua live chat (icon filter), panel dropdown.
 * Khong dung YouTube Data API, doc DOM truc tiep.
 */
(function () {
  'use strict';

  // ---- State ----
  const STORAGE_KEY = 'lcp_cfg_v1';
  let messages = [];            // {author, content}
  let seenKeys = new Set();     // dedup theo (author|content)
  const processedNodes = new WeakSet();  // node DOM da xu ly, khong thu lai sau Clear
  let observer = null;
  let chatRoot = null;
  let scanning = false;          // true trong luc dang scan + cuon history
  let cfg = loadCfg();

  function loadCfg() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(defaultCfg(), JSON.parse(raw));
    } catch (e) {}
    return defaultCfg();
  }
  function defaultCfg() {
    return { keyword: 'em' };
  }
  function saveCfg() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  // ---- Chat scanning ----
  function extractFromNode(node) {
    if (!node || !node.querySelector) return null;
    const content = node.querySelector('#content');
    if (!content) return null;
    const authorEl = content.querySelector('yt-live-chat-author-chip > #author-name')
      || node.querySelector('#author-name');
    const msgEl = content.querySelector('#message') || content;
    let author = (authorEl && authorEl.innerText ? authorEl.innerText : '').trim();
    const text = (msgEl && msgEl.innerText ? msgEl.innerText : '').trim();
    if (!author) return null;
    author = author.replace(/^@\s*/, '').trim();
    return { author, content: text };
  }

  function addMessageNode(node) {
    if (node && processedNodes.has(node)) return;   // da xu ly -> khong them lai
    const rec = extractFromNode(node);
    if (!rec) return;
    if (node) processedNodes.add(node);
    const key = rec.author + '|' + rec.content;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    messages.push(rec);
    if (ui.ready) scheduleRender();
  }

  function scanExisting() {
    const nodes = document.querySelectorAll(
      'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-membership-item-renderer'
    );
    nodes.forEach(addMessageNode);
  }

  function attachObserver() {
    const root = document.querySelector('yt-live-chat-item-list-renderer');
    if (!root) return false;
    if (chatRoot === root && observer) return true;
    if (observer) { try { observer.disconnect(); } catch (e) {} }
    chatRoot = root;
    observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.addedNodes && mut.addedNodes.length) {
          mut.addedNodes.forEach(addMessageNode);
        }
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return true;
  }

  let attachTimer = null;
  const ATTACH_TIMEOUT_MS = 60000;
  function ensureAttached() {
    if (attachObserver()) return true;
    if (attachTimer) return false;
    const startedAt = Date.now();
    attachTimer = setInterval(() => {
      if (attachObserver()) {
        scanExisting();   // snapshot tin dang hien thi ngay khi chat xuat hien
        clearInterval(attachTimer);
        attachTimer = null;
      } else if (Date.now() - startedAt > ATTACH_TIMEOUT_MS) {
        clearInterval(attachTimer);
        attachTimer = null;
      }
    }, 1000);
    return false;
  }

  // ---- Scan toan bo chat (replay history or current visible) ----
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function getScroller() {
    return document.querySelector('yt-live-chat-item-list-renderer #item-scroller')
        || document.querySelector('#item-scroller');
  }
  async function scanChat() {
    if (scanning) return;
    scanning = true;
    updateScanBtn();
    updateHeaderBtnsLive();
    setStatus(`Scanning… ${messages.length} messages`, true);
    ensureAttached();
    scanExisting();   // bat tin dang co san trong viewport
    const scroller = getScroller();
    const startedAt = Date.now();
    const MAX_MS = 30000;       // toi da 30 giay (phu hop ~30p chat replay)
    const MAX_ITER = 120;       // cap so lan scroll
    let lastCount = messages.length;
    let stableRounds = 0;
    let iter = 0;
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      while (iter++ < MAX_ITER && (Date.now() - startedAt) < MAX_MS) {
        scroller.scrollTop = 0;        // cuon len dau -> YouTube load them tin cu
        await sleep(700);
        const now = messages.length;
        if (now === lastCount) {
          if (++stableRounds >= 2) break;   // 2 lan khong tang -> cho la da den dau
        } else { stableRounds = 0; lastCount = now; }
        setStatus(`Scanning… ${messages.length} messages`, true);
      }
      // cuon tro lai cuoi de khong dut UI cua viewer
      try { scroller.scrollTop = scroller.scrollHeight; } catch (e) {}
    }
    scanning = false;
    updateScanBtn();
    updateHeaderBtnsLive();
    setStatus(`Done — ${messages.length} messages captured.`);
    renderList();
  }

  // ---- Filtering ----
  function computeFiltered() {
    const kw = (cfg.keyword || '').trim().toLowerCase();
    const set = new Map(); // lowerName -> displayName
    let matched = 0;
    if (kw) {  // khong kw -> khong match gi ca
      for (const m of messages) {
        if (m.content.toLowerCase().indexOf(kw) === -1) continue;
        matched++;
        const key = m.author.toLowerCase();
        if (!set.has(key)) set.set(key, m.author);
      }
    }
    return { names: Array.from(set.values()), matched, total: messages.length };
  }

  // ---- Header button (icon filter, tiem vao header cua live chat) ----
  const FILTER_ICON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>`;

  function makeHeaderButton() {
    const b = document.createElement('button');
    b.id = 'lcp-header-btn';
    b.type = 'button';
    b.title = 'Live Chat Picker';
    b.innerHTML = FILTER_ICON_SVG;
    b.setAttribute('style', [
      'all: unset',
      'display: inline-flex',
      'align-items: center',
      'justify-content: center',
      'width: 36px',
      'height: 36px',
      'border-radius: 50%',
      'cursor: pointer',
      'color: inherit',
      'margin: 0 4px',
      'vertical-align: middle',
      'transition: background .15s ease',
      'user-select: none',
    ].join(';'));
    b.addEventListener('mouseenter', () => { b.style.background = 'rgba(128,128,128,0.25)'; });
    b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; });
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });
    return b;
  }

  let headerBtns = [];
  function injectHeaderButton() {
    headerBtns = headerBtns.filter(b => b.isConnected);
    const headers = document.querySelectorAll('yt-live-chat-header-renderer');
    if (!headers.length) return false;
    let injected = false;
    headers.forEach(h => {
      const inShadow = h.shadowRoot && h.shadowRoot.querySelector('#lcp-header-btn');
      const inLight = h.querySelector('#lcp-header-btn');
      if (inShadow || inLight) { injected = true; return; }
      try {
        const host = h.shadowRoot || h;
        const btn = makeHeaderButton();
        host.appendChild(btn);
        headerBtns.push(btn);
        injected = true;
      } catch (e) {
        try {
          const btn = makeHeaderButton();
          h.appendChild(btn);
          headerBtns.push(btn);
          injected = true;
        } catch (e2) {}
      }
    });
    updateHeaderBtnsLive();
    return injected;
  }
  function updateHeaderBtnsLive() {
    headerBtns.forEach(b => {
      b.title = scanning ? 'Live Chat Picker (scanning)' : 'Live Chat Picker';
      b.style.color = scanning ? '#ff3b30' : 'inherit';
    });
  }

  let headerTimer = null;
  function ensureHeaderInjected() {
    if (injectHeaderButton()) return;
    if (headerTimer) return;
    const startedAt = Date.now();
    headerTimer = setInterval(() => {
      if (injectHeaderButton() || Date.now() - startedAt > ATTACH_TIMEOUT_MS) {
        clearInterval(headerTimer);
        headerTimer = null;
      }
    }, 1000);
  }

  // ---- Panel (Shadow DOM) ----
  const ui = {
    host: null, root: null, panel: null, listEl: null,
    statsEl: null, statusEl: null, collectBtn: null,
    copyBtn: null, clearBtn: null, kwIn: null,
    ready: false,
  };
  let renderScheduled = false;
  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => { renderScheduled = false; renderList(); });
  }

  function buildPanel() {
    const host = document.createElement('div');
    host.id = 'lcp-panel-host';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; font-family: "Segoe UI", Roboto, Arial, sans-serif; }
        #panel {
          position: fixed; top: 52px; right: 10px; z-index: 2147483647;
          width: 320px; max-height: calc(100vh - 64px); display: none; flex-direction: column;
          background: #fff; color: #0f0f0f; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,.35); overflow: hidden;
          border: 1px solid rgba(0,0,0,.08);
        }
        #panel.open { display: flex; }
        .hd {
          background: linear-gradient(135deg, #ff0000, #cc0033); color: #fff;
          padding: 10px 14px; font-weight: 600; font-size: 13px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .hd .tag { opacity: .85; font-weight: 400; font-size: 11px; }
        .body { padding: 12px 14px; overflow-y: auto; }
        .collect-btn {
          width: 100%; padding: 11px; border: none; border-radius: 9px; cursor: pointer;
          font-size: 14px; font-weight: 700; margin-bottom: 10px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background .15s ease, transform .1s ease;
        }
        .collect-btn.start { background: #0a7d2f; color: #fff; }
        .collect-btn.start:hover { background: #086324; }
        .collect-btn.stop { background: #c00; color: #fff; }
        .collect-btn.stop:hover { background: #a00; }
        .collect-btn:active { transform: scale(0.98); }
        .collect-btn:disabled { opacity: .55; cursor: not-allowed; }
        .status {
          font-size: 11px; text-align: center; margin-bottom: 10px; min-height: 14px;
          color: #666;
        }
        .status.live { color: #0a7d2f; font-weight: 600; }
        .kw-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .kw-field span { font-size: 11px; color: #666; }
        input[type="text"] {
          width: 100%; padding: 7px 9px; border: 1px solid #ccc; border-radius: 8px;
          font-size: 13px; outline: none; background: #fff; color: #0f0f0f;
        }
        input:focus { border-color: #ff0000; box-shadow: 0 0 0 2px rgba(255,0,0,.15); }
        .stats {
          font-size: 11px; color: #666; margin: 6px 0 8px;
          padding: 6px 8px; background: #f5f5f5; border-radius: 6px;
        }
        .list {
          border: 1px solid #eee; border-radius: 8px; max-height: 240px; overflow-y: auto;
          margin-bottom: 10px; background: #fafafa;
        }
        .list .item { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid #eee; }
        .list .item:last-child { border-bottom: none; }
        .empty { padding: 16px; text-align: center; color: #999; font-size: 12px; }
        .btns { display: flex; gap: 8px; }
        button.act {
          flex: 1; padding: 9px 10px; border: none; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 600;
        }
        button.primary { background: #ff0000; color: #fff; }
        button.primary:hover { background: #d40000; }
        button.ghost { background: #eee; color: #333; }
        button.ghost:hover { background: #ddd; }
        .toast { font-size: 11px; color: #0a7; text-align: center; min-height: 14px; margin-top: 6px; }
        .hint { font-size: 10px; color: #999; margin-top: 8px; line-height: 1.4; }
      </style>
      <div id="panel">
        <div class="hd">
          <span>Live Chat Picker</span>
          <span class="tag">YouTube</span>
        </div>
        <div class="body">
          <button class="collect-btn start" id="collectBtn">🔍 Scan chat</button>
          <div class="status" id="status">Ready to scan.</div>
          <div class="kw-field">
            <span>Keyword (case-insensitive, contained in message)</span>
            <input id="kw" type="text" placeholder="e.g. em" />
          </div>
          <div class="stats" id="stats">No data yet.</div>
          <div class="list" id="list"><div class="empty">No matches yet.</div></div>
          <div class="btns">
            <button class="act primary" id="copy">📋 Copy list</button>
            <button class="act ghost" id="clear">Clear</button>
          </div>
          <div class="toast" id="toast"></div>
          <div class="hint">
            • Press <b>Scan chat</b> to scroll back and capture history (up to ~30 min).<br>
            • New messages are also captured automatically.<br>
            • Duplicate names are merged; paste straight into wheelofnames.com.
          </div>
        </div>
      </div>
    `;
    document.documentElement.appendChild(host);
    ui.host = host;
    ui.root = shadow;
    ui.panel = shadow.getElementById('panel');
    ui.listEl = shadow.getElementById('list');
    ui.statsEl = shadow.getElementById('stats');
    ui.statusEl = shadow.getElementById('status');
    ui.collectBtn = shadow.getElementById('collectBtn');
    ui.copyBtn = shadow.getElementById('copy');
    ui.clearBtn = shadow.getElementById('clear');
    ui.kwIn = shadow.getElementById('kw');

    ui.kwIn.value = cfg.keyword || '';

    ui.collectBtn.addEventListener('click', () => {
      if (!scanning) scanChat();
    });
    const onChange = () => {
      cfg.keyword = ui.kwIn.value || '';
      saveCfg();
      renderList();
    };
    ui.kwIn.addEventListener('input', onChange);
    ui.copyBtn.addEventListener('click', copyList);
    ui.clearBtn.addEventListener('click', () => {
      messages = [];
      seenKeys = new Set();
      renderList();
      toast('Cleared.');
    });

    document.addEventListener('click', (e) => {
      if (!ui.panel.classList.contains('open')) return;
      const inPanel = ui.host.contains(e.target);
      const inHeaderBtn = e.target && e.target.closest && e.target.closest('#lcp-header-btn');
      if (!inPanel && !inHeaderBtn) closePanel();
    }, true);

    ui.ready = true;
    renderList();
  }

  function updateScanBtn() {
    if (!ui.ready) return;
    ui.collectBtn.className = 'collect-btn start';
    if (scanning) {
      ui.collectBtn.textContent = '⏳ Scanning…';
      ui.collectBtn.disabled = true;
    } else {
      ui.collectBtn.textContent = '🔍 Scan chat';
      ui.collectBtn.disabled = false;
    }
  }
  function setStatus(msg, live) {
    if (!ui.ready) return;
    ui.statusEl.textContent = msg;
    ui.statusEl.className = 'status' + (live ? ' live' : '');
  }

  function togglePanel() {
    if (!ui.ready) buildPanel();
    ui.panel.classList.toggle('open');
    if (ui.panel.classList.contains('open')) {
      renderList();
      setTimeout(() => { try { ui.kwIn.focus(); ui.kwIn.select(); } catch (e) {} }, 30);
    }
  }
  function closePanel() { if (ui.panel) ui.panel.classList.remove('open'); }

  function renderList() {
    if (!ui.ready) return;
    const { names, matched, total } = computeFiltered();
    const kwEmpty = !(cfg.keyword || '').trim();
    if (kwEmpty) {
      ui.statsEl.textContent = `Collected: ${total} • Matched: 0 (keyword empty)`;
      ui.listEl.innerHTML = '<div class="empty">Enter a keyword to filter.</div>';
      return;
    }
    ui.statsEl.textContent =
      `Collected: ${total} • Matched: ${matched} • Unique: ${names.length}`;
    if (names.length === 0) {
      ui.listEl.innerHTML = '<div class="empty">No matches yet.</div>';
      return;
    }
    // Auto-scroll: chi ep xuong cuoi neu user dang o gan bottom (khong bat len
    // khi dang cuot len de xem ten cu).
    const el = ui.listEl;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    ui.listEl.innerHTML = names.map(n => `<div class="item">${escapeHtml(n)}</div>`).join('');
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toast(msg) {
    const t = ui.root.getElementById('toast');
    t.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.textContent = ''; }, 1800);
  }
  async function copyList() {
    const { names } = computeFiltered();
    if (!(cfg.keyword || '').trim()) { toast('Enter a keyword first.'); return; }
    if (names.length === 0) { toast('Nothing to copy.'); return; }
    const text = names.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${names.length} names!`);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(`Copied ${names.length} names!`); }
      catch (e2) { toast('Copy failed.'); }
      document.body.removeChild(ta);
    }
  }

  // ---- Bootstrap ----
  function boot() {
    ensureHeaderInjected();
    ensureAttached();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('yt-navigate-finish', () => { ensureAttached(); ensureHeaderInjected(); });
  window.addEventListener('load', () => { ensureAttached(); ensureHeaderInjected(); });
})();