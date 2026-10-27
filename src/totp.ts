const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateTotpSecret(): string {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    (byte) => alphabet[byte & 31],
  ).join('')
}

export function totpUri(secret: string): string {
  return `otpauth://totp/Beeware:Beeware?secret=${secret}&issuer=Beeware&algorithm=SHA1&digits=6&period=30`
}

export async function generateTotp(
  secret: string,
  time = Date.now(),
): Promise<string> {
  if (!/^[A-Z2-7]{32}$/.test(secret)) throw new Error('Invalid TOTP secret')
  const bytes = new Uint8Array(20)
  let buffer = 0
  let bits = 0
  let index = 0
  for (const char of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes[index++] = (buffer >>> bits) & 255
    }
  }
  const counter = new Uint8Array(8)
  new DataView(counter.buffer).setBigUint64(0, BigInt(Math.floor(time / 30000)))
  const key = await crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter))
  const offset = digest[digest.length - 1] & 15
  const value = new DataView(digest.buffer).getUint32(offset) & 0x7fffffff
  return String(value % 1000000).padStart(6, '0')
}

export async function verifyTotp(
  secret: string,
  code: unknown,
  time = Date.now(),
): Promise<boolean> {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false
  // Allow one adjacent time step for clock drift and typing near expiry.
  const codes = await Promise.all(
    [-1, 0, 1]
      .filter((step) => time + step * 30000 >= 0)
      .map((step) => generateTotp(secret, time + step * 30000)),
  )
  return codes.includes(code)
}
