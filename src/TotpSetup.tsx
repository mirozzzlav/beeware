import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { totpUri } from './totp'
import tokens from './tokens.json'
import ErrorMessage from './ErrorMessage'
import { useLanguage } from './use-language'
import SettingsBlock from './SettingsBlock'

export default function TotpSetup({ secret }: { secret: string }) {
  const { t } = useLanguage()
  const [qr, setQr] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    void QRCode.toDataURL(totpUri(secret), {
      width: Number.parseInt(tokens['size-qr-code']),
      margin: 0,
      color: { dark: tokens['palette-black'], light: tokens['palette-white'] },
    })
      .then((url) => {
        if (active) {
          setQr(url)
          setError(false)
        }
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [secret])

  return (
    <SettingsBlock
      className="totp-setup"
      tone="surface"
      title={t('totpSetupLabel')}
      description={t('totpInstructions')}
    >
      {qr && <img className="totp-qr" src={qr} alt={t('totpQrAlt')} />}
      {error && <ErrorMessage>{t('qrError')}</ErrorMessage>}
      <code className="totp-secret" aria-label={t('totpManualKey')}>
        {secret}
      </code>
    </SettingsBlock>
  )
}
