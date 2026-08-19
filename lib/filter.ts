/**
 * Filter pipeline for download interception.
 *
 * Each stage inspects a candidate and returns 'intercept' | 'skip' | null.
 * null defers to the next stage. When all stages defer, intercepted.
 *
 * Stages: enabled → self-trigger → scope → scheme → mime → file-extension → minimum-size
 */

import picomatch from 'picomatch'

export const INTERCEPTABLE_SCHEMES = ['http:', 'https:', 'ftp:']

export interface FilterContext {
  url: string
  finalUrl: string
  filename: string
  fileSize: number
  totalBytes: number
  mimeType: string
  tabUrl: string
  byExtensionId?: string
}

export type FilterVerdict = 'intercept' | 'skip'

export interface FilterStage {
  readonly name: string
  evaluate: (ctx: FilterContext, config: DownloadSettings) => FilterVerdict | null
}

export interface DownloadSettings {
  enabled: boolean
  interceptionEnabled: boolean
  cookieSharingEnabled: boolean
  fileExtensionRule: {
    enabled: boolean
    extensions: string[]
    listedAction: FilterVerdict
    unknownAction: FilterVerdict
  }
  minimumFileSize: {
    enabled: boolean
    sizeMb: number
    unknownSizeAction: FilterVerdict
  }
}

// ─── Stages ──────────────────────────────────────────

const enabledStage: FilterStage = {
  name: 'enabled',
  evaluate: (_ctx, config) => config.enabled ? null : 'skip',
}

const selfTriggerStage: FilterStage = {
  name: 'self-trigger',
  evaluate: (ctx) => ctx.byExtensionId ? 'skip' : null,
}

const interceptionScope: FilterStage = {
  name: 'interception-scope',
  evaluate: (_ctx, config) => config.interceptionEnabled ? null : 'skip',
}

const schemeStage: FilterStage = {
  name: 'scheme',
  evaluate: (ctx) => {
    try {
      const protocol = new URL(ctx.url).protocol
      return (INTERCEPTABLE_SCHEMES as readonly string[]).includes(protocol) ? null : 'skip'
    } catch {
      return 'skip'
    }
  },
}

const DOCUMENT_MIMES = new Set(['text/html', 'text/xml', 'application/xhtml+xml'])

const mimeTypeStage: FilterStage = {
  name: 'mime-type',
  evaluate: (ctx) => {
    const base = ctx.mimeType.split(';')[0]?.trim().toLowerCase() ?? ''
    return base && DOCUMENT_MIMES.has(base) ? 'skip' : null
  },
}

function resolveFileExtension(candidates: string[]): string {
  for (const c of candidates) {
    if (!c) continue
    const dot = c.lastIndexOf('.')
    if (dot <= 0 || dot === c.length - 1) continue
    return c.slice(dot + 1).toLowerCase()
  }
  return ''
}

const fileExtensionRuleStage: FilterStage = {
  name: 'file-extension-rule',
  evaluate: (ctx, config) => {
    const settings = config.fileExtensionRule
    if (!settings.enabled) return null

    const ext = resolveFileExtension([
      ctx.filename,
      ctx.finalUrl,
      ctx.url,
    ])
    if (!ext) return settings.unknownAction

    return settings.extensions.some((e) => e.toLowerCase() === ext)
      ? settings.listedAction
      : null
  },
}

const minimumFileSizeStage: FilterStage = {
  name: 'minimum-file-size',
  evaluate: (ctx, config) => {
    const settings = config.minimumFileSize
    if (!settings.enabled || settings.sizeMb <= 0) return null

    const knownSize = ctx.totalBytes >= 0 ? ctx.totalBytes : ctx.fileSize >= 0 ? ctx.fileSize : null
    if (knownSize === null) return settings.unknownSizeAction === 'skip' ? 'skip' : null
    return knownSize < settings.sizeMb * 1024 * 1024 ? 'skip' : null
  },
}

// ─── Pipeline ────────────────────────────────────────

export function createFilterPipeline(): FilterStage[] {
  return [
    enabledStage,
    selfTriggerStage,
    interceptionScope,
    schemeStage,
    mimeTypeStage,
    fileExtensionRuleStage,
    minimumFileSizeStage,
  ]
}

export function evaluateFilterPipeline(
  ctx: FilterContext,
  config: DownloadSettings,
  stages: FilterStage[],
): { verdict: FilterVerdict; stageName: string | null } {
  for (const stage of stages) {
    const verdict = stage.evaluate(ctx, config)
    if (verdict !== null) return { verdict, stageName: stage.name }
  }
  return { verdict: 'intercept', stageName: null }
}
