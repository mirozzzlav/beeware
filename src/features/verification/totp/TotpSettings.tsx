import { useTotpSetup } from './use-totp-setup'
import { useLanguage } from '../../language/use-language'
import TotpSetup from './TotpSetup'
import ErrorMessage from '../../../components/ErrorMessage'

export default function TotpSettings() {
  const { t } = useLanguage()
  const setup = useTotpSetup()
  if (setup.status === 'error')
    return <ErrorMessage>{t(setup.error)}</ErrorMessage>
  if (setup.status === 'loading') return <p role="status">{t('loading')}</p>
  return (
    <TotpSetup
      secret={setup.secret}
      qr={setup.qr}
      error={setup.error ? t(setup.error) : ''}
    />
  )
}
