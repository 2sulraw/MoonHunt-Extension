/**
 * Content-Disposition header parsing for intercepted downloads.
 *
 * Inline replacement for the `content-disposition` npm package: that package
 * calls Buffer.from() during decode, and browsers have no Buffer — it crashed
 * the background worker at startup. This parser only extracts the filename,
 * which is all interception needs.
 */

const QUOTED = /^\s*"((?:\\.|[^"])*)"\s*$/

function unquote(value: string): string {
  const m = value.match(QUOTED)
  if (!m) return value
  const inner = m[1] as string | undefined
  return inner?.replace(/\\(.)/g, '$1') ?? value
}

function decodeRFC5987(value: string): string | null {
  // filename*=charset'lang'percent-encoded
  const m = value.match(/^\s*([^']*)'[^']*'(.*)$/)
  if (!m) return null
  const charset = (m[1] || 'utf-8').toLowerCase()
  if (charset !== 'utf-8' && charset !== 'us-ascii' && charset !== 'iso-8859-1') return null
  try {
    return decodeURIComponent(m[2] as string)
  } catch {
    return null
  }
}

/**
 * Extract the filename from a Content-Disposition header.
 *
 * Handles RFC 5987 `filename*=UTF-8''...` (percent-encoded, decoded) and plain
 * `filename="..."` values, including quoted names containing `;` or `"`.
 * Returns null when the header carries no usable filename.
 */
function splitParams(cd: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < cd.length; i++) {
    const ch = cd[i]
    if (ch === '\\' && inQuote) { current += ch + (cd[i + 1] ?? ''); i++; continue }
    if (ch === '"') { inQuote = !inQuote; current += ch; continue }
    if (ch === ';' && !inQuote) { parts.push(current); current = ''; continue }
    current += ch
  }
  parts.push(current)
  return parts
}

export function parseContentDispositionFilename(cd: string): string | null {
  if (!cd) return null

  let filenameStar: string | null = null
  let filename: string | null = null

  for (const part of splitParams(cd)) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const name = part.slice(0, eq).trim().toLowerCase()
    const raw = part.slice(eq + 1).trim()
    if (!raw) continue
    if (name === 'filename*') filenameStar = raw
    else if (name === 'filename' && filename === null) filename = unquote(raw)
  }

  if (filenameStar) {
    const decoded = decodeRFC5987(filenameStar)
    if (decoded) return decoded
  }
  return filename
}