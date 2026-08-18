(function configurarPerfuseLab(global) {
    const TOKEN_KEY = 'perfuselab.auth.token'
    const TOKEN_EXPIRATION_KEY = 'perfuselab.auth.expiresAt'
    let loginPromise = null

    function normalizarUrl(valor) {
        if (typeof valor !== 'string') return ''
        return valor.trim().replace(/\/$/, '')
    }

    function getApiBaseUrl() {
        const runtimeConfig = global.PERFUSELAB_RUNTIME_CONFIG || {}
        return normalizarUrl(runtimeConfig.apiBaseUrl || global.PERFUSELAB_API_URL || '')
    }

    function clearAuthSession() {
        try {
            global.sessionStorage.removeItem(TOKEN_KEY)
            global.sessionStorage.removeItem(TOKEN_EXPIRATION_KEY)
        } catch (error) {
            console.warn('Nao foi possivel limpar a sessao de acesso ao banco.', error)
        }
    }

    function getStoredSession() {
        try {
            const token = global.sessionStorage.getItem(TOKEN_KEY)
            const expiresAt = global.sessionStorage.getItem(TOKEN_EXPIRATION_KEY)

            if (!token || !expiresAt) return null
            if (new Date(expiresAt).getTime() <= Date.now()) {
                clearAuthSession()
                return null
            }

            return { token, expiresAt }
        } catch (error) {
            return null
        }
    }

    function setAuthSession(session) {
        if (!session || !session.token || !session.expiresAt) return

        try {
            global.sessionStorage.setItem(TOKEN_KEY, session.token)
            global.sessionStorage.setItem(TOKEN_EXPIRATION_KEY, session.expiresAt)
        } catch (error) {
            console.warn('Nao foi possivel salvar a sessao de acesso ao banco.', error)
        }
    }

    function parseJsonSafe(response) {
        return response.json().catch(() => ({}))
    }

    function buildAuthModal(message) {
        const overlay = global.document.createElement('div')
        overlay.className = 'auth-modal'
        overlay.innerHTML = `
            <form class="auth-modal__panel" autocomplete="on">
                <div>
                    <p class="auth-modal__eyebrow">Banco de dados PerfuseLab</p>
                    <h2>Acesso restrito</h2>
                    <p class="auth-modal__message">${message || 'Informe o usuario e a senha para acessar os casos salvos.'}</p>
                </div>
                <label>
                    Usuario
                    <input class="auth-modal__input" name="username" type="text" autocomplete="username" required>
                </label>
                <label>
                    Senha
                    <input class="auth-modal__input" name="password" type="password" autocomplete="current-password" required>
                </label>
                <p class="auth-modal__error" hidden></p>
                <div class="auth-modal__actions">
                    <button type="submit">Entrar</button>
                    <button type="button" data-auth-cancel>Cancelar</button>
                </div>
            </form>
        `

        global.document.body.appendChild(overlay)
        overlay.querySelector('[name="username"]').focus()
        return overlay
    }

    function requestLogin(message) {
        if (loginPromise) return loginPromise

        loginPromise = new Promise((resolve, reject) => {
            if (!global.document || !global.document.body) {
                reject(new Error('Interface de login indisponivel.'))
                return
            }

            const overlay = buildAuthModal(message)
            const form = overlay.querySelector('form')
            const errorBox = overlay.querySelector('.auth-modal__error')
            const cancelButton = overlay.querySelector('[data-auth-cancel]')

            function close() {
                overlay.remove()
                loginPromise = null
            }

            cancelButton.addEventListener('click', () => {
                close()
                reject(new Error('Login necessario para acessar o banco de dados.'))
            })

            form.addEventListener('submit', async (event) => {
                event.preventDefault()

                const submitButton = form.querySelector('[type="submit"]')
                const formData = new FormData(form)
                const username = String(formData.get('username') || '').trim()
                const password = String(formData.get('password') || '')

                if (!username || !password) return

                submitButton.disabled = true
                errorBox.hidden = true

                try {
                    const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    })
                    const payload = await parseJsonSafe(response)

                    if (!response.ok) {
                        throw new Error(payload.error || 'Nao foi possivel autenticar.')
                    }

                    setAuthSession(payload)
                    close()
                    resolve(payload)
                } catch (error) {
                    errorBox.textContent = error.message || 'Falha ao autenticar.'
                    errorBox.hidden = false
                    submitButton.disabled = false
                }
            })
        })

        return loginPromise
    }

    async function ensureAuthenticated(message) {
        const session = getStoredSession()
        if (session) return session
        return requestLogin(message)
    }

    function withAuthHeaders(options) {
        const session = getStoredSession()
        const headers = new Headers(options.headers || {})

        if (session && session.token) {
            headers.set('Authorization', `Bearer ${session.token}`)
        }

        return {
            ...options,
            headers
        }
    }

    async function authenticatedFetch(url, options = {}) {
        await ensureAuthenticated()

        let response = await fetch(url, withAuthHeaders(options))

        if (response.status !== 401) return response

        clearAuthSession()
        await ensureAuthenticated('Sessao expirada. Entre novamente para continuar.')
        response = await fetch(url, withAuthHeaders(options))
        return response
    }

    global.PerfuseLabConfig = Object.freeze({
        authenticatedFetch,
        clearAuthSession,
        getApiBaseUrl,
        getStoredSession
    })
})(window)
