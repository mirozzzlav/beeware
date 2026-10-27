import { useId, type ComponentPropsWithoutRef } from 'react'

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
}

export default function TextField({ label, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className="text-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...props} />
    </div>
  )
}
