import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const moduleUrl = new URL('../src/browser-api.ts', import.meta.url).href
function isolated(script) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict'
    ${script}
  `,
    ],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr || result.stdout)
}

test('web preview initializes without loading an extension-only polyfill', () => {
  isolated(`
    const api = await import(${JSON.stringify(moduleUrl)})
    assert.equal(api.isExtension, false)
    await api.initializeBrowserApi()
    assert.equal(api.browser, undefined)
  `)
})

test('native browser API is preserved without requiring the chrome namespace', () => {
  isolated(`
    const native = { runtime: { id: 'native@test' } }
    globalThis.browser = native
    const api = await import(${JSON.stringify(moduleUrl)})
    assert.equal(api.isExtension, true)
    await api.initializeBrowserApi()
    assert.equal(api.browser, native)
  `)
})

test('Chromium callbacks become promises, API errors reject, and async message replies work', () => {
  isolated(`
    let listener
    globalThis.chrome = {
      runtime: {
        id: 'chrome@test',
        onMessage: { addListener: (fn) => { listener = fn } },
        sendMessage: (message, reply) => reply({ echoed: message }),
      },
      storage: {
        // Newer APIs are already Promise-based and pass through unchanged.
        session: { get: async (key) => ({ [key]: 'session-value' }) },
        local: { get: (key, reply) => {
          if (key === 'fail') chrome.runtime.lastError = { message: 'Storage failed' }
          reply({ [key]: 'value' })
          delete chrome.runtime.lastError
        } },
      },
      tabs: { update: (id, change, reply) => reply({ id, ...change }) },
    }
    const api = await import(${JSON.stringify(moduleUrl)})
    assert.equal(api.isExtension, true)
    await api.initializeBrowserApi()
    const initialized = api.browser
    await api.initializeBrowserApi()
    assert.equal(api.browser, initialized)
    assert.deepEqual(await api.browser.storage.local.get('key'), { key: 'value' })
    assert.deepEqual(await api.browser.storage.session.get('key'), { key: 'session-value' })
    await assert.rejects(api.browser.storage.local.get('fail'), /Storage failed/)
    assert.deepEqual(await api.browser.tabs.update(7, { url: 'https://example.org/' }),
      { id: 7, url: 'https://example.org/' })
    assert.deepEqual(await api.browser.runtime.sendMessage('hello'), { echoed: 'hello' })
    api.browser.runtime.onMessage.addListener(async (message) => ({ received: message }))
    const reply = new Promise((resolve) => {
      assert.equal(listener('request', {}, resolve), true)
    })
    assert.deepEqual(await reply, { received: 'request' })
  `)
})
