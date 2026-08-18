require('dotenv').config()

const cors = require('cors')
const express = require('express')
const { connectDatabase, getDatabaseStatus } = require('./config/database')
const { createCorsOptions, getAllowedOrigins } = require('./config/cors')
const { authenticateRequest, isAuthConfigured } = require('./middleware/auth')
const authRouter = require('./routes/auth')
const casesRouter = require('./routes/cases')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()
const port = Number(process.env.PORT) || 3000
const allowedOrigins = getAllowedOrigins()

if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
    console.warn('FRONTEND_URL nao foi definida. Requisicoes de navegador serao bloqueadas pelo CORS.')
}

if (process.env.NODE_ENV === 'production' && !isAuthConfigured()) {
    console.warn('PERFUSELAB_AUTH_USER e PERFUSELAB_AUTH_PASSWORD nao foram definidas. O acesso aos dados sera bloqueado.')
}

app.use(cors(createCorsOptions()))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
    const database = getDatabaseStatus()
    const ok = database === 'connected'
    res.status(ok ? 200 : 503)
    res.json({
        ok,
        service: 'perfuselab-api',
        database,
        timestamp: new Date().toISOString()
    })
})

app.get('/', (req, res) => {
    res.json({
        ok: true,
        service: 'perfuselab-api'
    })
})

app.use('/api/auth', authRouter)
app.use('/api/cases', authenticateRequest, casesRouter)
app.use((req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada.' })
})
app.use(errorHandler)

async function bootstrap() {
    try {
        const connection = await connectDatabase()
        app.listen(port, () => {
            console.log(`PerfuseLab API rodando na porta ${port}`)
            console.log(`MongoDB conectado: ${connection.name}`)
        })
    } catch (error) {
        console.error('Falha ao iniciar o PerfuseLab API:', error.message)
        process.exitCode = 1
    }
}

if (require.main === module) {
    bootstrap()
}

module.exports = app
