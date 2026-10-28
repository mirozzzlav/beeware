import type { ReactNode } from 'react'
import Columns, { Column } from '../../components/Columns'

export default function SettingsSection({ children }: { children: ReactNode }) {
  return (
    <Columns>
      <Column>{children}</Column>
    </Columns>
  )
}
