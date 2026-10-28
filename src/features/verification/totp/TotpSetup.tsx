import ErrorMessage from '../../../components/ErrorMessage'
import { useLanguage } from '../../language/use-language'
import SettingsBlock from '../../settings/SettingsBlock'

export default function TotpSetup({
  secret,
  qr,
  error,
}: {
  secret: string
  qr: string | null
  error: string
}) {
  const { t } = useLanguage()

  return (
    <SettingsBlock
      className="totp-setup"
      tone="surface"
      title={t('totpSetupLabel')}
      description={t('totpInstructions')}
    >
      {qr && <img className="totp-qr" src={qr} alt={t('totpQrAlt')} />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <code className="totp-secret" aria-label={t('totpManualKey')}>
        {secret}
      </code>
    </SettingsBlock>
  )
}
