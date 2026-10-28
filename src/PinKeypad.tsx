import { useState } from 'react'
import { shuffledDigits } from './verification/pin'
import { useLanguage } from './use-language'
import Icon from './Icon'
import Block from './Block'

export default function PinKeypad({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const { t } = useLanguage()
  const [digits] = useState(shuffledDigits)
  return (
    <Block
      className="otp-block pin-block"
      padding="sm"
      title={t('pinCode')}
      description={t('pinHelp')}
    >
      <output
        className="pin-display"
        aria-live="polite"
        aria-label={t('pinCode')}
      >
        {value || '—'}
      </output>
      <div className="pin-keypad">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className="secondary"
            disabled={disabled || value.length >= 12}
            onClick={() => onChange(value + digit)}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="secondary pin-keypad-action"
          aria-label={t('pinClear')}
          title={t('pinClear')}
          disabled={disabled || !value}
          onClick={() => onChange('')}
        >
          <Icon name="trash" />
        </button>
        <button
          type="button"
          className="secondary pin-keypad-action"
          aria-label={t('pinBackspace')}
          title={t('pinBackspace')}
          disabled={disabled || !value}
          onClick={() => onChange(value.slice(0, -1))}
        >
          <Icon name="backspace" />
        </button>
      </div>
    </Block>
  )
}
