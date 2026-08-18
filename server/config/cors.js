const LOCAL_ORIGINS = Object.freeze([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
])

function parseOrigins(value = '') {
    return String(value)
        .split(',')
        .map(origin => origin.trim().replace(/\/$/, ''))
        .filter(Boolean)
}

function getAllowedOrigins() {
    const configured = [
        ...parseOrigins(process.env.FRONTEND_URL),
        ...parseOrigins(process.env.CORS_ORIGIN)
    ]

    if (configured.length) {
        return [...new Set(configured)]
    }

    return process.env.NODE_ENV === 'production'
        ? []
        : [...LOCAL_ORIGINS]
}

function createCorsOptions() {
    const allowedOrigins = getAllowedOrigins()

    return {
        origin(origin, callback) {
            if (!origin) {
                callback(null, true)
                return
            }

            const normalizedOrigin = origin.replace(/\/$/, '')
            if (allowedOrigins.includes(normalizedOrigin)) {
                callback(null, true)
                return
            }

            const error = new Error('Origem nao permitida pelo CORS.')
            error.status = 403
            callback(error)
        },
        optionsSuccessStatus: 204
    }
}

module.exports = {
    createCorsOptions,
    getAllowedOrigins
}
