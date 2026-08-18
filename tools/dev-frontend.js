const fs = require('fs/promises')
const http = require('http')
const path = require('path')

const root = path.resolve(__dirname, '..')
const port = Number(process.env.FRONTEND_PORT) || 5173
const apiBaseUrl = (process.env.VITE_API_URL || process.env.PERFUSELAB_API_URL || 'http://localhost:3000').trim().replace(/\/$/, '')
const allowedRoots = [
    root,
    path.join(root, 'src'),
    path.join(root, 'medias')
]

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
}

function resolverArquivo(urlPath) {
    const cleanPath = decodeURIComponent(urlPath.split('?')[0])
    const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '')
    const resolved = path.resolve(root, relativePath)
    const allowed = allowedRoots.some(base => resolved === base || resolved.startsWith(`${base}${path.sep}`))

    if (!allowed) return null
    if (!/^(index|dashboard|cases|checklist-modelo|informacoes)\.html$|^src[\\/]|^medias[\\/]/.test(relativePath)) return null
    return resolved
}

const server = http.createServer(async (req, res) => {
    if (req.url.split('?')[0] === '/src/js/runtime-env.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
        res.end(`window.PERFUSELAB_RUNTIME_CONFIG = Object.freeze({ apiBaseUrl: ${JSON.stringify(apiBaseUrl)} })\n`)
        return
    }

    const arquivo = resolverArquivo(req.url)
    if (!arquivo) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Arquivo nao encontrado.')
        return
    }

    try {
        const data = await fs.readFile(arquivo)
        res.writeHead(200, { 'Content-Type': contentTypes[path.extname(arquivo)] || 'application/octet-stream' })
        res.end(data)
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Arquivo nao encontrado.')
    }
})

server.listen(port, () => {
    console.log(`Frontend PerfuseLab em http://localhost:${port}`)
    console.log(`API configurada em ${apiBaseUrl || 'mesma origem'}`)
})
