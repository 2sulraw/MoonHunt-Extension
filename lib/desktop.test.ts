import { describe, expect, it, vi } from 'vitest'
import { buildProtocolUrl, wakeAndWaitForApi } from './desktop'

describe('desktop protocol wake', () => {
  it('builds the moonhunt:// protocol URL', () => {
    expect(buildProtocolUrl()).toBe('moonhunt://')
  })

  it('returns true immediately if the API is already reachable', async () => {
    const opened = vi.fn()
    const result = await wakeAndWaitForApi({
      openProtocol: async () => { opened(); return () => {} },
      checkApi: async () => true,
      maxWaitMs: 5000,
    })
    expect(result).toBe(true)
    expect(opened).not.toHaveBeenCalled()
  })

  it('opens the protocol tab and polls until reachable', async () => {
    let calls = 0
    const checkApi = vi.fn(async () => {
      calls++
      return calls >= 3
    })
    const closed = vi.fn()
    const result = await wakeAndWaitForApi({
      openProtocol: async () => { closed.mockClear(); return closed },
      checkApi,
      maxWaitMs: 5000,
      pollIntervalMs: 5,
    })
    expect(result).toBe(true)
    expect(checkApi).toHaveBeenCalledTimes(3)
    expect(closed).toHaveBeenCalled()
  })

  it('returns false on timeout without ever reaching the API', async () => {
    const closed = vi.fn()
    const result = await wakeAndWaitForApi({
      openProtocol: async () => closed,
      checkApi: async () => false,
      maxWaitMs: 30,
      pollIntervalMs: 10,
    })
    expect(result).toBe(false)
    expect(closed).toHaveBeenCalled()
  })
})