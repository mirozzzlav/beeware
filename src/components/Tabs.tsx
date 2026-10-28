import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

export default function Tabs({
  items,
  label,
  disabled = false,
}: {
  items: Tab[]
  label: string
  disabled?: boolean
}) {
  const prefix = useId()
  const [selected, setSelected] = useState(items[0]?.id)
  const active = items.some((item) => item.id === selected)
    ? selected
    : items[0]?.id
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (disabled) return
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % items.length
        break
      case 'ArrowLeft':
        next = (index - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    setSelected(items[next].id)
    tabRefs.current.get(items[next].id)?.focus()
  }

  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              if (node) tabRefs.current.set(item.id, node)
              else tabRefs.current.delete(item.id)
            }}
            id={`${prefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`${prefix}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            disabled={disabled}
            onClick={() => setSelected(item.id)}
            onKeyDown={(event) => moveFocus(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <section
          key={item.id}
          id={`${prefix}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${prefix}-tab-${item.id}`}
          hidden={active !== item.id}
          tabIndex={0}
        >
          {item.content}
        </section>
      ))}
    </div>
  )
}
