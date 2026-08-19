import { afterEach, describe, expect, it, vi } from 'vitest'
import { discoverBridgePort, DEFAULT_EXTENSION_PORT } from './bridge-port'

function route(handlers: Record<string, (url: string) => { ok: boolean; json?: unknown }>) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    for (const [prefix, handler] of Object.entries(handlers)) {
      if (url.startsWith(prefix)) {
        const res = handler(url)
        return { ok: res.ok, json: async () => res.json } as Response
      }
    }
    return { ok: false, json: async () => null } as Response
  }) as unknown as typeof fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  // @ts-expect-error vitest global restore
  delete globalThis.fetch
})

describe('discoverBridgePort', () => {
  it('adopts the app-reported extensionPort when the configured port is alive on a different one', async () => {
    route({
      'http://127.0.0.1:6802/api/ping': () => ({ ok: true }),
      'http://127.0.0.1:6802/extension-config': () => ({ ok: true, json: { extensionPort: 6900 } }),
    })
    const r = await discoverBridgePort(DEFAULT_EXTENSION_PORT)
    expect(r).toEqual({ port: 6900, source: 'app', authRequired: false, authToken: '' })
  })

  it('keeps the configured port when the app reports the same port', async () => {
    route({
      'http://127.0.0.1:6802/api/ping': () => ({ ok: true }),
      'http://127.0.0.1:6802/extension-config': () => ({ ok: true, json: { extensionPort: 6802 } }),
    })
    const r = await discoverBridgePort(DEFAULT_EXTENSION_PORT)
    expect(r).toEqual({ port: 6802, source: 'stored', authRequired: false, authToken: '' })
  })

  it('scans the range when the configured port is dead and finds a candidate', async () => {
    const aliveAt = 6877
    route({
      'http://127.0.0.1:6802/api/ping': () => ({ ok: false }),
      [`http://127.0.0.1:${aliveAt}/api/ping`]: () => ({ ok: true }),
      [`http://127.0.0.1:${aliveAt}/extension-config`]: () => ({ ok: true, json: { extensionPort: 6877 } }),
    })
    const r = await discoverBridgePort(DEFAULT_EXTENSION_PORT)
    expect(r).toEqual({ port: 6877, source: 'scan', authRequired: false, authToken: '' })
  })

  it('returns null when nothing answers', async () => {
    route({})
    const r = await discoverBridgePort(DEFAULT_EXTENSION_PORT)
    expect(r.port).toBeNull()
    expect(r.source).toBe('scan')
  })

  it('falls back to the default when preferredPort is invalid', async () => {
    route({
      'http://127.0.0.1:6802/api/ping': () => ({ ok: true }),
      'http://127.0.0.1:6802/extension-config': () => ({ ok: true, json: { extensionPort: 6802 } }),
    })
    // @ts-expect-error intentionally invalid type
    const r = await discoverBridgePort('bad')
    expect(r.port).toBe(6802)
  })
})