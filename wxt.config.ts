import { defineConfig, type WxtViteConfig } from 'wxt'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { buildExtensionManifest } from './shared/manifest'
import { localesPlugin } from './shared/i18n/locales-plugin'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifestVersion: 3,
  zip: {
    artifactTemplate: 'moonhunt-{{version}}-{{browser}}-mv3.zip',
  },
  manifest: ({ browser }) => ({
    ...buildExtensionManifest(browser),
    version,
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
