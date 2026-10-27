import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const tokens = JSON.parse(
  readFileSync(path.join(root, 'src/tokens.json'), 'utf8'),
)
const typography =
  /^(?:font|font-size|font-family|font-weight|line-height|letter-spacing)$/
const colorLiteral =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(|\b(?:white|black|red|blue|green|transparent)\b/i
const dimensionLiteral = /-?\d*\.?\d+(?:px|rem|em|vw|vh|svh)\b/
const colorProperty =
  /^(?:color|background-color|fill|stroke|border(?:-(?:top|right|bottom|left))?-color|outline-color|caret-color|accent-color)$/
const inheritedColor = /^(?:inherit|initial|unset|none|currentColor)$/

export function checkStyles(source) {
  const failures = []
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of css.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
    if (!(match[1] in tokens)) failures.push('Unknown token --' + match[1])
  }
  for (const [, property, value] of css.matchAll(
    /([a-z-]+)\s*:\s*([^;{}]+);/g,
  )) {
    const literal = value.replace(/var\(--[a-z0-9-]+\)/g, '').trim()
    if (
      colorProperty.test(property) &&
      literal &&
      !inheritedColor.test(literal)
    ) {
      failures.push(property + ' must use a palette token or inherit')
    }
    if (colorLiteral.test(literal))
      failures.push(property + ' contains a literal color: ' + value)
    if (dimensionLiteral.test(literal))
      failures.push(property + ' contains a literal dimension: ' + value)
    if (
      typography.test(property) &&
      !/^(?:var\(--[a-z0-9-]+\)|inherit)$/.test(value.trim())
    ) {
      failures.push(property + ' must use a token or inherit')
    }
    if (
      /^(?:stroke-width|border(?:-(?:top|right|bottom|left))?-width)$/.test(
        property,
      ) &&
      literal &&
      literal !== '0'
    ) {
      failures.push(property + ' must use a token')
    }
  }
  return failures
}

function scan(directory) {
  const failures = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) failures.push(...scan(file))
    else if (entry.name.endsWith('.css')) {
      for (const message of checkStyles(readFileSync(file, 'utf8'))) {
        failures.push(path.relative(root, file) + ': ' + message)
      }
    }
  }
  return failures
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const failures = scan(path.join(root, 'src'))
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  } else {
    console.log(
      'Design tokens: CSS uses declared tokens for typography, colors and dimensions.',
    )
  }
}
