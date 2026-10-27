import { useDomainSettings } from './use-domain-settings'
import DomainRuleEditor from './DomainRuleEditor'
import TotpSetup from './TotpSetup'
import Panel from './Panel'
import Icon from './Icon'
import ActionButton from './ActionButton'
import { languages, normalizeLanguage } from './i18n'
import { useLanguage } from './use-language'
import SettingsBlock from './SettingsBlock'

export default function Settings() {
  const { language, t } = useLanguage()
  const {
    rows,
    loading,
    loadFailed,
    busy,
    error,
    saved,
    secret,
    edit,
    add,
    remove,
    closeWindow,
    changeLanguage,
    save,
  } = useDomainSettings()

  return (
    <main>
      <Panel
        className="settings-panel"
        aria-labelledby="settings-title"
        error={error}
        actions={
          !loadFailed && !loading ? (
            <>
              <ActionButton
                icon={<Icon name="close" />}
                onClick={() => {
                  void closeWindow()
                }}
                disabled={busy}
              >
                {t('cancel')}
              </ActionButton>
              <ActionButton
                icon={<Icon name="submit" />}
                color="palette-green-700"
                appearance="filled"
                type="submit"
                form="settings-form"
                disabled={busy}
              >
                {busy ? t('saving') : t('saveSettings')}
              </ActionButton>
            </>
          ) : undefined
        }
        status={saved ? t('settingsSaved') : undefined}
      >
        <h1 id="settings-title">{t('settings')}</h1>
        {loading ? (
          <p role="status">{t('loading')}</p>
        ) : !loadFailed ? (
          <>
            <SettingsBlock
              title={t('language')}
              description={t('languageHelp')}
            >
              <div className="text-field">
                <label className="sr-only" htmlFor="language">
                  {t('language')}
                </label>
                <div className="select-control">
                  <select
                    id="language"
                    value={language}
                    disabled={busy}
                    onChange={(event) =>
                      changeLanguage(normalizeLanguage(event.target.value))
                    }
                  >
                    {languages.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" className="select-control-icon" />
                </div>
              </div>
            </SettingsBlock>
            <TotpSetup secret={secret} />
            <SettingsBlock
              title={t('monitoredDomains')}
              description={t('settingsIntro')}
            >
              <form
                id="settings-form"
                noValidate
                onSubmit={(event) => {
                  void save(event)
                }}
              >
                <fieldset disabled={busy}>
                  <legend className="sr-only">{t('monitoredDomains')}</legend>
                  {rows.length === 0 && (
                    <p className="empty-state">{t('noDomains')}</p>
                  )}
                  {rows.map((row) => (
                    <DomainRuleEditor
                      key={row.id}
                      rule={row}
                      onChange={(field, value) => edit(row.id, field, value)}
                      onRemove={() => remove(row.id)}
                    />
                  ))}
                  <button
                    className="secondary add-domain"
                    type="button"
                    onClick={add}
                  >
                    <Icon name="plus" className="settings-add-icon" />
                    {t('addDomain')}
                  </button>
                </fieldset>
              </form>
            </SettingsBlock>
          </>
        ) : null}
      </Panel>
    </main>
  )
}
