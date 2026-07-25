import { createContext, useEffect, useState, type ReactNode } from "react"

const currencyDisplayNames = new Intl.DisplayNames(["en"], { type: "currency" })

export const CURRENCIES = Intl.supportedValuesOf("currency")
    .map((code) => ({ code, label: currencyDisplayNames.of(code) ?? code }))
    .sort((a, b) => a.code.localeCompare(b.code))

export type CurrencyCode = string

interface CurrencyContextType {
    currency: CurrencyCode
    setCurrency: (currency: CurrencyCode) => void
    formatAmount: (amount: number) => string
}

const STORAGE_KEY = "financeTracker.currency"

const isCurrencyCode = (value: string | null): value is CurrencyCode =>
    !!value && CURRENCIES.some((c) => c.code === value)

export const currencyContext = createContext<CurrencyContextType | undefined>(undefined)

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrency] = useState<CurrencyCode>(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return isCurrencyCode(stored) ? stored : "USD"
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, currency)
    }, [currency])

    const formatAmount = (amount: number) =>
        amount.toLocaleString("en-US", { style: "currency", currency })

    return (
        <currencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
            {children}
        </currencyContext.Provider>
    )
}
