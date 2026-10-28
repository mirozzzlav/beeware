import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { generateTotp } from '../src/features/verification/totp/totp.ts'

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const messages = []
const removed = []
let tab = { id: 7 }
let response = { ok: true }
let verification
globalThis.browser = {
  runtime: {
    id: 'extension@test',
    sendMessage: async (message) => {
      messages.push(message)
      return message.type === 'get-totp-secret' ? { secret } : response
    },
  },
  tabs: {
    getCurrent: async () => tab,
    remove: async (id) => removed.push(id),
  },
  storage: { local: { get: async (key) => ({ [key]: verification }) } },
}
const { approveVisit, closeVisitTab, leaveUntrackedPage } =
  await import('../src/features/visit/visit.ts')
const request = {
  target: 'https://facebook.com/',
  reason: 'Chcem odpísať kamarátovi a dohodnúť stretnutie.',
  code: '123456',
}

beforeEach(() => {
  messages.length = 0
  removed.length = 0
  tab = { id: 7 }
  response = { ok: true }
  verification = { mode: 'totp' }
})

test('extension approval forwards the current tab and preserves background errors', async () => {
  response = { ok: false, error: 'invalid-totp' }
  assert.deepEqual(await approveVisit(request, false), response)
  assert.deepEqual(messages, [{ type: 'approve-visit', tabId: 7, ...request }])
})

test('preview checks TOTP locally without requesting a navigation', async () => {
  const code = await generateTotp(secret)
  assert.deepEqual(await approveVisit({ ...request, code }, true), { ok: true })
  assert.deepEqual(await approveVisit({ ...request, code: 'invalid' }, true), {
    ok: false,
    error: 'invalid-totp',
  })
  assert.ok(messages.every((message) => message.type === 'get-totp-secret'))
  assert.deepEqual(removed, [])
})

test('PIN preview validates the saved PIN without requesting a TOTP secret', async () => {
  verification = { mode: 'pin', pin: '01234' }
  assert.deepEqual(await approveVisit({ ...request, code: '01234' }, true), {
    ok: true,
  })
  assert.deepEqual(await approveVisit({ ...request, code: '1234' }, true), {
    ok: false,
    error: 'invalid-pin',
  })
  assert.deepEqual(messages, [])
})

test('closing removes only the current tab and rejects a missing tab', async () => {
  await closeVisitTab()
  assert.deepEqual(removed, [7])
  tab = undefined
  await assert.rejects(closeVisitTab(), /Missing tab/)
  assert.deepEqual(removed, [7])
})

test('untracked pages resume the target and send invalid targets to settings', () => {
  const destinations = []
  globalThis.window = { location: { replace: (url) => destinations.push(url) } }
  try {
    leaveUntrackedPage('https://example.com/path?x=1#section')
    for (const target of [
      null,
      '',
      'invalid',
      'javascript:alert(1)',
      'file:///tmp/test',
      'https://user:pass@example.com/',
    ]) {
      leaveUntrackedPage(target)
    }
    assert.deepEqual(destinations, [
      'https://example.com/path?x=1#section',
      ...Array(6).fill('./settings.html'),
    ])
  } finally {
    delete globalThis.window
  }
})
