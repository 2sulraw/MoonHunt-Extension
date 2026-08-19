# MoonHunt Browser Extension

A browser extension for **MoonHunt Download Manager**. It intercepts browser
downloads and sends them to the MoonHunt desktop app instead, so downloads
happen in the app with full speed and session support — no provider config
needed.

Works on **Chromium** browsers (Chrome, Edge, Brave…) and **Firefox**.

## How it works

- **Request-header capture.** The extension watches the browser's outgoing
  requests and remembers the real headers (`Cookie`, `Referer`, `User-Agent`,
  plus a safe whitelist) for each URL.
- **Download interception.** When you trigger a download, the extension grabs
  the URL + captured headers and hands them to MoonHunt before the browser
  starts its own copy.
- **To the desktop.** MoonHunt downloads the file with those headers, so
  authenticated, login-required, and redirect-based downloads work on any site
  automatically.

Nothing is configured per-site. If the browser can start the download, the
extension can forward it.

## Features

- Intercepts downloads from any site (no provider list)
- Forwards cookies / referer / user-agent so authenticated files download
- Context-menu action — "Download with MoonHunt" on links, images and media
- Optional YouTube/Google cookie sharing for **yt-dlp** — lets MoonHunt's
  yt-dlp handle signed-in or age-restricted video
- Works when MoonHunt handles a `moonhunt://` link to wake the app if closed

## Install (load unpacked)

### Chromium (Chrome / Edge)

1. Build the extension (below) or download a packaged release.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the `extension-v2` output folder.
4. Open the extension's options and enable **download interception**.

### Firefox

1. Build the Firefox version (below) or use the release zip.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Pick the built `manifest.json` (or the zip).

## Build

Requires [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

```bash
# install dependencies
pnpm install

# Chromium (Chrome/Edge)
npx wxt build -b chromium

# Firefox
npx wxt build -b firefox

# or build + zip both at once
npx wxt zip -b chromium
npx wxt zip -b firefox
```

Output goes to `.output/`. The built extension is **Manifest V3** on both
browsers.

## Privacy

The extension is a local-only bridge. Header and cookie data it captures is
sent **only** to the MoonHunt desktop app running on the same machine
(`127.0.0.1`). Nothing is uploaded anywhere.

- No analytics, no telemetry, no tracking.
- No user data leaves the computer.
- Cookie sharing is **off by default** and opt-in.

## Project layout

```
entrypoints/
  background.ts   — download interception + forwarding
  content.ts      — protocol-link handling
  options/        — extension settings page
  popup/          — toolbar popup
lib/
  filter.ts       — interception filter pipeline
  request-context.ts — request-header capture cache
  bridge-port.ts  — MoonHunt port discovery
shared/
  manifest.ts     — per-browser manifest
```

## License

GPL-3.0