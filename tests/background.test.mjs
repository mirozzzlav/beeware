import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

const listeners = {}
const state = {}
const localState = {}
const tabs = new Map()
const updates = []
const checkPage = 'moz-extension://extension/index.html'
const target = 'https://www.facebook.com/groups/example?tab=posts'
const pageUrl = `${checkPage}?target=${encodeURIComponent(target)}`
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const { generateTotp } = await import('../src/totp.ts')
let code
const event = (name) => ({
  addListener: (fn, ...options) => {
    listeners[name] = { fn, options }
  },
})

globalThis.browser = {
  runtime: {
    id: 'extension@test',
    getURL: () => checkPage,
    onMessage: event('message'),
    onInstalled: event('installed'),
    onStartup: event('startup'),
    openOptionsPage: async () => ({}),
  },
  webRequest: { onBeforeRequest: event('request') },
  webNavigation: {
    onCommitted: event('committed'),
    onHistoryStateUpdated: event('history'),
  },
  action: { onClicked: event('action') },
  storage: {
    onChanged: event('storage'),
    local: {
      get: async (key) => ({ [key]: localState[key] }),
      set: async (value) => {
        Object.assign(localState, value)
      },
    },
    session: {
      get: async (key) => ({ [key]: state[key] }),
      clear: async () => {
        for (const key of Object.keys(state)) delete state[key]
      },
      set: async (data) => {
        Object.assign(state, data)
      },
      remove: async (key) => {
        delete state[key]
      },
    },
  },
  tabs: {
    onRemoved: event('removed'),
    get: async (id) => tabs.get(id),
    update: async (id, change) => {
      updates.push({ id, ...change })
      return change
    },
    create: async () => ({}),
  },
}
await import('../src/background.ts')

beforeEach(async () => {
  for (const key of Object.keys(localState)) delete localState[key]
  for (const key of Object.keys(state)) delete state[key]
  tabs.clear()
  tabs.set(7, { id: 7, url: pageUrl })
  updates.length = 0
  localState.totpSecret = secret
  localState.verification = { mode: 'totp' }
  code = await generateTotp(secret)
})

const request = (tabId = 7, url = target) =>
  listeners.request.fn({ tabId, url })
const sender = { id: 'extension@test', url: pageUrl }
const message = (
  reason = 'Chcem odpísať kamarátovi a dohodnúť stretnutie.',
) => ({
  type: 'approve-visit',
  tabId: 7,
  target,
  reason,
  code,
})

test('blocks top-level Facebook requests and preserves the entire target URL', async () => {
  assert.deepEqual(listeners.request.options, [
    { urls: ['*://*/*'], types: ['main_frame'] },
    ['blocking'],
  ])
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.deepEqual(await request(-1), {})
  assert.deepEqual(await request(7, 'https://example.org'), {})
})
test('rejects fewer than five words, even when called outside the UI', async () => {
  assert.deepEqual(
    await listeners.message.fn(message('Chcem iba pozrieť správy'), sender),
    { ok: false },
  )
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.equal(updates.length, 0)
})

test('disabling the question permits an empty answer and still requires verification', async () => {
  localState.visitQuestionEnabled = false
  assert.deepEqual(
    await listeners.message.fn({ ...message(''), code: 'invalid' }, sender),
    { ok: false, error: 'invalid-totp' },
  )
  assert.equal(updates.length, 0)
  assert.deepEqual(await listeners.message.fn(message(''), sender), {
    ok: true,
  })
  assert.deepEqual(await request(), {})
  localState.visitQuestionEnabled = true
  await listeners.storage.fn({ visitQuestionEnabled: {} }, 'local')
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.deepEqual(await listeners.message.fn(message(''), sender), {
    ok: false,
  })
})
test('approval permits the site in this tab only and does not save the reason', async () => {
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: true })
  assert.deepEqual(updates, [{ id: 7, url: target }])
  assert.deepEqual(await request(), {})
  assert.deepEqual(await request(8), { redirectUrl: pageUrl })
  assert.deepEqual(state, { 'approved-domain:7': 'facebook.com' })
})

test('leaving the domain or closing the tab requires a new explanation', async () => {
  await listeners.message.fn(message(), sender)
  await listeners.committed.fn({
    tabId: 7,
    frameId: 1,
    url: 'https://example.org',
  })
  assert.deepEqual(await request(), {})
  await listeners.committed.fn({
    tabId: 7,
    frameId: 0,
    url: 'https://example.org',
  })
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  await listeners.message.fn(message(), sender)
  listeners.removed.fn(7)
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})
test('rejects messages from other pages and unprotected target URLs', async () => {
  assert.deepEqual(
    await listeners.message.fn(message(), {
      ...sender,
      url: 'https://facebook.com',
    }),
    { ok: false },
  )
  assert.deepEqual(
    await listeners.message.fn(
      { ...message(), target: 'https://evil.test' },
      sender,
    ),
    { ok: false },
  )
  tabs.set(7, { id: 7, url: 'https://example.org' })
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: false })
  assert.equal(updates.length, 0)
})

test('uses saved domains immediately, including an empty list', async () => {
  localState.domainRules = [{ domain: 'example.org', name: 'Example' }]
  assert.deepEqual(await request(), {})
  assert.deepEqual(await request(7, 'https://example.org/path'), {
    redirectUrl:
      checkPage + '?target=' + encodeURIComponent('https://example.org/path'),
  })
  localState.domainRules = []
  assert.deepEqual(await request(7, 'https://example.org/path'), {})
})

test('changing settings resets existing visit approvals', async () => {
  await listeners.message.fn(message(), sender)
  assert.deepEqual(await request(), {})
  listeners.storage.fn({ domainRules: {} }, 'local')
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('requires a valid OTP even with a valid explanation', async () => {
  for (const invalid of [
    undefined,
    '',
    'abcdef',
    await generateTotp(secret, Date.now() - 120000),
  ]) {
    assert.deepEqual(
      await listeners.message.fn({ ...message(), code: invalid }, sender),
      {
        ok: false,
        error: 'invalid-totp',
      },
    )
    assert.deepEqual(await request(), { redirectUrl: pageUrl })
  }
  assert.equal(updates.length, 0)
})

test('PIN mode rejects incorrect codes and approves the exact saved PIN including leading zeroes', async () => {
  localState.verification = { mode: 'pin', pin: '01234' }
  for (const invalid of [undefined, '', '1234', '00000', code]) {
    assert.deepEqual(
      await listeners.message.fn(
        { ...message(), code: invalid, mode: 'totp' },
        sender,
      ),
      {
        ok: false,
        error: 'invalid-pin',
      },
    )
  }
  assert.equal(updates.length, 0)
  assert.deepEqual(
    await listeners.message.fn({ ...message(), code: '01234' }, sender),
    { ok: true },
  )
  assert.deepEqual(await request(), {})
  await listeners.storage.fn({ verification: {} }, 'local')
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('fresh installations use the initial PIN while saved TOTP preferences remain active', async () => {
  delete localState.verification
  const { initialSettings } = await import('../src/initial-settings.ts')
  assert.deepEqual(
    await listeners.message.fn(
      { ...message(), code: initialSettings.verification.methods.pin.pin },
      sender,
    ),
    { ok: true },
  )
})

test('initializes one persistent secret and exposes the same key to settings', async () => {
  delete localState.totpSecret
  await listeners.installed.fn()
  const responses = await Promise.all([
    listeners.message.fn({ type: 'get-totp-secret' }, sender),
    listeners.message.fn({ type: 'get-totp-secret' }, sender),
  ])
  assert.match(localState.totpSecret, /^[A-Z2-7]{32}$/)
  assert.deepEqual(
    responses,
    responses.map(() => ({ secret: localState.totpSecret })),
  )
  const saved = localState.totpSecret
  await listeners.startup.fn()
  assert.deepEqual(
    await listeners.message.fn({ type: 'get-totp-secret' }, sender),
    { secret: saved },
  )
})
