import type { Plugin } from 'vite'

const LOCALES_DIR = 'public/_locales'

/**
 * Vite plugin that copies locale files from public/_locales to the output.
 * WXT doesn't handle _locales automatically in all configurations.
 */
export function localesPlugin(): Plugin {
  return {
    name: 'locales-plugin',
    apply: 'build',
    async closeBundle() {
      // WXT copies public/ to output dir automatically, so _locales should
      // already be handled. This is a no-op placeholder.
    },
  }
}
