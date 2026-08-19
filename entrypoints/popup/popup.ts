// MoonHunt popup — dashboard
import { applyExtensionLocale, loadExtensionLocale, t } from '../../lib/i18n'
import { buildProtocolUrl, openProtocolTab, wakeAndWaitForApi } from '../../lib/desktop'

const $ = (id: string) => document.getElementById(id)!
const HOST = '127.0.0.1'

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '—'
  if (bytesPerSec < 1000) return `${bytesPerSec} B/s`
  if (bytesPerSec < 1000000) return `${(bytesPerSec / 1000).toFixed(1)} KB/s`
  return `${(bytesPerSec / 1000000).toFixed(1)} MB/s`
}

let httpPort = 6802

async function updateUI() {
  const connBadge = $('connBadge')
  const openBtn = $('openBtn')
  const { token } = await chrome.storage.sync.get({ extensionAuthToken: '' })
  const headers: Record<string, string> = {}
  if (typeof token === 'string' && token) headers['X-MoonHunt-Token'] = token
  try {
    const r = await fetch(`http://${HOST}:${httpPort}/api/ping`, { headers })
    if (r.status === 401) {
      connBadge.textContent = '● Unauthorized'
      connBadge.className = 'badge rejected'
      $('statActive').textContent = '-'
      $('statSpeed').textContent = '-'
      $('statCompleted').textContent = '-'
      // App is up (auth is wrong) — button disabled.
      openBtn.classList.add('disabled')
      openBtn.setAttribute('aria-disabled', 'true')
      return
    }
    if (r.ok) {
      connBadge.textContent = '● ' + t('Connected')
      connBadge.className = 'badge connected'
      $('statActive').textContent = '0'
      $('statSpeed').textContent = formatSpeed(0)
      $('statCompleted').textContent = '0'
      // App is running — "Open MoonHunt" has nothing to open; fade it out.
      openBtn.classList.add('disabled')
      openBtn.setAttribute('aria-disabled', 'true')
    } else { throw new Error() }
  } catch {
    connBadge.textContent = '● ' + t('Disconnected')
    connBadge.className = 'badge disconnected'
    $('statActive').textContent = '-'
    $('statSpeed').textContent = '-'
    $('statCompleted').textContent = '-'
    // App is closed — the button launches it.
    openBtn.classList.remove('disabled')
    openBtn.setAttribute('aria-disabled', 'false')
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadExtensionLocale()
  applyExtensionLocale()
  $('connBadge').textContent = '● ' + t('Checking…')

  chrome.storage.sync.get({ port: 6802 }, (items: Record<string, unknown>) => {
    httpPort = Number(items.port ?? 6802)
  })
  updateUI()
  setInterval(updateUI, 3000)

  chrome.storage.sync.get({ interceptDownloads: true }, (items) => {
    const on = !!items.interceptDownloads
    $('interceptTrack').classList.toggle('on', on)
    $('toggleState').textContent = on ? t('Enabled') : t('Disabled')
  })
  $('toggleIntercept').addEventListener('click', () => {
    chrome.storage.sync.get({ interceptDownloads: true }, (items) => {
      const newVal = !items.interceptDownloads
      // Apply the visual state immediately so the UI never freezes on a slow or
      // failed write; revert if the write actually failed.
      $('interceptTrack').classList.toggle('on', newVal)
      $('toggleState').textContent = newVal ? t('Enabled') : t('Disabled')
      chrome.storage.sync.set({ interceptDownloads: newVal }, () => {
        if (chrome.runtime.lastError) {
          $('interceptTrack').classList.toggle('on', !newVal)
          $('toggleState').textContent = !newVal ? t('Enabled') : t('Disabled')
          console.error('[MoonHunt] Failed to persist interceptDownloads:', chrome.runtime.lastError)
        }
      })
    })
  })

  // Reflect interception changes made in the options page (or elsewhere) while
  // the popup stays open, so the toggle never displays stale state.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.interceptDownloads?.newValue !== undefined) {
      const on = !!changes.interceptDownloads.newValue
      $('interceptTrack').classList.toggle('on', on)
      $('toggleState').textContent = on ? t('Enabled') : t('Disabled')
    }
  })

  $('openBtn').addEventListener('click', async () => {
    if ($('openBtn').classList.contains('disabled')) return
    const { token } = await chrome.storage.sync.get({ extensionAuthToken: '' })
    const headers: Record<string, string> = {}
    if (typeof token === 'string' && token) headers['X-MoonHunt-Token'] = token

// Button is disabled when the app is open, so this handler only runs when
    // the app is closed: launch it via the moonhunt:// protocol.
    const launched = await wakeAndWaitForApi({
      openProtocol: () => openProtocolTab(buildProtocolUrl(), true),
      forceOpenProtocol: true,
      checkApi: async () => {
        try {
          const r = await fetch(`http://${HOST}:${httpPort}/api/ping`, { headers })
          return r.ok
        } catch { return false }
      },
      maxWaitMs: 15_000,
    })
    if (!launched) {
      try { await chrome.tabs.create({ url: `http://${HOST}:${httpPort}/` }) } catch { /* ignore */ }
    }
  })

  $('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('/options.html') }).catch(() => {
      chrome.runtime.openOptionsPage?.()
    })
  })
  $('optionsLink').addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: chrome.runtime.getURL('/options.html') }).catch(() => {
      chrome.runtime.openOptionsPage?.()
    })
  })

})
