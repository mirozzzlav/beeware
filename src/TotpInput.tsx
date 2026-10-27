import type { ComponentPropsWithoutRef, PointerEvent } from 'react'
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp'

type TotpInputProps = Pick<
  ComponentPropsWithoutRef<'input'>,
  | 'id'
  | 'name'
  | 'disabled'
  | 'required'
  | 'aria-label'
  | 'aria-describedby'
  | 'aria-invalid'
> & {
  value: string
  onChange: (value: string) => void
}

export default function TotpInput(props: TotpInputProps) {
  const { onChange } = props

  function selectDigit(event: PointerEvent<HTMLInputElement>) {
    if (event.button !== 0 || props.disabled) return
    const input = event.currentTarget
    const slots = input
      .closest('[data-input-otp-container]')
      ?.querySelectorAll<HTMLElement>('.totp-input-slot')
    if (!slots?.length) return

    let index = 0
    let distance = Infinity
    slots.forEach((slot, slotIndex) => {
      const bounds = slot.getBoundingClientRect()
      const slotDistance = Math.abs(
        event.clientX - (bounds.left + bounds.width / 2),
      )
      if (slotDistance < distance) {
        index = slotIndex
        distance = slotDistance
      }
    })

    // The transparent input spans all six slots; its text positions do not
    // match their visual positions. Select the digit in the clicked slot.
    event.preventDefault()
    input.focus()
    const start = Math.min(index, input.value.length)
    input.setSelectionRange(start, Math.min(start + 1, input.value.length))
  }

  return (
    <OTPInput
      {...props}
      containerClassName="totp-input"
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      onPointerDown={selectDigit}
      onPasteCapture={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const code = event.clipboardData
          .getData('text/plain')
          .replace(/[\s-]/g, '')
        if (!/^[0-9]+$/.test(code)) return
        const value = code.slice(0, 6)
        const input = event.currentTarget
        onChange(value)
        requestAnimationFrame(() => {
          if (document.activeElement === input)
            input.setSelectionRange(Math.min(value.length, 5), value.length)
        })
      }}
      render={({ slots }) =>
        slots.map((slot, index) => (
          <span
            key={index}
            className={`totp-input-slot${slot.isActive ? ' is-active' : ''}`}
            aria-hidden="true"
          >
            {slot.char}
            {slot.hasFakeCaret && <span className="totp-input-caret" />}
          </span>
        ))
      }
    />
  )
}
