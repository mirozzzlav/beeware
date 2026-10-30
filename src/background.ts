import {
  countWords,
  getProtectedSite,
  minimumWords,
} from './features/domains/policy.ts'
import {
  ensureTotpSecret,
  readSites,
  sitesStorageKey,
  totpStorageKey,
  readVerification,
  verificationStorageKey,
  readVisitQuestionEnabled,
  visitQuestionStorageKey,
} from './features/settings/settings-store.ts'
import { verifyCode } from './features/verification/verification.ts'
import { buildRequestRules } from './features/domains/request-rules.ts'
import { isVisitPage, readVisitTarget } from './features/visit/target.ts'

const approvalKey = (tabId: number) => `approved-domain:${tabId}`
const checkPage = browser.runtime.getURL('index.html')

// Serialize the storage mutation together with its rule update and navigation.
// Tab cleanup and settings resets must not interleave with an approval.
let pendingOperation: Promise<unknown> = Promise.resolve()
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingOperation.then(operation)
  pendingOperation = result.catch(console.error)
  return result
}

async function syncRequestRules(): Promise<void> {
  const sites = await readSites()
  const approvals = await browser.storage.session.get(null)
  const previous = await browser.declarativeNetRequest.getSessionRules()
  await browser.declarativeNetRequest.updateSessionRules({
    removeRuleIds: previous.map((rule) => rule.id),
    addRules: buildRequestRules(sites, approvals, checkPage),
  })
}

async function resetApprovals(): Promise<void> {
  const saved = await browser.storage.session.get(null)
  const keys = Object.keys(saved).filter((key) =>
    /^approved-domain:\d+$/.test(key),
  )
  if (keys.length) await browser.storage.session.remove(keys)
  await syncRequestRules()
}

void enqueue(syncRequestRules)
let settingsRevision = 0

// Leaving the domain ends the approved visit, including navigation within SPAs.
async function endVisit(details: {
  tabId: number
  frameId: number
  url: string
}) {
  if (details.frameId !== 0) return
  const key = approvalKey(details.tabId)
  const saved = await browser.storage.session.get(key)
  if (
    saved[key] !== undefined &&
    getProtectedSite(details.url, await readSites())?.domain !== saved[key]
  ) {
    await browser.storage.session.remove(key)
    await syncRequestRules()
  }
}
browser.webNavigation.onCommitted.addListener((details) =>
  enqueue(() => endVisit(details)),
)
browser.webNavigation.onHistoryStateUpdated.addListener((details) =>
  enqueue(() => endVisit(details)),
)
browser.tabs.onRemoved.addListener((tabId) =>
  enqueue(async () => {
    await browser.storage.session.remove(approvalKey(tabId))
    await syncRequestRules()
  }),
)

interface ApprovalMessage {
  type?: unknown
  tabId?: unknown
  target?: unknown
  reason?: unknown
  code?: unknown
}

browser.runtime.onMessage.addListener((message: ApprovalMessage, sender) => {
  if (message?.type === 'get-totp-secret' && sender.id === browser.runtime.id)
    return ensureTotpSecret().then((secret) => ({ secret }))
  if (message?.type !== 'approve-visit') return undefined
  const revision = settingsRevision
  return enqueue(async () => {
    if (
      sender.id !== browser.runtime.id ||
      !sender.url ||
      !isVisitPage(sender.url, checkPage) ||
      typeof message.tabId !== 'number' ||
      !Number.isInteger(message.tabId) ||
      message.tabId < 0 ||
      (sender.tab !== undefined && sender.tab.id !== message.tabId) ||
      (sender.frameId !== undefined && sender.frameId !== 0) ||
      typeof message.target !== 'string' ||
      typeof message.reason !== 'string'
    )
      return { ok: false }

    if (
      (await readVisitQuestionEnabled()) &&
      countWords(message.reason) < minimumWords
    )
      return { ok: false }

    const site = getProtectedSite(message.target, await readSites())
    if (!site) return { ok: false }
    const verification = await readVerification()
    const result = await verifyCode(verification, message.code, {
      getTotpSecret: ensureTotpSecret,
    })
    if (!result.ok) return result
    const tab = await browser.tabs.get(message.tabId)
    if (
      !tab.url ||
      !isVisitPage(tab.url, checkPage) ||
      readVisitTarget(tab.url) !== message.target
    )
      return { ok: false }

    const key = approvalKey(message.tabId)
    try {
      if (settingsRevision !== revision) return { ok: false }
      await browser.storage.session.set({ [key]: site.domain })
      await syncRequestRules()
      // Installing rules yields to browser events. Do not navigate a tab that
      // has since left the prompt, or approve with superseded settings.
      const currentTab = await browser.tabs.get(message.tabId)
      if (settingsRevision !== revision || currentTab.url !== tab.url)
        throw new Error('Visit changed during approval')
      await browser.tabs.update(message.tabId, { url: message.target })
      return { ok: true }
    } catch {
      await browser.storage.session.remove(key)
      await syncRequestRules()
      return { ok: false }
    }
  }).catch(() => ({ ok: false }))
})

browser.action.onClicked.addListener(() => {
  void browser.runtime.openOptionsPage()
})

browser.runtime.onInstalled.addListener(() => {
  void ensureTotpSecret().catch(console.error)
  return enqueue(resetApprovals)
})
browser.runtime.onStartup.addListener(() => {
  void ensureTotpSecret().catch(console.error)
  return enqueue(resetApprovals)
})

browser.storage.onChanged.addListener((changes, area) => {
  if (
    area === 'local' &&
    (sitesStorageKey in changes ||
      totpStorageKey in changes ||
      verificationStorageKey in changes ||
      visitQuestionStorageKey in changes)
  ) {
    settingsRevision += 1
    return enqueue(resetApprovals)
  }
})
