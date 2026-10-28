import packageInfo from '../package.json' with { type: 'json' }

export const appName = packageInfo.displayName
export const appLongName = packageInfo.longName
export const appSlug = packageInfo.name
export const appVersion = packageInfo.version
export const extensionId = `@${appSlug}.wondercules`
