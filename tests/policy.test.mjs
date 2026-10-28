import assert from 'node:assert/strict'
import test from 'node:test'
import {
  countWords,
  getProtectedSite,
  normalizeDomain,
  normalizeRules,
} from '../src/features/domains/policy.ts'

test('counts Slovak words across whitespace and punctuation', () => {
  assert.equal(
    countWords('  Chcem odpísať\nkamarátovi a\tdohodnúť stretnutie. '),
    6,
  )
  assert.equal(countWords('raz,dva;tri:štyri/päť'), 5)
  assert.equal(countWords('Chcem iba pozrieť správy'), 4)
})

test('normalizes domains and rejects invalid host permissions', () => {
  assert.equal(
    normalizeDomain(' https://WWW.Facebook.COM/feed '),
    'facebook.com',
  )
  assert.equal(normalizeDomain('example.org.'), 'example.org')
  for (const value of [
    '',
    '*.example.org',
    'user:pass@example.org',
    'https://example.org:1234',
    'https://',
    'not a domain',
    'file://example.org',
  ]) {
    assert.throws(() => normalizeDomain(value))
  }
  assert.throws(() =>
    normalizeRules([
      { domain: 'example.org', name: '' },
      { domain: 'www.example.org', name: 'Duplicate' },
    ]),
  )
})

test('trims application names when normalizing rules', () => {
  assert.deepEqual(
    normalizeRules([{ domain: 'EXAMPLE.ORG', name: '  Example  ' }]),
    [{ domain: 'example.org', name: 'Example' }],
  )
})

test('the most specific configured domain wins', () => {
  const rules = [
    { domain: 'example.org', name: 'Main' },
    { domain: 'work.example.org', name: 'Work' },
  ]
  assert.equal(
    getProtectedSite('https://work.example.org/path', rules)?.name,
    'Work',
  )
  assert.equal(
    getProtectedSite('https://other.example.org', rules)?.name,
    'Main',
  )
  assert.equal(getProtectedSite('https://facebook.com', rules), undefined)
})
test('punctuation and numbers alone do not count as words', () => {
  assert.equal(countWords(' ... !!! — \n '), 0)
  assert.equal(countWords('1 2 3 4 5'), 0)
})
test('matches Facebook and its subdomains, not lookalike URLs', () => {
  for (const url of [
    'https://facebook.com/',
    'https://www.facebook.com/feed',
    'http://m.facebook.com/',
    'https://FACEBOOK.COM./',
  ]) {
    assert.equal(getProtectedSite(url)?.domain, 'facebook.com')
  }
  for (const url of [
    'https://facebook.com.evil.test',
    'https://notfacebook.com',
    'https://facebook.com@evil.test',
    'https://user:pass@facebook.com',
    'javascript:alert(1)',
    'not a URL',
  ]) {
    assert.equal(getProtectedSite(url), undefined)
  }
})
