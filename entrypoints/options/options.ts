// MoonHunt options — HTTP-only connection settings
import { EXTENSION_LOCALES, applyExtensionLocale, applyExtensionLocaleOnly, getExtensionLocale, loadExtensionLocale, t } from '../../lib/i18n'

const $ = (id: string) => document.getElementById(id)!

// ─── Theme ─────────────────────────────────────────────
const THEMES: Record<string, { accent: string; bodyClass: string }> = {
  dark: { accent: '', bodyClass: '' },
  light: { accent: '#ff9f43', bodyClass: 'light' },
  'linear-dark': { accent: '#5e6ad2', bodyClass: 'linear-dark' },
}

let currentTheme = 'dark'
let stagedLanguage = getExtensionLocale()

function applyTheme(name: string) {
  currentTheme = name
  const theme = THEMES[name] ?? { accent: '', bodyClass: '' }
  document.body.className = ''
  if (theme.bodyClass) document.body.classList.add(theme.bodyClass)
  if (theme.accent) document.body.style.setProperty('--accent', theme.accent)
  else document.body.style.removeProperty('--accent')
  document.querySelectorAll('.theme-card').forEach((c) => c.classList.remove('active'))
  const id = name === 'dark' ? 'themeDark' : name === 'light' ? 'themeLight' : 'themeLinear'
  $(id)?.classList.add('active')
}

function showStatus(msg: string, type: 'success' | 'error') {
  const el = $('status')
  el.textContent = msg
  el.className = `status show ${type}`
  setTimeout(() => { el.className = 'status' }, 4000)
}

function buildLanguageCards() {
  const container = $('languageCards')
  if (!container) return
  container.innerHTML = ''
  const current = getExtensionLocale()
  for (const loc of EXTENSION_LOCALES) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `language-card${current === loc.code ? ' active' : ''}`
    btn.dataset.locale = loc.code
    btn.setAttribute('aria-pressed', String(current === loc.code))
    const img = document.createElement('img')
    img.className = 'language-flag'
    img.src = loc.flag
    img.alt = ''
    const name = document.createElement('span')
    name.className = 'language-name'
    name.textContent = loc.label
    const check = document.createElement('i')
    check.className = 'material-icons language-check'
    check.textContent = 'check_circle'
    btn.appendChild(img)
    btn.appendChild(name)
    btn.appendChild(check)
    btn.addEventListener('click', () => {
      stagedLanguage = loc.code
      document.querySelectorAll('.language-card').forEach((c) => {
        c.classList.toggle('active', c === btn)
        c.setAttribute('aria-pressed', String(c === btn))
      })
    })
    container.appendChild(btn)
  }
}


function load() {
  chrome.storage.sync.get({
    host: '127.0.0.1', port: 6802,
    interceptDownloads: true, cookieSharingEnabled: false,
    extensionAuthToken: '',
  }, (items: Record<string, unknown>) => {
    ;($('host') as HTMLInputElement).value = String(items.host ?? '127.0.0.1')
    ;($('port') as HTMLInputElement).value = String(items.port ?? 6802)
    ;($('toggleIntercept') as HTMLDivElement).classList.toggle('active', !!items.interceptDownloads)
    ;($('toggleCookies') as HTMLDivElement).classList.toggle('active', !!items.cookieSharingEnabled)
    ;($('authToken') as HTMLInputElement).value = String(items.extensionAuthToken ?? '')
    ;($('authToken') as HTMLInputElement).type = 'password'
  })
}

function save() {
  applyExtensionLocaleOnly(stagedLanguage)
  chrome.storage.sync.set({
    host: ($('host') as HTMLInputElement).value || '127.0.0.1',
    port: parseInt(($('port') as HTMLInputElement).value) || 6802,
    interceptDownloads: $('toggleIntercept').classList.contains('active'),
    cookieSharingEnabled: $('toggleCookies').classList.contains('active'),
    extensionAuthToken: ($('authToken') as HTMLInputElement).value.trim(),
    theme: currentTheme,
    language: stagedLanguage,
  }, () => {
    showStatus(t('Saved'), 'success')
    updateConnectionBadge()
  })
}

function updateConnectionBadge() {
  const badge = $('connBadge')
  // Reflect the SAVED config, not uncommitted input edits, so nothing changes
  // until Save Changes is pressed.
  chrome.storage.sync.get({ host: '127.0.0.1', port: 6802, extensionAuthToken: '' }, (items) => {
    const host = typeof items.host === 'string' && items.host ? items.host : '127.0.0.1'
    const port = Number(items.port) || 6802
    const token = typeof items.extensionAuthToken === 'string' ? items.extensionAuthToken.trim() : ''
    const headers: Record<string, string> = {}
    if (token) headers['X-MoonHunt-Token'] = token
    doPing(`http://${host}:${port}/api/ping`, headers, badge)
  })
}

// Live app open/closed checker — a dedicated card distinct from the top badge.
// A fetch to a closed port can hang (no response, slow reject), which would
// leave the card stuck on its previous state. AbortController forces a fast,
// deterministic "closed" verdict.
function pingWithTimeout(url: string, headers: Record<string, string>, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { headers, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function updateAppStatus() {
  const card = $('#appStatusCard') as HTMLElement
  const text = $('#appStatusText') as HTMLElement
  if (!card) return
  chrome.storage.sync.get({ host: '127.0.0.1', port: 6802, extensionAuthToken: '' }, (items) => {
    const host = typeof items.host === 'string' && items.host ? items.host : '127.0.0.1'
    const port = Number(items.port) || 6802
    const token = typeof items.extensionAuthToken === 'string' ? items.extensionAuthToken.trim() : ''
    const headers: Record<string, string> = {}
    if (token) headers['X-MoonHunt-Token'] = token

    pingWithTimeout(`http://${host}:${port}/api/ping`, headers, 1500)
      .then((r) => {
        if (r.status === 401) {
          card.className = 'app-status-card unauthorized'
          text.textContent = t('Unauthorized') + ' — ' + t('check your token')
          return
        }
        if (!r.ok) throw new Error()
        card.className = 'app-status-card open'
        text.textContent = '● ' + t('Connected') + ' — ' + t('MoonHunt is running')
      })
      .catch(() => {
        card.className = 'app-status-card closed'
        text.textContent = '● ' + t('MoonHunt is closed')
      })
  })
}

function doPing(url: string, headers: Record<string, string>, badge: HTMLElement) {
  pingWithTimeout(url, headers, 1500)
    .then((r) => {
      if (r.status === 401) {
        badge.textContent = '● Unauthorized'
        badge.className = 'badge rejected'
        return
      }
      if (!r.ok) throw new Error()
      badge.textContent = '● ' + t('Connected')
      badge.className = 'badge connected'
    })
    .catch(() => {
      badge.textContent = '● ' + t('Disconnected')
      badge.className = 'badge disconnected'
    })
}

// Nav
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    const sec = (item as HTMLElement).dataset.section
    if (!sec) return
    document.querySelectorAll('.sidebar-item').forEach(n => n.classList.remove('active'))
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'))
    item.classList.add('active')
    $(`section-${sec}`)?.classList.add('active')
  })
})

document.addEventListener('DOMContentLoaded', async () => {
  await loadExtensionLocale()
  applyExtensionLocale()
  stagedLanguage = getExtensionLocale()
  buildLanguageCards()
  load()

  $('connBadge').textContent = '● ' + t('Checking…')
  try {
    updateConnectionBadge()
    setInterval(updateConnectionBadge, 3000)
    updateAppStatus()
    setInterval(updateAppStatus, 3000)
  } catch (err) {
    // Surface init failures instead of silently hanging on "Checking…".
    $('connBadge').textContent = '● ERROR: ' + (err instanceof Error ? err.message : String(err))
    console.error('[MoonHunt] status init failed:', err)
  }
  // Hard fallback: if the first ping somehow never settles, never leave the
  // badge stuck on "Checking…".
  setTimeout(() => {
    if ($('connBadge').textContent.includes('Checking')) {
      $('connBadge').textContent = '● ' + t('Disconnected')
      $('connBadge').className = 'badge disconnected'
    }
  }, 2000)

  // About modal (mirrors the desktop app)
  const aboutModal = document.getElementById('aboutModal')
  const aboutCloseBtn = document.getElementById('aboutCloseBtn')
  $('aboutBtn')?.addEventListener('click', () => aboutModal?.classList.add('open'))
  aboutCloseBtn?.addEventListener('click', () => aboutModal?.classList.remove('open'))
  aboutModal?.addEventListener('mousedown', (event) => {
    if (event.target === aboutModal) aboutModal.classList.remove('open')
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') aboutModal?.classList.remove('open')
  })

  // Theme
  chrome.storage.sync.get({ theme: 'dark' }, (items: Record<string, unknown>) => applyTheme(String(items.theme ?? 'dark')))
  document.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      const theme = (card as HTMLElement).dataset.theme
      if (theme) applyTheme(theme)
    })
  })

  // Toggles only update the UI — nothing persists until Save Changes is pressed.
  document.getElementById('toggleIntercept')?.addEventListener('click', () => {
    $('toggleIntercept').classList.toggle('active')
  })
  document.getElementById('toggleCookies')?.addEventListener('click', () => {
    $('toggleCookies').classList.toggle('active')
  })
  let authTokenVisible = false
  document.getElementById('hideAuthBtn')?.addEventListener('click', () => {
    authTokenVisible = !authTokenVisible
    ;($('authToken') as HTMLInputElement).type = authTokenVisible ? 'text' : 'password'
    const icon = ($('hideAuthBtn') as HTMLElement).querySelector('.material-icons')
    if (icon) icon.textContent = authTokenVisible ? 'visibility' : 'visibility_off'
  })
  document.getElementById('copyAuthBtn')?.addEventListener('click', () => {
    const v = ($('authToken') as HTMLInputElement).value.trim()
    if (v) navigator.clipboard.writeText(v)
  })

  // Save
  document.querySelector('.btn-save')?.addEventListener('click', save)

  // Test connection — HTTP only
  const testBtn = $('testBtn')
  if (testBtn) {
    let testing = false
    testBtn.addEventListener('click', async () => {
      if (testing) return
      testing = true
      testBtn.innerHTML = '<i class="material-icons">wifi</i> ' + t('Testing…')
      const host = ($('host') as HTMLInputElement).value || '127.0.0.1'
      const httpPort = parseInt(($('port') as HTMLInputElement).value) || 6802
      const token = ($('authToken') as HTMLInputElement).value.trim()
      const headers: Record<string, string> = {}
      if (token) headers['X-MoonHunt-Token'] = token

      try {
        const r = await fetch(`http://${host}:${httpPort}/api/ping`, { headers })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        showStatus(`${t('Connected — MoonHunt v')}${d.version ?? '?'}`, 'success')
      } catch (e) {
        showStatus(`${t('Connection failed')}: ${e}`, 'error')
      } finally {
        testing = false
        testBtn.innerHTML = '<i class="material-icons">wifi</i> ' + t('Test Connection')
      }
    })
  }

  // Copy buttons
  $('copyPortBtn')?.addEventListener('click', () => navigator.clipboard.writeText(($('port') as HTMLInputElement).value || '6802'))

  // About: open the desktop app's GitHub repository
  const readGithubUrl = (): string => {
    const url = (document.getElementById('aboutGithubUrl') as HTMLSpanElement | null)?.textContent?.trim()
    return url && /^https?:\/\//i.test(url) ? url : 'https://github.com/2sulraw/MoonHunt-DownloadManager'
  }
  $('aboutGithubBtn')?.addEventListener('click', () => {
    const url = readGithubUrl()
    try {
      chrome.tabs.create({ url })
    } catch {
      window.open(url, '_blank', 'noopener')
    }
  })
})
