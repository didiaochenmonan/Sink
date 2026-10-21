import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'

const base = new URL(process.env.SINK_BASE_URL || 'https://sink.didiaochenmonan.workers.dev')
assert.equal(base.protocol, 'https:', 'Use the production HTTPS address')

for (let attempt = 0; attempt < 6; attempt++) {
  try {
    const dashboard = await fetch(new URL('/dashboard', base), {
      signal: AbortSignal.timeout(15000),
    })
    assert.equal(dashboard.status, 200, 'Dashboard must return HTTP 200')
    assert.match(dashboard.headers.get('content-type') || '', /text\/html/i)
    await dashboard.body?.cancel()

    const api = await fetch(new URL('/api/verify', base), {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    })
    assert.equal(api.status, 401, 'Unauthenticated API access must be rejected')
    await api.body?.cancel()
    console.log(`Sink deployment smoke check passed: ${base.origin}`)
    break
  }
  catch (error) {
    if (attempt === 5) throw error
    await setTimeout(5000)
  }
}
