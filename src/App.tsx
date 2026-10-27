import { getProtectedSite, minimumWords } from './policy'
import { isExtension } from './settings-store'
import { useVisit } from './use-visit'
import { useSites } from './use-sites'
import ActionButton from './ActionButton'
import PillIcon from './PillIcon'
import TotpInput from './TotpInput'
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
              <>
                <ActionButton
                  icon={<PillIcon color="red" />}
                  onClick={() => {
                    void closeWindow()
                  }}
                  disabled={busy}
                >
                  {t('closeWindow')}
                </ActionButton>
                <ActionButton
                  icon={<PillIcon color="blue" />}
                  type="submit"
                  form="visit-form"
                  disabled={busy}
                >
                  {busy ? t('opening') : t('continue')}
                </ActionButton>
              </>
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
          <form
            id="visit-form"
            noValidate
            onSubmit={(event) => {
              void continueToSite(event)
            }}
          >
            <h1 id="question" className="visit-question">
              {t('visiting')} <strong>{site.name || site.domain}</strong>.
              <br />
              {t('visitQuestion')}
            </h1>
            <textarea
              aria-label={t('visitQuestion')}
              value={reason}
              onChange={(event) => {
                changeReason(event.target.value)
              }}
              placeholder={t('reasonPlaceholder', { count: minimumWords })}
              rows={4}
              maxLength={3000}
              disabled={busy}
              required
            />
            <div className="otp-block">
              <label htmlFor="totp-code">{t('totpCode')}</label>
              <p id="totp-help">{t('totpHelp')}</p>
              <TotpInput
                id="totp-code"
                aria-describedby="totp-help"
                value={code}
                onChange={changeCode}
                disabled={busy}
                required
              />
              <a href="./settings.html" target="_blank" rel="noreferrer">
                {t('setupTotp')}
              </a>
            </div>
          </form>
        )}
      </Panel>
    </main>
  )
}
