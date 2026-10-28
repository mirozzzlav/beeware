import { countWords, getProtectedSite, minimumWords } from './policy.ts'
import {
  ensureTotpSecret,
  readSites,
  sitesStorageKey,
  totpStorageKey,
  readVerification,
  verificationStorageKey,
  readVisitQuestionEnabled,
  visitQuestionStorageKey,
} from './settings-store.ts'
import { verifyCode } from './verification.ts'

const approvalKey = (tabId: number) => `approved-domain:${tabId}`
const checkPage = browser.runtime.getURL('index.html')

browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const site = getProtectedSite(details.url, await readSites())
    if (!site || details.tabId < 0) return {}
    const key = approvalKey(details.tabId)
    const saved = await browser.storage.session.get(key)
    if (saved[key] === site.domain) return {}
    return {
      redirectUrl: `${checkPage}?target=${encodeURIComponent(details.url)}`,
    }
  },
  { urls: ['*://*/*'], types: ['main_frame'] },
  ['blocking'],
)

// Leaving the domain ends the approved visit, including navigation within SPAs.
async function endVisit(details: {
  tabId: number
  frameId: number
  url: string
}) {
  if (
    details.frameId === 0 &&
    !getProtectedSite(details.url, await readSites())
  ) {
    await browser.storage.session.remove(approvalKey(details.tabId))
  }
}
browser.webNavigation.onCommitted.addListener(endVisit)
browser.webNavigation.onHistoryStateUpdated.addListener(endVisit)
browser.tabs.onRemoved.addListener((tabId) => {
  void browser.storage.session.remove(approvalKey(tabId))
})

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
  return (async () => {
    if (
      sender.id !== browser.runtime.id ||
      sender.url?.split('?')[0] !== checkPage ||
      typeof message.tabId !== 'number' ||
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
    const expectedPage = `${checkPage}?target=${encodeURIComponent(message.target)}`
    if (tab.url !== expectedPage) return { ok: false }

    const key = approvalKey(message.tabId)
    await browser.storage.session.set({ [key]: site.domain })
    try {
      await browser.tabs.update(message.tabId, { url: message.target })
      return { ok: true }
    } catch {
      await browser.storage.session.remove(key)
      return { ok: false }
    }
  })()
})

browser.action.onClicked.addListener(() => {
  void browser.runtime.openOptionsPage()
})

browser.runtime.onInstalled.addListener(() => {
  void ensureTotpSecret().catch(console.error)
})
browser.runtime.onStartup.addListener(() => {
  void ensureTotpSecret().catch(console.error)
})

browser.storage.onChanged.addListener((changes, area) => {
  if (
    area === 'local' &&
    (sitesStorageKey in changes ||
      totpStorageKey in changes ||
      verificationStorageKey in changes ||
      visitQuestionStorageKey in changes)
  ) {
    void browser.storage.session.clear()
  }
})
