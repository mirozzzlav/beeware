import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { MessageError, normalizeLanguage, translate } from '../src/i18n.ts'
import { normalizeRules } from '../src/policy.ts'

const locales = JSON.parse(
  readFileSync(new URL('../src/locales.json', import.meta.url), 'utf8'),
)
const placeholders = (message) =>
  [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

test('every language has the same message keys and interpolation parameters', () => {
  for (const [language, locale] of Object.entries(locales)) {
    assert.ok(locale.name.trim(), language)
    assert.deepEqual(
      Object.keys(locale.messages).sort(),
      Object.keys(locales.sk.messages).sort(),
      language,
    )
    for (const [key, message] of Object.entries(locale.messages)) {
      assert.ok(message.trim(), `${language}.${key}`)
      assert.deepEqual(
        placeholders(message),
        placeholders(locales.sk.messages[key]),
        `${language}.${key}`,
      )
    }
  }
})

test('interpolates messages without interpreting user values as templates', () => {
  assert.equal(
    translate('en', 'reasonTooShort', { count: 5 }),
    'Answer the question in at least 5 words.',
  )
  assert.equal(
    translate('sk', 'duplicateDomain', { domain: 'example.org' }),
    'Doména example.org je v zozname viackrát.',
  )
  assert.equal(
    translate('en', 'removeDomain', { domain: '{count}' }),
    'Remove {count}',
  )
})

test('unknown or removed languages fall back to Slovak', () => {
  for (const value of [
    undefined,
    null,
    '',
    'unknown',
    'toString',
    '__proto__',
    {},
  ])
    assert.equal(normalizeLanguage(value), 'sk')
  assert.equal(normalizeLanguage('en'), 'en')
})

test('validation errors retain keys so they can be translated after changing language', () => {
  let error
  try {
    normalizeRules([
      { domain: 'example.org', name: '' },
      { domain: 'example.org', name: '' },
    ])
  } catch (cause) {
    error = cause
  }
  assert.ok(error instanceof MessageError)
  assert.equal(
    translate('en', error.key, error.params),
    'The domain example.org appears more than once.',
  )
  assert.equal(
    translate('sk', error.key, error.params),
    'Doména example.org je v zozname viackrát.',
  )
})
