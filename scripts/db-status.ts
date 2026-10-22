import { checkPublicStatus } from './public-api-checks'

try {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.')
  console.log('Public API status:', await checkPublicStatus(url, key))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Public API status failed')
  process.exitCode = 1
}
