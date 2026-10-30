import assert from 'node:assert/strict'
import test from 'node:test'
import { isVisitPage, readVisitTarget } from '../src/features/visit/target.ts'

test('DNR targets preserve query delimiters, plus signs and percent escapes', () => {
  for (const base of [
    'moz-extension://id/index.html',
    'chrome-extension://id/index.html',
  ]) {
    const target =
      'https://facebook.com/path?q=a+b&next=%2Ffeed%3Fx%3D1#section'
    assert.equal(readVisitTarget(`${base}#target=${target}`), target)
    assert.equal(isVisitPage(`${base}#target=${target}`, base), true)
    assert.equal(isVisitPage(`${base}/other#target=${target}`, base), false)
    assert.equal(
      readVisitTarget(`${base}?target=${encodeURIComponent(target)}`),
      target,
    )
    assert.equal(readVisitTarget(base), null)
  }
})
