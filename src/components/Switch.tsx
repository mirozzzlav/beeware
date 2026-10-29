import { useId } from 'react'

type SwitchProps = {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export default function Switch({
  label,
  checked,
  disabled,
  onChange,
}: SwitchProps) {
  const id = useId()
  return (
    <div className="switch-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="switch-input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}
