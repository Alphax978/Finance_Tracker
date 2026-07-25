import { useContext, useEffect, useState } from "react"
import {useUser, SignedIn, SignedOut} from "@clerk/clerk-react"
import { Navigate } from "react-router-dom"
import api from "../utils/api"
import { toast } from "../utils/toastStore"
import FinancialRecordForm from '../components/Financial-Record-Form'
import FinancialRecordList from '../components/Financial-Record-List'
import MonthlySummary from '../components/Monthly-Summary'
import OnboardingSalaryModal from '../components/OnboardingSalaryModal'
import { financialRecordContext } from '../context/financialRecordContext'
import { currencyContext } from '../context/currencyContext'
import { useCountUp } from '../hooks/useCountUp'

interface SavingsGoalData {
  monthlySalary: number
}

interface ProgressData {
  spent: number
  percentSpent: number
}

const DashboardContent = () => {
  const {user} = useUser()

  const recordCtx = useContext(financialRecordContext)
  if (!recordCtx) {
    throw new Error('Dashboard must be used within a FinancialRecordsProvider')
  }
  const { record: records } = recordCtx

  const currencyCtx = useContext(currencyContext)
  if (!currencyCtx) {
    throw new Error('Dashboard must be used within a CurrencyProvider')
  }
  const { formatAmount } = currencyCtx

  const [goal, setGoal] = useState<SavingsGoalData | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!user) return
    const email = user.primaryEmailAddress?.emailAddress
    if (!email) return

    // SavingsGoal only exists for users who've set up a salary, so this is
    // the one place every signed-in user's email is guaranteed to get
    // recorded — needed for the monthly digest to actually reach everyone.
    api
      .put(`/api/userprofile/${user.id}`, { email })
      .catch(() => {
        // non-critical — worst case the digest email skips this user this month
      })
  }, [user])

  useEffect(() => {
    if (!user) return

    const loadGoal = async () => {
      try {
        const response = await api.get(`/api/savingsgoal/${user.id}`)
        if (response.data.goal) {
          setGoal(response.data.goal)
        } else {
          setShowOnboarding(true)
        }
      } catch {
        // if this fails, onboarding simply won't show — not worth blocking the dashboard over
      }
    }

    loadGoal()
  }, [user])

  useEffect(() => {
    if (!user || !goal) return

    const loadProgress = async () => {
      try {
        const response = await api.get(`/api/savingsgoal/${user.id}/progress`)
        if (response.data.goal) {
          setProgress({ spent: response.data.spent, percentSpent: response.data.percentSpent })
        }
      } catch {
        // non-critical stat, fail silently
      }
    }

    loadProgress()
    // records is used only to trigger a re-check after spending changes
  }, [user, goal, records])

  const handleOnboardingSubmit = async (monthlySalary: number, alertsEnabled: boolean) => {
    if (!user) return
    try {
      const response = await api.put(`/api/savingsgoal/${user.id}`, {
        email: user.primaryEmailAddress?.emailAddress ?? '',
        monthlySalary,
        alertsEnabled,
      })
      setGoal(response.data.goal)
      setShowOnboarding(false)
      toast.success(
        alertsEnabled
          ? "Salary saved — we'll email you if your spending gets high."
          : 'Salary saved.'
      )
    } catch {
      toast.error('Failed to save your salary')
    }
  }

  const handleOnboardingSkip = async () => {
    setShowOnboarding(false)
    if (!user) return
    try {
      // record that onboarding was dismissed so it doesn't keep reappearing —
      // monthlySalary stays 0, which the rest of the dashboard already treats as "not set"
      const response = await api.put(`/api/savingsgoal/${user.id}`, {
        email: user.primaryEmailAddress?.emailAddress ?? '',
        monthlySalary: 0,
        alertsEnabled: false,
      })
      setGoal(response.data.goal)
    } catch {
      // if this fails, the prompt may just reappear next visit — not worth surfacing an error
    }
  }

  const now = new Date()
  const total = records
    .filter((r) => {
      const d = new Date(r.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, r) => sum + r.amount, 0)

  const displayTotal = useCountUp(total)
  const percent = progress ? Math.max(0, Math.min(progress.percentSpent, 100)) : 0
  const isOverThreshold = (progress?.percentSpent ?? 0) >= 50

  return (
    <div className='dahsboard-container'>
      {" "}
      {showOnboarding && (
        <OnboardingSalaryModal
          onSubmit={handleOnboardingSubmit}
          onSkip={handleOnboardingSkip}
        />
      )}
      <h1>Welcome, <span className="page-title-accent">{user?.firstName}</span></h1>

      <div className="hero-stat">
        <span className="hero-stat-label">Spent This Month</span>
        <span className="hero-stat-value">-{formatAmount(displayTotal)}</span>
        {goal && goal.monthlySalary > 0 && progress && (
          <div className="hero-salary-stat">
            <div className="hero-salary-bar-track">
              <div
                className={`hero-salary-bar-fill ${isOverThreshold ? 'is-over-threshold' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="hero-salary-stat-text">
              You've spent {progress.percentSpent.toFixed(0)}% of your {formatAmount(goal.monthlySalary)} salary this month
            </span>
          </div>
        )}
      </div>

      <div className="top-panels">
        <FinancialRecordForm/>
        <MonthlySummary/>
      </div>
      <FinancialRecordList/>
      <p className="records-note">
        <svg className="records-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        At the end of each month, we'll email you a copy of your full record list — every expense included.
      </p>
      <p className="records-subnote">You're always in control.</p>
    </div>
  )
}

const Dashboard = () => {
  return (
    <>
      <SignedIn>
        <DashboardContent />
      </SignedIn>
      <SignedOut>
        <Navigate to="/auth" replace />
      </SignedOut>
    </>
  )
}

export default Dashboard
