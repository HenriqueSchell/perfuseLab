const btnMain = document.getElementById('btnMain')
const btnModal = document.getElementById('btnModal')
const btnClose = document.getElementById('btnClose')
const main = document.getElementById('main')
const modal = document.getElementById('modal')
const arquivoDados = document.getElementById('arquivoDados')
const btnModeloArquivo = document.getElementById('btnModeloArquivo')
const statusArquivo = document.getElementById('statusArquivo')

//dados validações
const errorSex = document.getElementById('errorSex')

const colunasModelo = [
    'sexo', 'idade', 'peso', 'altura', 'temperatura', 'pam', 'tempo', 'fluxo',
    'ic', 'hemoglobina', 'hematocrito', 'lactato', 'lactato_mg_dl', 'sao2',
    'ido2', 'ivo2', 'do2_vo2', 'ph', 'svo2', 'pao2', 'paco2', 'hco3', 'be',
    'k', 'ca'
]

function transformarNumero(valor) {
    if (valor === undefined || valor === null || valor === '') return null
    const numero = Number(String(valor).trim().replace(',', '.'))
    return Number.isFinite(numero) ? numero : null
}

function converterLactatoParaMmol(valor, unidade) {
    const numero = transformarNumero(valor)
    if (numero === null) return null
    return unidade === 'mg/dL'
        ? Number((numero / 9.009).toFixed(2))
        : numero
}

function normalizarChave(chave) {
    return String(chave)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
}

function valorDaLinha(linha, ...nomes) {
    const normalizada = Object.fromEntries(
        Object.entries(linha).map(([chave, valor]) => [normalizarChave(chave), valor])
    )
    for (const nome of nomes) {
        const valor = normalizada[normalizarChave(nome)]
        if (valor !== undefined && valor !== '') return valor
    }
    return null
}

function separarCSV(linha, delimitador) {
    const valores = []
    let atual = ''
    let entreAspas = false

    for (let i = 0; i < linha.length; i += 1) {
        const caractere = linha[i]
        if (caractere === '"' && linha[i + 1] === '"' && entreAspas) {
            atual += '"'
            i += 1
        } else if (caractere === '"') {
            entreAspas = !entreAspas
        } else if (caractere === delimitador && !entreAspas) {
            valores.push(atual.trim())
            atual = ''
        } else {
            atual += caractere
        }
    }
    valores.push(atual.trim())
    return valores
}

function lerCSV(texto) {
    const linhas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter(linha => linha.trim())
    if (linhas.length < 2) throw new Error('O CSV precisa ter cabeçalho e pelo menos uma linha de dados.')

    const delimitador = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ','
    const cabecalhos = separarCSV(linhas[0], delimitador)
    return linhas.slice(1).map(linha => {
        const valores = separarCSV(linha, delimitador)
        return Object.fromEntries(cabecalhos.map((cabecalho, indice) => [cabecalho, valores[indice] ?? '']))
    })
}

function prepararImportacao(conteudo, extensao) {
    let paciente
    let monitorizacao
    let dadosOriginais = null

    if (extensao === 'json') {
        const dados = JSON.parse(conteudo)
        dadosOriginais = dados
        paciente = dados.paciente || dados.patient
        monitorizacao = dados.monitorizacao || dados.monitoring || dados.exames
        if (!paciente || !Array.isArray(monitorizacao) || !monitorizacao.length) {
            throw new Error('O JSON deve conter "paciente" e uma lista "monitorizacao".')
        }
    } else {
        monitorizacao = lerCSV(conteudo)
        const primeira = monitorizacao[0]
        paciente = {
            sexo: valorDaLinha(primeira, 'sexo'),
            idade: valorDaLinha(primeira, 'idade'),
            peso: valorDaLinha(primeira, 'peso'),
            altura: valorDaLinha(primeira, 'altura'),
            temperatura: valorDaLinha(primeira, 'temperatura'),
            pam: valorDaLinha(primeira, 'pam')
        }
    }

    const primeira = monitorizacao[0]
    const pacienteNormalizado = {
        sexo: String(valorDaLinha(paciente, 'sexo') || '').toLowerCase().trim(),
        idade: transformarNumero(valorDaLinha(paciente, 'idade')),
        peso: transformarNumero(valorDaLinha(paciente, 'peso')),
        alturaNum: transformarNumero(valorDaLinha(paciente, 'altura', 'alturaNum')),
        temperatura: transformarNumero(valorDaLinha(paciente, 'temperatura')),
        pam: transformarNumero(valorDaLinha(paciente, 'pam')),
        hemoglobina: transformarNumero(valorDaLinha(primeira, 'hemoglobina', 'hb')),
        hematocrito: transformarNumero(valorDaLinha(primeira, 'hematocrito', 'hct')),
        fluxo: transformarNumero(valorDaLinha(primeira, 'fluxo')),
        lactato: transformarNumero(valorDaLinha(primeira, 'lactato')),
        sao2: transformarNumero(valorDaLinha(primeira, 'sao2', 'saturacao'))
    }

    const SC = pacienteNormalizado.peso && pacienteNormalizado.alturaNum
        ? Math.sqrt((pacienteNormalizado.peso * pacienteNormalizado.alturaNum) / 3600)
        : null
    const icInicial = transformarNumero(valorDaLinha(primeira, 'ic', 'indicecardiaco', 'icinformado', 'ic_informado'))
    const hbInicial = transformarNumero(valorDaLinha(primeira, 'hemoglobina', 'hb'))
    const lactatoInicialMgDl = transformarNumero(valorDaLinha(primeira, 'lactatomgdl', 'lactato_mg_dl'))
    const ido2Inicial = transformarNumero(valorDaLinha(primeira, 'ido2', 'ido2informado', 'ido2_informado'))
    pacienteNormalizado.fluxo ??= icInicial && SC ? icInicial * SC : null
    pacienteNormalizado.hematocrito ??= hbInicial ? Number((hbInicial * 3).toFixed(2)) : null
    pacienteNormalizado.lactato ??= lactatoInicialMgDl !== null
        ? Number((lactatoInicialMgDl / 9.009).toFixed(2))
        : null

    const obrigatoriosPaciente = ['sexo', 'idade', 'peso', 'alturaNum', 'hemoglobina', 'hematocrito', 'fluxo', 'lactato']
    if (obrigatoriosPaciente.some(campo => pacienteNormalizado[campo] === null || pacienteNormalizado[campo] === '')) {
        throw new Error('Faltam dados obrigatórios do paciente ou da primeira monitorização.')
    }
    if (pacienteNormalizado.sao2 === null && ido2Inicial === null) {
        throw new Error('A primeira monitorização deve informar SaO2 medida ou iDO2 informado.')
    }

    const operacional = dadosOriginais?.operacional || {}
    const temperaturas = operacional.temperatura_c || []
    const pressaoArterial = operacional.pam_mmhg || []
    const historico = monitorizacao.map((linha, indice) => {
        const hb = transformarNumero(valorDaLinha(linha, 'hemoglobina', 'hb'))
        const hctInformado = transformarNumero(valorDaLinha(linha, 'hematocrito', 'hct'))
        const icInformado = transformarNumero(valorDaLinha(linha, 'ic', 'indicecardiaco', 'icinformado', 'ic_informado'))
        const fluxoInformado = transformarNumero(valorDaLinha(linha, 'fluxo'))
        const pao2 = transformarNumero(valorDaLinha(linha, 'pao2'))
        const sao2Entrada = transformarNumero(valorDaLinha(linha, 'sao2', 'saturacao'))
        const sao2InformadaEntrada = valorDaLinha(linha, 'sao2informada', 'sao2_informada')
        const lactatoMmol = transformarNumero(valorDaLinha(linha, 'lactato'))
        const lactatoMgDl = transformarNumero(valorDaLinha(linha, 'lactatomgdl', 'lactato_mg_dl'))
        return {
            ...linha,
            tempo: transformarNumero(valorDaLinha(linha, 'tempo', 'tempomin', 'tempo_min')) ?? indice,
            fluxo: fluxoInformado ?? (icInformado && SC ? icInformado * SC : null),
            hb,
            hct: hctInformado ?? (hb ? Number((hb * 3).toFixed(2)) : null),
            lactato: lactatoMmol ?? (lactatoMgDl !== null ? Number((lactatoMgDl / 9.009).toFixed(2)) : null),
            lactatoMgDl,
            sao2: sao2Entrada,
            sao2Informada: sao2InformadaEntrada !== null
                ? String(sao2InformadaEntrada).toLowerCase() !== 'false'
                : sao2Entrada !== null,
            ph: transformarNumero(valorDaLinha(linha, 'ph')),
            svo2: transformarNumero(valorDaLinha(linha, 'svo2')),
            pao2,
            paco2: transformarNumero(valorDaLinha(linha, 'paco2')),
            hco3: transformarNumero(valorDaLinha(linha, 'hco3')),
            be: transformarNumero(valorDaLinha(linha, 'be')),
            k: transformarNumero(valorDaLinha(linha, 'k', 'potassio')),
            ca: transformarNumero(valorDaLinha(linha, 'ca', 'calcio')),
            na: transformarNumero(valorDaLinha(linha, 'na', 'sodio')),
            cl: transformarNumero(valorDaLinha(linha, 'cl', 'cloro')),
            glicose: transformarNumero(valorDaLinha(linha, 'glicose', 'glucose')),
            fio2: transformarNumero(valorDaLinha(linha, 'fio2')),
            ivo2: transformarNumero(valorDaLinha(linha, 'ivo2')),
            relacaoDo2Vo2: transformarNumero(valorDaLinha(linha, 'do2vo2', 'do2_vo2')),
            gapPco2: transformarNumero(valorDaLinha(linha, 'gappco2', 'gap_pco2')),
            ido2Informado: transformarNumero(valorDaLinha(linha, 'ido2', 'ido2informado', 'ido2_informado')),
            icInformado,
            pam: transformarNumero(valorDaLinha(linha, 'pam')) ?? transformarNumero(pressaoArterial[indice]),
            temperatura: transformarNumero(valorDaLinha(linha, 'temperatura')) ?? transformarNumero(temperaturas[indice])
        }
    })

    const monitorizacaoIncompleta = historico.some(item => {
        const basicosAusentes = ['fluxo', 'hb', 'hct', 'lactato'].some(campo => item[campo] === null)
        return basicosAusentes || (item.sao2 === null && item.ido2Informado === null)
    })
    if (monitorizacaoIncompleta) {
        throw new Error('Cada monitorização deve informar fluxo/IC, hemoglobina, hematócrito, lactato e SaO2 medida ou iDO2 informado.')
    }

    return { paciente: pacienteNormalizado, historico, dadosOriginais }
}

function exibirStatusArquivo(mensagem, erro = false) {
    statusArquivo.textContent = mensagem
    statusArquivo.classList.remove('hidden', 'text-red-600', 'text-emerald-700')
    statusArquivo.classList.add(erro ? 'text-red-600' : 'text-emerald-700')
}

arquivoDados.addEventListener('change', async event => {
    const arquivo = event.target.files[0]
    if (!arquivo) return

    try {
        const extensao = arquivo.name.split('.').pop().toLowerCase()
        if (!['csv', 'json'].includes(extensao)) throw new Error('Selecione um arquivo CSV ou JSON.')
        const importacao = prepararImportacao(await arquivo.text(), extensao)
        localStorage.setItem('paciente', JSON.stringify(importacao.paciente))
        localStorage.setItem('historicoImportado', JSON.stringify(importacao.historico))
        localStorage.setItem('casoClinicoImportado', JSON.stringify(importacao.dadosOriginais || {}))
        exibirStatusArquivo(`${importacao.historico.length} registros importados. Abrindo análise...`)
        setTimeout(() => { window.location.href = 'dashboard.html' }, 500)
    } catch (erro) {
        exibirStatusArquivo(erro.message || 'Não foi possível importar o arquivo.', true)
        arquivoDados.value = ''
    }
})

btnModeloArquivo.addEventListener('click', () => {
    const exemplo = [
        colunasModelo.join(';'),
        'masculino;55;80;175;36,5;70;0;4,8;2,35;12;36;1,8;;98;;56;;7,40;75;180;38;24;0;4,2;1,15',
        'masculino;55;80;175;36,0;68;20;4,6;2,25;10,5;31,5;2,2;;97;;52;;7,36;72;160;40;22;-2;4,0;1,10'
    ].join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${exemplo}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo-perfuselab.csv'
    link.click()
    URL.revokeObjectURL(url)
})


btnMain.addEventListener('click', () => {
    main.classList.add('hidden')
    modal.classList.remove('hidden')
})

btnClose.addEventListener('click', () => {
    main.classList.remove('hidden')
    modal.classList.add('hidden')
})

btnModal.addEventListener('click', () => {
    const sexo = document.getElementById('sexo').value.toLowerCase().trim()
    const idade = document.getElementById('idade').value
    const peso = document.getElementById('peso').value.trim()
    const altura = document.getElementById('altura').value.trim()
    const hemoglobina = document.getElementById('hemoglobina').value.trim()
    const hematocrito = document.getElementById('hematocrito').value.trim()
    const fluxo = document.getElementById('fluxo').value.trim()
    const temperatura = document.getElementById('temperatura').value.trim()
    const pam = document.getElementById('pam').value.trim()
    const lactatoOriginal = document.getElementById('lactato').value.trim()
    const unidadeLactatoInicial = document.getElementById('unidadeLactatoInicial').value
    const lactato = converterLactatoParaMmol(lactatoOriginal, unidadeLactatoInicial)
    const sao2 = document.getElementById('sao2').value.trim()

    
    //validações
    if(!['m', 'f', 'masculino', 'feminino'].includes(sexo)){
        errorSex.classList.remove('hidden')
    }else{
        errorSex.classList.add('hidden')
    }

    const alturaNum = Number(altura)
    if(!Number.isInteger(alturaNum)){
        alert('A altura deve ser informada em centímetros!')
        return
    }
    
    const campos = [idade, peso, altura, hemoglobina, hematocrito, fluxo, temperatura, pam, lactatoOriginal, sao2]
    if (campos.some(campo => campo === '' || campo === null) || lactato === null) {
        alert('Preencha os dados corretamente!')
        return
    }
    
    const paciente = {
            sexo,
            idade,
            peso,
            alturaNum,
            hemoglobina,
            hematocrito,
            fluxo,
            temperatura,
            pam,
            lactato,
            lactatoOriginal: transformarNumero(lactatoOriginal),
            unidadeLactatoOriginal: unidadeLactatoInicial,
            sao2
        }
    localStorage.removeItem('historicoImportado')
    localStorage.removeItem('casoClinicoImportado')
    localStorage.setItem('paciente', JSON.stringify(paciente))
    window.location.href = 'dashboard.html'
    })
