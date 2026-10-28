import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

const listeners = new Set()
globalThis.browser = {
  runtime: { id: 'extension@test' },
  storage: {
    onChanged: {
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
    },
  },
}
const { observeSettings } =
  await import('../src/features/settings/observe-settings.ts')

beforeEach(() => listeners.clear())

function emit(changes, area = 'local') {
  for (const listener of listeners) listener(changes, area)
}

function observe(t) {
  const requests = []
  const values = []
  const errors = []
  const stop = observeSettings(
    {
      keys: ['question', 'enabled'],
      read: () => {
        assert.equal(listeners.size, 1, 'subscribe before reading')
        const request = Promise.withResolvers()
        requests.push(request)
        return request.promise
      },
    },
    (value) => values.push(value),
    () => errors.push('failed'),
  )
  t.after(stop)
  return { requests, values, errors, stop }
}

async function resolve(request, value) {
  request.resolve(value)
  await request.promise
}

async function reject(request) {
  request.reject(new Error('Storage unavailable'))
  await request.promise.catch(() => {})
}

test('loads initially and reloads only for relevant local changes', async (t) => {
  const { requests, values } = observe(t)
  await resolve(requests[0], 'initial')
  assert.deepEqual(values, ['initial'])
  emit({ unrelated: {} })
  emit({ question: {} }, 'sync')
  assert.equal(requests.length, 1)
  emit({ enabled: {} })
  await resolve(requests[1], 'disabled')
  emit({ question: {}, enabled: {} })
  assert.equal(requests.length, 3, 'one reload per storage event')
  await resolve(requests[2], 'updated question')
  assert.deepEqual(values, ['initial', 'disabled', 'updated question'])
})

test('an older read cannot overwrite the latest value', async (t) => {
  const { requests, values, errors } = observe(t)
  emit({ question: {} })
  await resolve(requests[1], 'new')
  await resolve(requests[0], 'old')
  assert.deepEqual(values, ['new'])
  assert.deepEqual(errors, [])
})

test('an outdated failure cannot hide a newer successful read', async (t) => {
  const { requests, values, errors } = observe(t)
  emit({ enabled: {} })
  await resolve(requests[1], 'new')
  await reject(requests[0])
  assert.deepEqual(values, ['new'])
  assert.deepEqual(errors, [])
})

test('a stale success cannot clear a newer failure, and later changes recover', async (t) => {
  const { requests, values, errors } = observe(t)
  emit({ enabled: {} })
  await reject(requests[1])
  await resolve(requests[0], 'old')
  assert.deepEqual(values, [])
  assert.deepEqual(errors, ['failed'])
  emit({ question: {} })
  await resolve(requests[2], 'recovered')
  assert.deepEqual(values, ['recovered'])
})

test('cleanup removes listeners and discards pending reads', async (t) => {
  const first = observe(t)
  first.stop()
  assert.equal(listeners.size, 0)
  const second = observe(t)
  await resolve(second.requests[0], 'remounted')
  await resolve(first.requests[0], 'unmounted')
  assert.deepEqual(first.values, [])
  assert.deepEqual(second.values, ['remounted'])
  emit({ question: {} })
  second.stop()
  await reject(second.requests[1])
  assert.deepEqual(second.errors, [])
  emit({ question: {} })
  assert.equal(second.requests.length, 2)
  assert.equal(listeners.size, 0)
})
