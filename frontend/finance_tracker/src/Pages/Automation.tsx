import { useContext, useEffect, useState } from 'react'
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { financialRecordContext } from '../context/financialRecordContext'

interface SubscriptionData {
  status: string
  currentPeriodEnd: string
}

type Platform = 'telegram' | 'whatsapp' | 'messenger'

interface Integration {
  platform: Platform
  externalId: string
  connectedAt: string
}

const PLATFORM_LABEL: Record<Platform, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
}

const PLATFORM_AVAILABLE: Record<Platform, boolean> = {
  telegram: true,
  whatsapp: false,
  messenger: false,
}

const AutomationContent = () => {
  const { user } = useUser()

  // Reused only so this page throws the same helpful error as the rest of
  // the app if it's ever rendered outside the provider tree.
  const recordCtx = useContext(financialRecordContext)
  if (!recordCtx) {
    throw new Error('Automation must be used within a FinancialRecordsProvider')
  }

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [linkCode, setLinkCode] = useState<{ platform: Platform; code: string; botUsername: string | null } | null>(null)
  const [generatingFor, setGeneratingFor] = useState<Platform | null>(null)

  useEffect(() => {
    if (!user) return

    const loadSubscription = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/subscription/${user.id}`
        )
        setSubscription(response.data.subscription)
        setIsActive(response.data.isActive)
      } catch {
        toast.error('Failed to load subscription status')
      }
    }

    loadSubscription()
  }, [user])

  useEffect(() => {
    if (!user || !isActive) return

    const loadIntegrations = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/automation/${user.id}`
        )
        setIntegrations(response.data.integrations ?? [])
      } catch {
        toast.error('Failed to load connected chats')
      }
    }

    loadIntegrations()
  }, [user, isActive])

  const handleSubscribe = async () => {
    if (!user) return
    setSubscribing(true)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/subscription/${user.id}/checkout`,
        { email: user.primaryEmailAddress?.emailAddress ?? '' }
      )
      window.location.href = response.data.url
    } catch {
      toast.error('Could not start checkout — billing may not be configured yet')
      setSubscribing(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/subscription/${user.id}/portal`
      )
      window.location.href = response.data.url
    } catch {
      toast.error('Could not open the billing portal')
    }
  }

  const handleGenerateCode = async (platform: Platform) => {
    if (!user) return
    setGeneratingFor(platform)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/automation/${user.id}/link-code`,
        { platform }
      )
      setLinkCode({ platform, code: response.data.code, botUsername: response.data.botUsername })
    } catch {
      toast.error('Failed to generate a linking code')
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied')
    } catch {
      toast.error('Could not copy — select and copy it manually')
    }
  }

  const handleDisconnect = async (platform: Platform) => {
    if (!user) return
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/automation/${user.id}/${platform}`
      )
      setIntegrations((prev) => prev.filter((i) => i.platform !== platform))
      toast.success(`${PLATFORM_LABEL[platform]} disconnected`)
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const connectedPlatforms = new Set(integrations.map((i) => i.platform))

  return (
    <div className="dahsboard-container">
      <h1>Chat <span className="page-title-accent">Automation</span></h1>

      {!isActive ? (
        <div className="automation-upsell">
          <span className="form-eyebrow">
            <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.2A8.5 8.5 0 1 1 21 11.5z" />
            </svg>
            Automation
          </span>
          <h2>Add expenses without opening the app</h2>
          <p className="automation-upsell-text">
            Once you're subscribed, adding an expense is just three steps:
          </p>
          <ol className="automation-steps">
            <li>
              <span className="automation-step-num">1</span>
              <span>Connect Telegram, WhatsApp, or Messenger from this page — a one-time setup.</span>
            </li>
            <li>
              <span className="automation-step-num">2</span>
              <span>
                Open a chat with the bot and type your expense as: <strong>description, amount, category, payment method</strong>
                {" "}— category and payment method are optional, and default to Other and Cash if left off.
              </span>
            </li>
            <li>
              <span className="automation-step-num">3</span>
              <span>Press enter — that's it, it's added to your dashboard instantly.</span>
            </li>
          </ol>
          <div className="automation-example">
            <span className="automation-example-label">For example, simply type:</span>
            <span className="automation-example-message">Groceries, 45.50, Food, Cash</span>
            <span className="automation-example-label">…and hit send. Or keep it short:</span>
            <span className="automation-example-message">Groceries, 45.50</span>
          </div>
          <button type="button" className="automation-subscribe-button" onClick={handleSubscribe} disabled={subscribing}>
            {subscribing ? 'Redirecting…' : 'Subscribe — $2/month'}
          </button>
          {subscription && (
            <p className="automation-status-note">
              Subscription status: {subscription.status}. If you just subscribed, this can take a moment to update.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="automation-billing-row">
            <span className="automation-active-badge">✓ Automation active</span>
            <button type="button" className="automation-manage-link" onClick={handleManageBilling}>
              Manage billing
            </button>
          </div>

          <div className="automation-platforms">
            {(Object.keys(PLATFORM_LABEL) as Platform[]).map((platform) => {
              const connected = connectedPlatforms.has(platform)
              return (
                <div key={platform} className="automation-platform-card">
                  <div className="automation-platform-header">
                    <span className="automation-platform-name">{PLATFORM_LABEL[platform]}</span>
                    {!PLATFORM_AVAILABLE[platform] && <span className="automation-platform-pending">Pending Meta approval</span>}
                  </div>

                  {connected ? (
                    <>
                      <p className="automation-platform-status is-connected">Connected</p>
                      <button type="button" className="automation-disconnect-button" onClick={() => handleDisconnect(platform)}>
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="automation-platform-status">Not connected</p>

                      {linkCode?.platform !== platform ? (
                        <button
                          type="button"
                          className="automation-connect-button"
                          onClick={() => handleGenerateCode(platform)}
                          disabled={generatingFor === platform}
                        >
                          {generatingFor === platform ? 'Generating…' : 'Get linking code'}
                        </button>
                      ) : (
                        <div className="automation-link-panel">
                          <div className="automation-link-code-row">
                            <span className="automation-link-code-value">{linkCode.code}</span>
                            <button type="button" className="automation-copy-button" onClick={() => handleCopyCode(linkCode.code)}>
                              Copy
                            </button>
                          </div>

                          <ol className="automation-link-steps">
                            <li>
                              Open {PLATFORM_LABEL[platform]}
                              {platform === 'telegram' && linkCode.botUsername ? (
                                <> and message <strong>@{linkCode.botUsername}</strong></>
                              ) : null}
                            </li>
                            <li>
                              Send: <code className="automation-link-command">connect {linkCode.code}</code>
                            </li>
                            <li>You'll get a ✅ reply once it's connected</li>
                          </ol>

                          {platform === 'telegram' && linkCode.botUsername && (
                            <a
                              className="automation-open-app-button"
                              href={`https://t.me/${linkCode.botUsername}?start=${linkCode.code}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Telegram &amp; connect
                            </a>
                          )}

                          {!PLATFORM_AVAILABLE[platform] && (
                            <p className="automation-link-pending-note">
                              This will start working once {PLATFORM_LABEL[platform]} support goes live.
                            </p>
                          )}

                          <div className="automation-link-footer">
                            <span className="automation-link-expiry">Expires in 15 minutes</span>
                            <button type="button" className="automation-regenerate-link" onClick={() => handleGenerateCode(platform)}>
                              New code
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="analysis-section">
            <span className="form-eyebrow">
              <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Message Format
            </span>
            <p className="automation-format-text">
              Once connected, send a message in this order: <strong>description, amount, category, payment method</strong>
            </p>
            <p className="automation-format-example">Example: Groceries, 45.50, Food, Cash</p>
            <p className="automation-format-text">
              Category and payment method are optional — leave them off and they'll default to <strong>Other</strong> and <strong>Cash</strong>.
              <br />
              Example: <span className="automation-format-example">Groceries, 45.50</span>
            </p>
            <p className="automation-format-lists">
              Categories: Food, Rent, Utilities, Entertainment, Other
              <br />
              Payment methods: Cash, Credit Card, Debit Card, Bank Transfer
            </p>
          </div>
        </>
      )}
    </div>
  )
}

const Automation = () => {
  return (
    <>
      <SignedIn>
        <AutomationContent />
      </SignedIn>
      <SignedOut>
        <Navigate to="/auth" replace />
      </SignedOut>
    </>
  )
}

export default Automation
