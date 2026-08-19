export type ExtensionBrowser = 'chromium' | 'firefox' | string

export interface ExtensionManifest {
  name: string
  description: string
  default_locale: string
  permissions: string[]
  optional_permissions: string[]
  host_permissions: string[]
  optional_host_permissions: string[]
  content_security_policy?: {
    extension_pages?: string
  }
  options_ui?: {
    page: string
    open_in_tab: boolean
  }
  icons?: { 16: string; 48: string; 128: string }
  action?: { default_icon: string; default_popup: string }
  browser_specific_settings?: {
    gecko: {
      id: string
      strict_min_version: string
      data_collection_permissions?: { required?: Array<string>; optional?: Array<string> }
    }
    gecko_android?: {
      strict_min_version: string
    }
  }
}

const REQUIRED_PERMISSIONS = [
  'downloads',
  // Chrome-only: unlocks downloads.onDeterminingFilename, which reports the
  // real filename (Content-Disposition applied) instead of the URL-derived one
  // available at onCreated time. Kept out of the Firefox list below (Firefox
  // does not implement the event at all).
  'downloads.shelf',
  'storage',
  'contextMenus',
  'cookies',
  'webRequest',
  'tabs',
] as const

const FIREFOX_REQUIRED_PERMISSIONS = [
  'downloads',
  'storage',
  'contextMenus',
  'webRequest',
  // Firefox MV3 still supports blocking webRequest (unlike Chrome MV3), so
  // the response-level cancel in background.ts can stop the browser download
  // before it starts — no tray popup, no DownloadManager trace.
  'webRequestBlocking',
  'cookies',
  'tabs',
] as const

const LOOPBACK = ['http://127.0.0.1/*', 'http://localhost/*'] as const
const ALL_HTTP = ['https://*/*', 'http://*/*'] as const

export function buildExtensionManifest(browser: ExtensionBrowser): ExtensionManifest {
  const isFirefox = browser === 'firefox'
  const permissions = isFirefox
    ? [...FIREFOX_REQUIRED_PERMISSIONS]
    : [...REQUIRED_PERMISSIONS, 'scripting']

  return {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    permissions,
    // downloads.ui is Chrome-only (lets setUiOptions hide the download bar);
    // Firefox rejects it, so only declare it for Chromium.
    optional_permissions: isFirefox ? [] : ['downloads.ui'],
    host_permissions: [...LOOPBACK, ...ALL_HTTP],
    optional_host_permissions: [],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; connect-src http://127.0.0.1:* http://localhost:*",
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      16: 'icons/icon-128.png',
      48: 'icons/icon-128.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_icon: 'icons/icon-128.png',
      default_popup: 'popup.html',
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'moonhunt-extension@moonhunt.app',
              strict_min_version: '130.0',
              // MoonHunt collects no user data (all traffic stays on 127.0.0.1).
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  }
}
