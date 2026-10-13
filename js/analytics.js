// ===================================================
// analytics.js — Analytics Dashboard
// ===================================================

let analyticsData = null;
let chartInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAnalytics();
  initDateFilter();
});

// ---------------------------------------------------
// Load Analytics
// ---------------------------------------------------
async function loadAnalytics() {
  showSkeletons();
  try {
    try {
      analyticsData = await UrlsAPI.getOverallAnalytics();
    } catch (e) {
      if (e.status === 0) { analyticsData = MockData.analytics; }
      else throw e;
    }
    renderStats();
    renderLineChart();
    renderReferrers();
    renderDevices();
    renderCountries();
    renderTopLinks();
  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  }
}

// ---------------------------------------------------
// Stats
// ---------------------------------------------------
function renderStats() {
  const d = analyticsData;
  animateCount('statTotalClicks', d.totalClicks);
  animateCount('statUniqueVisitors', d.uniqueVisitors);
  animateCount('statActiveLinks', d.activeLinks);
  animateCount('statCountries', typeof d.countries === 'number' ? d.countries : d.countries?.length || 32);

  // Change indicators (mock)
  setChange('changeTotalClicks', '+12%', true);
  setChange('changeUniqueVisitors', '+8%', true);
  setChange('changeActiveLinks', '+5%', true);
  setChange('changeCountries', '+2', true);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 1000;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = formatNumber(value);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatNumber(target);
  };
  requestAnimationFrame(step);
}

function setChange(id, val, up) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val;
  el.className = `stat-change ${up ? 'up' : 'down'}`;
}

// ---------------------------------------------------
// Line Chart (SVG)
// ---------------------------------------------------
function renderLineChart() {
  const svg = document.getElementById('clicksChart');
  if (!svg) return;

  const data = analyticsData.clicksOverTime || [];
  if (data.length === 0) return;

  const W = svg.clientWidth || 700;
  const H = 200;
  const padL = 40, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...data.map(d => d.clicks)) * 1.1;
  const minVal = 0;

  const xScale = (i) => padL + (i / (data.length - 1)) * chartW;
  const yScale = (v) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.clicks), ...d }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${points[points.length-1].x},${padT+chartH} L${padL},${padT+chartH} Z`;

  // Y axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: Math.round(maxVal * f),
    y: yScale(maxVal * f),
  }));

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);
  svg.innerHTML = `
    <!-- Grid lines -->
    ${yLabels.map(l => `
      <line x1="${padL}" y1="${l.y.toFixed(1)}" x2="${W - padR}" y2="${l.y.toFixed(1)}" stroke="var(--border)" stroke-dasharray="4,3" stroke-width="1"/>
      <text x="${padL - 6}" y="${l.y + 4}" font-size="9" fill="var(--text-muted)" text-anchor="end" font-family="Inter,sans-serif">${formatNumber(l.v)}</text>
    `).join('')}

    <!-- Area fill -->
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <path d="${areaD}" fill="url(#chartGrad)"/>

    <!-- Line -->
    <path d="${pathD}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
    </path>

    <!-- Data points -->
    ${points.map((p, i) => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="white" stroke="var(--primary)" stroke-width="2.5" class="chart-dot" style="cursor:pointer">
        <title>${p.date}: ${p.clicks} clicks</title>
      </circle>
    `).join('')}

    <!-- X axis labels -->
    ${points.filter((_, i) => i % 2 === 0).map(p => `
      <text x="${p.x.toFixed(1)}" y="${padT + chartH + 18}" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="Inter,sans-serif">${p.date}</text>
    `).join('')}

    <!-- Highlight bar for max point -->
    ${(() => {
      const maxPt = points.reduce((a,b) => b.clicks > a.clicks ? b : a, points[0]);
      return `
        <g>
          <line x1="${maxPt.x}" y1="${padT}" x2="${maxPt.x}" y2="${padT+chartH}" stroke="var(--primary)" stroke-dasharray="4,3" stroke-width="1.5" stroke-opacity="0.5"/>
          <rect x="${maxPt.x - 40}" y="${maxPt.y - 34}" width="80" height="26" rx="6" fill="#1e1b4b"/>
          <text x="${maxPt.x}" y="${maxPt.y - 17}" font-size="10" fill="white" text-anchor="middle" font-weight="600" font-family="Inter,sans-serif">${maxPt.date}</text>
          <text x="${maxPt.x}" y="${maxPt.y - 6}" font-size="9" fill="#c4b5fd" text-anchor="middle" font-family="Inter,sans-serif">Clicks: ${maxPt.clicks}</text>
        </g>
      `;
    })()}
  `;
}

// ---------------------------------------------------
// Referrers
// ---------------------------------------------------
function renderReferrers() {
  const container = document.getElementById('referrersList');
  if (!container) return;

  const data = analyticsData.topReferrers || [];
  const icons = {
    Direct: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    Google: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>`,
    YouTube: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.7A20.5 20.5 0 0112 3.3a20.5 20.5 0 01-3.82.69 4.83 4.83 0 01-3.77 2.7A16 16 0 003 12a16 16 0 001.41 5.31 4.83 4.83 0 003.77 2.7 20.5 20.5 0 003.82.69 20.5 20.5 0 003.82-.69 4.83 4.83 0 003.77-2.7A16 16 0 0021 12a16 16 0 00-1.41-5.31zM10 15V9l5 3z"/></svg>`,
    Twitter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>`,
    Others: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  };

  const colors = ['var(--primary)', '#3b82f6', '#ef4444', '#1DA1F2', 'var(--text-muted)'];

  container.innerHTML = `<div class="progress-list">
    ${data.map((item, i) => `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label" style="display:flex;align-items:center;gap:6px">
            ${icons[item.name] || icons.Others}
            ${item.name}
          </span>
          <span class="progress-val">${item.pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${item.pct}%;background:${colors[i % colors.length]}"></div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// ---------------------------------------------------
// Devices (Donut Chart)
// ---------------------------------------------------
function renderDevices() {
  const container = document.getElementById('devicesChart');
  if (!container) return;

  const data = analyticsData.devices || [];
  const total = 8425; // center label
  const colors = ['#7c3aed', '#3b82f6', '#06b6d4'];
  const r = 60, cx = 80, cy = 80, strokeW = 22;

  let offset = 0;
  const segments = data.map((d, i) => {
    const dash = (d.pct / 100) * (2 * Math.PI * r);
    const gap = (2 * Math.PI * r) - dash;
    const seg = { ...d, dash, gap, offset, color: colors[i % colors.length] };
    offset += dash + 1;
    return seg;
  });

  const circ = 2 * Math.PI * r;

  container.innerHTML = `
    <div class="donut-wrap">
      <svg class="donut-svg" width="160" height="160" viewBox="0 0 160 160">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${strokeW}"/>
        ${segments.map(s => `
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${strokeW}"
            stroke-dasharray="${s.dash.toFixed(2)} ${(circ - s.dash + 2).toFixed(2)}"
            stroke-dashoffset="${(-s.offset + circ / 4).toFixed(2)}"
            stroke-linecap="round">
            <title>${s.name}: ${s.pct}%</title>
          </circle>
        `).join('')}
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text-primary)" font-family="Inter,sans-serif">${formatNumber(total)}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="var(--text-muted)" font-family="Inter,sans-serif">Clicks</text>
      </svg>
      <div class="donut-legend">
        ${data.map((d, i) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${colors[i % colors.length]}"></div>
            <span class="legend-name">${d.name}</span>
            <span class="legend-pct">${d.pct}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ---------------------------------------------------
// Countries
// ---------------------------------------------------
function renderCountries() {
  const container = document.getElementById('countriesList');
  if (!container) return;

  const data = typeof analyticsData.countries === 'number'
    ? MockData.analytics.countries
    : (Array.isArray(analyticsData.countries) ? analyticsData.countries : MockData.analytics.countries);

  container.innerHTML = `<div class="progress-list">
    ${data.map(item => `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">${item.flag} ${item.name}</span>
          <span class="progress-val">${item.pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill blue" style="width:${item.pct}%"></div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// ---------------------------------------------------
// Top Links Table
// ---------------------------------------------------
function renderTopLinks() {
  const container = document.getElementById('topLinksTable');
  if (!container) return;

  const links = MockData.links.slice(0, 5);
  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Short URL</th>
            <th>Clicks</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          ${links.map((l, i) => `
            <tr>
              <td style="color:var(--text-muted);font-weight:700">${i + 1}</td>
              <td style="font-weight:600">${l.title}</td>
              <td><a href="${l.shortUrl}" target="_blank" class="td-short-url">${l.shortUrl}</a></td>
              <td class="td-number" style="color:var(--primary)">${formatNumber(l.clicks)}</td>
              <td>
                <div style="display:flex;gap:2px;align-items:flex-end;height:24px">
                  ${Array(7).fill(0).map(() => `<div style="width:6px;border-radius:2px 2px 0 0;background:var(--grad-primary);height:${(Math.random()*20+4).toFixed(0)}px;opacity:0.7"></div>`).join('')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------
// Date filter
// ---------------------------------------------------
function initDateFilter() {
  const btn = document.getElementById('dateRangeBtn');
  if (!btn) return;
  // Simple date range presets
  const presets = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'This month', 'Custom'];
  btn.addEventListener('click', () => {
    const existing = document.getElementById('dateDropdown');
    if (existing) { existing.remove(); return; }

    const dropdown = document.createElement('div');
    dropdown.id = 'dateDropdown';
    dropdown.style.cssText = `position:absolute;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:100;min-width:160px;overflow:hidden`;

    presets.forEach(p => {
      const item = document.createElement('div');
      item.style.cssText = `padding:10px 16px;font-size:13px;cursor:pointer;transition:background 0.15s;color:var(--text-primary)`;
      item.textContent = p;
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-input)');
      item.addEventListener('mouseleave', () => item.style.background = '');
      item.addEventListener('click', () => {
        btn.querySelector('span').textContent = `Oct 1, 2026 - Oct 12, 2026`;
        dropdown.remove();
        showToast(`Filter applied: ${p}`, 'info', 2000);
      });
      dropdown.appendChild(item);
    });

    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(dropdown);
    document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && e.target !== btn) dropdown.remove(); }, { once: true });
  });
}

// ---------------------------------------------------
// Skeletons
// ---------------------------------------------------
function showSkeletons() {
  ['statTotalClicks', 'statUniqueVisitors', 'statActiveLinks', 'statCountries'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '...';
  });
}
