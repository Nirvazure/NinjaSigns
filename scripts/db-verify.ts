import { verifyPublicApi } from './public-api-checks'

try {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.')
  await verifyPublicApi(url, key)
  console.log(
    'Verified public catalog and anonymous RPC rejection. Database grants were not audited.',
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Public API verification failed')
  process.exitCode = 1
}
