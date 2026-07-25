import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

const getKey = (): Buffer => {
    const key = process.env.SALARY_ENCRYPTION_KEY
    if (!key || key.length !== 64) {
        throw new Error("SALARY_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes)")
    }
    return Buffer.from(key, "hex")
}

// AES-256-GCM: a random IV per value plus the auth tag are stored alongside
// the ciphertext so a single static key can still verify integrity on decrypt.
export const encryptNumber = (value: number): string => {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()
    return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":")
}

export const decryptNumber = (payload: string): number => {
    const [ivHex, authTagHex, dataHex] = payload.split(":")
    if (!ivHex || !authTagHex || !dataHex) {
        throw new Error("Malformed encrypted payload")
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"))
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()])
    return Number(decrypted.toString("utf8"))
}
