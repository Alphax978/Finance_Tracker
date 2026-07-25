import { useContext, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { currencyContext, CURRENCIES } from '../context/currencyContext'

const CurrencySelect = () => {
  const context = useContext(currencyContext)
  if (!context) {
    throw new Error('CurrencySelect must be used within a CurrencyProvider')
  }
  const { currency, setCurrency } = context

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = CURRENCIES.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
  })

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const openDropdown = () => {
    setQuery('')
    setHighlighted(0)
    setOpen(true)
  }

  const selectCurrency = (code: string) => {
    setCurrency(code)
    setOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const match = filtered[highlighted]
      if (match) selectCurrency(match.code)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="currency-select" ref={containerRef}>
      <button
        type="button"
        className="currency-select-trigger"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currency}
      </button>
      {open && (
        <div className="currency-select-panel">
          <input
            ref={inputRef}
            type="text"
            className="currency-select-search"
            placeholder="Search currency…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlighted(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <ul className="currency-select-list" role="listbox">
            {filtered.length === 0 ? (
              <li className="currency-select-empty">No matches</li>
            ) : (
              filtered.map((c, i) => (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={c.code === currency}
                  className={[
                    'currency-select-option',
                    i === highlighted ? 'is-highlighted' : '',
                    c.code === currency ? 'is-selected' : '',
                  ].join(' ').trim()}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => selectCurrency(c.code)}
                >
                  <span className="currency-select-code">{c.code}</span>
                  <span className="currency-select-label">{c.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CurrencySelect
