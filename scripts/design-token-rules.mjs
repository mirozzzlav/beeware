const rawColor = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(/i
const rawFontSize = /\b\d+(?:\.\d+)?(?:px|rem|em)\b/i
const designProperties = new Set([
  'font',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'strokeWidth',
  'fill',
  'stroke',
  'fillStyle',
  'strokeStyle',
])
const inheritedValues = new Set([
  'inherit',
  'initial',
  'unset',
  'none',
  'currentColor',
])

export const designTokenRules = {
  rules: {
    'no-literal-design-values': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          token:
            'Use a shared value from src/tokens.json instead of a literal design value.',
        },
      },
      create(context) {
        function checkText(node, value) {
          if (rawColor.test(value) || rawFontSize.test(value)) {
            context.report({ node, messageId: 'token' })
          }
        }
        return {
          Literal(node) {
            if (typeof node.value === 'string') checkText(node, node.value)
          },
          TemplateElement(node) {
            checkText(node, node.value.raw)
          },
          Property(node) {
            const key = node.key.name ?? node.key.value
            if (
              designProperties.has(key) &&
              node.value.type === 'Literal' &&
              !inheritedValues.has(node.value.value) &&
              node.value.value !== 0
            ) {
              context.report({ node: node.value, messageId: 'token' })
            }
          },
          AssignmentExpression(node) {
            if (node.left.type !== 'MemberExpression') return
            const key = node.left.property.name ?? node.left.property.value
            if (
              designProperties.has(key) &&
              node.right.type === 'Literal' &&
              !inheritedValues.has(node.right.value) &&
              node.right.value !== 0
            ) {
              context.report({ node: node.right, messageId: 'token' })
            }
          },
          JSXAttribute(node) {
            const key = node.name.name
            const name = node.parent.name
            const nativeElement =
              name.type === 'JSXIdentifier' && /^[a-z]/.test(name.name)
            if (!nativeElement || !designProperties.has(key) || !node.value)
              return
            const value =
              node.value.type === 'JSXExpressionContainer'
                ? node.value.expression
                : node.value
            if (
              value.type === 'Literal' &&
              !inheritedValues.has(value.value) &&
              value.value !== 0
            ) {
              context.report({ node: value, messageId: 'token' })
            }
          },
        }
      },
    },
  },
}
