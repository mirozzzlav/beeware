import { useEffect, useState } from 'react'
import { readTotpSecret } from '../settings-store'
import { useLanguage } from '../use-language'
import TotpSetup from '../TotpSetup'
import ErrorMessage from '../ErrorMessage'

export default function TotpSettings() {
  const { t } = useLanguage()
  const [secret, setSecret] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    void readTotpSecret()
      .then((value) => {
        if (active) setSecret(value)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])
  if (failed) return <ErrorMessage>{t('totpLoadError')}</ErrorMessage>
  if (!secret) return <p role="status">{t('loading')}</p>
  return <TotpSetup secret={secret} />
}
