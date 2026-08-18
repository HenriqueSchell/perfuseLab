const fs = require('fs/promises')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const apiBaseUrl = (process.env.VITE_API_URL || process.env.PERFUSELAB_API_URL || '').trim().replace(/\/$/, '')

if (apiBaseUrl && !/^https?:\/\//i.test(apiBaseUrl)) {
    throw new Error('VITE_API_URL deve comecar com http:// ou https://.')
}

async function copiarArquivo(origem, destino) {
    await fs.mkdir(path.dirname(destino), { recursive: true })
    await fs.copyFile(origem, destino)
}

async function main() {
    await fs.rm(dist, { recursive: true, force: true })
    await fs.mkdir(dist, { recursive: true })

    await Promise.all([
        copiarArquivo(path.join(root, 'index.html'), path.join(dist, 'index.html')),
        copiarArquivo(path.join(root, 'dashboard.html'), path.join(dist, 'dashboard.html')),
        copiarArquivo(path.join(root, 'cases.html'), path.join(dist, 'cases.html')),
        copiarArquivo(path.join(root, 'checklist-modelo.html'), path.join(dist, 'checklist-modelo.html')),
        copiarArquivo(path.join(root, 'informacoes.html'), path.join(dist, 'informacoes.html')),
        fs.cp(path.join(root, 'src'), path.join(dist, 'src'), { recursive: true }),
        fs.cp(path.join(root, 'medias'), path.join(dist, 'medias'), { recursive: true })
    ])

    await fs.writeFile(
        path.join(dist, 'src', 'js', 'runtime-env.js'),
        `window.PERFUSELAB_RUNTIME_CONFIG = Object.freeze({ apiBaseUrl: ${JSON.stringify(apiBaseUrl)} })\n`,
        'utf8'
    )

    console.log('Frontend preparado em dist/.')
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
