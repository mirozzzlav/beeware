import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'

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
  const [active, setActive] = useState(items[0]?.id)

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
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
    setActive(items[next].id)
    document.getElementById(`${prefix}-tab-${items[next].id}`)?.focus()
  }

  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            id={`${prefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`${prefix}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            disabled={disabled}
            onClick={() => setActive(item.id)}
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
