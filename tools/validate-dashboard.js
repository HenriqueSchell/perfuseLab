const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const noop = () => {}

function dummyEl(id = '') {
    return {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        className: '',
        dataset: {},
        style: {},
        checked: false,
        disabled: false,
        type: '',
        placeholder: '',
        classList: {
            add: noop,
            remove: noop,
            toggle: noop,
            contains: () => false
        },
        append: noop,
        appendChild: noop,
        setAttribute: noop,
        removeAttribute: noop,
        addEventListener: noop,
        cloneNode: () => dummyEl(`${id}-clone`)
    }
}

function loadScript(file, context) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file })
}

function validate() {
    const indexContext = {
        console,
        Blob: function Blob() {},
        URL: { createObjectURL: () => '', revokeObjectURL: noop },
        setTimeout: noop,
        localStorage: { setItem: noop, removeItem: noop },
        window: { location: {} },
        document: { getElementById: dummyEl, createElement: dummyEl }
    }
    vm.createContext(indexContext)
    loadScript('src/js/index.js', indexContext)

    const dashboardContext = {
        console,
        fetch: async () => ({ ok: true, json: async () => ({ data: { _id: 'test' } }) }),
        document: {
            addEventListener: noop,
            getElementById: dummyEl,
            createElement: dummyEl,
            querySelectorAll: () => [],
            body: { classList: { add: noop, remove: noop } }
        },
        window: { addEventListener: noop, print: noop, PERFUSELAB_API_URL: '' },
        Chart: function Chart() {},
        localStorage: { getItem: () => null, setItem: noop, removeItem: noop }
    }
    dashboardContext.Chart.defaults = { font: {} }
    vm.createContext(dashboardContext)
    loadScript('src/js/dashboard.js', dashboardContext)

    const caseSources = [
        { dir: path.join(root, 'casos-clinicos-didaticos'), pattern: /^\d+_.*\.csv$/ },
        { dir: path.join(root, 'casos-completos-cirurgicos'), pattern: /^\d+_.*\.json$/ }
    ]
    const files = caseSources.flatMap(source => (
        fs.existsSync(source.dir)
            ? fs.readdirSync(source.dir)
                .filter(file => source.pattern.test(file))
                .sort()
                .map(file => path.join(source.dir, file))
            : []
    ))
    files.forEach(file => {
        const extensao = path.extname(file).slice(1)
        const importacao = indexContext.prepararImportacao(fs.readFileSync(file, 'utf8'), extensao)
        const sc = dashboardContext.superficieCorporal(importacao.paciente.peso, importacao.paciente.alturaNum)
        const historico = importacao.historico.map(exame => dashboardContext.completarExame(exame, sc))
        dashboardContext.montarAnalisePerfusional(importacao.paciente, historico, importacao.dadosOriginais || {}, sc)
    })

    console.log(`Dashboard validado com ${files.length} arquivo(s) de caso.`)
}

validate()
