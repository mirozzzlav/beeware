import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDraft,
  editDraft,
  normalizeDrafts,
} from '../src/features/domains/domain-draft.ts'

test('suggested names follow domain edits while custom names are preserved', () => {
  const original = createDraft({ domain: 'facebook.com', name: 'Facebook' })
  const renamed = editDraft(original, 'domain', 'example.org')
  assert.equal(renamed.name, 'Example')
  assert.equal(renamed.id, original.id)
  assert.equal(original.domain, 'facebook.com')

  const custom = editDraft(renamed, 'name', 'Moja aplikácia')
  assert.equal(editDraft(custom, 'domain', 'other.org').name, 'Moja aplikácia')

  const cleared = editDraft(custom, 'name', '  ')
  assert.equal(editDraft(cleared, 'domain', 'other.org').name, 'Other')
})

test('loading custom names and normalizing drafts preserves only stored fields', () => {
  const custom = createDraft({ domain: 'example.org', name: 'Práca' })
  assert.equal(editDraft(custom, 'domain', 'other.org').name, 'Práca')
  assert.notEqual(createDraft(custom).id, custom.id)

  const cleared = editDraft(custom, 'name', '')
  assert.deepEqual(normalizeDrafts([cleared]), [
    { domain: 'example.org', name: 'Example' },
  ])
  assert.deepEqual(normalizeDrafts([]), [])
  assert.throws(() => normalizeDrafts([custom, createDraft(custom)]))
})
