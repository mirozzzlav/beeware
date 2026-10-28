import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeVerification,
  verifyCode,
  verificationMethods,
} from '../src/features/verification/verification.ts'
import { shuffledDigits } from '../src/features/verification/pin/pin.ts'
import { initialSettings } from '../src/features/settings/initial-settings.ts'

test('invalid saved verification settings cannot silently disable verification', () => {
  for (const value of [
    { mode: 'none' },
    { mode: 'toString' },
    { mode: '__proto__' },
    { mode: 'pin' },
    { mode: 'pin', pin: 1234 },
    false,
    'pin',
  ]) {
    assert.throws(() => normalizeVerification(value))
  }
})

test('initial settings select PIN and every read returns independent config objects', async () => {
  const settings = normalizeVerification(undefined)
  assert.equal(settings.mode, 'pin')
  assert.deepEqual(
    await verifyCode(settings, initialSettings.verification.methods.pin.pin, {
      getTotpSecret: () => {
        throw Error('PIN must not load a TOTP secret')
      },
    }),
    { ok: true },
  )
  settings.methods.pin.pin = '9999'
  assert.notEqual(normalizeVerification(undefined).methods.pin.pin, '9999')
})

test('legacy settings migrate without changing the mode or PIN', () => {
  assert.deepEqual(normalizeVerification({ mode: 'pin', pin: '001234' }), {
    mode: 'pin',
    methods: { totp: {}, pin: { pin: '001234' } },
  })
  assert.deepEqual(normalizeVerification({ mode: 'totp', pin: '9876' }), {
    mode: 'totp',
    methods: { totp: {}, pin: { pin: '9876' } },
  })
})

test('method definitions validate input and do not confuse TOTP and PIN formats', () => {
  assert.equal(verificationMethods.pin.validateInput('0123'), null)
  assert.equal(
    verificationMethods.totp.validateInput('0123'),
    'invalidTotpFormat',
  )
  assert.equal(verificationMethods.totp.validateInput('012345'), null)
  assert.equal(
    verificationMethods.pin.validateInput('abcde'),
    'invalidPinFormat',
  )
})

test('every shuffled keypad contains each digit exactly once', () => {
  for (let index = 0; index < 100; index++) {
    assert.deepEqual(shuffledDigits().sort(), [...'0123456789'])
  }
})
