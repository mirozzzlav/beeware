import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { generateTotp } from '../src/totp.ts'

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const messages = []
const removed = []
let tab = { id: 7 }
let response = { ok: true }
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
}
const { approveVisit, closeVisitTab } = await import('../src/visit.ts')
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

test('closing removes only the current tab and rejects a missing tab', async () => {
  await closeVisitTab()
  assert.deepEqual(removed, [7])
  tab = undefined
  await assert.rejects(closeVisitTab(), /Missing tab/)
  assert.deepEqual(removed, [7])
})
