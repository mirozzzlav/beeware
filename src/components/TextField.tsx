import { useId, type ComponentPropsWithoutRef } from 'react'
import FormField from './FormField'

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
}

export default function TextField({ label, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FormField label={label} htmlFor={inputId}>
      <input id={inputId} {...props} />
    </FormField>
  )
}
