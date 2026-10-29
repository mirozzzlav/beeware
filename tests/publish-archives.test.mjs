import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { publishArchives } from '../scripts/publish-archives.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wakeup-archives-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const staging = path.join(root, 'staging')
  const output = path.join(root, 'releases')
  fs.mkdirSync(staging)
  fs.mkdirSync(output)
  const archives = ['wakeup-0.1.0.zip', 'wakeup-0.1.0-source.zip']
  for (const archive of archives) {
    fs.writeFileSync(path.join(staging, archive), `new ${archive}`)
    fs.writeFileSync(path.join(output, archive), `old ${archive}`)
  }
  fs.writeFileSync(path.join(output, 'wakeup-0.0.1.zip'), 'previous version')
  fs.writeFileSync(path.join(output, 'other.zip'), 'unrelated')
  return { staging, output, archives }
}

for (const operation of ['copy', 'rename']) {
  test(`keeps previous archives when the second ${operation} fails`, (t) => {
    const { staging, output, archives } = fixture(t)
    const method = operation === 'copy' ? 'cpSync' : 'renameSync'
    const original = fs[method]
    t.mock.method(fs, method, (source, destination, ...args) => {
      if (
        operation === 'copy'
          ? source === path.join(staging, archives[1])
          : source.endsWith(archives[1]) &&
            path.basename(path.dirname(source)).startsWith('.pending-')
      ) {
        throw new Error('Simulated disk failure')
      }
      return original(source, destination, ...args)
    })
    assert.throws(
      () => publishArchives(staging, output, 'wakeup', archives),
      /Simulated disk failure/,
    )
    for (const archive of archives)
      assert.equal(
        fs.readFileSync(path.join(output, archive), 'utf8'),
        `old ${archive}`,
      )
    assert.equal(
      fs.readFileSync(path.join(output, 'wakeup-0.0.1.zip'), 'utf8'),
      'previous version',
    )
    assert.equal(
      fs.readFileSync(path.join(output, 'other.zip'), 'utf8'),
      'unrelated',
    )
    assert.equal(
      fs.readdirSync(output).some((name) => name.startsWith('.pending-')),
      false,
    )
  })
}

test('installs both archives before removing older versions and preserves unrelated files', (t) => {
  const { staging, output, archives } = fixture(t)
  publishArchives(staging, output, 'wakeup', archives)
  for (const archive of archives)
    assert.equal(
      fs.readFileSync(path.join(output, archive), 'utf8'),
      `new ${archive}`,
    )
  assert.deepEqual(
    fs.readdirSync(output).sort(),
    [...archives, 'other.zip'].sort(),
  )
})
