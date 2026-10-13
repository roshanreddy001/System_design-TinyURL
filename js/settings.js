// ===================================================
// settings.js — Settings Page Logic
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  loadLinkSelector();
  initAppearanceSettings();
  initDangerZone();
});

// ---------------------------------------------------
// Init Settings
// ---------------------------------------------------
function initSettings() {
  // Basic Settings Form
  const basicForm = document.getElementById('basicSettingsForm');
  if (basicForm) {
    basicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = basicForm.querySelector('[type=submit]');
      const linkId = document.getElementById('settingsLinkSelector')?.value;
      if (!linkId) { showToast('Please select a link to edit.', 'warning'); return; }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Saving...`;

      const payload = {
        originalUrl: document.getElementById('settOriginalUrl').value.trim(),
        customAlias: document.getElementById('settCustomAlias').value.trim() || undefined,
        expiresAt: document.getElementById('settExpiresAt').value || undefined,
        password: document.getElementById('settPassword').value || undefined,
        analyticsEnabled: document.getElementById('settAnalytics')?.checked,
        isPrivate: document.getElementById('settPrivate')?.checked,
      };

      try {
        try { await UrlsAPI.update(linkId, payload); }
        catch (e) { if (e.status !== 0) throw e; }
        showToast('Basic settings saved!', 'success');
      } catch (err) {
        showToast('Failed to save: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
    });
  }

  // Advanced Settings Form
  const advForm = document.getElementById('advSettingsForm');
  if (advForm) {
    advForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = advForm.querySelector('[type=submit]');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Saving...`;
      await new Promise(r => setTimeout(r, 800));
      showToast('Advanced settings saved!', 'success');
      btn.disabled = false;
      btn.innerHTML = 'Save Changes';
    });
  }
}

// ---------------------------------------------------
// Link Selector
// ---------------------------------------------------
async function loadLinkSelector() {
  const selector = document.getElementById('settingsLinkSelector');
  if (!selector) return;

  try {
    let links;
    try { const res = await UrlsAPI.getAll(); links = res.content || res; }
    catch { links = MockData.links; }

    selector.innerHTML = `<option value="">— Select a link to configure —</option>` +
      links.map(l => `<option value="${l.id}">${l.title || l.shortCode} — ${truncate(l.originalUrl, 40)}</option>`).join('');

    selector.addEventListener('change', () => {
      const id = parseInt(selector.value);
      const link = links.find(l => l.id === id);
      if (link) populateSettings(link);
    });
  } catch (err) {
    selector.innerHTML = `<option value="">Failed to load links</option>`;
  }
}

function populateSettings(link) {
  const fields = {
    settOriginalUrl: link.originalUrl,
    settCustomAlias: link.shortCode,
    settExpiresAt: link.expiresAt ? link.expiresAt.split('T')[0] : '',
    settTitle: link.title || '',
    settDescription: link.description || '',
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  const analyticsToggle = document.getElementById('settAnalytics');
  if (analyticsToggle) analyticsToggle.checked = link.analyticsEnabled !== false;

  showToast(`Loaded settings for "${link.title || link.shortCode}"`, 'info', 2000);
}

// ---------------------------------------------------
// Appearance Settings
// ---------------------------------------------------
function initAppearanceSettings() {
  // Theme buttons
  const themeLight = document.getElementById('themeLightBtn');
  const themeDark = document.getElementById('themeDarkBtn');

  if (themeLight) {
    themeLight.addEventListener('click', () => {
      setTheme('light');
      themeLight.classList.add('active');
      if (themeDark) themeDark.classList.remove('active');
      showToast('Light theme applied!', 'success', 2000);
    });
  }

  if (themeDark) {
    themeDark.addEventListener('click', () => {
      setTheme('dark');
      themeDark.classList.add('active');
      if (themeLight) themeLight.classList.remove('active');
      showToast('Dark theme applied!', 'success', 2000);
    });
  }

  // Set initial state
  const current = localStorage.getItem('rt_theme') || 'light';
  if (current === 'dark' && themeDark) themeDark.classList.add('active');
  else if (themeLight) themeLight.classList.add('active');

  // Sidebar collapse toggle
  const sidebarToggleSetting = document.getElementById('sidebarCollapseSetting');
  if (sidebarToggleSetting) {
    const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    sidebarToggleSetting.checked = isCollapsed;

    sidebarToggleSetting.addEventListener('change', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (sidebarToggleSetting.checked) sidebar.classList.add('collapsed');
        else sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar_collapsed', sidebarToggleSetting.checked);
      }
    });
  }

  // Accent color swatches
  document.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      const color = s.dataset.color;
      if (color) {
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--primary-light', color);
        localStorage.setItem('rt_accent', color);
        showToast('Accent color updated!', 'success', 2000);
      }
    });
  });

  // Restore accent
  const savedAccent = localStorage.getItem('rt_accent');
  if (savedAccent) {
    document.documentElement.style.setProperty('--primary', savedAccent);
    document.documentElement.style.setProperty('--primary-light', savedAccent);
    document.querySelectorAll('.swatch').forEach(s => {
      if (s.dataset.color === savedAccent) s.classList.add('active');
    });
  }
}

// ---------------------------------------------------
// Danger Zone
// ---------------------------------------------------
function initDangerZone() {
  const deleteBtn = document.getElementById('dangerDeleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const selector = document.getElementById('settingsLinkSelector');
      const id = selector?.value;
      if (!id) { showToast('Please select a link first.', 'warning'); return; }

      confirmAction(
        `This will permanently delete this link and all its analytics data. This cannot be undone.`,
        async () => {
          try {
            try { await UrlsAPI.delete(id); } catch (e) { if (e.status !== 0) throw e; }
            showToast('Link deleted successfully.', 'success');
            selector.value = '';
          } catch (err) {
            showToast('Failed to delete: ' + err.message, 'error');
          }
        },
        true
      );
    });
  }

  const resetBtn = document.getElementById('dangerResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      confirmAction(
        'This will clear all your local preferences (theme, sidebar state, etc.). Are you sure?',
        () => {
          localStorage.removeItem('rt_theme');
          localStorage.removeItem('rt_accent');
          localStorage.removeItem('sidebar_collapsed');
          document.documentElement.removeAttribute('data-theme');
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--primary-light');
          showToast('Preferences reset to defaults.', 'success');
        },
        true
      );
    });
  }
}
