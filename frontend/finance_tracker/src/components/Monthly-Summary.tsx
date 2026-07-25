import { useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { financialRecordContext } from '../context/financialRecordContext'
import { currencyContext } from '../context/currencyContext'

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface MonthlyTotal {
  year: number
  month: number
  total: number
}

interface YearlyTotal {
  year: number
  total: number
}

const MonthlySummary = () => {
  const context = useContext(financialRecordContext)
  if (!context) {
    throw new Error('MonthlySummary must be used within a FinancialRecordsProvider')
  }
  const { record: records } = context
  const currency = useContext(currencyContext)
  if (!currency) {
    throw new Error('MonthlySummary must be used within a CurrencyProvider')
  }
  const { formatAmount } = currency
  const { user } = useUser()
  const [monthly, setMonthly] = useState<MonthlyTotal[]>([])
  const [yearly, setYearly] = useState<YearlyTotal[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchSummary = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/financialrecord/summary/${user.id}`
        )
        setMonthly(response.data.monthly)
        setYearly(response.data.yearly)
      } catch {
        setMonthly([])
        setYearly([])
      }
    }

    fetchSummary()
    // records is used only to trigger a re-fetch after add/edit/delete
  }, [user, records])

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // backend uses 1-12

  const currentYearMonths: MonthlyTotal[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const existing = monthly.find((m) => m.year === currentYear && m.month === month)
    return { year: currentYear, month, total: existing?.total ?? 0 }
  })

  const maxTotal = Math.max(...currentYearMonths.map((m) => m.total), 1)

  const currentYearTotal = yearly.find((y) => y.year === currentYear)?.total ?? 0
  const otherYears = yearly.filter((y) => y.year !== currentYear)

  return (
    <div className="summary-container">
      <span className="form-eyebrow">
        <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="6" y1="20" x2="6" y2="12" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="18" y1="20" x2="18" y2="15" />
        </svg>
        Monthly Summary
      </span>
      <div className="summary-chart">
        {currentYearMonths.map((m) => {
          const isCurrent = m.month === currentMonth
          const widthPct = Math.max((m.total / maxTotal) * 100, m.total > 0 ? 4 : 0)
          return (
            <div key={`${m.year}-${m.month}`} className={`summary-bar-row ${isCurrent ? 'is-current' : ''}`}>
              <span className="summary-bar-month">
                {MONTH_ABBR[m.month - 1]}
                {isCurrent && <span className="summary-bar-now">now</span>}
              </span>
              <span className="summary-bar-track">
                <span className="summary-bar-fill" style={{ width: mounted ? `${widthPct}%` : '0%' }} />
              </span>
              <span className="summary-bar-value">{formatAmount(m.total)}</span>
            </div>
          )
        })}
      </div>
      <div className="summary-years">
        <div className="summary-year-total">
          <span>Year total ({currentYear})</span>
          <span>-{formatAmount(currentYearTotal)}</span>
        </div>
        {otherYears.map((y) => (
          <div key={y.year} className="summary-year-total">
            <span>Year total ({y.year})</span>
            <span>-{formatAmount(y.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthlySummary
