type GetTokenFn = () => Promise<string | null>

// The backend needs a real, verifiable token on every request — Clerk's
// getToken() is only available inside React via the useAuth() hook, but the
// axios interceptor that attaches it runs outside any component. This is the
// bridge: a small registrar component (see AuthTokenRegistrar) stores the
// hook's getToken function here once, and the interceptor reads it from here.
let getTokenFn: GetTokenFn | null = null

export const registerGetToken = (fn: GetTokenFn) => {
    getTokenFn = fn
}

export const getAuthToken = async (): Promise<string | null> => {
    if (!getTokenFn) return null
    return getTokenFn()
}
