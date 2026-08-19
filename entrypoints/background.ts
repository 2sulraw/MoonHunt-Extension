/**
 * MoonHunt background script — unified for Chrome MV3 and Firefox MV3.
 *
 * The extension captures the browser's real outgoing request headers through
 * webRequest (no provider config, no hardcoded hosts) and forwards them with
 * each intercepted download. Authenticated downloads therefore work on any
 * site, including redirect-based file hosts.
 */

import { browser } from 'wxt/browser'
import { createFilterPipeline, evaluateFilterPipeline, type FilterContext, type DownloadSettings } from '@/lib/filter'
import { parseContentDispositionFilename } from '../lib/content-disposition'
import { loadExtensionLocale, t } from '../lib/i18n'
import {
  RequestHeaderContextStore,
  buildRequestHeaderExtraInfoSpec,
  captureRequestHeaderContext,
  requestHeadersToRecord,
  type RequestHeaderContext,
} from '../lib/request-context'
import { buildProtocolUrl, openProtocolTab, wakeAndWaitForApi } from '../lib/desktop'
import { discoverBridgePort, DEFAULT_EXTENSION_PORT } from '../lib/bridge-port'

export default defineBackground(() => {
  // ─── Default settings ─────────────────────────────────
  const DEFAULT_SETTINGS: DownloadSettings = {
    enabled: true,
    interceptionEnabled: true,
    cookieSharingEnabled: false,
    fileExtensionRule: { enabled: false, extensions: [], listedAction: 'skip', unknownAction: 'intercept' },
    minimumFileSize: { enabled: false, sizeMb: 5, unknownSizeAction: 'intercept' },
  }

  // ─── State ────────────────────────────────────────────
  let settings: DownloadSettings = { ...DEFAULT_SETTINGS }
  const filterStages = createFilterPipeline()
  const browserFallbacks = new Map<string, number>()
  const pendingUrls = new Set<string>()
  const requestHeaderContexts = new RequestHeaderContextStore()
  const BROWSER_FALLBACK_TTL = 30_000
  const ALL_HTTP_URLS = ['http://*/*', 'https://*/*']
  const LOOPBACK_PREFIXES = ['http://127.0.0.1', 'http://localhost']

  let httpPort = DEFAULT_EXTENSION_PORT
  let authRequired = false
  let authToken = ''
  let manualAuth = false
  let discoverTimer: number | undefined

  function errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e)
  }

  function evaluateCandidate(
    url: string, finalUrl: string, filename: string, fileSize: number, totalBytes: number,
    mime: string, tabUrl: string, byExtensionId?: string,
  ): { tabUrl: string; stageName: string | null } | null {
    const ctx: FilterContext = { url, finalUrl, filename, fileSize, totalBytes, mimeType: mime, tabUrl, byExtensionId }
    const { verdict, stageName } = evaluateFilterPipeline(ctx, settings, filterStages)
    return verdict === 'skip' ? null : { tabUrl, stageName }
  }

  // ─── Bridge port discovery ───────────────────────────
  // The app's extension port is configurable (Settings → Browser Extension);
  // discover it from the app so a changed port never silently breaks delivery.
  let discoveryInFlight = false

  async function refreshBridgePort(trigger: string, preferred = httpPort): Promise<number> {
    if (discoveryInFlight) return httpPort
    discoveryInFlight = true
    try {
      const found = await discoverBridgePort(preferred, authToken)
      if (found.port && found.port !== httpPort) {
        console.log(`[MoonHunt] Bridge port discovered (${trigger}): ${found.port} (${found.source})`)
        httpPort = found.port
        try { chrome.storage.sync.set({ port: httpPort }) } catch {}
      }
      authRequired = found.authRequired
      if (!manualAuth) authToken = found.authToken
      if (authRequired && !authToken) {
        console.warn('[MoonHunt] Bridge auth is required but no token was provided')
      }
      return httpPort
    } finally {
      discoveryInFlight = false
    }
  }

  function scheduleBridgeRefresh(trigger: string, delayMs = 2000) {
    if (discoverTimer) clearTimeout(discoverTimer)
    discoverTimer = setTimeout(() => { discoverTimer = undefined; void refreshBridgePort(trigger) }, delayMs) as unknown as number
  }

  // A token typed in the options page overrides the auto-discovered one. Set
  // manualAuth so the periodic port refresh doesn't clobber it. Whether auth is
  // required is decided by the app (discovery), never by a local toggle.
  function applyStoredAuth(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ extensionAuthToken: '' }, (items) => {
        const token = typeof items.extensionAuthToken === 'string' ? items.extensionAuthToken.trim() : ''
        manualAuth = token !== ''
        if (manualAuth) authToken = token
        resolve()
      })
    })
  }

  function withAuthHeaders(headers: Record<string, string>): Record<string, string> {
    if (authRequired && authToken) headers['X-MoonHunt-Token'] = authToken
    return headers
  }

  async function sendToDesktop(url: string, filename: string, headers: Record<string, string> = {}) {
    const body = JSON.stringify({ url, filename, headers })
    const fetchHeaders = withAuthHeaders({ 'Content-Type': 'application/json' })

    const attempt = async (): Promise<boolean> => {
      try {
        console.log('[MoonHunt] HTTP POST /download:', body.length > 500 ? body.slice(0, 500) + '...' : body)
        const r = await fetch(`http://127.0.0.1:${httpPort}/download`, {
          method: 'POST', headers: fetchHeaders, body,
          keepalive: true,
        })
        return r.ok
      } catch { return false }
    }

    // Cancelled browser downloads must still reach MoonHunt, so retry briefly
    // on connection failures (e.g. the desktop app is still starting).
    if (await attempt()) return true
    // The app may be running on a different extension port now — refresh the
    // discovered port before retrying so a port change self-heals.
    await refreshBridgePort('post-failure', httpPort)
    await new Promise((resolve) => setTimeout(resolve, 400))
    return attempt()
  }

  const FORBIDDEN_MESSAGE_HEADERS = new Set([
    'authorization',
    'connection',
    'content-length',
    'host',
    'range',
    'transfer-encoding',
  ])

  function sanitizeMessageHeaders(input: unknown): Record<string, string> {
    const headers: Record<string, string> = {}
    if (!input || typeof input !== 'object') return headers
    for (const [rawName, rawValue] of Object.entries(input)) {
      const name = String(rawName).trim().toLowerCase()
      if (!name || FORBIDDEN_MESSAGE_HEADERS.has(name) || name.startsWith('proxy-') || name.startsWith('if-')) continue
      const value = String(rawValue).replace(/[\r\n]+/g, ' ').replace(/[ \t]+/g, ' ').trim()
      if (value) headers[name] = value
    }
    return headers
  }

  /**
   * Build the flat header map MoonHunt's bridge accepts. Captured browser
   * headers win; referrer and cookie fallbacks only fill gaps.
   */
  async function buildDownloadHeaders(
    url: string,
    context: RequestHeaderContext | undefined,
    fallbacks: { referrer?: string },
  ): Promise<Record<string, string>> {
    const headers = requestHeadersToRecord(context)
    if (!headers.referer && fallbacks.referrer) headers.referer = fallbacks.referrer
    if (!headers.origin && (headers.referer || fallbacks.referrer)) {
      try {
        headers.origin = new URL(headers.referer || fallbacks.referrer!).origin
      } catch {}
    }
    if (!headers.cookie) {
      try {
        const cookies = await browser.cookies.getAll({ url })
        if (cookies.length) headers.cookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
      } catch { /* permission may be missing */ }
    }
    return headers
  }

  // ─── App-not-running wake ────────────────────────────
  async function checkApi(): Promise<boolean> {
    try {
      const r = await fetch(`http://127.0.0.1:${httpPort}/api/ping`, { method: 'GET' })
      return r.ok
    } catch { return false }
  }

  /**
   * Wake the desktop app via moonhunt:// and re-send the queued download.
   * The browser's own "Open MoonHunt?" protocol prompt is the only UI — no
   * extra notification layer.
   */
  async function wakeMoonHunt(url: string, filename: string, headers: Record<string, string>) {
    try {
      const launched = await wakeAndWaitForApi({
        openProtocol: () => openProtocolTab(buildProtocolUrl()),
        checkApi,
        maxWaitMs: 15_000,
      })
      if (launched) await sendToDesktop(url, filename, headers)
    } catch (e) {
      console.warn('[MoonHunt] Wake failed:', errorMessage(e))
    }
  }

  // ─── Generic request-header capture ───────────────────
  function registerRequestHeaderCapture(): void {
    const wr = (browser as unknown as { webRequest?: WebRequestApi }).webRequest
    const listener = wr?.onBeforeSendHeaders
    if (!listener) {
      console.warn('[MoonHunt] webRequest.onBeforeSendHeaders unavailable')
      return
    }

    const browserName = import.meta.env.FIREFOX ? 'firefox' : 'chromium'
    const capture = (details: { url: string; requestHeaders?: Array<{ name?: string; value?: string }> }) => {
      if (!settings.enabled || !settings.interceptionEnabled) return
      if (LOOPBACK_PREFIXES.some((prefix) => details.url.startsWith(prefix))) return
      const context = captureRequestHeaderContext(details)
      if (context) requestHeaderContexts.remember(context)
    }

    const fullSpec = buildRequestHeaderExtraInfoSpec(browserName)
    for (const extraInfoSpec of [fullSpec, ['requestHeaders']]) {
      try {
        listener.addListener(capture, { urls: ALL_HTTP_URLS }, extraInfoSpec)
        return
      } catch (e) {
        if (extraInfoSpec === fullSpec && !fullSpec.includes('extraHeaders')) {
          console.warn('[MoonHunt] Request header capture unavailable:', errorMessage(e))
          return
        }
      }
    }
    console.warn('[MoonHunt] Request header capture unavailable')
  }

  // ─── Browser download interception ────────────────────
  function isCandidateUrl(url: string): boolean {
    if (!url) return false
    if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://') ||
        url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:')) return false
    return true
  }

  function filenameFromItem(item: { filename?: string }): string {
    return (item.filename || '').split(/[/\\]/).pop()?.trim() || 'download'
  }

  /**
   * Fallback interception via onCreated. At this point Chrome/Firefox may not
   * have resolved the real name yet (Content-Disposition is applied later), so
   * the filename can be URL-derived. Only used where onDeterminingFilename is
   * unavailable (Firefox, or Chrome without the downloads.shelf permission).
   */
  function registerCreatedInterception(): void {
    browser.downloads.onCreated.addListener((item) => {
      void (async () => {
        // TEMP DEBUG
        if (!settings.enabled || !settings.interceptionEnabled) return
        const url = item.url
        if (!isCandidateUrl(url)) return
        // In MV3 the non-blocking onHeadersReceived (Firefox) no longer cancels the
        // response, so the browser download continues past it. Cancel it here in
        // onCreated, which always observes the item with a real id we can cancel,
        // and erase it so Firefox's download manager keeps no trace.
        const hadFallback = browserFallbacks.has(url)
        if (hadFallback) browserFallbacks.delete(url)
        if (pendingUrls.has(url)) {
          // Already on its way to MoonHunt — still cancel + erase the copy.
          if (hadFallback) armCancelSweep(item.id)
          return
        }

        // onHeadersReceived already forwarded this download to MoonHunt with the
        // real Content-Disposition name, so just cancel + erase the browser copy.
        if (hadFallback) { armCancelSweep(item.id); return }

        const filename = filenameFromItem(item)
        const result = evaluateCandidate(url, item.finalUrl ?? url, filename,
          item.fileSize ?? -1, item.totalBytes ?? -1, item.mime ?? '', item.referrer ?? '')
        if (!result) return

        pendingUrls.add(url)
        const releaseUrl = () => pendingUrls.delete(url)
        setTimeout(releaseUrl, 60_000)

        // Cancel the browser's own download so it never commits the file. Headers
        // are captured by webRequest (which runs before onCreated), so the token-
        // auth headers are still available to forward regardless of cancel.
        armCancelSweep(item.id)

        const match = requestHeaderContexts.match({ url, finalUrl: item.finalUrl ?? url })
        const headers = await buildDownloadHeaders(url, match.context, { referrer: item.referrer ?? '' })

        console.log('[MoonHunt] Intercepted download:', { url, filename, referrer: headers.referer, cookieCount: (headers.cookie || '').split(';').filter(Boolean).length })
        void sendToDesktop(url, filename, headers).then((success) => {
          if (!success) void wakeMoonHunt(url, filename, headers)
        })
        releaseUrl()
      })()
    })
  }

  /**
   * Chrome (MV3) interception via onDeterminingFilename. This event fires with
   * the *final* suggested name — after Content-Disposition has been applied —
   * which fixes downloads that previously reached MoonHunt with a generic
   * "download" or URL-derived name. Requires the "downloads.shelf" permission.
   */
  function registerDeterminingFilenameInterception(): void {
    browser.downloads.onDeterminingFilename.addListener((item, suggest) => {
      const url = item.url
      let intercept = false
      let filename = 'download'
      try {
        if (!settings.enabled || !settings.interceptionEnabled) return
        if (!isCandidateUrl(url)) return
        if (pendingUrls.has(url)) return
        if (browserFallbacks.has(url)) { browserFallbacks.delete(url); return }

        filename = filenameFromItem(item)
        const result = evaluateCandidate(url, item.finalUrl ?? url, filename,
          item.fileSize ?? -1, item.totalBytes ?? -1, item.mime ?? '', item.referrer ?? '')
        intercept = !!result
      } finally {
        // `suggest` must be called exactly once. Keep Chrome's own name for
        // non-intercepted downloads — never rename them.
        if (intercept && filename !== 'download') suggest({ filename })
        else suggest()
      }
      if (!intercept) return

      void (async () => {
        if (pendingUrls.has(url)) return
        pendingUrls.add(url)
        const releaseUrl = () => pendingUrls.delete(url)
        setTimeout(releaseUrl, 60_000)

        // The real filename is known now, so cancel Chrome's copy — MoonHunt
        // downloads the file under this name instead. armCancelSweep re-cancels
        // once the item is cancellable so a race can't let the file commit.
        try { await browser.downloads.cancel(item.id) } catch { /* webRequest already cancelled it — expected */ }
        armCancelSweep(item.id)

        const match = requestHeaderContexts.match({ url, finalUrl: item.finalUrl ?? url })
        const headers = await buildDownloadHeaders(url, match.context, { referrer: item.referrer ?? '' })

        console.log('[MoonHunt] Intercepted download:', { url, filename, referrer: headers.referer, cookieCount: (headers.cookie || '').split(';').filter(Boolean).length })
        void sendToDesktop(url, filename, headers).then((success) => {
          if (!success) void wakeMoonHunt(url, filename, headers)
        })
        releaseUrl()
      })()
    })
  }

  // Chrome resolves the final filename (Content-Disposition applied) in
  // onDeterminingFilename; Firefox does not support that event (bugzilla
  // 1245652), so it keeps the onCreated fallback.
  let determiningFilenameAvailable = false
  try {
    if (typeof browser.downloads.onDeterminingFilename?.addListener === 'function') {
      registerDeterminingFilenameInterception()
      determiningFilenameAvailable = true
    }
  } catch (e) {
    console.warn('[MoonHunt] onDeterminingFilename unavailable:', errorMessage(e))
  }
  if (!determiningFilenameAvailable) registerCreatedInterception()

  // ─── Cancel sweeper ───────────────────────────────────
  // downloads.cancel() only works while a download is in_progress, and in both
  // onDeterminingFilename and onCreated it can race the download starting. This
  // listener cancels any download we've flagged the moment it becomes
  // cancellable, so the file never commits even if the earlier cancel raced.
  // Erasing is decoupled from cancel(): erase() only succeeds once the item is
  // in a terminal state, and by then cancel() may have already rejected, so the
  // two must not be chained (.then). Attempt erase in every terminal state.
  const cancelSweep = new Set<number>()
  function eraseDownload(id: number) {
    try { void browser.downloads.erase({ id }).catch(() => {}) } catch { /* already gone */ }
  }
  browser.downloads.onChanged.addListener((delta) => {
    if (!cancelSweep.has(delta.id)) return
    const st = delta.state?.current
    if (st === 'in_progress' || st === 'interrupted') {
      cancelSweep.delete(delta.id)
      try { void browser.downloads.cancel(delta.id).catch(() => {}) } catch { /* already gone */ }
      eraseDownload(delta.id)
    } else if (st === 'complete') {
      // Already done cancelling; just clear the trace.
      cancelSweep.delete(delta.id)
      eraseDownload(delta.id)
    }
  })
  function armCancelSweep(id: number) {
    cancelSweep.add(id)
    // If the download already reached a cancellable state before the listener
    // saw it, cancel and erase immediately.
    try { void browser.downloads.cancel(id).catch(() => {}) } catch { /* already gone */ }
    eraseDownload(id)
  }

  // ─── Firefox: non-blocking response interception ──────
  //
  // MV3 removes webRequestBlocking, so Firefox cannot cancel a response in
  // onHeadersReceived anymore (as it could under MV2). Instead, this listener
  // reads the real Content-Disposition filename non-blocking and forwards it
  // to MoonHunt; the onCreated handler below (downloads API, MV3-safe) cancels
  // the browser's own copy via downloads.cancel + the cancel-sweep.
  if (import.meta.env.FIREFOX) {
    try {
      const wr = (browser as unknown as { webRequest?: WebRequestApi }).webRequest
      if (wr?.onHeadersReceived) {
        // This listener must return synchronously: Firefox starts committing the
        // response as soon as an async listener yields, before its promise
        // resolves, so an awaited cancel arrives too late to stop the download.
        // Returning { cancel: true } here cancels the response before the
        // browser download begins — no tray popup, no DownloadManager entry.
        wr.onHeadersReceived.addListener(
          (details: WebRequestHeadersDetails) => {
            if (!settings.enabled || !settings.interceptionEnabled) return
            if (details.type !== 'main_frame' && details.type !== 'sub_frame') return
            if (details.method !== 'GET') return
            if (details.statusCode < 200 || details.statusCode >= 300) return

            const cd = details.responseHeaders?.find((h) => h.name?.toLowerCase() === 'content-disposition')?.value
            if (!cd || !/attachment/i.test(cd)) return

            // Honor RFC 5987 filename*= (percent-encoded, decoded) and quoted
            // names containing ';' — the previous regex truncated both.
            const filename = parseContentDispositionFilename(cd) ?? 'download'

            const result = evaluateCandidate(details.url, details.url, filename, -1, -1, '',
              details.originUrl ?? details.documentUrl ?? '')
            if (!result) return

            browserFallbacks.set(details.url, Date.now() + BROWSER_FALLBACK_TTL)
            const match = requestHeaderContexts.match({ url: details.url, finalUrl: details.url })

            // Fire the desktop POST asynchronously, but return { cancel: true }
            // synchronously so Firefox blocks the browser's own download first.
            setTimeout(() => {
              void buildDownloadHeaders(details.url, match.context, {
                referrer: details.originUrl ?? details.documentUrl ?? '',
              }).then((headers) =>
                sendToDesktop(details.url, filename, headers).then((success) => {
                  if (!success) void wakeMoonHunt(details.url, filename, headers)
                })
              )
            }, 0)
            return { cancel: true }
          },
          { urls: ['<all_urls>'], types: ['main_frame', 'sub_frame'] },
          ['blocking', 'responseHeaders'],
        )
      }
    } catch (e) {
      console.warn('[MoonHunt] Firefox interception unavailable:', errorMessage(e))
    }
  }

  // ─── Context menu ─────────────────────────────────────
  browser.contextMenus.create({
    id: 'download-with-moonhunt',
    title: 'Download with MoonHunt',
    contexts: ['link', 'image', 'audio', 'video'],
  })
  void loadExtensionLocale().then(() => {
    browser.contextMenus.update('download-with-moonhunt', { title: t('Download with MoonHunt') }).catch(() => {})
  })
  browser.contextMenus.onClicked.addListener((info) => {
    const url = info.linkUrl || info.srcUrl
    if (!url) return
    void sendToDesktop(url, url.split('/').pop() || 'download', { referer: info.pageUrl ?? '' })
  })

  // ─── External protocol messages ───────────────────────
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && typeof msg === 'object' && (msg as { type?: string }).type === 'HANDLE_EXTERNAL_PROTOCOL') {
      const m = msg as { url: string; protocol: string }
      if (!m.url || !m.protocol) return
      void sendToDesktop(m.url, '')
      return { disposition: 'handled' as const }
    }
    if (msg && typeof msg === 'object' && (msg as { type?: string }).type === 'sendDownload') {
      const m = msg as { url: string; filename?: string; headers?: unknown }
      if (!m.url) return
      void sendToDesktop(m.url, m.filename || '', sanitizeMessageHeaders(m.headers))
        .then((ok) => sendResponse({ success: ok }))
        .catch(() => sendResponse({ success: false }))
      return true
    }
  })

  // ─── Cookie sharing for yt-dlp ───────────────────────
  const COOKIE_DOMAINS = ['.youtube.com', '.google.com', '.googlevideo.com', '.ytimg.com']
  async function exportCookies() {
    if (!settings.cookieSharingEnabled) return
    try {
      const all: { name: string; value: string; domain: string; path: string; expires: number | null; secure: boolean; sameSite: string }[] = []
      for (const domain of COOKIE_DOMAINS) {
        try {
          const cookies = await browser.cookies.getAll({ domain })
          all.push(...cookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expirationDate ?? null,
            secure: c.secure,
            sameSite: c.sameSite,
          })))
        } catch {}
      }
      if (!all.length) return
      const fetchHeaders = withAuthHeaders({ 'Content-Type': 'application/json' })
      const r = await fetch(`http://127.0.0.1:${httpPort}/save-cookies`, { method: 'POST', headers: fetchHeaders, body: JSON.stringify({ cookies: all }) })
      console.log(`[MoonHunt] Exported ${all.length} cookies → /save-cookies (${r.status})`)
    } catch (e) { console.warn('[MoonHunt] Cookie export failed:', errorMessage(e)) }
  }

  let exportDebounce: number | undefined
  const scheduleCookieExport = () => {
    if (exportDebounce) clearTimeout(exportDebounce)
    exportDebounce = window.setTimeout(() => { exportDebounce = undefined; void exportCookies() }, 2000)
  }

  // ─── Hide the browser's own download bar ────────────
  // Chrome shows a mini download toolbar when a download starts, which flashes
  // even though we cancel it a moment later. With the optional downloads.ui
  // permission, keep the bar hidden (Chrome-only; Firefox has no such API).
  async function hideBrowserDownloadBar(): Promise<void> {
    if (!import.meta.env.FIREFOX) {
      try {
        const ds = (browser.downloads as unknown as { setUiOptions?: (o: { enabled: boolean }) => Promise<void> })
        if (!ds.setUiOptions) return
        if (!await browser.permissions.contains({ permissions: ['downloads.ui'] })) {
          await browser.permissions.request({ permissions: ['downloads.ui'] }).catch(() => {})
        }
        await ds.setUiOptions({ enabled: false })
      } catch { /* permission or API unavailable */ }
    }
  }

  // ─── Init ─────────────────────────────────────────────
  chrome.storage.sync.get({
    port: DEFAULT_EXTENSION_PORT,
    interceptDownloads: true, cookieSharingEnabled: false,
  }, (items) => {
    void hideBrowserDownloadBar()
    httpPort = typeof items.port === 'number' ? items.port : DEFAULT_EXTENSION_PORT
    settings.interceptionEnabled = !!items.interceptDownloads
    settings.cookieSharingEnabled = !!items.cookieSharingEnabled
    console.log(`[MoonHunt] Init: httpPort=${httpPort}`)

    // Load the manual token first so discovery can authenticate the ping when
    // the app requires auth, then discover port and auth state.
    void applyStoredAuth().then(() => refreshBridgePort('init', httpPort)).then(() => {
      console.log(`[MoonHunt] Bridge port active: ${httpPort}`)
    })
    setInterval(() => { void refreshBridgePort('timer', httpPort) }, 30_000)

    // Export cookies once httpPort is known, then keep them fresh.
    void exportCookies()
    setInterval(exportCookies, 5 * 60 * 1000)
  })

  try {
    browser.cookies.onChanged.addListener((change) => {
      if (change.removed) return
      const d = change.cookie?.domain || ''
      if (d.includes('youtube.com') || d.includes('google.com') || d.includes('googlevideo.com')) {
        scheduleCookieExport()
      }
    })
  } catch { /* permission may be missing */ }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' || area === 'local') {
      if (changes.language !== undefined) {
        void loadExtensionLocale().then(() => {
          browser.contextMenus.update('download-with-moonhunt', { title: t('Download with MoonHunt') }).catch(() => {})
        })
      }
      if (changes.settings?.newValue) settings = { ...settings, ...changes.settings.newValue }
      if (changes.interceptDownloads !== undefined) settings.interceptionEnabled = !!changes.interceptDownloads.newValue
      if (changes.cookieSharingEnabled !== undefined) {
        settings.cookieSharingEnabled = !!changes.cookieSharingEnabled.newValue
        if (changes.cookieSharingEnabled.newValue) void exportCookies()
      }
      if (changes.port !== undefined) {
        const newPort = typeof changes.port.newValue === 'number' ? changes.port.newValue : DEFAULT_EXTENSION_PORT
        httpPort = newPort
        void refreshBridgePort('storage-change', newPort)
      }
      if (changes.extensionAuthToken !== undefined) {
        void applyStoredAuth().then(() => void refreshBridgePort('auth-change', httpPort))
      }
    }
  })

  registerRequestHeaderCapture()
  console.log('[MoonHunt] Background started')
})

// ─── Types (local) ────────────────────────────────────
interface WebRequestApi {
  onBeforeSendHeaders?: {
    addListener: (
      cb: (details: { url: string; requestHeaders?: Array<{ name?: string; value?: string }> }) => void,
      filter: { urls: string[] },
      extraInfoSpec?: string[],
    ) => void
  }
  onHeadersReceived?: {
    addListener: (
      cb: (details: WebRequestHeadersDetails) => void,
      filter: { urls: string[]; types?: string[] },
      extraInfoSpec: string[],
    ) => void
  }
}

interface WebRequestHeadersDetails {
  url: string
  method: string
  type: string
  statusCode: number
  originUrl?: string
  documentUrl?: string
  responseHeaders?: Array<{ name: string; value: string }>
}
