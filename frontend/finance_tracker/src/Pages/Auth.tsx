import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const Auth = () => {
  return (
    <>
      <SignedOut>
        <div className="auth-page">
          <div className="navbar-wrap">
            <div className="navbar">
              <span className="navbar-brand">
                <span className="navbar-brand-mark">$</span>
                Finance Tracker
              </span>
              <SignUpButton mode="modal">
                <button type="button" className="auth-topbar-cta">Start Tracking Today</button>
              </SignUpButton>
            </div>
          </div>

          <div className="auth-hero">
            <div className="auth-card">
              <div className="auth-card-mark">$</div>
              <h1>Finance Tracker</h1>
              <p>Track spending, spot trends, and stay ahead of overspending — all in one place.</p>

              <SignUpButton mode="modal">
                <button type="button" className="auth-primary-button">Create an account</button>
              </SignUpButton>

              <p className="auth-card-switch">
                Already have an account?{" "}
                <SignInButton mode="modal">
                  <button type="button" className="auth-card-switch-link">Log in</button>
                </SignInButton>
              </p>
            </div>

            <p className="auth-tagline">
              <span className="auth-tagline-quote">
                Financial freedom starts with self-awareness and self-discipline.
              </span>
            </p>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
    </>
  )
}

export default Auth
