/**
 * Desktop app integration outside the HTTP API: the `moonhunt://` deep-link
 * protocol and the wake-then-poll launch flow.
 */

import { browser } from 'wxt/browser'

export const MOONHUNT_PROTOCOL = 'moonhunt'

export function buildProtocolUrl(): string {
  return `${MOONHUNT_PROTOCOL}://`
}

export interface WakeOptions {
  openProtocol: () => Promise<() => void>
  checkApi: () => Promise<boolean>
  maxWaitMs: number
  pollIntervalMs?: number
  /** Open the protocol tab even when the app is already reachable (explicit "Open MoonHunt" action). */
  forceOpenProtocol?: boolean
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function isReachable(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await check()
  } catch {
    return false
  }
}

/**
 * Open a moonhunt:// URL in a focused tab, then poll the desktop API until it
 * is reachable (the app launched/revealed) or the timeout expires.
 */
export async function wakeAndWaitForApi(options: WakeOptions): Promise<boolean> {
  const pollIntervalMs = options.pollIntervalMs ?? 500

  // The app may already be running — skip the protocol tab entirely, unless
  // the caller explicitly wants to surface the app (popup "Open MoonHunt").
  if (!options.forceOpenProtocol && await isReachable(options.checkApi)) return true

  const closeTab = await options.openProtocol()
  try {
    const deadline = Date.now() + options.maxWaitMs
    while (Date.now() < deadline) {
      await sleep(pollIntervalMs)
      if (await isReachable(options.checkApi)) return true
    }
    return false
  } finally {
    closeTab()
  }
}

/**
 * Open a moonhunt:// URL in a tab and return a cleanup function that closes
 * it. The tab must stay open until cleanup so the user can confirm the
 * browser's protocol dialog.
 *
 * `active` defaults to false so automatic wakes (during download interception)
 * don't steal focus from the user's current tab. Explicit user actions (the
 * popup's "Open MoonHunt" button) should pass true — Firefox only reliably
 * surfaces the external-protocol prompt for a focused tab navigation.
 */
export async function openProtocolTab(url: string, active = false): Promise<() => void> {
  const tab = await browser.tabs.create({ url, active })
  const tabId = tab.id
  if (!tabId) return () => {}

  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    browser.tabs.onUpdated.removeListener(onUpdated)
    browser.tabs.remove(tabId).catch(() => {})
  }
  const onUpdated = (_id: number, info: { url?: string }) => {
    // Chrome navigates the protocol tab to about:blank after "Open".
    if (_id === tabId && info.url === 'about:blank') close()
  }
  browser.tabs.onUpdated.addListener(onUpdated)
  // Safety net: clean up after 30s regardless.
  setTimeout(close, 30_000)
  return close
}