import { useContext, useEffect, useState } from 'react'
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { financialRecordContext } from '../context/financialRecordContext'
import { currencyContext } from '../context/currencyContext'
import Spinner from '../components/Spinner'

interface SavingsGoalData {
  monthlySalary: number
}

interface ProgressData {
  spent: number
  percentSpent: number
}

const GENERAL_TIPS = [
  'Automate your savings: move money the day you get paid, before you have a chance to spend it.',
  'Review recurring subscriptions each month and cancel the ones you no longer use.',
  'Give non-essential purchases a 24-hour wait before buying — impulse spending drops fast.',
  'Track every expense. Awareness alone tends to reduce spending by 10-15%.',
]

const SaveMoreContent = () => {
  const { user } = useUser()

  const recordCtx = useContext(financialRecordContext)
  if (!recordCtx) {
    throw new Error('SaveMore must be used within a FinancialRecordsProvider')
  }
  const { record: records } = recordCtx

  const currencyCtx = useContext(currencyContext)
  if (!currencyCtx) {
    throw new Error('SaveMore must be used within a CurrencyProvider')
  }
  const { formatAmount } = currencyCtx

  const [monthlySalary, setMonthlySalary] = useState('')
  const [goal, setGoal] = useState<SavingsGoalData | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [saving, setSaving] = useState(false)
  const [goalLoading, setGoalLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/savingsgoal/${user.id}`
        )
        if (response.data.goal) {
          setGoal(response.data.goal)
          setMonthlySalary(String(response.data.goal.monthlySalary))
        }
      } catch {
        toast.error('Failed to load your salary')
      } finally {
        setGoalLoading(false)
      }
    }

    load()
  }, [user])

  useEffect(() => {
    if (!user || !goal) return

    const loadProgress = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/savingsgoal/${user.id}/progress`
        )
        if (response.data.goal) {
          setGoal(response.data.goal)
          setProgress({
            spent: response.data.spent,
            percentSpent: response.data.percentSpent,
          })
          const newlyNotified: number[] = response.data.newlyNotified ?? []
          if (newlyNotified.length > 0) {
            const actualPercent = Math.round(response.data.percentSpent)
            toast.warn(`You've spent ${actualPercent}% of this month's salary — we emailed you a heads up.`)
          }
        }
      } catch {
        toast.error('Failed to load your spending progress')
      }
    }

    loadProgress()
    // records is used only to trigger a re-check after spending changes
  }, [user, goal?.monthlySalary, records])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const salary = parseFloat(monthlySalary)
    if (!salary || salary <= 0) {
      toast.error('Enter a monthly salary above 0')
      return
    }

    setSaving(true)
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/savingsgoal/${user.id}`,
        {
          email: user.primaryEmailAddress?.emailAddress ?? '',
          monthlySalary: salary,
          alertsEnabled: true,
        }
      )
      setGoal(response.data.goal)
      toast.success('Alert scheduled')
    } catch {
      toast.error('Failed to schedule your alert')
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()

  const currentMonthRecords = records.filter((r) => {
    const d = new Date(r.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const categoryTotals = new Map<string, number>()
  currentMonthRecords.forEach((r) => {
    categoryTotals.set(r.category, (categoryTotals.get(r.category) ?? 0) + r.amount)
  })
  const topCategoryEntry = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0]

  const percent = progress ? Math.max(0, Math.min(progress.percentSpent, 100)) : 0
  const isPastFirstAlert = (progress?.percentSpent ?? 0) >= 30
  const isOverThreshold = (progress?.percentSpent ?? 0) >= 50

  const personalizedTips: string[] = []
  if (topCategoryEntry) {
    personalizedTips.push(
      `Your biggest expense this month is ${topCategoryEntry[0]} at ${formatAmount(topCategoryEntry[1])}. Trimming even 10% there would meaningfully cut your spending.`
    )
  }
  if (isOverThreshold && goal) {
    const remaining = Math.max(goal.monthlySalary - (progress?.spent ?? 0), 0)
    personalizedTips.push(
      `You've already used ${(progress?.percentSpent ?? 0).toFixed(0)}% of this month's salary — only ${formatAmount(remaining)} left before you're spending more than you earn.`
    )
  }

  return (
    <div className="dahsboard-container alerts-page">
      <h1>Save <span className="page-title-accent">More</span></h1>

      <div className="save-more-layout">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <span className="form-eyebrow">
              <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Your Monthly Salary
            </span>
            <div className="form-field form-field-full">
              <label htmlFor="monthlySalary">Monthly Salary</label>
              <input
                id="monthlySalary"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={monthlySalary}
                required
                onChange={(e) => setMonthlySalary(e.target.value)}
              />
            </div>
            <button type="submit" disabled={saving}>
              {saving ? (<><Spinner inline size="sm" />Scheduling…</>) : 'Schedule Alert'}
            </button>
            <p className="form-note">
              We'll email you if you spend 30% of your monthly salary this month. A second alert follows at 50%.{" "}
              <span className="form-note-highlight">Don't forget to track each and every expense.</span>
            </p>
          </form>
        </div>

        <div className="summary-container">
          <span className="form-eyebrow">
            <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            This Month's Spending
          </span>

          <div className="save-progress-content">
            {goalLoading ? (
              <Spinner label="Loading your spending…" />
            ) : !goal || goal.monthlySalary <= 0 ? (
              <p className="summary-empty-text">Set your monthly salary to start tracking your spending.</p>
            ) : (
              <>
                <div className="save-progress-bar-track">
                  <div
                    className={`save-progress-bar-fill ${isOverThreshold ? 'is-over-threshold' : isPastFirstAlert ? 'is-past-first-alert' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="save-progress-stats">
                  <span>{formatAmount(progress?.spent ?? 0)} spent</span>
                  <span>{(progress?.percentSpent ?? 0).toFixed(0)}% of {formatAmount(goal.monthlySalary)}</span>
                </div>
                {isPastFirstAlert && (
                  <p className="save-progress-notified is-warning">
                    ⚠ You're currently over your {isOverThreshold ? '50%' : '30%'} spending alert.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <span className="form-eyebrow">
          <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
          </svg>
          Tips To Save More
        </span>
        <ul className="save-tips-list">
          {personalizedTips.map((tip, i) => (
            <li key={`p-${i}`} className="save-tip is-personalized">{tip}</li>
          ))}
          {GENERAL_TIPS.map((tip, i) => (
            <li key={`g-${i}`} className="save-tip">{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SaveMore = () => {
  return (
    <>
      <SignedIn>
        <SaveMoreContent />
      </SignedIn>
      <SignedOut>
        <Navigate to="/auth" replace />
      </SignedOut>
    </>
  )
}

export default SaveMore
