import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { registerGetToken } from '../utils/authToken'

// Mounted once near the root, inside ClerkProvider — its only job is handing
// the current getToken() function to the axios interceptor (see utils/api.ts),
// since that interceptor runs outside React and can't call the hook itself.
const AuthTokenRegistrar = () => {
    const { getToken } = useAuth()

    useEffect(() => {
        registerGetToken(getToken)
    }, [getToken])

    return null
}

export default AuthTokenRegistrar
