import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

let data = {}
globalThis.browser = {
  runtime: { id: 'beeware@test' },
  storage: {
    local: {
      get: async (key) => ({ [key]: data[key] }),
      set: async (value) => {
        Object.assign(data, value)
      },
    },
  },
}
const { readSites, saveSites, ensureTotpSecret, readLanguage, saveLanguage } =
  await import('../src/settings-store.ts')
beforeEach(() => {
  data = {}
})

test('persists the selected language without changing domains or the authenticator key', async () => {
  assert.equal(await readLanguage(), 'sk')
  await saveSites([{ domain: 'example.org', name: 'Example' }])
  const secret = await ensureTotpSecret()
  await saveLanguage('en')
  assert.equal(await readLanguage(), 'en')
  assert.deepEqual(await readSites(), [
    { domain: 'example.org', name: 'Example' },
  ])
  assert.equal(await ensureTotpSecret(), secret)
  data.language = 'removed-language'
  assert.equal(await readLanguage(), 'sk')
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
