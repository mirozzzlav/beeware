import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCurrentVisitTarget,
  isVisitPage,
  readVisitTarget,
  subscribeVisitTarget,
} from '../src/features/visit/target.ts'

test('target subscriptions follow fragment and history navigation and clean up', () => {
  const page = 'https://extension.test/index.html'
  const previousWindow = globalThis.window
  globalThis.window = Object.assign(new EventTarget(), {
    location: { href: `${page}#target=https://facebook.com/first` },
  })
  const targets = []
  const unsubscribe = subscribeVisitTarget(() => {
    targets.push(getCurrentVisitTarget())
  })
  try {
    assert.equal(getCurrentVisitTarget(), 'https://facebook.com/first')
    window.location.href = `${page}#target=https://facebook.com/second?x=1&y=2`
    window.dispatchEvent(new Event('hashchange'))
    window.location.href = `${page}?target=https%3A%2F%2Fexample.org%2F`
    window.dispatchEvent(new Event('popstate'))
    window.location.href = page
    window.dispatchEvent(new Event('hashchange'))
    assert.deepEqual(targets, [
      'https://facebook.com/second?x=1&y=2',
      'https://example.org/',
      null,
    ])
    unsubscribe()
    window.dispatchEvent(new Event('hashchange'))
    window.dispatchEvent(new Event('popstate'))
    assert.equal(targets.length, 3)
  } finally {
    unsubscribe()
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

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
