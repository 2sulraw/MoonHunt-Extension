/**
 * Generic content script for MoonHunt.
 *
 * Only external protocol links (magnet/ed2k/thunder) are handled at the DOM
 * level. HTTP(S) downloads are captured generically by the background worker
 * through downloads/webRequest, so no provider-specific code runs here.
 */

import { browser } from 'wxt/browser'

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  main() {
    const EXTERNAL_PROTOCOLS = ['magnet:', 'ed2k://', 'thunder://']

    const findExternalProtocolLink = (target: EventTarget | null): { protocol: string; url: string } | null => {
      if (!(target instanceof Element)) return null
      const href = target.closest('a[href]')?.getAttribute('href')
      if (!href) return null
      const protocol = EXTERNAL_PROTOCOLS.find((p) => href.toLowerCase().startsWith(p))
      return protocol ? { protocol, url: href } : null
    }

    document.addEventListener('click', (event) => {
      const link = findExternalProtocolLink(event.target)
      if (!link) return
      event.preventDefault()
      event.stopPropagation()
      browser.runtime.sendMessage({
        type: 'HANDLE_EXTERNAL_PROTOCOL',
        url: link.url,
        protocol: link.protocol,
      })
    })
  },
})
