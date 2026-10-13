// ===================================================
// dashboard.js — URL Shortening Functionality
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  loadRecentLinks();
});

function initDashboard() {
  const form = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const shortenBtn = document.getElementById('shortenBtn');
  const resultPanel = document.getElementById('resultPanel');
  const errorMsg = document.getElementById('urlError');
  const advToggle = document.getElementById('advToggle');
  const advBody = document.getElementById('advBody');

  // Advanced options toggle
  if (advToggle && advBody) {
    advToggle.addEventListener('click', () => {
      advToggle.classList.toggle('open');
      advBody.classList.toggle('open');
    });
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleShorten();
    });
  }

  // Real-time validation
  if (urlInput) {
    urlInput.addEventListener('input', () => clearError());
  }
}

async function handleShorten() {
  const urlInput = document.getElementById('urlInput');
  const shortenBtn = document.getElementById('shortenBtn');
  const resultPanel = document.getElementById('resultPanel');
  const errorMsg = document.getElementById('urlError');

  const url = urlInput.value.trim();

  // Validate
  if (!url) {
    showError('Please enter a URL to shorten.');
    return;
  }
  if (!isValidUrl(url)) {
    showError('Please enter a valid URL starting with http:// or https://');
    return;
  }

  // Build payload
  const customAlias = document.getElementById('customAlias')?.value.trim();
  const expiresAt = document.getElementById('expiresAt')?.value;
  const title = document.getElementById('linkTitle')?.value.trim();

  const payload = { originalUrl: url };
  if (customAlias) payload.customAlias = customAlias;
  if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
  if (title) payload.title = title;

  // Loading state
  setLoading(true, shortenBtn);

  try {
    let data;
    try {
      data = await UrlsAPI.create(payload);
    } catch (apiErr) {
      // Fallback to mock when backend not available
      if (apiErr.status === 0) {
        data = mockShortenResponse(url, customAlias);
      } else {
        throw apiErr;
      }
    }

    showResult(data, url);
    showToast('URL shortened successfully!', 'success');

    // Reset form
    urlInput.value = '';
    const advBody = document.getElementById('advBody');
    if (advBody) {
      advBody.classList.remove('open');
      document.getElementById('advToggle')?.classList.remove('open');
    }

  } catch (err) {
    showError(err.message || 'Failed to shorten URL. Please try again.');
    showToast(err.message || 'Shortening failed.', 'error');
  } finally {
    setLoading(false, shortenBtn);
  }
}

function mockShortenResponse(originalUrl, alias) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const code = alias || Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return {
    id: Date.now(),
    originalUrl,
    shortCode: code,
    shortUrl: `https://tinyurl.com/${code}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
  };
}

function showResult(data, originalUrl) {
  const panel = document.getElementById('resultPanel');
  const shortUrlEl = document.getElementById('shortUrlDisplay');
  const originalUrlEl = document.getElementById('originalUrlDisplay');
  const copyBtn = document.getElementById('copyShortUrl');
  const qrBtn = document.getElementById('qrBtn');

  if (!panel) return;

  if (shortUrlEl) shortUrlEl.textContent = data.shortUrl;
  if (originalUrlEl) originalUrlEl.textContent = originalUrl;

  if (copyBtn) {
    copyBtn.onclick = () => copyToClipboard(data.shortUrl, copyBtn);
  }

  if (qrBtn) {
    qrBtn.onclick = () => showQR(data.shortUrl);
  }

  panel.classList.add('show');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showQR(url) {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  const id = 'qr-modal';
  let overlay = document.getElementById(id);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.innerHTML = `
      <div class="modal" style="max-width:320px;text-align:center">
        <div class="modal-header">
          <h2 class="modal-title">QR Code</h2>
          <button class="modal-close"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <img id="qr-img" src="" alt="QR Code" style="width:200px;height:200px;border-radius:12px;border:1px solid var(--border);margin:0 auto;display:block"/>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px">Scan to open the short URL</p>
        <a id="qr-download" download="qrcode.png" class="btn btn-primary btn-sm" style="margin-top:16px;display:inline-flex">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download
        </a>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  document.getElementById('qr-img').src = qrApiUrl;
  document.getElementById('qr-download').href = qrApiUrl;
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function showError(msg) {
  const el = document.getElementById('urlError');
  const input = document.getElementById('urlInput');
  if (el) { el.textContent = msg; el.style.display = 'flex'; }
  if (input) input.classList.add('error');
}

function clearError() {
  const el = document.getElementById('urlError');
  const input = document.getElementById('urlInput');
  if (el) { el.style.display = 'none'; el.textContent = ''; }
  if (input) input.classList.remove('error');
}

function setLoading(loading, btn) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Shortening...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Shorten URL';
  }
}

// ---------------------------------------------------
// Recent Links (quick summary on dashboard)
// ---------------------------------------------------
async function loadRecentLinks() {
  const container = document.getElementById('recentLinks');
  if (!container) return;

  try {
    let links;
    try {
      const res = await UrlsAPI.getAll({ page: 0, size: 3 });
      links = res.content || res;
    } catch { links = MockData.links.slice(0, 3); }

    renderRecentLinks(container, links);
  } catch {
    container.innerHTML = `<div class="empty-state"><p>Could not load recent links.</p></div>`;
  }
}

function renderRecentLinks(container, links) {
  if (!links || links.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        <h3>No links yet</h3>
        <p>Shorten your first URL above to get started!</p>
      </div>`;
    return;
  }

  container.innerHTML = links.map(link => `
    <div class="recent-link-row">
      <div class="rl-info">
        <div class="rl-title">${link.title || 'Untitled'}</div>
        <div class="rl-original">${truncate(link.originalUrl, 50)}</div>
      </div>
      <div class="rl-meta">
        <a href="${link.shortUrl}" target="_blank" class="rl-short">${link.shortUrl}</a>
        <div class="rl-clicks">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          ${formatNumber(link.clicks)}
        </div>
      </div>
      <button class="btn-icon" data-tooltip="Copy" onclick="copyToClipboard('${link.shortUrl}', this)">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>
    </div>
  `).join('');
}
