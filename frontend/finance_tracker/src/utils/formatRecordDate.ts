// Month names are listed here instead of using toLocaleDateString() because
// that formats differently depending on the browser's language settings.
// It also avoids the 01/02/2024 problem, where some countries read that as
// 1 February and others as 2 January. "1 Feb 2024" means the same thing
// to everyone.
const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Returns the time (in milliseconds) of midnight on the day this date falls on.
// We compare midnights rather than the dates themselves so that any two times
// on the same calendar day count as the same day. Without this, 11pm Monday
// and 1am Tuesday are only two hours apart and would wrongly look like "Today".
function getStartOfDay(date: Date): number {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return startOfDay.getTime()
}

// Formats a date as "15 Jan 2024".
function formatFullDate(date: Date): string {
    const day = date.getDate()
    // getMonth() returns 0 for January through 11 for December, which lines
    // up with the positions in MONTH_NAMES above.
    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
}

// Builds the short "Today" / "3 days ago" note that goes in brackets after
// the date. The count has no upper limit, so an old record still reports the
// exact number of days.
function getRelativeLabel(recordDate: Date, now: Date): string {
    const millisecondsPerDay = 24 * 60 * 60 * 1000

    // Math.round, not Math.floor: clocks shift by an hour twice a year for
    // daylight saving, so two midnights can be 23 or 25 hours apart. That
    // gives 0.96 or 1.04 days, and rounding turns both into the right number.
    const daysApart = Math.round(
        (getStartOfDay(now) - getStartOfDay(recordDate)) / millisecondsPerDay
    )

    if (daysApart === 0) {
        return 'Today'
    }

    if (daysApart === 1) {
        return 'Yesterday'
    }

    if (daysApart >= 2) {
        return `${daysApart} days ago`
    }

    // Only a date in the future gets this far, where daysApart is negative.
    // Records shouldn't be dated ahead, but if one ever is we show the date
    // on its own rather than something like "-3 days ago".
    return ''
}

// Shows when a record was added, for example "15 Jan 2024 (3 days ago)".
export function formatRecordDate(date: Date | string, now: Date = new Date()): string {
    // Records arrive from the API as JSON, and JSON has no date type, so
    // record.date is really a string at runtime even though our type says Date.
    // Passing either one to new Date() gives us a real Date to work with.
    const recordDate = new Date(date)

    const fullDate = formatFullDate(recordDate)
    const relativeLabel = getRelativeLabel(recordDate, now)

    if (relativeLabel === '') {
        return fullDate
    }

    return `${fullDate} (${relativeLabel})`
}
