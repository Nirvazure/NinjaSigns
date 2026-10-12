import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { X509Certificate } from 'node:crypto'

// Public CA from Supabase's official HTTPS downloads bucket. Pin the downloaded trust anchor.
export const databaseCaFingerprint =
  '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA'
export async function databaseCaPath() {
  const path = resolve(process.env.SUPABASE_DB_CA_PATH || '.cache/supabase-db-ca.crt')
  let pem: string
  try {
    pem = await readFile(path, 'utf8')
  } catch (error) {
    if (process.env.SUPABASE_DB_CA_PATH || (error as NodeJS.ErrnoException).code !== 'ENOENT')
      throw error
    const response = await fetch(
      'https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt',
      { signal: AbortSignal.timeout(20000) },
    )
    if (!response.ok) throw Error(`Database CA download failed: HTTP ${response.status}`)
    pem = await response.text()
    validate(pem)
    await mkdir('.cache', { recursive: true })
    await writeFile(path, pem)
  }
  validate(pem)
  return path
}
function validate(pem: string) {
  const certificate = new X509Certificate(pem)
  if (
    !certificate.ca ||
    certificate.fingerprint256 !== databaseCaFingerprint ||
    Date.parse(certificate.validTo) <= Date.now()
  )
    throw Error(
      'Invalid Supabase database CA; verify the official certificate before updating the pin.',
    )
}
