import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FinancialRecordList, { RecordRow } from "./Financial-Record-List"
import { financialRecordContext } from "../context/financialRecordContext"
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

describe("FinancialRecordList category filter", () => {
    const records = [
        {
            id: "1",
            userId: "user-1",
            date: new Date(2024, 0, 15),
            description: "Groceries",
            amount: 45.5,
            category: "Food",
            paymentMethod: "Cash",
        },
        {
            id: "2",
            userId: "user-1",
            date: new Date(2024, 0, 14),
            description: "Monthly rent",
            amount: 900,
            category: "Rent",
            paymentMethod: "Card",
        },
        {
            id: "3",
            userId: "user-1",
            date: new Date(2024, 0, 13),
            description: "Lunch",
            amount: 12.4,
            category: "Food",
            paymentMethod: "Cash",
        },
    ]

    // FinancialRecordList reads its records from financialRecordContext and its
    // money formatting from currencyContext, so both have to be provided here.
    // The context value is supplied directly rather than through
    // FinancialRecordsProvider, which would try to fetch from the API.
    const renderList = (listRecords: typeof records) => {
        const contextValue = {
            record: listRecords,
            isLoading: false,
            addRecord: jest.fn(),
            updateRecord: jest.fn(),
            deleteRecord: jest.fn(),
        }

        return render(
            <CurrencyProvider>
                <financialRecordContext.Provider value={contextValue}>
                    <FinancialRecordList />
                </financialRecordContext.Provider>
            </CurrencyProvider>
        )
    }

    it("shows every record while the filter is set to All", () => {
        renderList(records)

        expect(screen.getByText("Groceries")).toBeInTheDocument()
        expect(screen.getByText("Monthly rent")).toBeInTheDocument()
        expect(screen.getByText("Lunch")).toBeInTheDocument()
    })

    it("shows only the records in the chosen category", async () => {
        renderList(records)

        await userEvent.selectOptions(screen.getByLabelText("Category"), "Food")

        expect(screen.getByText("Groceries")).toBeInTheDocument()
        expect(screen.getByText("Lunch")).toBeInTheDocument()
        expect(screen.queryByText("Monthly rent")).not.toBeInTheDocument()
    })

    it("explains an empty table when the filter matches no records", async () => {
        renderList(records)

        await userEvent.selectOptions(screen.getByLabelText("Category"), "Utilities")

        expect(screen.getByText("No records in this category.")).toBeInTheDocument()
        expect(screen.queryByText("Groceries")).not.toBeInTheDocument()
    })

    // The two empty states share one box, so this guards against the filtered
    // wording leaking into the case where the user simply has no records yet.
    it("keeps the first-run wording when there are no records at all", () => {
        renderList([])

        expect(
            screen.getByText("No records yet — add your first one above.")
        ).toBeInTheDocument()
        expect(screen.queryByText("No records in this category.")).not.toBeInTheDocument()
    })
})
