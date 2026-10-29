import type { ReactNode } from 'react'

export default function SettingsSection({ children }: { children: ReactNode }) {
  return <div className="settings-section">{children}</div>
}
