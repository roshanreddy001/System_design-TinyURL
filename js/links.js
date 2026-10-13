// ===================================================
// links.js — Link Management Page
// ===================================================

let allLinks = [];
let filteredLinks = [];
let currentPage = 1;
const PAGE_SIZE = 10;
let expandedRows = new Set();

document.addEventListener('DOMContentLoaded', () => {
  loadLinks();
  initFilters();
  initCreateModal();
  initEditModal();
});

// ---------------------------------------------------
// Load Links
// ---------------------------------------------------
async function loadLinks() {
  showTableLoading();
  try {
    let res;
    try {
      res = await UrlsAPI.getAll();
      allLinks = res.content || res;
    } catch (e) {
      if (e.status === 0) { allLinks = [...MockData.links]; }
      else throw e;
    }
    filteredLinks = [...allLinks];
    renderTable();
    updateStats();
  } catch (err) {
    showTableError(err.message);
  }
}

function updateStats() {
  const totalEl = document.getElementById('statTotal');
  const clicksEl = document.getElementById('statClicks');
  const activeEl = document.getElementById('statActive');

  if (totalEl) totalEl.textContent = allLinks.length;
  if (clicksEl) clicksEl.textContent = formatNumber(allLinks.reduce((s, l) => s + (l.clicks || 0), 0));
  if (activeEl) activeEl.textContent = allLinks.filter(l => l.status === 'active' || !l.status).length;
}

// ---------------------------------------------------
// Table Rendering
// ---------------------------------------------------
function renderTable() {
  const tbody = document.getElementById('linksTableBody');
  const noResults = document.getElementById('noResults');
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageLinks = filteredLinks.slice(start, start + PAGE_SIZE);

  if (filteredLinks.length === 0) {
    tbody.innerHTML = '';
    if (noResults) noResults.style.display = 'flex';
    renderPagination();
    return;
  }

  if (noResults) noResults.style.display = 'none';

  tbody.innerHTML = pageLinks.map((link, i) => {
    const isExpanded = expandedRows.has(link.id);
    const statusBadge = link.status === 'expired'
      ? `<span class="badge badge-danger">Expired</span>`
      : `<span class="badge badge-success">Active</span>`;

    return `
      <tr class="link-row" data-id="${link.id}">
        <td style="width:40px;color:var(--text-muted);font-weight:600">${start + i + 1}</td>
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${link.title || 'Untitled'}</div>
          ${statusBadge}
        </td>
        <td class="td-url" title="${link.originalUrl}">
          <span style="color:var(--text-secondary)">${truncate(link.originalUrl, 45)}</span>
        </td>
        <td>
          <a href="${link.shortUrl}" target="_blank" class="td-short-url" title="${link.shortUrl}">${link.shortUrl}</a>
        </td>
        <td class="td-number" style="color:var(--primary)">${formatNumber(link.clicks || 0)}</td>
        <td style="color:var(--text-secondary);font-size:12.5px">${formatDate(link.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" data-tooltip="Copy URL" onclick="copyToClipboard('${link.shortUrl}', this)">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button class="btn-icon" data-tooltip="Analytics" onclick="window.location.href='analytics.html?id=${link.id}'">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </button>
            <button class="btn-icon" data-tooltip="Edit" onclick="openEditModal(${link.id})">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn-icon" data-tooltip="Delete" style="color:var(--danger)" onclick="deleteLink(${link.id})">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <button class="btn-icon" data-tooltip="${isExpanded ? 'Collapse' : 'Expand'}" onclick="toggleExpand(${link.id}, this)">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="transform:${isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};transition:transform 0.2s"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        </td>
      </tr>
      ${isExpanded ? renderExpandedRow(link) : ''}
    `;
  }).join('');

  renderPagination();
}

function renderExpandedRow(link) {
  return `
    <tr class="expanded-row">
      <td colspan="7">
        <div class="expanded-content">
          <div class="expanded-item">
            <span class="expanded-label">Title</span>
            <span class="expanded-val">${link.title || '—'}</span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Short Code</span>
            <span class="expanded-val" style="color:var(--primary);font-family:monospace;font-weight:600">${link.shortCode}</span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Original URL</span>
            <span class="expanded-val" style="word-break:break-all"><a href="${link.originalUrl}" target="_blank" style="color:var(--secondary)">${link.originalUrl}</a></span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Short URL</span>
            <span class="expanded-val"><a href="${link.shortUrl}" target="_blank" style="color:var(--primary)">${link.shortUrl}</a></span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Created At</span>
            <span class="expanded-val">${formatDate(link.createdAt)}</span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Expires</span>
            <span class="expanded-val">${link.expiresAt ? formatDate(link.expiresAt) : 'Never'}</span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Total Clicks</span>
            <span class="expanded-val" style="font-weight:700;color:var(--primary)">${formatNumber(link.clicks || 0)}</span>
          </div>
          <div class="expanded-item">
            <span class="expanded-label">Analytics</span>
            <span class="expanded-val">${link.analyticsEnabled ? '✅ Enabled' : '❌ Disabled'}</span>
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;gap:10px">
          <button class="btn btn-outline btn-sm" onclick="window.location.href='analytics.html?id=${link.id}'">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            View Analytics
          </button>
          <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${link.shortUrl}', this)">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Copy Short URL
          </button>
        </div>
      </td>
    </tr>
  `;
}

function toggleExpand(id, btn) {
  if (expandedRows.has(id)) {
    expandedRows.delete(id);
  } else {
    expandedRows.add(id);
  }
  renderTable();
}

// ---------------------------------------------------
// Pagination
// ---------------------------------------------------
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredLinks.length / PAGE_SIZE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `
    <button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `
    <button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>
  `;

  container.innerHTML = html;

  const info = document.getElementById('pageInfo');
  if (info) {
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredLinks.length);
    info.textContent = `Showing ${start}–${end} of ${filteredLinks.length} links`;
  }
}

function goPage(page) {
  const totalPages = Math.ceil(filteredLinks.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  expandedRows.clear();
  renderTable();
  document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------
// Filters
// ---------------------------------------------------
function initFilters() {
  const search = document.getElementById('searchInput');
  const dateFilter = document.getElementById('dateFilter');
  const statusFilter = document.getElementById('statusFilter');

  const apply = () => {
    const q = search?.value.toLowerCase().trim() || '';
    const status = statusFilter?.value || '';

    filteredLinks = allLinks.filter(link => {
      const matchQuery = !q ||
        link.title?.toLowerCase().includes(q) ||
        link.originalUrl?.toLowerCase().includes(q) ||
        link.shortCode?.toLowerCase().includes(q) ||
        link.shortUrl?.toLowerCase().includes(q);

      const matchStatus = !status || link.status === status ||
        (!link.status && status === 'active');

      return matchQuery && matchStatus;
    });

    currentPage = 1;
    expandedRows.clear();
    renderTable();
  };

  search?.addEventListener('input', apply);
  dateFilter?.addEventListener('change', apply);
  statusFilter?.addEventListener('change', apply);
}

// ---------------------------------------------------
// Delete
// ---------------------------------------------------
async function deleteLink(id) {
  const link = allLinks.find(l => l.id === id);
  confirmAction(
    `Are you sure you want to delete <strong>"${link?.title || 'this link'}"</strong>? This action cannot be undone.`,
    async () => {
      try {
        try { await UrlsAPI.delete(id); } catch (e) { if (e.status !== 0) throw e; }
        allLinks = allLinks.filter(l => l.id !== id);
        filteredLinks = filteredLinks.filter(l => l.id !== id);
        expandedRows.delete(id);
        renderTable();
        updateStats();
        showToast('Link deleted successfully.', 'success');
      } catch (err) {
        showToast('Failed to delete link: ' + err.message, 'error');
      }
    }
  );
}

// ---------------------------------------------------
// Create Modal
// ---------------------------------------------------
function initCreateModal() {
  const btn = document.getElementById('createLinkBtn');
  const form = document.getElementById('createLinkForm');

  if (btn) btn.addEventListener('click', () => openModal('createModal'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[type=submit]');
      const url = document.getElementById('newOriginalUrl').value.trim();

      if (!isValidUrl(url)) {
        showToast('Please enter a valid URL.', 'error');
        return;
      }

      const payload = {
        originalUrl: url,
        title: document.getElementById('newTitle').value.trim(),
        customAlias: document.getElementById('newAlias').value.trim() || undefined,
        expiresAt: document.getElementById('newExpires').value || undefined,
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Creating...`;

      try {
        let data;
        try { data = await UrlsAPI.create(payload); }
        catch (e) { if (e.status === 0) data = mockShortenResponse(url, payload.customAlias); else throw e; }

        allLinks.unshift({ ...data, title: payload.title || 'Untitled', status: 'active' });
        filteredLinks = [...allLinks];
        currentPage = 1;
        renderTable();
        updateStats();
        closeModal('createModal');
        form.reset();
        showToast('Link created!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Link';
      }
    });
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
    analyticsEnabled: true,
  };
}

// ---------------------------------------------------
// Edit Modal
// ---------------------------------------------------
function initEditModal() {
  const form = document.getElementById('editLinkForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(form.dataset.linkId);
    const submitBtn = form.querySelector('[type=submit]');

    const payload = {
      title: document.getElementById('editTitle').value.trim(),
      customAlias: document.getElementById('editAlias').value.trim() || undefined,
      expiresAt: document.getElementById('editExpires').value || undefined,
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Saving...`;

    try {
      try { await UrlsAPI.update(id, payload); } catch (e) { if (e.status !== 0) throw e; }
      const idx = allLinks.findIndex(l => l.id === id);
      if (idx !== -1) { allLinks[idx] = { ...allLinks[idx], ...payload }; }
      filteredLinks = [...allLinks];
      renderTable();
      closeModal('editModal');
      showToast('Link updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Changes';
    }
  });
}

function openEditModal(id) {
  const link = allLinks.find(l => l.id === id);
  if (!link) return;

  const form = document.getElementById('editLinkForm');
  if (!form) return;

  form.dataset.linkId = id;
  document.getElementById('editOriginalUrl').value = link.originalUrl;
  document.getElementById('editTitle').value = link.title || '';
  document.getElementById('editAlias').value = link.shortCode || '';
  document.getElementById('editExpires').value = link.expiresAt ? link.expiresAt.split('T')[0] : '';

  openModal('editModal');
}

// ---------------------------------------------------
// Table loading / error states
// ---------------------------------------------------
function showTableLoading() {
  const tbody = document.getElementById('linksTableBody');
  if (!tbody) return;
  tbody.innerHTML = Array(5).fill(0).map(() => `
    <tr>
      <td colspan="7">
        <div style="display:flex;gap:16px;padding:12px">
          <div class="skeleton" style="width:40px;height:14px"></div>
          <div class="skeleton" style="flex:1;height:14px"></div>
          <div class="skeleton" style="width:120px;height:14px"></div>
          <div class="skeleton" style="width:80px;height:14px"></div>
        </div>
      </td>
    </tr>
  `).join('');
}

function showTableError(msg) {
  const tbody = document.getElementById('linksTableBody');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr><td colspan="7">
      <div class="empty-state">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--danger)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <h3>Failed to load links</h3>
        <p>${msg || 'Unknown error'}</p>
        <button class="btn btn-primary btn-sm" onclick="loadLinks()">Retry</button>
      </div>
    </td></tr>
  `;
}
