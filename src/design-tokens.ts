import type tokens from './tokens.json'

export type DesignToken = keyof typeof tokens
export type ColorToken = Extract<
  DesignToken,
  `palette-${string}` | `color-${string}`
>

/** Use CSS references in DOM styles so theme overrides also apply to React. */
export function tokenVar(name: DesignToken): string {
  return `var(--${name})`
}
