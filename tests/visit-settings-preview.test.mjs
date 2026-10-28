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
