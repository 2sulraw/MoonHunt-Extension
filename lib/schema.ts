/**
 * Storage helpers for the MoonHunt extension.
 */
import { z } from 'zod'

// ─── Connection config ──────────────────────────────

export const ConnectionConfigSchema = z.object({
  port: z.number().int().min(1024).max(65535).catch(6802),
})

export type ConnectionConfig = z.output<typeof ConnectionConfigSchema>

// ─── Download settings ──────────────────────────────

const interceptOrSkip = z.enum(['intercept', 'skip'])

export const DownloadSettingsSchema = z.object({
  enabled: z.boolean().catch(true),
  interceptionEnabled: z.boolean().catch(true),
  desktopUnavailable: z.object({
    action: z.enum(['launch', 'browser']).catch('launch'),
    startupTimeoutSeconds: z.number().int().min(1).max(60).catch(15),
  }).catch({ action: 'launch', startupTimeoutSeconds: 15 }),
  forwardCookies: z.boolean().catch(true),
  duplicateGuard: z.object({
    enabled: z.boolean().catch(true),
    windowSeconds: z.number().int().min(1).max(300).catch(10),
  }).catch({ enabled: true, windowSeconds: 10 }),
  minimumFileSize: z.object({
    enabled: z.boolean().catch(false),
    sizeMb: z.number().min(0).catch(5),
    unknownSizeAction: interceptOrSkip.catch('intercept'),
  }).catch({ enabled: false, sizeMb: 5, unknownSizeAction: 'intercept' as const }),
  fileExtensionRule: z.object({
    enabled: z.boolean().catch(false),
    extensions: z.array(z.string()).catch([]),
    listedAction: interceptOrSkip.catch('skip'),
    unknownAction: interceptOrSkip.catch('intercept'),
  }).catch({ enabled: false, extensions: [], listedAction: 'skip' as const, unknownAction: 'intercept' as const }),
})

export type DownloadSettings = z.output<typeof DownloadSettingsSchema>
