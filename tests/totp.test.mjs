import assert from 'node:assert/strict'
import { test } from 'node:test'
import packageInfo from '../package.json' with { type: 'json' }
import {
  generateTotp,
  generateTotpSecret,
  totpUri,
  verifyTotp,
} from '../src/totp.ts'

// SHA-1 test vectors from RFC 6238, reduced to six digits.
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
test('matches RFC 6238 SHA-1 vectors including times beyond 2038', async () => {
  for (const [seconds, expected] of [
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ]) {
    assert.equal(await generateTotp(secret, seconds * 1000), expected)
  }
})
test('accepts adjacent steps but rejects malformed, wrong and expired codes', async () => {
  const time = 1234567890000
  for (const step of [-1, 0, 1]) {
    assert.equal(
      await verifyTotp(
        secret,
        await generateTotp(secret, time + step * 30000),
        time,
      ),
      true,
    )
  }
  for (const code of [
    undefined,
    5924,
    '00592',
    '0059240',
    'abcdef',
    '000000',
    ' 005924',
  ]) {
    assert.equal(await verifyTotp(secret, code, time), false)
  }
  assert.equal(
    await verifyTotp(secret, await generateTotp(secret, time - 60000), time),
    false,
  )
})
test('creates independent base32 keys and an authenticator provisioning URI', () => {
  const first = generateTotpSecret()
  assert.match(first, /^[A-Z2-7]{32}$/)
  assert.notEqual(first, generateTotpSecret())
  const uri = new URL(totpUri(first))
  assert.equal(uri.protocol, 'otpauth:')
  assert.equal(uri.hostname, 'totp')
  assert.equal(uri.searchParams.get('issuer'), packageInfo.displayName)
  assert.equal(
    decodeURIComponent(uri.pathname),
    `/${packageInfo.displayName}:${packageInfo.displayName}`,
  )
  assert.equal(uri.searchParams.get('secret'), first)
  assert.equal(uri.searchParams.get('digits'), '6')
  assert.equal(uri.searchParams.get('period'), '30')
})
