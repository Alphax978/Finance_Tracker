import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import ToastStack from './components/ToastStack.tsx'
import AuthTokenRegistrar from './components/AuthTokenRegistrar.tsx'
import { FinancialRecordsProvider } from './context/financialRecordContext.tsx'
import { CurrencyProvider } from './context/currencyContext.tsx'

const publishedKey: string = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishedKey){
  throw new Error("missing publishable key")
}

createRoot(document.getElementById('root')!).render(
   <StrictMode>
    <ClerkProvider publishableKey={publishedKey}>
      <AuthTokenRegistrar />
      <CurrencyProvider>
        <FinancialRecordsProvider>
          <App />
          <ToastStack />
        </FinancialRecordsProvider>
      </CurrencyProvider>
    </ClerkProvider>
  </StrictMode>,
)
