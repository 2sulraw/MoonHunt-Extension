import { describe, expect, it } from 'vitest'
import { parseContentDispositionFilename } from './content-disposition'

describe('parseContentDispositionFilename', () => {
  it('parses a plain quoted filename', () => {
    expect(parseContentDispositionFilename('attachment; filename="report.pdf"')).toBe('report.pdf')
  })

  it('parses an unquoted filename', () => {
    expect(parseContentDispositionFilename('attachment; filename=simple.zip')).toBe('simple.zip')
  })

  it('handles quoted filenames containing semicolons', () => {
    expect(parseContentDispositionFilename('attachment; filename="report; final.pdf"')).toBe('report; final.pdf')
  })

  it('handles quoted filenames containing escaped quotes', () => {
    expect(parseContentDispositionFilename('attachment; filename="a\\"b.txt"')).toBe('a"b.txt')
  })

  it('decodes RFC 5987 filename* values', () => {
    expect(parseContentDispositionFilename("attachment; filename*=UTF-8''%E2%82%AC%20rates.zip")).toBe('€ rates.zip')
  })

  it('prefers filename* over filename', () => {
    expect(parseContentDispositionFilename("attachment; filename*=UTF-8''real.zip; filename=\"fallback.zip\"")).toBe('real.zip')
  })

  it('returns null for a header without a filename', () => {
    expect(parseContentDispositionFilename('attachment')).toBeNull()
  })

  it('returns null for malformed headers instead of throwing', () => {
    expect(parseContentDispositionFilename('attachment; filename*="broken')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(parseContentDispositionFilename('')).toBeNull()
  })
})
