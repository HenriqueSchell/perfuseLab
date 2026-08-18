function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        next(error)
        return
    }

    const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
    const isProduction = process.env.NODE_ENV === 'production'
    const message = isProduction && status >= 500
        ? 'Erro interno do servidor.'
        : error.message || 'Erro interno do servidor.'

    if (status >= 500) {
        console.error('Erro interno:', error.message)
    }

    res.status(status).json({
        error: message
    })
}

module.exports = { errorHandler }
