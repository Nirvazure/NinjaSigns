export function clearLegacyStorage(storage: Pick<Storage, 'removeItem'>) {
  for (const key of [
    'naruto-spiritism.progress.v1',
    'naruto-spiritism.companion.v1',
    'naruto-spiritism.ninja-unlocks.v1',
  ]) {
    try {
      storage.removeItem(key)
    } catch {
      /* Storage restrictions must not prevent startup. */
    }
  }
}
export function safeReturnPath(value: unknown): string {
  const invalid = (path: string) =>
    Array.from(path).some((character) => character === '\\' || character.charCodeAt(0) <= 32)
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    invalid(value)
  )
    return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || invalid(decoded)) return '/'
    const url = new URL(value, 'https://dojo.invalid')
    if (
      url.origin !== 'https://dojo.invalid' ||
      ['/login', '/auth/callback'].includes(url.pathname.replace(/\/$/, ''))
    )
      return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
