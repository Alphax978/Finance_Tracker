import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface OnboardingSalaryModalProps {
  onSubmit: (monthlySalary: number, alertsEnabled: boolean) => Promise<void>
  onSkip: () => void
}

const OnboardingSalaryModal = ({ onSubmit, onSkip }: OnboardingSalaryModalProps) => {
  const [monthlySalary, setMonthlySalary] = useState('')
  const [wantsAlert, setWantsAlert] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSkip])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const salary = parseFloat(monthlySalary)
    if (!salary || salary <= 0 || wantsAlert === null) return

    setSubmitting(true)
    try {
      await onSubmit(salary, wantsAlert)
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="onboarding-backdrop" onClick={onSkip}>
      <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="onboarding-close" aria-label="Skip for now" onClick={onSkip}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <span className="form-eyebrow">
          <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Welcome
        </span>
        <h2>What's your monthly salary?</h2>
        <p className="onboarding-modal-text">
          Kept private and used only for your own tracking, never shared with anyone. It lets us show what share you've spent each month, and you can turn on alerts below for a heads-up before you overspend.{" "}
          <span className="onboarding-modal-highlight">Don't forget to track each and every expense.</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="onboarding-salary">Monthly Salary</label>
            <input
              id="onboarding-salary"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="onboarding-alert-choice">
            <span className="onboarding-alert-question">Email you when spending gets high?</span>
            <div className="onboarding-alert-options">
              <button
                type="button"
                className={`onboarding-alert-option ${wantsAlert === true ? 'is-selected' : ''}`}
                onClick={() => setWantsAlert(true)}
              >
                Yes, alert me
              </button>
              <button
                type="button"
                className={`onboarding-alert-option ${wantsAlert === false ? 'is-selected' : ''}`}
                onClick={() => setWantsAlert(false)}
              >
                No thanks
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting || wantsAlert === null}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </form>

        <button type="button" className="onboarding-skip" onClick={onSkip}>
          Skip for now
        </button>
      </div>
    </div>,
    document.body
  )
}

export default OnboardingSalaryModal
