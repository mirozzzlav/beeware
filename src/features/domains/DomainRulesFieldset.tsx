import type { DomainRule } from './policy'
import DomainRuleEditor from './DomainRuleEditor'
import Icon from '../../components/Icon'
import ActionButton from '../../components/ActionButton'
import { useLanguage } from '../language/use-language'

type DomainRulesFieldsetProps = {
  rows: readonly (DomainRule & { id: string })[]
  disabled?: boolean
  onChange: (id: string, field: keyof DomainRule, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export default function DomainRulesFieldset({
  rows,
  disabled,
  onChange,
  onAdd,
  onRemove,
}: DomainRulesFieldsetProps) {
  const { t } = useLanguage()
  return (
    <fieldset className="domain-rules" disabled={disabled}>
      <legend className="sr-only">{t('monitoredDomains')}</legend>
      {rows.length === 0 && <p className="empty-state">{t('noDomains')}</p>}
      {rows.map((row) => (
        <DomainRuleEditor
          key={row.id}
          rule={row}
          onChange={(field, value) => onChange(row.id, field, value)}
          onRemove={() => onRemove(row.id)}
        />
      ))}
      <ActionButton
        size="normal"
        className="add-domain"
        icon={<Icon name="plus" className="settings-add-icon" />}
        onClick={onAdd}
      >
        {t('addDomain')}
      </ActionButton>
    </fieldset>
  )
}
