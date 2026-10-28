import { useId, type ComponentProps } from 'react'
import TotpInput from './TotpInput'
import { useLanguage } from '../../language/use-language'
import Block from '../../../components/Block'

type TotpFieldProps = Pick<
  ComponentProps<typeof TotpInput>,
  'value' | 'onChange' | 'disabled' | 'required'
>

export default function TotpField(props: TotpFieldProps) {
  const { t } = useLanguage()
  const id = useId()
  const helpId = `${id}-help`
  return (
    <Block
      className="otp-block"
      padding="md"
      title={<label htmlFor={id}>{t('totpCode')}</label>}
      description={t('totpHelp')}
      descriptionId={helpId}
    >
      <TotpInput id={id} aria-describedby={helpId} {...props} />
      <a href="./settings.html" target="_blank" rel="noreferrer">
        {t('setupTotp')}
      </a>
    </Block>
  )
}
