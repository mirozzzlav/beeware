import type { ComponentPropsWithoutRef } from 'react'
import { useFieldControl } from './use-field-control'
import FormField from './FormField'
import type { ControlSize } from './control-size'

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  label: string
  description?: string
  size?: ControlSize
}

export default function TextField({
  label,
  description,
  id,
  size = 'normal',
  className = '',
  ...props
}: TextFieldProps) {
  const control = useFieldControl({
    id,
    description,
    describedBy: props['aria-describedby'],
    className,
    size,
  })
  return (
    <FormField
      label={label}
      description={description}
      htmlFor={control.id}
      size={size}
    >
      <input {...props} {...control} />
    </FormField>
  )
}
