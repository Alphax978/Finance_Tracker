import { render, screen } from "@testing-library/react"
import { RecordRow } from "./Financial-Record-List"
import { CurrencyProvider } from "../context/currencyContext"

jest.mock("../utils/api", () => ({
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}))

describe("RecordRow", () => {
    const mockRecord = {
        id: "1",
        userId: "user-1",
        date: new Date("2024-01-15"),
        description: "I want to get as far away from here as I can",
        amount: 42.5,
        category: "Food",
        paymentMethod: "Cash",
    }

    it("shows a truncated description in the table cell", () => {
        render(
            <CurrencyProvider>
                <table>
                    <tbody>
                        <RecordRow record={mockRecord} onUpdate={jest.fn()} onDelete={jest.fn()} />
                    </tbody>
                </table>
            </CurrencyProvider>
        )

        expect(screen.getByText("I want to get as far away ...")).toBeInTheDocument()
    })

    it("keeps the full description available via the title attribute", () => {
        render(
            <CurrencyProvider>
                <table>
                    <tbody>
                        <RecordRow record={mockRecord} onUpdate={jest.fn()} onDelete={jest.fn()} />
                    </tbody>
                </table>
            </CurrencyProvider>
        )

        expect(screen.getByTitle(mockRecord.description)).toBeInTheDocument()
    })
})
