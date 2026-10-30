import assert from 'node:assert/strict'
import test from 'node:test'
import { createManifest } from '../scripts/extension-manifest.ts'

test('Chromium manifest contains only its supported platform settings', () => {
  const manifest = createManifest('chromium')
  assert.equal(manifest.manifest_version, 3)
  assert.deepEqual(manifest.background, {
    service_worker: 'background.js',
    type: 'module',
  })
  assert.equal(manifest.minimum_chrome_version, '121')
  assert.equal(Object.hasOwn(manifest, 'browser_specific_settings'), false)
  assert.equal(Object.hasOwn(manifest, 'developer'), false)
})

test('Firefox manifest preserves its published identity and privacy declaration', () => {
  const manifest = createManifest('firefox')
  assert.deepEqual(manifest.background, {
    scripts: ['background.js'],
    type: 'module',
  })
  assert.equal(
    manifest.browser_specific_settings.gecko.id,
    '@wakeup.wondercules',
  )
  assert.deepEqual(
    manifest.browser_specific_settings.gecko.data_collection_permissions,
    { required: ['none'] },
  )
  assert.equal(Object.hasOwn(manifest, 'minimum_chrome_version'), false)
})

test('both manifests share release metadata, icons and permissions', () => {
  const chromium = createManifest('chromium')
  const firefox = createManifest('firefox')
  for (const key of [
    'name',
    'version',
    'author',
    'action',
    'icons',
    'permissions',
    'host_permissions',
    'optional_host_permissions',
    'web_accessible_resources',
    'options_ui',
  ]) {
    assert.deepEqual(chromium[key], firefox[key], key)
  }
  assert.throws(() => createManifest('unknown'), /Unknown browser target/)
})
