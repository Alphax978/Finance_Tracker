interface SpendingAlertParams {
    percent: number
    spent: number
    salary: number
    accentColor: string
    message: string
}

interface DigestRecord {
    date: Date
    description: string
    category: string
    paymentMethod: string
    amount: number
}

interface MonthlyDigestParams {
    monthLabel: string
    total: number
    records: DigestRecord[]
}

const formatNumber = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Unlike spendingAlertEmail (which only ever interpolates numbers), this
// template embeds raw user-typed description/category text into HTML —
// those come straight from the chat bots and financial record form and
// must be escaped before going into the email markup.
const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

export const spendingAlertEmail = ({ percent, spent, salary, accentColor, message }: SpendingAlertParams) => {
    const appUrl = process.env.FRONTEND_URL || "http://localhost:5173"

    return `
<div style="background-color:#f5f7fc; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 32px rgba(37,99,235,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5,#2563eb); padding:20px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px; height:32px; background:rgba(255,255,255,0.18); border-radius:8px; text-align:center; vertical-align:middle; font-weight:700; color:#ffffff; font-size:16px;">$</td>
            <td style="padding-left:10px; color:#ffffff; font-weight:700; font-size:16px;">Finance Tracker</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 8px;">
        <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${accentColor};">Spending Alert</p>
        <h1 style="margin:8px 0 0; font-size:22px; font-weight:800; color:#0f172a; line-height:1.3;">You've spent ${percent.toFixed(0)}% of this month's salary</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #edeff4; border-radius:12px;">
          <tr>
            <td style="padding:22px 24px; text-align:center;">
              <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8;">Spent this month</p>
              <p style="margin:8px 0 0; font-size:34px; font-weight:800; color:${accentColor};">${formatNumber(spent)}</p>
              <p style="margin:6px 0 0; font-size:13px; color:#64748b;">of ${formatNumber(salary)} salary</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;">
        <p style="margin:0; font-size:14px; line-height:1.6; color:#475569;">${message}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${appUrl}/save-more" style="display:inline-block; background:linear-gradient(135deg,#4f46e5,#2563eb); color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 22px; border-radius:8px;">View Your Spending</a>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px; border-top:1px solid #edeff4; text-align:center;">
        <p style="margin:0; font-size:12px; color:#94a3b8;">You're receiving this because you set up a spending alert in Finance Tracker.</p>
      </td>
    </tr>
  </table>
</div>
`
}

export const monthlyDigestEmail = ({ monthLabel, total, records }: MonthlyDigestParams) => {
    const appUrl = process.env.FRONTEND_URL || "http://localhost:5173"

    const rows = records
        .map(
            (r) => `
          <tr>
            <td style="padding:10px 12px; border-bottom:1px solid #edeff4; font-size:13px; color:#64748b; white-space:nowrap;">${formatDate(r.date)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #edeff4; font-size:13px; color:#0f172a;">${escapeHtml(r.description)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #edeff4; font-size:13px; color:#64748b;">${escapeHtml(r.category)}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #edeff4; font-size:13px; color:#64748b; text-align:right; white-space:nowrap;">${formatNumber(r.amount)}</td>
          </tr>`
        )
        .join("")

    return `
<div style="background-color:#f5f7fc; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 32px rgba(37,99,235,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5,#2563eb); padding:20px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px; height:32px; background:rgba(255,255,255,0.18); border-radius:8px; text-align:center; vertical-align:middle; font-weight:700; color:#ffffff; font-size:16px;">$</td>
            <td style="padding-left:10px; color:#ffffff; font-weight:700; font-size:16px;">Finance Tracker</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 8px;">
        <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#4f46e5;">Monthly Digest</p>
        <h1 style="margin:8px 0 0; font-size:22px; font-weight:800; color:#0f172a; line-height:1.3;">Your ${monthLabel} recap</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #edeff4; border-radius:12px;">
          <tr>
            <td style="padding:22px 24px; text-align:center;">
              <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8;">Total spent in ${monthLabel}</p>
              <p style="margin:8px 0 0; font-size:34px; font-weight:800; color:#2563eb;">${formatNumber(total)}</p>
              <p style="margin:6px 0 0; font-size:13px; color:#64748b;">across ${records.length} record${records.length === 1 ? "" : "s"}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #edeff4; border-radius:12px; overflow:hidden;">
          <tr style="background-color:#f8fafc;">
            <td style="padding:10px 12px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#94a3b8;">Date</td>
            <td style="padding:10px 12px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#94a3b8;">Description</td>
            <td style="padding:10px 12px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#94a3b8;">Category</td>
            <td style="padding:10px 12px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#94a3b8; text-align:right;">Amount</td>
          </tr>
          ${rows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${appUrl}/" style="display:inline-block; background:linear-gradient(135deg,#4f46e5,#2563eb); color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 22px; border-radius:8px;">Open Finance Tracker</a>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px; border-top:1px solid #edeff4; text-align:center;">
        <p style="margin:0; font-size:12px; color:#94a3b8;">You're receiving this because you have an account with Finance Tracker.</p>
      </td>
    </tr>
  </table>
</div>
`
}
