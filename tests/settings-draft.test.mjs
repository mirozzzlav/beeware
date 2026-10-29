import assert from 'node:assert/strict'
import test from 'node:test'
import { createDraft } from '../src/features/domains/domain-draft.ts'
import {
  createSettingsDraft,
  settingsDraftReducer as reduce,
} from '../src/features/settings/settings-draft.ts'

function loadedDraft() {
  const state = createSettingsDraft()
  return reduce(state, {
    type: 'initialize',
    values: {
      ...state.values,
      rows: [createDraft({ domain: 'example.org', name: 'Example' })],
    },
  })
}

test('edits and reverts update values and invalidate old feedback', () => {
  const state = loadedDraft()
  for (const [field, value] of [
    ['language', 'sk'],
    ['visitQuestionEnabled', false],
    ['visitQuestionText', 'Why visit?'],
    ['verification', { ...state.values.verification, mode: 'totp' }],
  ]) {
    const edited = reduce(state, { type: 'change', field, value })
    assert.equal(edited.values[field], value)
    const reverted = reduce(edited, {
      type: 'change',
      field,
      value: state.values[field],
    })
    assert.deepEqual(reverted.values, state.values)
    assert.notEqual(
      reverted.revision,
      state.revision,
      'old feedback stays invalid',
    )
  }
})

test('domain edits preserve automatic names, custom names and row identity', () => {
  const state = loadedDraft()
  const id = state.values.rows[0].id
  const edit = (state, field, value) =>
    reduce(state, { type: 'edit', id, field, value })
  const edited = edit(state, 'domain', 'other.org')
  assert.equal(edited.values.rows[0].name, 'Other')
  assert.equal(edited.values.rows[0].id, id)
  assert.equal(
    state.values.rows[0].domain,
    'example.org',
    'previous state is immutable',
  )
  const custom = edit(edited, 'name', 'Work')
  assert.equal(
    edit(custom, 'domain', 'another.org').values.rows[0].name,
    'Work',
  )
})

test('adding then removing a domain restores the saved values', () => {
  const state = loadedDraft()
  const row = createDraft({ domain: '', name: '' })
  const added = reduce(state, { type: 'add', row })
  assert.equal(added.values.rows.at(-1).id, row.id)
  const removed = reduce(added, { type: 'remove', id: row.id })
  assert.deepEqual(removed.values, state.values)
  assert.equal(state.values.rows.length, 1)
})

test('successful save acknowledges normalized values without changing row IDs', () => {
  const state = loadedDraft()
  const edited = reduce(state, {
    type: 'change',
    field: 'visitQuestionText',
    value: '  Why?  ',
  })
  const committed = reduce(edited, {
    type: 'commit',
    values: { ...edited.values, visitQuestionText: 'Why?' },
    revision: edited.revision,
  })
  assert.equal(committed.values.visitQuestionText, 'Why?')
  assert.equal(committed.values.rows[0].id, state.values.rows[0].id)
})

test('a pending save cannot replace newer edits or mark them as saved', () => {
  const submitted = loadedDraft()
  const edited = reduce(submitted, {
    type: 'change',
    field: 'visitQuestionText',
    value: 'A newer question',
  })
  const committed = reduce(edited, {
    type: 'commit',
    values: submitted.values,
    revision: submitted.revision,
  })
  assert.equal(committed.values.visitQuestionText, 'A newer question')
  assert.notEqual(committed.revision, submitted.revision)
})
