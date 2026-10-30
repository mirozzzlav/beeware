import type { ComponentPropsWithoutRef } from 'react'
import { useFieldControl } from './use-field-control'
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
      hideLabel={hideLabel}
      size={size}
    >
      <div className="select-control">
        <select {...props} {...control}>
          {children}
        </select>
        <Icon name="chevronDown" className="select-control-icon" />
      </div>
    </FormField>
  )
}
