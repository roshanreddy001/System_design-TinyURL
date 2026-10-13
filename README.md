# Roshan TinyURL — Frontend

A modern, professional URL shortener web application built with **HTML5, CSS3, and Vanilla JavaScript**.

---

## 📁 Project Structure

```
Project of ADDA/
│
├── index.html          # Screen 1 — URL Shortener Home (Dashboard)
├── links.html          # Screen 2 — My Links Dashboard
├── analytics.html      # Screen 3 — Link Analytics
├── settings.html       # Screen 4 — Link Settings
│
├── css/
│   └── style.css       # Shared styles, design system, responsive layout
│
└── js/
    ├── api.js          # Backend communication (fetch() API layer + mock data)
    ├── app.js          # Shared: sidebar toggle, theme, toasts, modals, utilities
    ├── dashboard.js    # URL shortening form, validation, result display, QR code
    ├── links.js        # Link management: CRUD, pagination, search, filter
    ├── analytics.js    # Analytics charts, stats, referrers, devices, countries
    └── settings.js     # Settings forms, theme switcher, danger zone
```

---

## 🚀 Running Locally

Since this is a pure HTML/CSS/JS project with no build step, simply open any HTML file in a browser:

### Option 1: Double-click
Open `index.html` directly in Chrome, Edge, or Firefox.

### Option 2: Live Server (recommended for API calls)
```bash
# Using VS Code Live Server extension, or:
npx -y live-server --port=3000 --open=index.html
```

> **Note:** When opened via `file://`, the browser may block `fetch()` requests due to CORS. Use a local server to avoid this.

---

## 🔌 Backend Integration

### API Base URL

Configured in `js/api.js`:
```js
const API_BASE = 'http://localhost:8080/api';
```
Change this to match your Spring Boot server.

### Expected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/urls` | Create a short URL |
| `GET` | `/api/urls` | Get all user links (supports `?page=&size=&search=&status=`) |
| `GET` | `/api/urls/{id}` | Get a single link |
| `PUT` | `/api/urls/{id}` | Update link metadata |
| `DELETE` | `/api/urls/{id}` | Delete a link |
| `GET` | `/api/urls/{id}/analytics` | Get per-link analytics |
| `GET` | `/api/analytics` | Get aggregate analytics |

### Request/Response Format

**POST /api/urls** — Request body:
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "customAlias": "my-link",        // optional
  "expiresAt": "2026-12-31T23:59:59Z",  // optional ISO 8601
  "title": "My Link",              // optional
  "password": "secret"             // optional
}
```

**POST /api/urls** — Expected response:
```json
{
  "id": 1,
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "my-link",
  "shortUrl": "https://tinyurl.com/my-link",
  "createdAt": "2026-10-13T10:00:00Z",
  "clicks": 0,
  "status": "active",
  "analyticsEnabled": true
}
```

**GET /api/urls** — Expected response (paginated):
```json
{
  "content": [ /* array of link objects */ ],
  "totalElements": 100,
  "totalPages": 10,
  "size": 10,
  "number": 0
}
```
> Also accepts plain array format: `[ { link }, { link }, ... ]`

---

## ✅ Feature Status

### Fully Implemented (Frontend)
- [x] URL shortening form with real-time validation
- [x] Collapsible advanced options (custom alias, expiry, title)
- [x] Result panel with short URL display
- [x] Copy-to-clipboard functionality
- [x] QR code generation (via api.qrserver.com)
- [x] My Links table with search, filter, pagination
- [x] Expandable table rows with link details
- [x] Create/Edit/Delete link modals with confirmation dialogs
- [x] Analytics stats with animated counters
- [x] SVG line chart for clicks over time
- [x] Donut chart for device breakdown
- [x] Progress bars for referrers and countries
- [x] Top links performance table
- [x] Settings: Basic, Advanced, Redirection, Appearance, Danger Zone
- [x] Light/Dark theme toggle (persisted to localStorage)
- [x] Accent color picker (persisted to localStorage)
- [x] Collapsible sidebar with persistence
- [x] Responsive layout (desktop, tablet, mobile)
- [x] Toast notifications for all actions
- [x] Loading, empty, and error states
- [x] Mock data fallback when backend is unavailable

### Requires Backend Support
- [ ] Actual short URL generation (backend generates the short code)
- [ ] User authentication & JWT token support
- [ ] Real click tracking and analytics data
- [ ] Password-protected links
- [ ] Unique visitor tracking
- [ ] Geographic data (country detection from IP)
- [ ] Real referrer tracking
- [ ] Pagination from backend (`?page=0&size=10`)
- [ ] "Make Link Private" feature
- [ ] UTM parameter tracking

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#7c3aed` (Purple) |
| Secondary | `#3b82f6` (Blue) |
| Success | `#10b981` (Green) |
| Danger | `#ef4444` (Red) |
| Sidebar | `#0d0f1e` (Dark Navy) |
| Font | Inter + Plus Jakarta Sans |
| Border Radius | 8px / 12px / 16px / 20px |

---

## 🛠️ CORS Configuration

When running the Spring Boot backend, ensure CORS is configured to allow the frontend origin:

```java
@CrossOrigin(origins = "http://localhost:3000")  // or your frontend port
```

Or globally in a `CorsConfigurationSource` bean.

---

## 📝 Notes

- Short code generation is **always done server-side**. The frontend never generates authoritative codes.
- Mock data is automatically used when the backend returns a network error (`status: 0`), allowing you to develop and demo the UI without a running backend.
- All destructive actions (delete) show a confirmation dialog before proceeding.
