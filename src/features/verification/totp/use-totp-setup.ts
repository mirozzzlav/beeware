import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { readTotpSecret } from '../../settings/settings-store'
import { totpUri } from './totp'
import tokens from '../../../tokens.json'

type TotpSetupState =
  | { status: 'loading' }
  | { status: 'error'; error: 'totpLoadError' }
  | {
      status: 'ready'
      secret: string
      qr: string | null
      error: 'qrError' | null
    }

export function useTotpSetup(): TotpSetupState {
  const [state, setState] = useState<TotpSetupState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    async function load() {
      let secret: string
      try {
        secret = await readTotpSecret()
      } catch {
        if (active) setState({ status: 'error', error: 'totpLoadError' })
        return
      }
      if (!active) return

      // Manual setup stays available while the QR loads or if it fails.
      setState({ status: 'ready', secret, qr: null, error: null })
      try {
        const qr = await QRCode.toDataURL(totpUri(secret), {
          width: Number.parseInt(tokens['size-qr-code']),
          margin: 0,
          color: {
            dark: tokens['palette-black'],
            light: tokens['palette-white'],
          },
        })
        if (active) setState({ status: 'ready', secret, qr, error: null })
      } catch {
        if (active)
          setState({ status: 'ready', secret, qr: null, error: 'qrError' })
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  return state
}
