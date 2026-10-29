import assert from 'node:assert/strict'
import test from 'node:test'
import { readVisitSettings } from '../src/features/settings/settings-store.ts'

test('preview reads JSON preferences and plain question text as one configuration', async () => {
  const data = new Map([
    [
      'domainRules',
      JSON.stringify([{ domain: 'example.org', name: 'Example' }]),
    ],
    ['verification', JSON.stringify({ mode: 'totp', methods: {} })],
    ['visitQuestionEnabled', 'false'],
    ['visitQuestionText', '  A plain text question?  '],
  ])
  globalThis.window = {
    localStorage: { getItem: (key) => data.get(key) ?? null },
  }
  const snapshot = await readVisitSettings()
  assert.deepEqual(snapshot.sites, [{ domain: 'example.org', name: 'Example' }])
  assert.equal(snapshot.verification.mode, 'totp')
  assert.equal(snapshot.visitQuestionEnabled, false)
  assert.equal(snapshot.visitQuestionText, 'A plain text question?')
  data.set('verification', '{broken')
  await assert.rejects(readVisitSettings(), SyntaxError)
})

test('preview saves a single snapshot, migrates legacy values and preserves settings on failure', async () => {
  const {
    saveSettings,
    readLanguage,
    readVerification,
    previewSettingsStorageKey,
  } = await import('../src/features/settings/settings-store.ts')
  const data = new Map([
    ['language', 'sk'],
    ['visitQuestionText', 'Old question'],
  ])
  const writes = []
  let fail = false
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        writes.push(key)
        if (fail) throw new Error('Quota exceeded')
        data.set(key, value)
      },
    },
  }
  assert.equal(await readLanguage(), 'sk')
  const settings = {
    ...(await readVisitSettings()),
    language: 'en',
    sites: [],
    visitQuestionEnabled: false,
    visitQuestionText: ' New question ',
  }
  await saveSettings(settings)
  assert.deepEqual(writes, [previewSettingsStorageKey])
  assert.equal(await readLanguage(), 'en')
  assert.deepEqual(await readVisitSettings(), {
    sites: [],
    verification: settings.verification,
    visitQuestionEnabled: false,
    visitQuestionText: 'New question',
  })
  assert.deepEqual(await readVerification(), settings.verification)
  const previous = data.get(previewSettingsStorageKey)
  fail = true
  await assert.rejects(
    saveSettings({ ...settings, language: 'sk' }),
    /Quota exceeded/,
  )
  assert.equal(data.get(previewSettingsStorageKey), previous)
  assert.equal(await readLanguage(), 'en')
})
