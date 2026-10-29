import assert from 'node:assert/strict'
import test from 'node:test'
import { renderMatrixBackground } from '../src/components/MatrixBackground/matrix-renderer.ts'

async function withBrowser(width, run) {
  let viewport = width
  let reducedMotion = false
  let frameId = 0
  let paints = 0
  let contextReads = 0
  const frames = new Map()
  const observers = new Set()
  const queries = []
  const glyphs = []
  const context = {
    clearRect() {
      paints++
    },
    setTransform() {},
    measureText: () => ({ width: 10 }),
    fillText(glyph, x, y) {
      glyphs.push({ glyph, x, y })
    },
  }
  const canvas = {
    get clientWidth() {
      return viewport
    },
    clientHeight: 800,
    getContext() {
      contextReads++
      return context
    },
  }
  const window = Object.assign(new EventTarget(), {
    devicePixelRatio: 2,
    matchMedia(media) {
      const listeners = new Set()
      const query = {
        get matches() {
          if (media === '(prefers-reduced-motion: reduce)') return reducedMotion
          if (media === '(width >= 48rem)') return viewport >= 768
          if (media === '(width >= 64rem)') return viewport >= 1024
          throw new Error(`Unexpected media query: ${media}`)
        },
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        listeners,
      }
      queries.push(query)
      return query
    },
    requestAnimationFrame(callback) {
      frames.set(++frameId, callback)
      return frameId
    },
    cancelAnimationFrame(id) {
      frames.delete(id)
    },
  })
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    fonts: { add() {} },
  })
  const mocks = {
    window,
    document,
    FontFace: class {
      load() {
        return Promise.resolve(this)
      }
    },
    ResizeObserver: class {
      observe() {
        observers.add(this)
      }
      disconnect() {
        observers.delete(this)
      }
    },
  }
  const originals = Object.fromEntries(
    Object.keys(mocks).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  )
  for (const [key, value] of Object.entries(mocks)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    })
  }

  function changeMedia(update) {
    const previous = queries.map((query) => query.matches)
    update()
    queries.forEach((query, index) => {
      if (query.matches !== previous[index]) {
        for (const listener of query.listeners) listener()
      }
    })
  }

  const cleanup = renderMatrixBackground(canvas)
  try {
    await Promise.resolve()
    await run({
      canvas,
      frames,
      observers,
      queries,
      glyphs,
      cleanup,
      get paints() {
        return paints
      },
      get contextReads() {
        return contextReads
      },
      setWidth(value) {
        changeMedia(() => {
          viewport = value
        })
        window.dispatchEvent(new Event('resize'))
      },
      setReducedMotion(value) {
        changeMedia(() => {
          reducedMotion = value
        })
      },
      setHidden(value) {
        document.hidden = value
        document.dispatchEvent(new Event('visibilitychange'))
      },
      tick(time) {
        const callbacks = [...frames.values()]
        frames.clear()
        for (const callback of callbacks) callback(time)
      },
    })
  } finally {
    cleanup()
    await Promise.resolve()
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}

test('mobile skips canvas rendering and animation below the tablet boundary', async () => {
  await withBrowser(767.99, (browser) => {
    assert.equal(browser.contextReads, 0)
    assert.equal(browser.paints, 0)
    assert.equal(browser.frames.size, 0)
    assert.equal(browser.observers.size, 0)
    assert.equal(browser.canvas.width, 0)
    assert.equal(browser.canvas.height, 0)
  })
})

test('tablet renders a static snapshot at both ends of its width range', async () => {
  for (const width of [768, 1023.99]) {
    await withBrowser(width, (browser) => {
      assert.ok(browser.glyphs.length > 0)
      assert.ok(browser.glyphs.every(({ glyph }) => /^[01]$/.test(glyph)))
      assert.equal(browser.frames.size, 0)
      const paints = browser.paints
      browser.tick(1000)
      assert.equal(browser.paints, paints)
    })
  }
})

test('desktop restores falling digits and pauses while the document is hidden', async () => {
  await withBrowser(1024, (browser) => {
    assert.equal(browser.frames.size, 1)
    const initialPaints = browser.paints
    for (let time = 40; time <= 1000; time += 40) browser.tick(time)
    assert.ok(browser.paints > initialPaints)
    assert.ok(browser.glyphs.length > 0)
    assert.ok(new Set(browser.glyphs.map(({ y }) => y)).size > 1)
    browser.setHidden(true)
    assert.equal(browser.frames.size, 0)
    browser.setHidden(false)
    assert.equal(browser.frames.size, 1)
  })
})

test('viewport changes stop the previous renderer and enable the new mode', async () => {
  await withBrowser(1024, async (browser) => {
    browser.setWidth(900)
    assert.equal(browser.frames.size, 0)
    assert.equal(browser.observers.size, 1)
    assert.ok(browser.glyphs.length > 0)

    browser.setWidth(390)
    assert.equal(browser.frames.size, 0)
    assert.equal(browser.observers.size, 0)
    assert.equal(browser.canvas.width, 0)
    const paints = browser.paints
    browser.setWidth(400)
    browser.tick(1000)
    assert.equal(browser.paints, paints)

    browser.setWidth(1024)
    assert.equal(browser.frames.size, 1)
    assert.equal(browser.observers.size, 1)
    await Promise.resolve()
    browser.cleanup()
    assert.equal(browser.frames.size, 0)
    assert.equal(browser.observers.size, 0)
    assert.ok(browser.queries.every(({ listeners }) => listeners.size === 0))
    const reads = browser.contextReads
    browser.setWidth(900)
    browser.setHidden(false)
    assert.equal(browser.contextReads, reads)
    assert.equal(browser.frames.size, 0)
  })
})

test('reduced-motion changes switch desktop between a snapshot and animation', async () => {
  await withBrowser(1280, (browser) => {
    browser.setReducedMotion(true)
    assert.equal(browser.frames.size, 0)
    assert.ok(browser.glyphs.length > 0)
    browser.setHidden(true)
    browser.setHidden(false)
    assert.equal(browser.frames.size, 0)
    browser.setReducedMotion(false)
    assert.equal(browser.frames.size, 1)
    assert.equal(browser.observers.size, 1)
  })
})
