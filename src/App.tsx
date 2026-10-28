import { getProtectedSite } from './policy'
import { isExtension } from './settings-store'
import { useVisit } from './use-visit'
import { useSites } from './use-sites'
import ActionButton from './ActionButton'
import PillIcon from './PillIcon'
import VisitForm from './VisitForm'
import FormActions from './FormActions'
import Panel from './Panel'
import { useLanguage } from './use-language'

const requestedTarget = new URLSearchParams(window.location.search).get(
  'target',
)

export default function App() {
  const { t } = useLanguage()
  const { sites, error: loadError } = useSites()
  const target =
    requestedTarget ?? (sites?.[0] ? `https://${sites[0].domain}/` : '')
  const site = sites ? getProtectedSite(target, sites) : undefined
  const {
    reason,
    code,
    busy,
    error,
    finished,
    changeReason,
    changeCode,
    continueToSite,
    reset,
    closeWindow,
  } = useVisit(target, site, !isExtension || requestedTarget === null)
  const showVisitForm = !loadError && !!site && !finished

  return (
    <main>
      <Panel
        aria-labelledby="question"
        error={loadError || (showVisitForm ? error : undefined)}
        actions={
          !loadError && site ? (
            finished ? (
              <ActionButton icon={<PillIcon color="blue" />} onClick={reset}>
                {t('tryAgain')}
              </ActionButton>
            ) : (
              <FormActions
                form="visit-form"
                busy={busy}
                onCancel={closeWindow}
                cancelLabel={t('closeWindow')}
                submitLabel={t('continue')}
                busyLabel={t('opening')}
                cancelIcon={<PillIcon color="red" />}
                submitIcon={<PillIcon color="blue" />}
              />
            )
          ) : undefined
        }
      >
        {loadError ? (
          <h1 id="question">{t('loadErrorTitle')}</h1>
        ) : !sites ? (
          <h1 id="question">{t('loading')}</h1>
        ) : !site ? (
          <>
            <h1 id="question">{t('untrackedDomain')}</h1>
            <a href="./settings.html">{t('openSettings')}</a>
          </>
        ) : finished ? (
          <>
            <h1 id="question">
              {t('visitPreview', { site: site.name || site.domain })}
            </h1>
          </>
        ) : (
          <VisitForm
            id="visit-form"
            titleId="question"
            site={site}
            reason={reason}
            code={code}
            busy={busy}
            onReasonChange={changeReason}
            onCodeChange={changeCode}
            onSubmit={(event) => {
              void continueToSite(event)
            }}
          />
        )}
      </Panel>
    </main>
  )
}
