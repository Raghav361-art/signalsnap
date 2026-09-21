# SignalSnap Tracking Pixel

Lightweight JavaScript tracking client for SignalSnap.

## Quick Start

```html
<script src="/path/to/signalsnap.js"></script>
<script>
  SignalSnap.init({
    apiBase: 'http://localhost:8000',
    token:   'YOUR_JWT_TOKEN',
  });
</script>
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiBase` | string | *required* | Backend API base URL |
| `token` | string | `''` | JWT bearer token for authentication |
| `flushInterval` | number | `3000` | Milliseconds between automatic flushes |
| `autoPageView` | boolean | `true` | Automatically track `page_view` events |
| `debug` | boolean | `false` | Log events to console |

## API

```js
// Track a custom event
SignalSnap.track('button_click', { label: 'signup-cta' });

// Manual flush (called automatically on interval / tab hide / unload)
SignalSnap.flush();

// Get current IDs
SignalSnap.getAnonymousId();  // persistent across sessions
SignalSnap.getSessionId();    // per-tab

// Teardown
SignalSnap.destroy();
```

## Automatic Behaviour

- **Anonymous ID**: Generated once per browser, stored in `localStorage` as `ss_anon_id`
- **Session ID**: Generated once per tab, stored in `sessionStorage` as `ss_session_id`
- **Page views**: Tracked on init and on `pushState` / `replaceState` / `popstate` / `hashchange`
- **Batching**: Events are queued and flushed every 3 seconds (configurable)
- **Retry**: Failed flushes retry with exponential backoff (max 3 attempts)
- **Tab close**: Queue is flushed on `visibilitychange` and `beforeunload`

## Event Schema

Each event sent to the backend:

```json
{
  "type": "page_view",
  "page": "https://example.com/pricing",
  "timestamp": 1779403800000,
  "anonymous_id": "v_abc-123",
  "session_id": "s_def-456",
  "metadata": { "referrer": "google" }
}
```

- `type`: 1–100 characters
- `page`: 1–2048 characters (auto-captured from `location.href`)
- `timestamp`: JavaScript `Date.now()` milliseconds
- `metadata`: Optional key-value object
- Batch limit: 1–50 events per request
