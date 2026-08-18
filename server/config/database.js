const mongoose = require('mongoose')

const CONNECTION_STATES = Object.freeze({
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
})

function getDatabaseStatus() {
    return CONNECTION_STATES[mongoose.connection.readyState] || 'unknown'
}

async function connectDatabase() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        throw new Error('MONGO_URI nao foi definida. Crie um .env a partir do .env.example.')
    }

    mongoose.set('strictQuery', true)
    await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB || undefined,
        serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 10000
    })

    mongoose.connection.on('error', error => {
        console.error('Erro na conexao com MongoDB:', error.message)
    })

    mongoose.connection.on('disconnected', () => {
        console.warn('Conexao com MongoDB encerrada.')
    })

    return mongoose.connection
}

module.exports = {
    connectDatabase,
    getDatabaseStatus
}
