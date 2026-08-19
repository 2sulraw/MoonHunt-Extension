import { describe, expect, it } from 'vitest'
import {
  RequestHeaderContextStore,
  buildRequestHeaderExtraInfoSpec,
  captureRequestHeaderContext,
  requestHeadersToRecord,
} from './request-context'

describe('request header context', () => {
  it('keeps only safe whitelisted headers and extracts user-agent separately', () => {
    const context = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      now: 1000,
      requestHeaders: [
        { name: 'User-Agent', value: 'Browser/1.0' },
        { name: 'Accept', value: 'application/octet-stream' },
        { name: 'Accept-Language', value: 'en-US,en;q=0.9' },
        { name: 'Sec-Fetch-Site', value: 'same-origin' },
        { name: 'X-Custom-Token', value: 'secret' },
      ],
    })

    expect(context).toEqual({
      url: 'https://cdn.example.com/file.zip',
      createdAt: 1000,
      userAgent: 'Browser/1.0',
      requestHeaders: [
        { name: 'Accept', value: 'application/octet-stream' },
        { name: 'Accept-Language', value: 'en-US,en;q=0.9' },
        { name: 'Sec-Fetch-Site', value: 'same-origin' },
      ],
    })
  })

  it('captures cookie/referer/origin and skips forbidden headers', () => {
    const context = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      requestHeaders: [
        { name: 'Host', value: 'cdn.example.com' },
        { name: 'Authorization', value: 'Bearer secret' },
        { name: 'Proxy-Authorization', value: 'secret' },
        { name: 'Range', value: 'bytes=0-' },
        { name: 'Cookie', value: 'xf_session=abc; cf_clearance=ok' },
        { name: 'Referer', value: 'https://example.com/files' },
        { name: 'Origin', value: 'https://example.com' },
      ],
    })

    expect(context?.cookie).toBe('xf_session=abc; cf_clearance=ok')
    expect(context?.referer).toBe('https://example.com/files')
    expect(context?.requestHeaders).toEqual([{ name: 'Origin', value: 'https://example.com' }])
  })

  it('strips CR and LF from captured values', () => {
    const context = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      requestHeaders: [
        { name: 'User-Agent', value: 'Browser\r\nInjected: 1' },
        { name: 'Origin', value: 'https://example.com\nInjected: 1' },
      ],
    })

    expect(context?.userAgent).toBe('Browser Injected: 1')
    expect(context?.requestHeaders).toEqual([
      { name: 'Origin', value: 'https://example.com Injected: 1' },
    ])
  })

  it('matches finalUrl before url and consumes the matched context', () => {
    let now = 1000
    const store = new RequestHeaderContextStore(() => now, 30_000, 16)
    const original = captureRequestHeaderContext({
      url: 'https://origin.example.com/download',
      requestHeaders: [{ name: 'Accept', value: 'origin' }],
    })
    const final = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      requestHeaders: [{ name: 'Accept', value: 'final' }],
    })

    expect(original).not.toBeNull()
    expect(final).not.toBeNull()
    store.remember(original!)
    store.remember(final!)

    const matched = store.match({
      url: 'https://origin.example.com/download',
      finalUrl: 'https://cdn.example.com/file.zip',
    })

    expect(matched).toEqual(
      expect.objectContaining({
        matched: true,
        reason: 'matched',
        source: 'finalUrl',
        ageMs: 0,
      }),
    )
    expect(matched.context?.requestHeaders).toEqual([{ name: 'Accept', value: 'final' }])

    const secondMatch = store.match({
      url: 'https://origin.example.com/download',
      finalUrl: 'https://cdn.example.com/file.zip',
    })
    expect(secondMatch).toEqual(
      expect.objectContaining({
        matched: true,
        reason: 'matched',
        source: 'url',
      }),
    )
    expect(secondMatch.context).toEqual(original)
  })

  it('expires entries after the TTL', () => {
    let now = 1000
    const store = new RequestHeaderContextStore(() => now, 100, 16)
    const context = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      now,
      requestHeaders: [{ name: 'Accept', value: '*/*' }],
    })

    expect(context).not.toBeNull()
    store.remember(context!)
    now = 1101

    expect(store.match({ url: 'https://cdn.example.com/file.zip' })).toEqual({
      matched: false,
      reason: 'expired',
    })
  })

  it('flattens captured context into the MoonHunt headers map', () => {
    const context = captureRequestHeaderContext({
      url: 'https://cdn.example.com/file.zip',
      requestHeaders: [
        { name: 'Cookie', value: 'sid=1' },
        { name: 'Referer', value: 'https://example.com/' },
        { name: 'User-Agent', value: 'Browser/1.0' },
        { name: 'Origin', value: 'https://example.com' },
        { name: 'Accept', value: 'application/json' },
      ],
    })

    expect(requestHeadersToRecord(context ?? undefined)).toEqual({
      cookie: 'sid=1',
      referer: 'https://example.com/',
      'user-agent': 'Browser/1.0',
      origin: 'https://example.com',
      accept: 'application/json',
    })
  })

  it('uses extraHeaders only for Chromium request-header capture', () => {
    expect(buildRequestHeaderExtraInfoSpec('chromium')).toEqual(['requestHeaders', 'extraHeaders'])
    expect(buildRequestHeaderExtraInfoSpec('firefox')).toEqual(['requestHeaders'])
  })
})
