import assert from 'node:assert/strict'
import test from 'node:test'
import { observeSettings } from '../src/features/settings/observe-settings.ts'

const localStorage = {}
const sessionStorage = {}
const listeners = new Set()
globalThis.window = {
  localStorage,
  addEventListener(type, listener) {
    assert.equal(type, 'storage')
    listeners.add(listener)
  },
  removeEventListener(type, listener) {
    assert.equal(type, 'storage')
    listeners.delete(listener)
  },
}

function emit(key, storageArea = localStorage) {
  for (const listener of listeners) listener({ key, storageArea })
}

test('preview watches its localStorage keys and clear(), and cleans up', async (t) => {
  let reads = 0
  const values = []
  const stop = observeSettings(
    { keys: ['language'], read: async () => ++reads },
    (value) => values.push(value),
    () => assert.fail('unexpected read failure'),
  )
  t.after(stop)
  await Promise.resolve()
  assert.deepEqual(values, [1])
  emit('unrelated')
  emit('language', sessionStorage)
  emit(null, sessionStorage)
  assert.equal(reads, 1)
  emit('language')
  await Promise.resolve()
  assert.deepEqual(values, [1, 2])
  emit(null)
  await Promise.resolve()
  assert.deepEqual(values, [1, 2, 3])
  stop()
  assert.equal(listeners.size, 0)
  emit('language')
  assert.equal(reads, 3)
})

test('a complete preview snapshot refreshes language subscribers', async (t) => {
  const { previewSettingsStorageKey } =
    await import('../src/features/settings/settings-store.ts')
  let reads = 0
  const stop = observeSettings(
    { keys: ['language'], read: async () => ++reads },
    () => {},
    () => assert.fail('unexpected failure'),
  )
  t.after(stop)
  await Promise.resolve()
  emit(previewSettingsStorageKey)
  await Promise.resolve()
  assert.equal(reads, 2)
})
