import { useContext, useEffect, useState } from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { financialRecordContext } from '../context/financialRecordContext'
import { currencyContext } from '../context/currencyContext'
import { categoryColor } from '../constants/categories'
import { useCountUp } from '../hooks/useCountUp'
import Spinner from '../components/Spinner'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const InsightsContent = () => {
  const recordCtx = useContext(financialRecordContext)
  if (!recordCtx) {
    throw new Error('Insights must be used within a FinancialRecordsProvider')
  }
  const { record: records, isLoading } = recordCtx

  const currencyCtx = useContext(currencyContext)
  if (!currencyCtx) {
    throw new Error('Insights must be used within a CurrencyProvider')
  }
  const { formatAmount } = currencyCtx

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const categoryGroups = new Map<string, { total: number; entries: typeof records }>()
  records.forEach((r) => {
    const group = categoryGroups.get(r.category) ?? { total: 0, entries: [] }
    group.total += r.amount
    group.entries.push(r)
    categoryGroups.set(r.category, group)
  })
  const categories = Array.from(categoryGroups.entries())
    .map(([category, { total, entries }]) => ({
      category,
      total,
      entries: [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
    .sort((a, b) => b.total - a.total)
  const maxCategoryTotal = Math.max(...categories.map((c) => c.total), 1)
  const topCategory = categories[0]
  const grandTotal = categories.reduce((sum, c) => sum + c.total, 0)
  const displayGrandTotal = useCountUp(grandTotal)

  interface MonthRow {
    key: string
    year: number
    month: number
    total: number
    topCategory: string
    topCategoryTotal: number
  }

  const monthMap = new Map<string, { total: number; byCategory: Map<string, number>; year: number; month: number }>()
  records.forEach((r) => {
    const d = new Date(r.date)
    const year = d.getFullYear()
    const month = d.getMonth()
    const key = `${year}-${month}`
    const entry = monthMap.get(key) ?? { total: 0, byCategory: new Map<string, number>(), year, month }
    entry.total += r.amount
    entry.byCategory.set(r.category, (entry.byCategory.get(r.category) ?? 0) + r.amount)
    monthMap.set(key, entry)
  })

  const months: MonthRow[] = Array.from(monthMap.entries())
    .map(([key, entry]) => {
      const top = Array.from(entry.byCategory.entries()).sort((a, b) => b[1] - a[1])[0]
      return {
        key,
        year: entry.year,
        month: entry.month,
        total: entry.total,
        topCategory: top[0],
        topCategoryTotal: top[1],
      }
    })
    .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month))

  const topMonth = [...months].sort((a, b) => b.total - a.total)[0]

  return (
    <div className="dahsboard-container">
      <h1>My <span className="page-title-accent">Insights</span></h1>

      {isLoading ? (
        <Spinner label="Loading your insights…" size="lg" />
      ) : records.length === 0 ? (
        <div className="record-list-empty">
          <svg className="record-list-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="12" x2="15" y2="12" />
          </svg>
          <span>No records yet — add some on the Dashboard to see your insights.</span>
        </div>
      ) : (
        <>
          <div className="hero-stat">
            <span className="hero-stat-label">Total Spent</span>
            <span className="hero-stat-value">-{formatAmount(displayGrandTotal)}</span>
          </div>

          <div className="insights-composition-wrap">
            <div className="insights-composition">
              {categories.map((c) => (
                <span
                  key={c.category}
                  className="insights-composition-segment"
                  style={{
                    width: mounted ? `${(c.total / grandTotal) * 100}%` : '0%',
                    backgroundColor: categoryColor(c.category),
                  }}
                />
              ))}
            </div>
            <div className="insights-legend">
              {categories.map((c) => (
                <span key={c.category} className="insights-legend-item">
                  <span className="insights-legend-dot" style={{ backgroundColor: categoryColor(c.category) }} />
                  {c.category} · {((c.total / grandTotal) * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>

          <div className="analysis-headline-row">
            <div className="analysis-headline-card">
              <svg className="analysis-headline-icon" viewBox="0 0 24 24" fill="none" stroke={categoryColor(topCategory.category)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
                <path d="M17 5h2.5A2.5 2.5 0 0 1 17 9M7 5H4.5A2.5 2.5 0 0 0 7 9" />
              </svg>
              <span className="analysis-headline-label">Highest Spending Category</span>
              <span className="analysis-headline-value" style={{ color: categoryColor(topCategory.category) }}>
                {topCategory.category}
              </span>
              <span className="analysis-headline-sub">-{formatAmount(topCategory.total)}</span>
            </div>
            {topMonth && (
              <div className="analysis-headline-card">
                <svg className="analysis-headline-icon" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="8" y1="3" x2="8" y2="7" />
                  <line x1="16" y1="3" x2="16" y2="7" />
                </svg>
                <span className="analysis-headline-label">Highest Spending Month</span>
                <span className="analysis-headline-value">
                  {MONTH_NAMES[topMonth.month]} {topMonth.year}
                </span>
                <span className="analysis-headline-sub">-{formatAmount(topMonth.total)}</span>
              </div>
            )}
          </div>

          <div className="analysis-category-cards">
            {categories.map((c) => (
              <div
                key={c.category}
                className="analysis-category-card"
                style={{
                  borderTopColor: categoryColor(c.category),
                  background: `linear-gradient(180deg, ${categoryColor(c.category)}0d, rgba(255,255,255,0.9) 56px)`,
                }}
              >
                <div className="analysis-category-card-header">
                  <span className="analysis-category-card-dot" style={{ backgroundColor: categoryColor(c.category) }} />
                  <span className="analysis-category-card-name">
                    {c.category}
                    <span className="analysis-category-card-count">{c.entries.length}</span>
                  </span>
                  <span className="analysis-category-card-value">-{formatAmount(c.total)}</span>
                </div>
                <ul className="analysis-category-card-entries">
                  {c.entries.map((entry) => (
                    <li key={entry.id} className="analysis-category-card-entry">
                      <span className="analysis-category-card-entry-desc">{entry.description}</span>
                      <span className="analysis-category-card-entry-amount">-{formatAmount(entry.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="analysis-section" style={{ animationDelay: '0.32s' }}>
            <span className="form-eyebrow">
              <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="20" x2="6" y2="12" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="18" y1="20" x2="18" y2="15" />
              </svg>
              Total Spending By Category
            </span>
            <div className="analysis-category-list">
              {categories.map((c) => (
                <div key={c.category} className="analysis-category-row">
                  <span className="analysis-category-name">{c.category}</span>
                  <span className="analysis-category-track">
                    <span
                      className="analysis-category-fill"
                      style={{
                        width: mounted ? `${(c.total / maxCategoryTotal) * 100}%` : '0%',
                        backgroundColor: categoryColor(c.category),
                      }}
                    />
                  </span>
                  <span className="analysis-category-value">-{formatAmount(c.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-section" style={{ animationDelay: '0.4s' }}>
            <span className="form-eyebrow">
              <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </svg>
              Monthly Breakdown
            </span>
            <div className="analysis-monthly-table-wrap">
              <table className="analysis-monthly-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Spent</th>
                    <th>Highest Category</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.key}>
                      <td>{MONTH_NAMES[m.month]} {m.year}</td>
                      <td className="record-cell-amount">-{formatAmount(m.total)}</td>
                      <td>
                        <span className="category-tag">
                          <span className="category-dot" style={{ backgroundColor: categoryColor(m.topCategory) }} />
                          {m.topCategory} (-{formatAmount(m.topCategoryTotal)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const Insights = () => {
  return (
    <>
      <SignedIn>
        <InsightsContent />
      </SignedIn>
      <SignedOut>
        <Navigate to="/auth" replace />
      </SignedOut>
    </>
  )
}

export default Insights
