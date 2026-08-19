import { defineConfig, type WxtViteConfig } from 'wxt'
import { resolve } from 'node:path'
import { buildExtensionManifest } from './shared/manifest'
import { localesPlugin } from './shared/i18n/locales-plugin'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifestVersion: 3,
  zip: {
    artifactTemplate: 'moonhunt-{{version}}-{{browser}}-mv3.zip',
  },
  manifest: ({ browser }) => ({
    ...buildExtensionManifest(browser),
    version: '0.0.1',
  }),
  hooks: {
    'build:manifestGenerated': (_, manifest) => {
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true
      }
    },
  },
  vite: () => {
    const config = {
      build: {
        chunkSizeWarningLimit: 1024,
      },
      plugins: [localesPlugin()],
    } as unknown as WxtViteConfig
    return config
  },
})
