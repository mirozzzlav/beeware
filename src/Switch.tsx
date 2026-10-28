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
    <label className="switch-field" htmlFor={id}>
      <input
        id={id}
        className="switch-input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
