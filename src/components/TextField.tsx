import { useId, type ComponentPropsWithoutRef } from 'react'
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
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FormField
      label={label}
      description={description}
      htmlFor={inputId}
      size={size}
    >
      <input
        id={inputId}
        {...props}
        className={`control ${className}`.trim()}
        data-size={size}
        aria-describedby={
          [
            props['aria-describedby'],
            description ? `${inputId}-description` : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    </FormField>
  )
}
