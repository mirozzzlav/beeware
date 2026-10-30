import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

const listeners = {}
const state = {}
const localState = {}
const tabs = new Map()
const updates = []
let rules = []
let failRuleUpdate = false
let failNavigation = false
let failSessionWrite = false
let duringRuleUpdate
const checkPage = 'moz-extension://extension/index.html'
const target = 'https://www.facebook.com/groups/example?tab=posts'
const pageUrl = `${checkPage}#target=${target}`
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const { generateTotp } =
  await import('../src/features/verification/totp/totp.ts')
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
  declarativeNetRequest: {
    getSessionRules: async () => structuredClone(rules),
    updateSessionRules: async ({ removeRuleIds, addRules }) => {
      if (failRuleUpdate) {
        failRuleUpdate = false
        throw new Error('Rule update failed')
      }
      rules = rules
        .filter((rule) => !removeRuleIds.includes(rule.id))
        .concat(addRules)
      const callback = duringRuleUpdate
      duringRuleUpdate = undefined
      if (callback) await callback()
    },
  },
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
      get: async (key) => (key === null ? { ...state } : { [key]: state[key] }),
      clear: async () => {
        for (const key of Object.keys(state)) delete state[key]
      },
      set: async (data) => {
        if (failSessionWrite) {
          failSessionWrite = false
          throw new Error('Session write failed')
        }
        Object.assign(state, data)
      },
      remove: async (keys) => {
        for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key]
      },
    },
  },
  tabs: {
    onRemoved: event('removed'),
    get: async (id) => tabs.get(id),
    update: async (id, change) => {
      if (failNavigation) throw new Error('Tab is gone')
      updates.push({ id, ...change })
      tabs.set(id, { ...tabs.get(id), ...change })
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
  failRuleUpdate = false
  failNavigation = false
  failSessionWrite = false
  duringRuleUpdate = undefined
  await listeners.startup.fn()
})

// Evaluate the subset of DNR used by WakeUp; no background listener is invoked.
const request = async (
  tabId = 7,
  url = target,
  resourceType = 'main_frame',
) => {
  const hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, '')
  const rule = rules.find(
    ({ condition }) =>
      condition.resourceTypes.includes(resourceType) &&
      !condition.excludedTabIds.includes(tabId) &&
      !condition.excludedRequestDomains.some(
        (domain) => hostname === domain || hostname.endsWith('.' + domain),
      ) &&
      new RegExp(condition.regexFilter, 'i').test(url),
  )
  return rule
    ? {
        redirectUrl: url.replace(
          new RegExp(rule.condition.regexFilter, 'i'),
          rule.action.redirect.regexSubstitution.replace('\\1', '$1'),
        ),
      }
    : {}
}
const sender = {
  id: 'extension@test',
  url: pageUrl,
  tab: { id: 7 },
  frameId: 0,
}
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
  assert.equal(listeners.request, undefined)
  assert.equal(rules.length, 1)
  assert.equal(rules[0].action.type, 'redirect')
  assert.deepEqual(await request(7, target, 'sub_frame'), {})
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.deepEqual(await request(-1), {})
  assert.deepEqual(await request(7, 'https://example.org'), {})
})

test('DNR matches domain boundaries, trailing dots and ports without matching lookalikes', async () => {
  for (const url of [
    'http://m.facebook.com/',
    'https://FACEBOOK.COM./',
    'https://facebook.com:8443/path?q=a+b&next=%2Ffeed%3Fx%3D1',
  ]) {
    assert.deepEqual(await request(7, url), {
      redirectUrl: `${checkPage}#target=${url}`,
    })
  }
  for (const url of [
    'https://notfacebook.com/',
    'https://facebook.com.evil.test/',
    'https://facebook.com@evil.test/',
    'https://evil.test/?next=https://facebook.com/',
  ])
    assert.deepEqual(await request(7, url), {})
})

test('a subdomain with its own policy still requires verification in an approved parent tab', async () => {
  localState.domainRules = [
    { domain: 'facebook.com', name: 'Facebook' },
    { domain: 'work.facebook.com', name: 'Work' },
  ]
  await listeners.storage.fn({ domainRules: {} }, 'local')
  await listeners.message.fn(message(), sender)
  assert.deepEqual(await request(), {})
  const work = 'https://work.facebook.com/'
  assert.deepEqual(await request(7, work), {
    redirectUrl: `${checkPage}#target=${work}`,
  })
  tabs.set(7, { id: 7, url: `${checkPage}#target=${work}` })
  assert.deepEqual(
    await listeners.message.fn({ ...message(), target: work }, sender),
    { ok: true },
  )
  assert.deepEqual(await request(7, work), {})
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('startup replaces existing session rules without duplicate IDs', async () => {
  rules = [{ id: 99 }]
  await listeners.startup.fn()
  await listeners.startup.fn()
  assert.equal(rules.length, 1)
  assert.equal(rules[0].id, 1)
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('failed navigation rolls back the approval and restores interception', async () => {
  failNavigation = true
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: false })
  assert.deepEqual(state, {})
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('failed rule updates cannot open the destination or leave a saved approval', async () => {
  failRuleUpdate = true
  const originalError = console.error
  const errors = []
  console.error = (error) => errors.push(error)
  try {
    assert.deepEqual(await listeners.message.fn(message(), sender), {
      ok: false,
    })
    assert.equal(errors.length, 0)
    assert.deepEqual(updates, [])
    assert.deepEqual(state, {})
    assert.deepEqual(await request(), { redirectUrl: pageUrl })
    assert.deepEqual(await listeners.message.fn(message(), sender), {
      ok: true,
    })
  } finally {
    console.error = originalError
  }
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
  tabs.set(7, { id: 7, url: pageUrl })
  await listeners.message.fn(message(), sender)
  await listeners.removed.fn(7)
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
  await listeners.storage.fn({ domainRules: {} }, 'local')
  assert.deepEqual(await request(), {})
  assert.deepEqual(await request(7, 'https://example.org/path'), {
    redirectUrl: checkPage + '#target=https://example.org/path',
  })
  localState.domainRules = []
  await listeners.storage.fn({ domainRules: {} }, 'local')
  assert.deepEqual(await request(7, 'https://example.org/path'), {})
})

test('changing settings resets existing visit approvals', async () => {
  await listeners.message.fn(message(), sender)
  assert.deepEqual(await request(), {})
  await listeners.storage.fn({ domainRules: {} }, 'local')
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
  const { initialSettings } =
    await import('../src/features/settings/initial-settings.ts')
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

test('approval survives navigation and history updates within the same domain', async () => {
  await listeners.message.fn(message(), sender)
  for (const event of ['committed', 'history']) {
    await listeners[event].fn({
      tabId: 7,
      frameId: 0,
      url: 'https://m.facebook.com/feed',
    })
    assert.deepEqual(await request(), {})
    assert.deepEqual(await request(8), { redirectUrl: pageUrl })
  }
  await listeners.history.fn({
    tabId: 7,
    frameId: 0,
    url: 'https://example.org/',
  })
  assert.deepEqual(state, {})
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('committing a different protected domain revokes the old approval immediately', async () => {
  localState.domainRules = [
    { domain: 'facebook.com', name: 'Facebook' },
    { domain: 'example.org', name: 'Example' },
  ]
  await listeners.storage.fn({ domainRules: {} }, 'local')
  await listeners.message.fn(message(), sender)
  await listeners.committed.fn({
    tabId: 7,
    frameId: 0,
    url: 'https://example.org/',
  })
  assert.deepEqual(state, {})
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('closing one approved tab leaves the other approved tab alone', async () => {
  await listeners.message.fn(message(), sender)
  tabs.set(8, { id: 8, url: pageUrl })
  await listeners.message.fn(
    { ...message(), tabId: 8 },
    { ...sender, tab: { id: 8 } },
  )
  await listeners.removed.fn(7)
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.deepEqual(await request(8), {})
  assert.deepEqual(state, { 'approved-domain:8': 'facebook.com' })
})

test('browser startup and extension update revoke approvals without clearing unrelated session data', async () => {
  for (const event of ['startup', 'installed']) {
    tabs.set(7, { id: 7, url: pageUrl })
    await listeners.message.fn(message(), sender)
    state.unrelated = 'preserved'
    await listeners[event].fn()
    assert.deepEqual(state, { unrelated: 'preserved' })
    assert.deepEqual(await request(), { redirectUrl: pageUrl })
  }
})

test('approval cannot target another sender tab, a frame or an invalid tab ID', async () => {
  for (const invalidSender of [
    { ...sender, tab: { id: 8 } },
    { ...sender, frameId: 1 },
    { ...sender, url: 'invalid' },
  ])
    assert.deepEqual(await listeners.message.fn(message(), invalidSender), {
      ok: false,
    })
  for (const tabId of [-1, 1.5, NaN, Infinity]) {
    assert.deepEqual(
      await listeners.message.fn({ ...message(), tabId }, sender),
      { ok: false },
    )
  }
  assert.deepEqual(state, {})
  assert.deepEqual(updates, [])
})

test('a tab that leaves or closes during rule installation is not navigated by a late approval', async () => {
  for (const closed of [false, true]) {
    tabs.set(7, { id: 7, url: pageUrl })
    duringRuleUpdate = async () => {
      if (closed) tabs.delete(7)
      else tabs.set(7, { id: 7, url: 'https://example.org/' })
    }
    assert.deepEqual(await listeners.message.fn(message(), sender), {
      ok: false,
    })
    assert.deepEqual(state, {})
    assert.deepEqual(updates, [])
    assert.deepEqual(await request(), { redirectUrl: pageUrl })
  }
})

test('settings changes during rule installation cancel the pending approval', async () => {
  let reset
  duringRuleUpdate = async () => {
    localState.verification = { mode: 'pin', pin: '5678' }
    reset = listeners.storage.fn({ verification: {} }, 'local')
  }
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: false })
  await reset
  assert.deepEqual(state, {})
  assert.deepEqual(updates, [])
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
})

test('concurrent submissions can navigate the prompt tab only once', async () => {
  const results = await Promise.all([
    listeners.message.fn(message(), sender),
    listeners.message.fn(message(), sender),
  ])
  assert.deepEqual(results, [{ ok: true }, { ok: false }])
  assert.deepEqual(updates, [{ id: 7, url: target }])
})

test('a failed session write leaves the tab blocked and allows a later retry', async () => {
  failSessionWrite = true
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: false })
  assert.deepEqual(state, {})
  assert.deepEqual(updates, [])
  assert.deepEqual(await request(), { redirectUrl: pageUrl })
  assert.deepEqual(await listeners.message.fn(message(), sender), { ok: true })
})

test('extension pages without sender tab metadata still validate the pending prompt', async () => {
  const extensionSender = { id: sender.id, url: sender.url }
  assert.deepEqual(await listeners.message.fn(message(), extensionSender), {
    ok: true,
  })
})

test('restarting the background context preserves approvals in the current browser session', async () => {
  await listeners.message.fn(message(), sender)
  await import('../src/background.ts?restart-test')
  // This event also waits for the fresh context's initial rule synchronization.
  await listeners.history.fn({ tabId: 7, frameId: 0, url: target })
  assert.deepEqual(await request(), {})
  assert.deepEqual(state, { 'approved-domain:7': 'facebook.com' })
})
