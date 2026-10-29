import assert from 'node:assert/strict'
import test from 'node:test'
import { createDraft } from '../src/features/domains/domain-draft.ts'
import { createSettingsDraft } from '../src/features/settings/settings-draft.ts'
import { validateSettings } from '../src/features/settings/validate-settings.ts'

test('validation reports the first invalid tab in display order', () => {
  const values = {
    ...createSettingsDraft().values,
    visitQuestionEnabled: true,
    visitQuestionText: ' ',
    rows: [createDraft({ domain: '', name: '' })],
    verification: { mode: 'pin', methods: { pin: { pin: '' } } },
  }
  const general = validateSettings(values)
  assert.equal(general.valid, false)
  assert.equal(general.tab, 'general')
  assert.equal(general.error.key, 'visitQuestionRequired')

  values.visitQuestionText = 'Why visit?'
  const domains = validateSettings(values)
  assert.equal(domains.valid, false)
  assert.equal(domains.tab, 'domains')
  assert.equal(domains.error.key, 'invalidDomain')

  values.rows = [createDraft({ domain: 'example.org', name: 'Example' })]
  const verification = validateSettings(values)
  assert.equal(verification.valid, false)
  assert.equal(verification.tab, 'verification')
  assert.equal(verification.error.key, 'invalidPinFormat')

  values.verification.methods.pin.pin = '1234'
  assert.equal(validateSettings(values).valid, true)
})

test('duplicate domains route to the domains tab with the error parameters', () => {
  const values = createSettingsDraft().values
  values.rows = [
    createDraft({ domain: 'example.org', name: 'Example' }),
    createDraft({ domain: 'www.example.org', name: 'Duplicate' }),
  ]
  const result = validateSettings(values)
  assert.equal(result.valid, false)
  assert.equal(result.tab, 'domains')
  assert.equal(result.error.key, 'duplicateDomain')
  assert.deepEqual(result.error.params, { domain: 'example.org' })
})

test('valid settings normalize input while preserving draft row identities', () => {
  const values = createSettingsDraft().values
  values.visitQuestionText = '  Why visit?  '
  values.rows = [createDraft({ domain: 'https://www.example.org', name: '' })]
  const result = validateSettings(values)
  assert.equal(result.valid, true)
  assert.equal(result.values.visitQuestionText, 'Why visit?')
  assert.equal(result.values.rows[0].id, values.rows[0].id)
  assert.equal(result.values.rows[0].domain, 'example.org')
  assert.equal(result.values.rows[0].name, 'Example')
  assert.equal(values.rows[0].domain, 'https://www.example.org')
})

test('an empty question only blocks saving when the question is enabled', () => {
  const values = createSettingsDraft().values
  values.visitQuestionEnabled = false
  values.visitQuestionText = ' '
  const result = validateSettings(values)
  assert.equal(result.valid, true)
  assert.equal(result.values.visitQuestionText, null)
})
