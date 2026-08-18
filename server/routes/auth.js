const express = require('express')
const {
    createAuthToken,
    getAuthStatus,
    validateCredentials
} = require('../middleware/auth')

const router = express.Router()

router.get('/status', (req, res) => {
    res.json(getAuthStatus())
})

router.post('/login', (req, res, next) => {
    try {
        const { username, password } = req.body || {}
        const status = getAuthStatus()

        if (!status.enabled) {
            return res.status(503).json({
                error: 'Autenticacao nao configurada.'
            })
        }

        if (!validateCredentials(username, password)) {
            return res.status(401).json({
                error: 'Usuario ou senha invalidos.'
            })
        }

        const session = createAuthToken(username)

        res.json({
            token: session.token,
            expiresAt: session.expiresAt,
            user: username
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router
