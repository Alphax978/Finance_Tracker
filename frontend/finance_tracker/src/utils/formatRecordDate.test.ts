import { formatRecordDate } from "./formatRecordDate"

describe("formatRecordDate", () => {
    // A fixed "current time" so every run gives the same result. Building
    // dates with new Date(year, monthIndex, day, ...) creates them in the
    // local timezone, which is what formatRecordDate compares against. A
    // string like "2024-01-15" would be read as UTC and could land on the
    // previous day in some timezones.
    // Note that monthIndex is zero-based, so 0 means January.
    const now = new Date(2024, 0, 15, 12, 0)

    it("adds Today for a record added earlier the same day", () => {
        expect(formatRecordDate(new Date(2024, 0, 15, 9, 0), now))
            .toBe("15 Jan 2024 (Today)")
    })

    it("adds Yesterday for the day before", () => {
        expect(formatRecordDate(new Date(2024, 0, 14, 9, 0), now))
            .toBe("14 Jan 2024 (Yesterday)")
    })

    it("counts the days for a record from earlier in the week", () => {
        expect(formatRecordDate(new Date(2024, 0, 12, 9, 0), now))
            .toBe("12 Jan 2024 (3 days ago)")
    })

    // The count has no cutoff, so a record from a week, a month or a year
    // back still reports its exact age.
    it("keeps counting past a week", () => {
        expect(formatRecordDate(new Date(2024, 0, 8, 9, 0), now))
            .toBe("8 Jan 2024 (7 days ago)")
    })

    it("keeps counting past a month", () => {
        expect(formatRecordDate(new Date(2023, 11, 16, 9, 0), now))
            .toBe("16 Dec 2023 (30 days ago)")
    })

    it("keeps counting past a year", () => {
        expect(formatRecordDate(new Date(2023, 0, 15, 9, 0), now))
            .toBe("15 Jan 2023 (365 days ago)")
    })

    // This is the case getStartOfDay exists for. These two times are only two
    // hours apart, so comparing them by elapsed time would say "Today" — but
    // they fall on different calendar days, so the answer is "Yesterday".
    it("says Yesterday for late last night, not Today", () => {
        const lateLastNight = new Date(2024, 0, 14, 23, 0)
        const earlyThisMorning = new Date(2024, 0, 15, 1, 0)

        expect(formatRecordDate(lateLastNight, earlyThisMorning))
            .toBe("14 Jan 2024 (Yesterday)")
    })

    it("adds no note to a future date instead of a negative count", () => {
        expect(formatRecordDate(new Date(2024, 0, 20, 9, 0), now))
            .toBe("20 Jan 2024")
    })

    it("writes single-digit days without a leading zero", () => {
        expect(formatRecordDate(new Date(2024, 0, 5, 9, 0), now))
            .toBe("5 Jan 2024 (10 days ago)")
    })

    it("uses the right name for the last month of the year", () => {
        expect(formatRecordDate(new Date(2023, 11, 25, 9, 0), now))
            .toBe("25 Dec 2023 (21 days ago)")
    })

    // Records come back from the API as JSON, so date is a string at runtime.
    it("accepts a date string as well as a Date object", () => {
        expect(formatRecordDate("2024-01-14T09:00:00", now))
            .toBe("14 Jan 2024 (Yesterday)")
    })
})
