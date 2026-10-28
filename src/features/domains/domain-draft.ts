import { inferAppName, normalizeRules, type DomainRule } from './policy.ts'

export interface DraftRule extends DomainRule {
  id: string
  autoName: boolean
}

export function createDraft(rule: DomainRule): DraftRule {
  const inferredName = inferAppName(rule.domain)
  return {
    ...rule,
    id: crypto.randomUUID(),
    name: rule.name || inferredName,
    autoName: !rule.name || rule.name === inferredName,
  }
}

export function editDraft(
  row: DraftRule,
  field: keyof DomainRule,
  value: string,
): DraftRule {
  if (field === 'name') return { ...row, name: value, autoName: !value.trim() }
  return {
    ...row,
    domain: value,
    name: row.autoName ? inferAppName(value) : row.name,
  }
}

export function normalizeDrafts(rows: readonly DraftRule[]): DomainRule[] {
  return normalizeRules(
    rows.map(({ domain, name }) => ({
      domain,
      name: name.trim() || inferAppName(domain),
    })),
  )
}
