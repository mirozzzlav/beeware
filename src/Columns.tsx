import type { ComponentPropsWithoutRef } from 'react'

type ColumnsProps = ComponentPropsWithoutRef<'div'>
type ColumnProps = ColumnsProps & { span?: 1 | 2 }

export default function Columns({ className = '', ...props }: ColumnsProps) {
  return <div {...props} className={`columns ${className}`.trim()} />
}

export function Column({ span = 1, className = '', ...props }: ColumnProps) {
  return (
    <div {...props} className={`column ${className}`.trim()} data-span={span} />
  )
}
