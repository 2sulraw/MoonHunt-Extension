/**
 * Bridge port discovery: find the port MoonHunt's HTTP bridge actually listens
 * on. The app's extension port is configurable (Settings → Browser Extension),
 * so the extension probes the app instead of trusting a hardcoded value.
 */

export const DEFAULT_EXTENSION_PORT = 6802
export const PORT_SCAN_START = 6800
export const PORT_SCAN_END = 6900

export interface BridgePortDiscoveryResult {
  port: number | null
  source: 'stored' | 'app' | 'scan'
  /** Whether MoonHunt requires an auth token to accept bridge requests. */
  authRequired: boolean
  /** The shared token to attach when authRequired. */
  authToken: string
  /** Whether the app has registered the moonhunt:// protocol (wake enabled). */
  protocolEnabled?: boolean
}

interface BridgeConfig {
  extensionPort: number
  authRequired: boolean
  authToken: string
  protocolEnabled?: boolean
}

const NO_AUTH = { authRequired: false, authToken: '' }

async function tryFetch(url: string, opts: { timeoutMs?: number; token?: string } = {}): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 800)
  const headers: Record<string, string> = {}
  if (opts.token) headers['X-MoonHunt-Token'] = opts.token
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal, headers })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function ping(port: number, token = ''): Promise<boolean> {
  const r = await tryFetch(`http://127.0.0.1:${port}/api/ping`, { token })
  return r?.ok ?? false
}

/** Ask the app which port it configured for the extension (authoritative). */
async function readBridgeConfig(port: number): Promise<BridgeConfig | null> {
  const r = await tryFetch(`http://127.0.0.1:${port}/extension-config`)
  if (!r?.ok) return null
  try {
    const data = (await r.json()) as { extensionPort?: unknown; authRequired?: unknown; protocolEnabled?: unknown }
    const p = Number(data.extensionPort)
    if (!(Number.isInteger(p) && p > 0)) return null
    return {
      extensionPort: p,
      authRequired: data.authRequired === true,
      authToken: '', // the token is never served to the browser; manual entry only
      protocolEnabled: data.protocolEnabled === true,
    }
  } catch {
    return null
  }
}

/**
 * Discover the live bridge port. Starts from the user-configured (or default)
 * port; once the app answers, its reported extensionPort wins. If the
 * configured port is dead, scan a small local range.
 */
export async function discoverBridgePort(preferredPort = DEFAULT_EXTENSION_PORT, token = ''): Promise<BridgePortDiscoveryResult> {
  const configured = Number.isInteger(preferredPort) ? preferredPort : DEFAULT_EXTENSION_PORT

  if (await ping(configured, token)) {
    const cfg = await readBridgeConfig(configured)
    if (cfg && cfg.extensionPort !== configured) {
      // The app rebuilt on a different port (e.g. user changed it in Settings).
      return { port: cfg.extensionPort, source: 'app', authRequired: cfg.authRequired, authToken: cfg.authToken }
    }
    return {
      port: configured, source: 'stored',
      authRequired: cfg?.authRequired ?? false, authToken: cfg?.authToken ?? '',
    }
  }

  for (let port = PORT_SCAN_START; port <= PORT_SCAN_END; port++) {
    if (port === configured) continue
    if (await ping(port, token)) {
      const cfg = await readBridgeConfig(port)
      const auth = cfg ?? { authRequired: false, authToken: '' }
      const fallbackAuth: BridgePortDiscoveryResult = { port: port, source: 'scan', ...auth }
      // Prefer the app's authoritative port and auth when config is readable.
      if (cfg) {
        return { port: cfg.extensionPort, source: 'scan', authRequired: cfg.authRequired, authToken: cfg.authToken }
      }
      return fallbackAuth
    }
  }

  return { port: null, source: 'scan', ...NO_AUTH }
}