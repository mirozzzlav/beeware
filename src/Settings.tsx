import { useDomainSettings } from './use-domain-settings'
import DomainRulesFieldset from './DomainRulesFieldset'
import TotpSetup from './TotpSetup'
import Panel from './Panel'
import Icon from './Icon'
import FormActions from './FormActions'
import LanguageSettings from './LanguageSettings'
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
            <FormActions
              form="settings-form"
              busy={busy}
              onCancel={closeWindow}
              cancelLabel={t('cancel')}
              submitLabel={t('saveSettings')}
              busyLabel={t('saving')}
              cancelIcon={<Icon name="close" />}
              submitIcon={<Icon name="submit" />}
              submitColor="color-action-success"
              submitAppearance="filled"
            />
          ) : undefined
        }
        status={saved ? t('settingsSaved') : undefined}
      >
        <h1 id="settings-title">{t('settings')}</h1>
        {loading ? (
          <p role="status">{t('loading')}</p>
        ) : !loadFailed ? (
          <>
            <LanguageSettings
              value={language}
              disabled={busy}
              onChange={changeLanguage}
            />
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
                <DomainRulesFieldset
                  rows={rows}
                  disabled={busy}
                  onChange={edit}
                  onAdd={add}
                  onRemove={remove}
                />
              </form>
            </SettingsBlock>
          </>
        ) : null}
      </Panel>
    </main>
  )
}
