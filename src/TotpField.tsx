import { useId, type ComponentProps } from 'react'
import TotpInput from './TotpInput'
import { useLanguage } from './use-language'

type TotpFieldProps = Pick<
  ComponentProps<typeof TotpInput>,
  'value' | 'onChange' | 'disabled' | 'required'
>

export default function TotpField(props: TotpFieldProps) {
  const { t } = useLanguage()
  const id = useId()
  const helpId = `${id}-help`
  return (
    <div className="otp-block">
      <label htmlFor={id}>{t('totpCode')}</label>
      <p id={helpId}>{t('totpHelp')}</p>
      <TotpInput id={id} aria-describedby={helpId} {...props} />
      <a href="./settings.html" target="_blank" rel="noreferrer">
        {t('setupTotp')}
      </a>
    </div>
  )
}
