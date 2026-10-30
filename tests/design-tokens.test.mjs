import assert from 'node:assert/strict'
import test from 'node:test'
import { Linter } from 'eslint'
import {
  checkStyles,
  checkTokenDefinitions,
} from '../scripts/check-design-tokens.mjs'
import { designTokenRules } from '../scripts/design-token-rules.mjs'

test('semantic tokens support shared references and composite borders', () => {
  assert.deepEqual(
    checkTokenDefinitions({
      'palette-black': '#000000',
      'color-text': 'var(--palette-black)',
      'border-width-thin': '1px',
      'border-control': 'var(--border-width-thin) solid var(--color-text)',
    }),
    [],
  )
})

test('token references reject missing values and cycles', () => {
  for (const definitions of [
    { a: 'var(--missing)' },
    { a: 'var(--a)' },
    { a: 'var(--b)', b: 'var(--c)', c: 'var(--a)' },
  ]) {
    assert.ok(checkTokenDefinitions(definitions).length)
  }
})

test('CSS rejects values outside the palette and typography scale', () => {
  for (const declaration of [
    'color: #123456;',
    'background: red;',
    'background: rgb(1, 2, 3);',
    'font-size: 17px;',
    'font-weight: 550;',
    'font-family: Arial;',
    'border: 2px solid var(--palette-black);',
    'stroke-width: 1.7;',
    'color: var(--unknown-color);',
    'color: rebeccapurple;',
  ]) {
    assert.ok(
      checkStyles('.example { ' + declaration + ' }').length,
      declaration,
    )
  }
})

test('CSS accepts palette tokens, inherited typography and token-based dimensions', () => {
  assert.deepEqual(
    checkStyles(
      '.example { color: var(--palette-black); font-size: var(--font-size-small); font: inherit; border: var(--border-width-thin) solid var(--palette-gray-300); margin: calc(-1 * var(--space-24)) 0; }',
    ),
    [],
  )
})

const linter = new Linter()
const config = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  plugins: { 'design-tokens': designTokenRules },
  rules: { 'design-tokens/no-literal-design-values': 'error' },
}

test('ESLint rejects raw CSS colors, inline typography and SVG stroke widths', () => {
  for (const source of [
    'const value = "#123456";',
    'const value = "rgba(1, 2, 3, 0.5)";',
    'const style = { fontWeight: 500 };',
    'const view = <svg fill="red" strokeWidth="1.5" />;',
    'context.font = "16px Arial";',
    'context.fillStyle = "red";',
  ]) {
    assert.ok(linter.verify(source, config).length, source)
  }
})

test('ESLint allows tokens in canvas, styles and SVGs', () => {
  const source =
    'const style = { fontWeight: tokens["font-weight-bold"] }; context.fillStyle = tokens["palette-blue-500"]; const view = <svg fill="none" stroke="currentColor" strokeWidth={tokens["stroke-width-icon"]} />;'
  assert.deepEqual(linter.verify(source, config), [])
})
