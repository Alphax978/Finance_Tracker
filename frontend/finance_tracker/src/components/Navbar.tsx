import { NavLink } from 'react-router-dom'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import CurrencySelect from './CurrencySelect'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar-link ${isActive ? 'is-active' : ''}`

const highlightedLinkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar-link navbar-link-focus ${isActive ? 'is-active' : ''}`

const Navbar = () => {
  return (
    <div className="navbar-wrap">
      <div className="navbar">
        <NavLink to="/" end className="navbar-brand">
          <span className="navbar-brand-mark">$</span>
          Finance Tracker
        </NavLink>
        <div className="navbar-actions">
          <SignedIn>
            <NavLink to="/" end className={navLinkClass} aria-label="Dashboard">
              <svg className="navbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11.5 12 4l8 7.5" />
                <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
              </svg>
              <span className="navbar-link-text">Dashboard</span>
            </NavLink>
            <NavLink to="/insights" className={navLinkClass} aria-label="My Insights">
              <svg className="navbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="20" x2="6" y2="12" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="18" y1="20" x2="18" y2="15" />
              </svg>
              <span className="navbar-link-text">My Insights</span>
            </NavLink>
            <NavLink to="/save-more" className={navLinkClass} aria-label="Save More">
              <svg className="navbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span className="navbar-link-text">Focus Mode: Save More</span>
            </NavLink>
            <NavLink to="/automation" className={highlightedLinkClass} aria-label="Automation">
              <svg className="navbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.2A8.5 8.5 0 1 1 21 11.5z" />
              </svg>
              <span className="navbar-link-text">Automation</span>
            </NavLink>
            <div className="navbar-currency-group">
              <span className="navbar-currency-label">Currency:</span>
              <CurrencySelect />
            </div>
            <UserButton
              showName
              appearance={{
                elements: {
                  userButtonBox: 'navbar-user-box',
                  userButtonTrigger: 'navbar-user-trigger',
                  userButtonOuterIdentifier: 'navbar-user-name',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </div>
  )
}

export default Navbar
