import { isExtension, readTotpSecret } from './settings-store.ts'
import { verifyTotp } from './totp.ts'

interface VisitRequest {
  target: string
  reason: string
  code: string
}

interface ApprovalResponse {
  ok?: boolean
  error?: string
}

export async function approveVisit(
  request: VisitRequest,
  preview: boolean,
): Promise<ApprovalResponse> {
  if (preview) {
    return (await verifyTotp(await readTotpSecret(), request.code))
      ? { ok: true }
      : { ok: false, error: 'invalid-totp' }
  }
  const tab = await browser.tabs.getCurrent()
  return browser.runtime.sendMessage({
    type: 'approve-visit',
    tabId: tab?.id,
    ...request,
  })
}

export async function closeVisitTab(): Promise<void> {
  if (isExtension) {
    const tab = await browser.tabs.getCurrent()
    if (tab?.id === undefined) throw new Error('Missing tab')
    await browser.tabs.remove(tab.id)
  } else {
    window.close()
  }
}
