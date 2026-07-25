import { Resend } from "resend"

let client: Resend | null = null

const getClient = () => {
    if (client) return client

    const { RESEND_API_KEY } = process.env
    if (!RESEND_API_KEY) {
        return null
    }

    client = new Resend(RESEND_API_KEY)
    return client
}

export const sendEmail = async (to: string, subject: string, html: string) => {
    const resend = getClient()
    if (!resend) {
        console.warn(`[mailer] RESEND_API_KEY not configured — skipping email to ${to}: "${subject}"`)
        return false
    }

    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to,
        subject,
        html,
    })

    if (error) {
        console.error("[mailer] Resend error:", error)
        return false
    }
    return true
}
