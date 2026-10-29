import { useId, type ComponentPropsWithoutRef } from 'react'
import FormField from './FormField'
import Icon from './Icon'
import type { ControlSize } from './control-size'

type SelectFieldProps = Omit<ComponentPropsWithoutRef<'select'>, 'size'> & {
  label: string
  description?: string
  hideLabel?: boolean
  size?: ControlSize
}

export default function SelectField({
  label,
  description,
  hideLabel,
  id,
  children,
  size = 'normal',
  className = '',
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FormField
      label={label}
      description={description}
      htmlFor={inputId}
      hideLabel={hideLabel}
      size={size}
    >
      <div className="select-control">
        <select
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
        >
          {children}
        </select>
        <Icon name="chevronDown" className="select-control-icon" />
      </div>
    </FormField>
  )
}
