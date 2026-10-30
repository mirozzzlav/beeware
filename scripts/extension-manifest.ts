import common from '../manifest.template.json' with { type: 'json' }
import chromium from '../manifest.chromium.json' with { type: 'json' }
import firefox from '../manifest.firefox.json' with { type: 'json' }
import {
  appName,
  appLongName,
  appVersion,
  extensionId,
} from '../src/app-info.ts'

export function createManifest(target: 'chromium' | 'firefox') {
  const metadata = {
    name: appLongName,
    version: appVersion,
    action: { ...common.action, default_title: appName },
  }
  if (target === 'chromium') return { ...common, ...chromium, ...metadata }
  if (target === 'firefox')
    return {
      ...common,
      ...firefox,
      ...metadata,
      browser_specific_settings: {
        ...firefox.browser_specific_settings,
        gecko: { ...firefox.browser_specific_settings.gecko, id: extensionId },
      },
    }
  throw new Error(`Unknown browser target: ${target}`)
}
