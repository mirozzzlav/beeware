import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { defaultLanguage } from '../src/features/language/i18n.ts'

let data = {}
let reads = []
globalThis.browser = {
  runtime: { id: 'extension@test' },
  storage: {
    local: {
      get: async (key) => {
        reads.push(key)
        return Object.fromEntries(
          (Array.isArray(key) ? key : [key]).map((name) => [name, data[name]]),
        )
      },
      set: async (value) => {
        Object.assign(data, value)
      },
    },
  },
}
const {
  readSites,
  saveSites,
  ensureTotpSecret,
  readLanguage,
  saveLanguage,
  readVerification,
  saveVerification,
  readVisitQuestionEnabled,
  saveVisitQuestionEnabled,
  readVisitQuestionText,
  saveVisitQuestionText,
  readVisitSettings,
  visitSettingsStorageKeys,
} = await import('../src/features/settings/settings-store.ts')
beforeEach(() => {
  data = {}
  reads = []
})

test('loads all visit preferences from one storage snapshot with shared defaults', async () => {
  const snapshot = await readVisitSettings()
  assert.deepEqual(reads, [visitSettingsStorageKeys])
  assert.deepEqual(snapshot, {
    sites: await readSites(),
    verification: await readVerification(),
    visitQuestionEnabled: await readVisitQuestionEnabled(),
    visitQuestionText: await readVisitQuestionText(),
  })
})

test('visit snapshot preserves empty domains, opt-out, custom text and verification errors', async () => {
  data = {
    domainRules: [],
    visitQuestionEnabled: false,
    visitQuestionText: '  Custom question?  ',
    verification: {
      mode: 'pin',
      methods: { pin: { pin: '001234' }, totp: {} },
    },
  }
  assert.deepEqual(await readVisitSettings(), {
    sites: [],
    verification: data.verification,
    visitQuestionEnabled: false,
    visitQuestionText: 'Custom question?',
  })
  data.verification = { mode: 'unknown' }
  await assert.rejects(readVisitSettings(), { key: 'verificationLoadError' })
})

test('visit question defaults to enabled and preserves an explicit opt-out', async () => {
  assert.equal(await readVisitQuestionEnabled(), true)
  await saveVisitQuestionEnabled(false)
  assert.equal(await readVisitQuestionEnabled(), false)
  await saveLanguage('sk')
  assert.equal(await readVisitQuestionEnabled(), false)
  await saveVisitQuestionEnabled(true)
  assert.equal(await readVisitQuestionEnabled(), true)
  for (const invalid of [null, 'false', 0, {}]) {
    data.visitQuestionEnabled = invalid
    assert.equal(await readVisitQuestionEnabled(), true)
  }
})

test('custom question persists independently of its switch and empty text restores the default', async () => {
  assert.equal(await readVisitQuestionText(), null)
  await saveVisitQuestionText('  Čo chceš dnes dosiahnuť?  ')
  assert.equal(await readVisitQuestionText(), 'Čo chceš dnes dosiahnuť?')
  await saveVisitQuestionEnabled(false)
  assert.equal(await readVisitQuestionEnabled(), false)
  assert.equal(await readVisitQuestionText(), 'Čo chceš dnes dosiahnuť?')
  await saveVisitQuestionEnabled(true)
  assert.equal(await readVisitQuestionText(), 'Čo chceš dnes dosiahnuť?')
  await saveVisitQuestionText('   ')
  assert.equal(await readVisitQuestionText(), null)
  for (const invalid of [null, false, 123, {}]) {
    data.visitQuestionText = invalid
    assert.equal(await readVisitQuestionText(), null)
  }
})

test('persists the selected language without changing domains or the authenticator key', async () => {
  assert.equal(await readLanguage(), defaultLanguage)
  await saveSites([{ domain: 'example.org', name: 'Example' }])
  const secret = await ensureTotpSecret()
  await saveLanguage('sk')
  assert.equal(await readLanguage(), 'sk')
  assert.deepEqual(await readSites(), [
    { domain: 'example.org', name: 'Example' },
  ])
  assert.equal(await ensureTotpSecret(), secret)
  data.language = 'removed-language'
  assert.equal(await readLanguage(), defaultLanguage)
})

test('loads defaults initially and preserves an explicitly empty list', async () => {
  assert.deepEqual(await readSites(), [
    { domain: 'facebook.com', name: 'Facebook' },
  ])
  await saveSites([])
  assert.deepEqual(await readSites(), [])
})

test('persists normalized domains and optional application names', async () => {
  await saveSites([
    { domain: 'https://www.example.org/path', name: ' Example ' },
  ])
  assert.deepEqual(await readSites(), [
    { domain: 'example.org', name: 'Example' },
  ])
  await assert.rejects(saveSites([{ domain: 'invalid', name: '' }]))
  assert.deepEqual(await readSites(), [
    { domain: 'example.org', name: 'Example' },
  ])
})

test('creates a secret once across simultaneous reads and preserves it when saving domains', async () => {
  const secrets = await Promise.all([ensureTotpSecret(), ensureTotpSecret()])
  assert.match(secrets[0], /^[A-Z2-7]{32}$/)
  assert.equal(secrets[0], secrets[1])
  await saveSites([])
  assert.equal(await ensureTotpSecret(), secrets[0])
})

test('does not silently replace a damaged secret', async () => {
  data.totpSecret = 'broken'
  await assert.rejects(ensureTotpSecret())
  assert.equal(data.totpSecret, 'broken')
})

test('verification defaults to PIN and persists independent settings for each method', async () => {
  const { initialSettings } =
    await import('../src/features/settings/initial-settings.ts')
  assert.deepEqual(await readVerification(), initialSettings.verification)
  const expected = {
    mode: 'pin',
    methods: { totp: {}, pin: { pin: '001234' } },
  }
  await saveVerification(expected)
  assert.deepEqual(await readVerification(), expected)
  for (const pin of ['', '123', '1234567890123', 'abcd', '12 34']) {
    await assert.rejects(
      saveVerification({ mode: 'pin', methods: { pin: { pin } } }),
    )
  }
  assert.deepEqual(await readVerification(), expected)
  await saveVerification({ ...expected, mode: 'totp' })
  assert.deepEqual(await readVerification(), { ...expected, mode: 'totp' })
})

test('old stored TOTP and PIN preferences take precedence over initial settings', async () => {
  data.verification = { mode: 'totp', pin: '000123' }
  assert.equal((await readVerification()).mode, 'totp')
  data.verification = { mode: 'pin', pin: '000123' }
  const migrated = await readVerification()
  assert.equal(migrated.methods.pin.pin, '000123')
  await saveVerification(migrated)
  assert.deepEqual(data.verification, migrated)
})
