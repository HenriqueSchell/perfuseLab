const crypto = require('crypto')

const DEFAULT_TOKEN_TTL_HOURS = 8

function getConfiguredUsername() {
    return (process.env.PERFUSELAB_AUTH_USER || '').trim()
}

function getConfiguredPassword() {
    return process.env.PERFUSELAB_AUTH_PASSWORD || ''
}

function getAuthSecret() {
    return process.env.PERFUSELAB_AUTH_SECRET || ''
}

function getTokenTtlHours() {
    const configuredValue = Number(process.env.PERFUSELAB_AUTH_TOKEN_TTL_HOURS)
    return Number.isFinite(configuredValue) && configuredValue > 0
        ? configuredValue
        : DEFAULT_TOKEN_TTL_HOURS
}

function isAuthConfigured() {
    return Boolean(getConfiguredUsername() && getConfiguredPassword())
}

function safeCompare(left, right) {
    const leftHash = crypto.createHash('sha256').update(String(left)).digest()
    const rightHash = crypto.createHash('sha256').update(String(right)).digest()
    return crypto.timingSafeEqual(leftHash, rightHash)
}

function validateCredentials(username, password) {
    if (!isAuthConfigured()) return false

    return (
        safeCompare(username || '', getConfiguredUsername()) &&
        safeCompare(password || '', getConfiguredPassword())
    )
}

function signPayload(encodedPayload) {
    const secret = getAuthSecret()

    if (!secret) {
        const error = new Error('PERFUSELAB_AUTH_SECRET nao foi configurada.')
        error.status = 500
        throw error
    }

    return crypto
        .createHmac('sha256', secret)
        .update(encodedPayload)
        .digest('base64url')
}

function createAuthToken(username) {
    const issuedAt = Date.now()
    const expiresAtMs = issuedAt + getTokenTtlHours() * 60 * 60 * 1000
    const payload = {
        sub: username,
        iat: issuedAt,
        exp: expiresAtMs
    }
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = signPayload(encodedPayload)

    return {
        token: `${encodedPayload}.${signature}`,
        expiresAt: new Date(expiresAtMs).toISOString()
    }
}

function verifyAuthToken(token) {
    if (!token || typeof token !== 'string' || !getAuthSecret()) return null

    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    let expectedSignature
    try {
        expectedSignature = signPayload(encodedPayload)
    } catch (error) {
        return null
    }

    if (!safeCompare(signature, expectedSignature)) return null

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
        if (!payload.exp || payload.exp < Date.now()) return null
        if (payload.sub !== getConfiguredUsername()) return null
        return payload
    } catch (error) {
        return null
    }
}

function authenticateRequest(req, res, next) {
    if (!isAuthConfigured()) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                error: 'Autenticacao do PerfuseLab nao configurada.'
            })
        }

        return next()
    }

    const authHeader = req.get('authorization') || ''
    const match = authHeader.match(/^Bearer\s+(.+)$/i)

    if (!match) {
        return res.status(401).json({
            error: 'Login necessario para acessar o banco de dados.'
        })
    }

    const payload = verifyAuthToken(match[1])

    if (!payload) {
        return res.status(401).json({
            error: 'Sessao invalida ou expirada.'
        })
    }

    req.auth = { username: payload.sub }
    next()
}

function getAuthStatus() {
    return {
        enabled: isAuthConfigured(),
        tokenTtlHours: getTokenTtlHours()
    }
}

module.exports = {
    authenticateRequest,
    createAuthToken,
    getAuthStatus,
    isAuthConfigured,
    validateCredentials,
    verifyAuthToken
}
