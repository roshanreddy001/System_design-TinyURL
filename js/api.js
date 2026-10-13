// ===================================================
// api.js — Backend Communication Layer
// Base URL: http://localhost:8080/api
// ===================================================

const API_BASE = 'http://localhost:8080/api';

// ---------------------------------------------------
// HTTP helpers
// ---------------------------------------------------

async function request(method, path, body = null, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Attach auth token if present (for future JWT support)
  const token = localStorage.getItem('rt_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new ApiError(err.message || 'Request failed', res.status);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Network error. Please check your connection or backend server.', 0);
  }
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Convenience wrappers
const api = {
  get: (path, opts) => request('GET', path, null, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  put: (path, body, opts) => request('PUT', path, body, opts),
  patch: (path, body, opts) => request('PATCH', path, body, opts),
  delete: (path, opts) => request('DELETE', path, null, opts),
};

// ---------------------------------------------------
// URL / Links API  (POST /api/urls)
// ---------------------------------------------------

const UrlsAPI = {
  /**
   * Shorten a URL.
   * @param {Object} payload - { originalUrl, customAlias?, expiresAt?, password?, title? }
   * @returns {Object} Created link object from backend.
   */
  create(payload) {
    return api.post('/urls', payload);
  },

  /**
   * Get all links for the current user.
   * @param {Object} params - { page?, size?, search?, status?, dateFrom?, dateTo? }
   */
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/urls${query ? '?' + query : ''}`);
  },

  /**
   * Get a single link by ID.
   */
  getById(id) {
    return api.get(`/urls/${id}`);
  },

  /**
   * Update a link.
   * @param {string|number} id
   * @param {Object} payload - updatable fields
   */
  update(id, payload) {
    return api.put(`/urls/${id}`, payload);
  },

  /**
   * Delete a link.
   */
  delete(id) {
    return api.delete(`/urls/${id}`);
  },

  /**
   * Get analytics for a specific link.
   * @param {string|number} id
   * @param {Object} params - { dateFrom?, dateTo? }
   */
  getAnalytics(id, params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/urls/${id}/analytics${query ? '?' + query : ''}`);
  },

  /**
   * Get aggregated analytics for all links.
   */
  getOverallAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/analytics${query ? '?' + query : ''}`);
  },
};

// ---------------------------------------------------
// Mock / Dev data  (used when backend is unavailable)
// ---------------------------------------------------

const MockData = {
  links: [
    {
      id: 1,
      title: 'YouTube Channel',
      originalUrl: 'https://www.youtube.com/channel/UCxxxxxxxxxxxxxx',
      shortCode: 'a8X7kP',
      shortUrl: 'https://tinyurl.com/a8X7kP',
      clicks: 1247,
      createdAt: '2026-10-12T10:24:00Z',
      expiresAt: null,
      status: 'active',
      analyticsEnabled: true,
    },
    {
      id: 2,
      title: 'GitHub Profile',
      originalUrl: 'https://github.com/username/repository-name',
      shortCode: 'b3Lm9Q',
      shortUrl: 'https://tinyurl.com/b3Lm9Q',
      clicks: 856,
      createdAt: '2026-10-10T08:15:00Z',
      expiresAt: null,
      status: 'active',
      analyticsEnabled: true,
    },
    {
      id: 3,
      title: 'Blog Post',
      originalUrl: 'https://example.com/blog/post/complete-guide-to-everything',
      shortCode: 'c7D2nF',
      shortUrl: 'https://tinyurl.com/c7D2nF',
      clicks: 425,
      createdAt: '2026-10-08T14:30:00Z',
      expiresAt: '2026-12-31T23:59:59Z',
      status: 'active',
      analyticsEnabled: true,
    },
    {
      id: 4,
      title: 'Google Maps',
      originalUrl: 'https://www.google.com/maps/place/New+Delhi',
      shortCode: 'dR4kZv',
      shortUrl: 'https://tinyurl.com/dR4kZv',
      clicks: 312,
      createdAt: '2026-10-05T09:00:00Z',
      expiresAt: null,
      status: 'active',
      analyticsEnabled: false,
    },
    {
      id: 5,
      title: 'Instagram',
      originalUrl: 'https://www.instagram.com/profile/',
      shortCode: 'e2H6RY',
      shortUrl: 'https://tinyurl.com/e2H6RY',
      clicks: 198,
      createdAt: '2026-10-02T16:45:00Z',
      expiresAt: '2026-11-01T00:00:00Z',
      status: 'expired',
      analyticsEnabled: true,
    },
  ],

  analytics: {
    totalClicks: 8425,
    uniqueVisitors: 6210,
    activeLinks: 24,
    countries: 32,
    clicksOverTime: [
      { date: 'Oct 1', clicks: 210 },
      { date: 'Oct 2', clicks: 185 },
      { date: 'Oct 3', clicks: 320 },
      { date: 'Oct 4', clicks: 290 },
      { date: 'Oct 5', clicks: 410 },
      { date: 'Oct 6', clicks: 380 },
      { date: 'Oct 7', clicks: 420 },
      { date: 'Oct 8', clicks: 390 },
      { date: 'Oct 9', clicks: 350 },
      { date: 'Oct 10', clicks: 480 },
      { date: 'Oct 11', clicks: 520 },
      { date: 'Oct 12', clicks: 470 },
    ],
    topReferrers: [
      { name: 'Direct', pct: 42 },
      { name: 'Google', pct: 28 },
      { name: 'YouTube', pct: 15 },
      { name: 'Twitter', pct: 8 },
      { name: 'Others', pct: 7 },
    ],
    devices: [
      { name: 'Desktop', pct: 52 },
      { name: 'Mobile', pct: 41 },
      { name: 'Tablet', pct: 7 },
    ],
    countries: [
      { name: 'India', flag: '🇮🇳', pct: 38 },
      { name: 'United States', flag: '🇺🇸', pct: 24 },
      { name: 'United Kingdom', flag: '🇬🇧', pct: 12 },
      { name: 'Canada', flag: '🇨🇦', pct: 8 },
      { name: 'Others', flag: '🌐', pct: 18 },
    ],
  },
};
