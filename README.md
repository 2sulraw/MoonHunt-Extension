# MoonHunt Browser Extension

A browser extension for **MoonHunt Download Manager**. It intercepts downloads
in the browser and hands them to the MoonHunt desktop app, which takes over
with its download engine.

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

Nothing is configured per-site. If the browser can start a download, the
extension can forward it.


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

## Install

> **Note:** the zip already contains the built extension — the Build section
> below is only for developers who want to build from source.

### Chromium (Chrome / Edge)

1. Download the **Chromium zip** from the latest [release]. If you use Chrome,
   you can drag it straight into `chrome://extensions` and skip steps 2–3.
2. Otherwise, extract the zip and open `chrome://extensions` and enable
   **Developer mode**.
3. Click **Load unpacked** and select the extracted folder (the one containing
   `manifest.json`).
4. Open the extension's options and enable **Intercept Downloads**.

### Firefox

Install from [Firefox Add-ons (AMO)][amo] — the signed, official listing.
It installs like any regular add-on and updates automatically.

**Manual install** (from a release zip — temporary or unsigned):

1. Download the **Firefox zip** from the latest [release] (no extraction needed).
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Select the downloaded `.zip`.

> **Keep it installed permanently (unsigned):** Firefox normally refuses to
> keep an unsigned add-on. To get around that for a local install:
>
> 1. Type `about:config` in the address bar and press **Enter**.
>    Click **Accept the Risk and Continue** on the warning page.
> 2. In the search box, type `xpinstall.signatures.required`.
> 3. Click the **toggle** arrow on that row so the value turns `false`
>    (or click the **+ Add** button → **Boolean** → name it
>    `xpinstall.signatures.required` → set it to `false` if it doesn't exist).
> 4. Open `about:addons` (press `Ctrl+Shift+A`), click the **gear** icon, and
>    choose **Install Add-on From File…**, then pick the downloaded Firefox
>    zip.

[release]: https://github.com/2sulraw/moonhunt-extension/releases
[amo]: https://addons.mozilla.org/en-US/firefox/addon/moonhunt-download-manager/

## Build (developers)

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

Open **Settings**:

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