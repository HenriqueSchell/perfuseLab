(function configurarPerfuseLab(global) {
    function normalizarUrl(valor) {
        if (typeof valor !== 'string') return ''
        return valor.trim().replace(/\/$/, '')
    }

    function getApiBaseUrl() {
        const runtimeConfig = global.PERFUSELAB_RUNTIME_CONFIG || {}
        return normalizarUrl(runtimeConfig.apiBaseUrl || global.PERFUSELAB_API_URL || '')
    }

    global.PerfuseLabConfig = Object.freeze({
        getApiBaseUrl
    })
})(window)
