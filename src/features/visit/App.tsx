import { useEffect, useSyncExternalStore } from 'react'
import { getProtectedSite } from '../domains/policy'
import { leaveUntrackedPage } from './visit'
import { useVisitSettings } from './use-visit-settings'
import { isExtension } from '../settings/settings-store'
import Panel from '../../components/Panel'
import { useLanguage } from '../language/use-language'
import VisitPrompt from './VisitPrompt'
import { getCurrentVisitTarget, subscribeVisitTarget } from './target'

export default function App() {
  const requestedTarget = useSyncExternalStore(
    subscribeVisitTarget,
    getCurrentVisitTarget,
  )
  const { t } = useLanguage()
  const { settings, error: loadError } = useVisitSettings()
  const sites = settings?.sites
  const target =
    requestedTarget ?? (sites?.[0] ? `https://${sites[0].domain}/` : '')
  const site = sites ? getProtectedSite(target, sites) : undefined

  useEffect(() => {
    if (sites && !loadError && !site) leaveUntrackedPage(requestedTarget)
  }, [sites, loadError, site, requestedTarget])

  if (sites && !loadError && !site) return null

  return (
    <main className="visit-page">
      {loadError ? (
        <Panel aria-labelledby="question" error={loadError}>
          <h1 id="question">{t('loadErrorTitle')}</h1>
        </Panel>
      ) : !site || !settings ? (
        <Panel aria-labelledby="question">
          <h1 id="question">{t('loading')}</h1>
        </Panel>
      ) : (
        <VisitPrompt
          key={`${target}:${settings.mode}`}
          target={target}
          site={site}
          preview={!isExtension || requestedTarget === null}
          mode={settings.mode}
          visitQuestionEnabled={settings.visitQuestionEnabled}
          question={settings.question}
        />
      )}
    </main>
  )
}
