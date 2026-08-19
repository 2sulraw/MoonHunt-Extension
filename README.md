# MoonHunt Browser Extension

A browser extension for **MoonHunt Download Manager**. It intercepts downloads
in the browser and hands them to the MoonHunt desktop app, which takes over
with its download engine — so files land through MoonHunt with full speed,
session support, and no per-site configuration.

Works on **Chromium** browsers (Chrome, Edge, Brave…) and **Firefox**, as a
Manifest V3 extension on both.

## How it works

1. **Header capture.** The extension watches outgoing requests via
   `webRequest` and remembers the real headers for each URL — `Cookie`,
   `Referer`, `User-Agent`, plus a safe whitelist — for a few seconds.
2. **Interception.** When a download starts, the extension checks it against a
   filter pipeline, then forwards the URL plus captured headers to MoonHunt
   *before* the browser's own copy completes. The in-browser download is
   cancelled.
3. **To the desktop.** MoonHunt downloads the file with those headers, so
   authenticated, login-required, and redirect-based downloads work
   automatically.

Nothing is configured per-site. If the browser can start a download, the
extension can forward it.

## Features

- **Intercepts downloads from any site** — no provider list to maintain
- **Authenticated downloads just work** — cookies / referer / user-agent are
  forwarded, so files behind a login or a redirect host download in MoonHunt
- **Context-menu action** — “Download with MoonHunt” on links, images and media
- **True filenames** — Chromium reports the real filename (Content-Disposition
  applied) via `downloads.onDeterminingFilename`; Firefox falls back gracefully
- **Two interception paths** — Chrome MV3: blocking `webRequest` +
  `onDeterminingFilename`; Firefox MV3: blocking `webRequest` only
- **Filters** — optional file-extension rules and minimum-size rules let you
  keep the browser's downloads for small files or specific types
- **Optional cookie sharing for yt-dlp** — exported YouTube/Google cookies let
  MoonHunt's yt-dlp handle signed-in or age-restricted video (off by default)
- **Hides the browser's own download bar** — optional Chrome `downloads.ui`
  toggle keeps the tray from flashing on every intercepted download
- **Apps wake on demand** — a `moonhunt://` deep link launches the desktop app
  if it's closed, then waits for it to come online
- **Translated** — English, Persian, Spanish, Portuguese, Russian, Japanese,
  Chinese, and Arabic (RTL-aware)
- **Localization + theming** — the popup and options page mirror the desktop
  app's dark/light look

## Privacy

The extension is a **local-only bridge**. Everything it captures — including
cookies — is sent only to the MoonHunt desktop app running on the same machine
(`127.0.0.1`). Nothing is uploaded anywhere.

- No analytics, no telemetry, no tracking.
- No user data leaves your computer.
- Cookie sharing is **off by default** and opt-in.

## Requirements

- **MoonHunt desktop app** — the extension can't download anything on its own;
  it forwards downloads to the running app
- **Node.js ≥ 24** and **pnpm ≥ 10** for building

## Install (load unpacked)

### Chromium (Chrome / Edge)

1. Build the extension (below) or download a packaged `.zip`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `chromium-mv3` output folder.
4. Open the extension's options and enable **Intercept Downloads**.

### Firefox

1. Build the Firefox build (below) or use the release `.zip`.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Select the built `manifest.json` (or the zip).

## Build

```bash
pnpm install

pnpm build            # Chromium  → .output/chromium-mv3/
pnpm build:firefox    # Firefox   → .output/firefox-mv3/

pnpm zip              # package a Chromium .zip
pnpm zip:firefox      # package a Firefox .zip
```

Other useful scripts:

```bash
pnpm dev              # watch mode with auto-reload
pnpm test             # unit tests (vitest)
pnpm compile          # type-check (vue-tsc)
```

## Configuration

Open **Settings** (via the popup or `chrome://extensions` → *Details* →
Extension options):

| Setting | What it does |
| --- | --- |
| Host / Port | Where MoonHunt's bridge listens (default `127.0.0.1:6802`). The extension probes the app automatically, so you usually don't need to touch these. |
| Auth Token | An optional shared token for the bridge. If the app requires one, set the same value here. |
| Intercept Downloads | Master switch for forwarding downloads to MoonHunt. |
| Cookie Sharing | Export session cookies to the app for yt-dlp (YouTube/Google). |
| Language / Theme | UI language and popup/options appearance. |

**Note:** whether authentication is *required* is decided by the app, not by
the extension.

## Project layout

```
entrypoints/
  background.ts            — header capture, download interception, forwarding
  content.ts               — moonhunt:// protocol-link handling
  options/                 — extension settings page
  popup/                   — toolbar popup
lib/
  filter.ts                — interception filter pipeline
  request-context.ts       — request-header capture cache
  bridge-port.ts           — MoonHunt port discovery + auth probing
  content-disposition.ts   — Content-Disposition filename parsing (no Buffer)
  desktop.ts               — wake-the-app deep-link flow
  i18n.ts                  — UI strings for 8 locales
shared/
  manifest.ts              — per-browser manifest
  i18n/                    — locale plumbing
```

## License

GPL-3.0