
let graficoAtual = null
const CONSTANTES_OXIGENIO = Object.freeze({
    capacidadeHb: 1.36,
    solubilidadePlasmatica: 0.003
})

// Transformar número
function transformarNumero(valor){
    if(valor === undefined || valor === null || valor === '') return null
    const numero = Number(String(valor).replace(',','.'))
    return Number.isFinite(numero) ? numero : null
}

function converterLactatoParaMmol(valor, unidade){
    const numero = transformarNumero(valor)
    if(numero === null) return null
    return unidade === 'mg/dL'
        ? Number((numero / 9.009).toFixed(2))
        : numero
}
// Calcular superficie corporal
function superficieCorporal(peso, altura){
    const pesoNumerico = transformarNumero(peso)
    const alturaNumerica = transformarNumero(altura)
    if(!Number.isFinite(pesoNumerico) || !Number.isFinite(alturaNumerica) || pesoNumerico <= 0 || alturaNumerica <= 0){
        return null
    }
    return Math.sqrt((pesoNumerico * alturaNumerica) / 3600)
}

// Calcular oferta de oxigênio
function ofertaOxigenio(hemoglobina, sao2, fluxo, SC, pao2 = 0){
    const hb = transformarNumero(hemoglobina)
    const saturacao = transformarNumero(sao2)
    const fluxoNumerico = transformarNumero(fluxo)
    const superficie = transformarNumero(SC)
    const pressaoOxigenio = transformarNumero(pao2)
    if(!Number.isFinite(hb) || !Number.isFinite(saturacao) || !Number.isFinite(fluxoNumerico)
        || !Number.isFinite(superficie) || superficie <= 0 || saturacao < 0 || saturacao > 100){
        return null
    }
    const oxigenioLigado = hb * CONSTANTES_OXIGENIO.capacidadeHb * (saturacao / 100)
    const oxigenioDissolvido = Number.isFinite(pressaoOxigenio)
        ? CONSTANTES_OXIGENIO.solubilidadePlasmatica * pressaoOxigenio
        : 0
    const cao2 = oxigenioLigado + oxigenioDissolvido
    const do2 = fluxoNumerico * cao2 * 10
    return Number((do2 / superficie).toFixed(2))
}

function ofertaOxigenioPorIndice(hemoglobina, sao2, IC, pao2 = 0){
    const hb = transformarNumero(hemoglobina)
    const saturacao = transformarNumero(sao2)
    const indice = transformarNumero(IC)
    const pressaoOxigenio = transformarNumero(pao2)
    if(!Number.isFinite(hb) || !Number.isFinite(saturacao) || !Number.isFinite(indice)
        || indice <= 0 || saturacao < 0 || saturacao > 100){
        return null
    }
    const cao2 = (hb * CONSTANTES_OXIGENIO.capacidadeHb * (saturacao / 100))
        + (Number.isFinite(pressaoOxigenio) ? CONSTANTES_OXIGENIO.solubilidadePlasmatica * pressaoOxigenio : 0)
    return Number((10 * indice * cao2).toFixed(2))
}

function sao2ImplicitaPorIdo2(ido2, hemoglobina, IC, pao2 = 0){
    const oferta = transformarNumero(ido2)
    const hb = transformarNumero(hemoglobina)
    const indice = transformarNumero(IC)
    const pressaoOxigenio = transformarNumero(pao2)
    if(!Number.isFinite(oferta) || !Number.isFinite(hb) || !Number.isFinite(indice)
        || hb <= 0 || indice <= 0){
        return null
    }
    const cao2Necessario = oferta / (10 * indice)
    const oxigenioDissolvido = Number.isFinite(pressaoOxigenio)
        ? CONSTANTES_OXIGENIO.solubilidadePlasmatica * pressaoOxigenio
        : 0
    return Number((((cao2Necessario - oxigenioDissolvido)
        / (hb * CONSTANTES_OXIGENIO.capacidadeHb)) * 100).toFixed(1))
}

//Calcular Índice cardíaco
function indiceCardiaco(fluxo, SC){
    const fluxoNumerico = transformarNumero(fluxo)
    const superficie = transformarNumero(SC)
    if(!Number.isFinite(fluxoNumerico) || !Number.isFinite(superficie) || superficie <= 0) return null
    return Number((fluxoNumerico / superficie).toFixed(2))
}

//Função para resetar exames
function resetarExames(camposExames){
    camposExames.forEach(item => {
        item.input.value = ''
        item.input.classList.remove('hidden')

        item.campo.textContent = ''
        item.campo.classList.add('hidden')
    })
}

function classificarHemoglobina(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-600','bg-emerald-600')
    if(valor < 7.5){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Atenção PBM'
    }else if(valor >= 7.5 && valor < 10){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Avaliar contexto'
    }else if(valor >= 10){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Preservada'
    }
}

function classificarHematocrito(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-600','bg-emerald-600')
    if(valor < 22){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Zona Crítica'
    }else if(valor >= 22 && valor < 24){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Zona Limítrofe'
    }else if(valor >=24){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Acima de 24%'
    }
}

function classificarLactato(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-400','bg-emerald-600')
    if(valor > 4){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Crítico'
    }else if(valor >= 2 && valor <= 4){
        elemento.classList.add('bg-amber-400')
        elemento.textContent = 'Atenção'
    }else if(valor < 2){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Adequado'
    }
}

function classificarIC(valor, elemento){
    elemento.classList.remove('bg-red-500', 'bg-amber-600', 'bg-emerald-600', 'bg-blue-600')
    if(!Number.isFinite(valor)){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Não calculável'
        return
    }
    if(valor < 2.2){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Zona Crítica'
    }else if(valor >= 2.2 && valor < 2.4){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Zona Limítrofe'
    }else if(valor >= 2.4){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Adequado'
    }
}

function classificarOfertaOxigenio(valor, elemento){
    elemento.classList.remove('bg-red-500', 'bg-amber-600', 'bg-emerald-600')
    if(!Number.isFinite(valor)){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Não calculável'
        return
    }
    if(valor < 260){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Abaixo de 260'
    }else if(valor >= 260 && valor < 280){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Abaixo do alvo GDP'
    }else if(valor >= 280){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Alvo GDP'
    }
}

function calcularHb(hct){
   return Number((hct / 3).toFixed(2))
}

function calcularHct(hb){
    return Number((hb * 3).toFixed(2))
}

function score(ido2, hct, lactato, IC){
    if(![ido2, hct, lactato, IC].every(Number.isFinite)) return null
    //Score
    let scoreIdo2 = 0
    let scoreHct = 0
    let scoreLactato = 0
    let scoreIC = 0

    //Score iDO²
    if(ido2 >= 320){
        scoreIdo2 = 4
    }else if(ido2 >= 300 && ido2 < 320){
        scoreIdo2 = 3
    }else if(ido2 >= 260 && ido2 < 300){
        scoreIdo2 = 2
    }else if(ido2 < 260){
        scoreIdo2 = 0
    }
    
    //Score HCT
    if(hct >= 25){
        scoreHct = 2
    }else if(hct >= 22 && hct < 25){
        scoreHct = 1
    }else if(hct < 22){
        scoreHct = 0
    }
    //Score Lactato
    if(lactato < 2){
        scoreLactato = 2
    }else if(lactato >= 2 && lactato <= 3){
        scoreLactato = 1
    }else if(lactato > 3){
        scoreLactato = 0
    }
    
    //Score IC
    if(IC >= 2.4){
        scoreIC = 2
    }else if(IC >= 2.2 && IC < 2.4){
        scoreIC = 1
    }else if(IC < 2.2){
        scoreIC = 0
    }
    
    //Somatória
    let scoreTotal = scoreIdo2 + scoreHct + scoreLactato + scoreIC

    //Regra de corte fisiológica
    if(hct < 22 && IC < 2.2){
        scoreTotal -= 1
    }
    return scoreTotal
}

function classificarScore(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-600','bg-emerald-600')
    if(valor >= 9){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Índice alto — não validado'
    }if(valor >= 7 && valor < 9){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Índice intermediário-alto'
    }if(valor >= 5 && valor < 7){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Índice intermediário'
    }if(valor <= 4){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Índice baixo — não validado'
    }
}

function AtualizarTabela(exame, tabela, ido2, IC){
    let linhaTempo = document.getElementById('linhaTempo')
    let dadoTempo = document.createElement('td')
    dadoTempo.textContent = exame.tempo

    let linhaFluxo = document.getElementById('linhaFluxo')
    let dadoFluxo = document.createElement('td')
    dadoFluxo.textContent = formatarMetrica(exame.fluxo, 3)

    let linhaHb = document.getElementById('linhaHb')
    let dadoHb = document.createElement('td')
    dadoHb.textContent = exame.hb

    let linhaHct = document.getElementById('linhaHct')
    let dadoHct = document.createElement('td')
    dadoHct.textContent = exame.hct

    let linhaLactato = document.getElementById('linhaLactato')
    let dadoLactato = document.createElement('td')
    dadoLactato.textContent = exame.lactato

    
    let linhaSao2 = document.getElementById('linhaSao2')
    let dadoSao2 = document.createElement('td')
    dadoSao2.textContent = Number.isFinite(exame.sao2) ? exame.sao2 : '—'

    let linhaIdo2 = document.getElementById('linhaIdo2')
    let dadoIdo2 = document.createElement('td')
    dadoIdo2.textContent = ido2

    let linhaIC = document.getElementById('linhaIC')
    let dadoIC = document.createElement('td')
    dadoIC.textContent = IC

    let linhaFonteIdo2 = document.getElementById('linhaFonteIdo2')
    let dadoFonteIdo2 = document.createElement('td')
    dadoFonteIdo2.textContent = descreverOrigemIdo2(exame)

    let linhasEdados = [linhaTempo, dadoTempo, linhaFluxo, dadoFluxo, linhaHb, dadoHb, linhaHct, dadoHct, linhaLactato, dadoLactato, linhaSao2, dadoSao2, linhaIdo2, dadoIdo2, linhaIC, dadoIC, linhaFonteIdo2, dadoFonteIdo2]

    linhasEdados.forEach(elemento => elemento.classList.add('border-2', 'border-slate-800', 'text-center'))




    linhaTempo.appendChild(dadoTempo)
    linhaFluxo.appendChild(dadoFluxo)
    linhaHb.appendChild(dadoHb)
    linhaHct.appendChild(dadoHct)
    linhaLactato.appendChild(dadoLactato)
    linhaSao2.appendChild(dadoSao2)
    linhaIdo2.appendChild(dadoIdo2)
    linhaIC.appendChild(dadoIC)
    linhaFonteIdo2.appendChild(dadoFonteIdo2)


    tabela.appendChild(linhaTempo)
    tabela.appendChild(linhaFluxo)
    tabela.appendChild(linhaHb)
    tabela.appendChild(linhaHct)
    tabela.appendChild(linhaLactato)
    tabela.appendChild(linhaSao2)
    tabela.appendChild(linhaIdo2)
    tabela.appendChild(linhaIC)
    tabela.appendChild(linhaFonteIdo2)

    const linhasAdicionais = [
        ['linhaIvo2', exame.ivo2],
        ['linhaO2er', exame.o2er],
        ['linhaRelacaoDo2Vo2', exame.relacaoDo2Vo2],
        ['linhaSvo2', exame.svo2],
        ['linhaPh', exame.ph],
        ['linhaPaco2', exame.paco2],
        ['linhaHco3', exame.hco3],
        ['linhaGapPco2', exame.gapPco2],
        ['linhaPam', exame.pam],
        ['linhaTemperatura', exame.temperatura]
    ]

    linhasAdicionais.forEach(([id, valor]) => {
        const linha = document.getElementById(id)
        const dado = document.createElement('td')
        dado.textContent = valor ?? '—'
        dado.classList.add('border-2', 'border-slate-800', 'text-center')
        linha.appendChild(dado)
        tabela.appendChild(linha)
    })
}

function criarGrafico(campo, dados, valorCritico = null){
    let local = document.getElementById('local')
    if (graficoAtual) {
        graficoAtual.destroy();
    }

    local.innerHTML = ''

    let canvas = document.createElement('canvas')
    local.appendChild(canvas)

    let labels = dados.map(d => d.tempo)
    let valores = dados.map(d => d[campo] ?? null)

    let linhaCritica = valorCritico !== null ? labels.map(() => valorCritico) : null

    let config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${campo.toUpperCase()} x TEMPO`,
                data: valores,
                borderWidth: 2,
                fill: false,

            },
            ...(linhaCritica ? [{
                label: 'Linha Crítica',
                data: linhaCritica,
                borderWidth: 2,
                borderDash: [6,6],
            }] : []),
            
            
                
        ]}
    }

    Chart.defaults.font.size = 16

    graficoAtual = new Chart(canvas, config)
}

function completarExame(exame, SC){
    const hb = transformarNumero(exame.hb)
    const hct = transformarNumero(exame.hct)
    const lactato = transformarNumero(exame.lactato)
    const fluxo = transformarNumero(exame.fluxo)
    const sao2 = transformarNumero(exame.sao2)
    const icCalculado = indiceCardiaco(fluxo, SC)
    const ido2Informado = transformarNumero(exame.ido2Informado ?? exame.ido2_informado)
    const icInformado = transformarNumero(exame.icInformado ?? exame.ic_informado)
    const IC = icInformado ?? icCalculado
    const sao2Medida = Number.isFinite(sao2) && exame.sao2Informada !== false
    const ido2Calculado = sao2Medida
        ? ofertaOxigenioPorIndice(hb, sao2, IC, transformarNumero(exame.pao2))
        : null
    const ido2 = ido2Calculado ?? ido2Informado
    const diferencaIdo2Percentual = Number.isFinite(ido2Calculado) && Number.isFinite(ido2Informado) && ido2Informado !== 0
        ? Number((((ido2Calculado - ido2Informado) / ido2Informado) * 100).toFixed(1))
        : null
    const sao2Implicita = !sao2Medida && Number.isFinite(ido2Informado)
        ? sao2ImplicitaPorIdo2(ido2Informado, hb, IC, transformarNumero(exame.pao2))
        : null
    let consistenciaIdo2 = 'calculado'
    if(Number.isFinite(ido2Informado) && Number.isFinite(ido2Calculado)){
        consistenciaIdo2 = Math.abs(diferencaIdo2Percentual) <= 5 ? 'compativel' : 'divergente'
    }else if(Number.isFinite(ido2Informado) && !sao2Medida){
        if(Number.isFinite(sao2Implicita) && (sao2Implicita < 0 || sao2Implicita > 100)){
            consistenciaIdo2 = 'incompativel'
        }else if(Number.isFinite(sao2Implicita)
            && Number.isFinite(transformarNumero(exame.pao2))
            && transformarNumero(exame.pao2) >= 100
            && sao2Implicita < 90){
            consistenciaIdo2 = 'discordante'
        }else{
            consistenciaIdo2 = 'nao_verificavel'
        }
    }else if(Number.isFinite(ido2Informado)){
        consistenciaIdo2 = 'informado'
    }
    const ivo2 = transformarNumero(exame.ivo2)
    const relacaoInformada = transformarNumero(exame.relacaoDo2Vo2 ?? exame.do2_vo2)
    const o2er = Number.isFinite(ivo2) && Number.isFinite(ido2) && ido2 > 0
        ? Number(((ivo2 / ido2) * 100).toFixed(1))
        : null
    const relacaoDo2Vo2 = Number.isFinite(ivo2) && Number.isFinite(ido2) && ivo2 > 0
        ? Number((ido2 / ivo2).toFixed(2))
        : null
    const diferencaRelacao = Number.isFinite(relacaoInformada) && Number.isFinite(relacaoDo2Vo2)
        ? Number((relacaoDo2Vo2 - relacaoInformada).toFixed(2))
        : null
    return {
        ...exame,
        hb,
        hct,
        lactato,
        fluxo,
        sao2,
        ido2,
        ido2Calculado,
        ido2Informado,
        fonteIdo2: Number.isFinite(ido2Calculado) ? 'calculado' : 'informado',
        consistenciaIdo2,
        diferencaIdo2Percentual,
        sao2Implicita,
        IC,
        icCalculado,
        icInformado,
        ivo2,
        o2er,
        relacaoDo2Vo2,
        relacaoInformada,
        diferencaRelacao,
        score: score(ido2, hct, lactato, IC)
    }
}

function descreverOrigemIdo2(exame){
    if(exame.fonteIdo2 === 'calculado'){
        if(exame.consistenciaIdo2 === 'divergente'){
            return `Calculado; informado difere ${formatarMetrica(Math.abs(exame.diferencaIdo2Percentual))}%`
        }
        if(exame.consistenciaIdo2 === 'compativel') return 'Calculado; informado compatível'
        return 'Calculado com SaO₂ medida'
    }
    if(exame.consistenciaIdo2 === 'incompativel'){
        return `Informado; SaO₂ implícita ${formatarMetrica(exame.sao2Implicita)}% (impossível)`
    }
    if(exame.consistenciaIdo2 === 'discordante'){
        return `Informado; SaO₂ implícita ${formatarMetrica(exame.sao2Implicita)}% (discordante)`
    }
    if(exame.consistenciaIdo2 === 'nao_verificavel'){
        return Number.isFinite(exame.sao2Implicita)
            ? `Informado; SaO₂ implícita ${formatarMetrica(exame.sao2Implicita)}%`
            : 'Informado; sem SaO₂ medida'
    }
    return Number.isFinite(exame.ido2Informado) ? 'Informado' : 'Não calculável'
}

function criarGraficoRelatorio(container, titulo, campo, dados, valorCritico){
    const bloco = document.createElement('div')
    const cabecalho = document.createElement('h3')
    const canvas = document.createElement('canvas')
    cabecalho.textContent = titulo
    cabecalho.className = 'text-xl font-bold mb-2'
    bloco.append(cabecalho, canvas)
    container.appendChild(bloco)

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: dados.map(item => item.tempo),
            datasets: [
                {
                    label: titulo,
                    data: dados.map(item => item[campo]),
                    borderColor: '#2563eb',
                    backgroundColor: '#2563eb',
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false
                },
                {
                    label: 'Limite de referência',
                    data: dados.map(() => valorCritico),
                    borderColor: '#dc2626',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    pointRadius: 0
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { title: { display: true, text: 'Tempo em CEC (min)' } }
            }
        }
    })
}

function alvoIdo2PorTemperatura(temperatura){
    const tabela = [
        [25, 110],
        [28, 152],
        [30, 180],
        [33, 223],
        [35, 252],
        [37, 280]
    ]
    if(!Number.isFinite(temperatura)) return 223
    if(temperatura <= tabela[0][0]) return tabela[0][1]
    if(temperatura >= tabela[tabela.length - 1][0]) return tabela[tabela.length - 1][1]

    for(let i = 1; i < tabela.length; i += 1){
        const [tempAtual, alvoAtual] = tabela[i]
        const [tempAnterior, alvoAnterior] = tabela[i - 1]
        if(temperatura <= tempAtual){
            const proporcao = (temperatura - tempAnterior) / (tempAtual - tempAnterior)
            return Number((alvoAnterior + proporcao * (alvoAtual - alvoAnterior)).toFixed(1))
        }
    }
    return 223
}

function calcularAucDeficit(dados, obterAlvo){
    let auc = 0
    let tempoAbaixo = 0
    for(let i = 1; i < dados.length; i += 1){
        const anterior = dados[i - 1]
        const atual = dados[i]
        const alvoAnterior = obterAlvo(anterior)
        const alvoAtual = obterAlvo(atual)
        if(!Number.isFinite(anterior.ido2) || !Number.isFinite(atual.ido2)
            || !Number.isFinite(alvoAnterior) || !Number.isFinite(alvoAtual)){
            continue
        }
        const intervalo = Math.max(0, atual.tempo - anterior.tempo)
        const deficitAnterior = alvoAnterior - anterior.ido2
        const deficitAtual = alvoAtual - atual.ido2

        if(deficitAnterior > 0 && deficitAtual > 0){
            auc += ((deficitAnterior + deficitAtual) / 2) * intervalo
            tempoAbaixo += intervalo
        }else if(deficitAnterior > 0 || deficitAtual > 0){
            const deficitPositivo = Math.max(deficitAnterior, deficitAtual)
            const fracaoAbaixo = deficitPositivo / (Math.abs(deficitAnterior) + Math.abs(deficitAtual))
            const intervaloAbaixo = intervalo * fracaoAbaixo
            auc += (deficitPositivo * intervaloAbaixo) / 2
            tempoAbaixo += intervaloAbaixo
        }
    }
    return {
        auc: Number(auc.toFixed(1)),
        tempoAbaixo: Number(tempoAbaixo.toFixed(1))
    }
}

function fio2CorrigidaHamilton(fio2Percentual, pao2, pressaoBarometrica = 760){
    if(!Number.isFinite(fio2Percentual) || !Number.isFinite(pao2) || !Number.isFinite(pressaoBarometrica)){
        return null
    }
    const fio2Fracao = fio2Percentual / 100
    const corrigida = fio2Fracao - (pao2 / (pressaoBarometrica - 47)) + 0.21
    return Number((corrigida * 100).toFixed(1))
}

function formatarMetrica(valor, casas = 1){
    return Number.isFinite(valor) ? valor.toFixed(casas).replace('.', ',') : 'Não calculável'
}

function criarAlerta(nivel, titulo, detalhe){
    return { nivel, titulo, detalhe }
}

function analisarAcidoBase(exame){
    if(!Number.isFinite(exame.ph) || !Number.isFinite(exame.paco2) || !Number.isFinite(exame.hco3)){
        return { resumo: 'Não calculável', detalhe: 'pH, PaCO₂ e HCO₃⁻ são necessários.' }
    }
    if(exame.ph < 7.35 && exame.paco2 > 45){
        return { resumo: 'Acidose respiratória', detalhe: 'pH reduzido com PaCO₂ elevada; avaliar componente metabólico associado.' }
    }
    if(exame.ph < 7.35 && exame.hco3 < 22){
        return { resumo: 'Acidose metabólica', detalhe: 'pH e HCO₃⁻ reduzidos; verificar compensação respiratória e ânion gap.' }
    }
    if(exame.ph > 7.45 && exame.paco2 < 35){
        return { resumo: 'Alcalose respiratória', detalhe: 'pH elevado com PaCO₂ reduzida.' }
    }
    if(exame.ph > 7.45 && exame.hco3 > 26){
        return { resumo: 'Alcalose metabólica', detalhe: 'pH e HCO₃⁻ elevados.' }
    }
    if(exame.paco2 < 35 && exame.hco3 <= 24){
        return { resumo: 'Provável alcalose respiratória compensada', detalhe: 'PaCO₂ reduzida com queda de HCO₃⁻ e pH próximo da faixa normal.' }
    }
    if(exame.paco2 > 45 && exame.hco3 >= 24){
        return { resumo: 'Provável acidose respiratória compensada', detalhe: 'PaCO₂ elevada com retenção de HCO₃⁻ e pH próximo da faixa normal.' }
    }
    return { resumo: 'Sem distúrbio primário evidente', detalhe: 'Interpretar em conjunto com temperatura, estratégia alfa-stat e tendência.' }
}

function montarAnalisePerfusional(paciente, historico, casoClinico, SC){
    const alvoGdp = 280
    const pressaoBarometrica = transformarNumero(casoClinico?.operacional?.pressao_barometrica_mmhg) || 760
    const dados = historico
        .map(exame => ({
            ...exame,
            alvoIdo2Termico: alvoIdo2PorTemperatura(transformarNumero(exame.temperatura))
        }))
        .sort((a, b) => a.tempo - b.tempo)
    const inicial = dados[0]
    const final = dados[dados.length - 1]
    const aucGdp = calcularAucDeficit(dados, () => alvoGdp)
    const aucTermica = calcularAucDeficit(dados, exame => exame.alvoIdo2Termico)
    const alertas = []
    const limitacoes = []
    const bmi = Number((transformarNumero(paciente.peso) / Math.pow(transformarNumero(paciente.alturaNum) / 100, 2)).toFixed(1))
    const adequacaoGdpInicial = Number(((inicial.ido2 / alvoGdp) * 100).toFixed(1))
    const adequacaoGdpFinal = Number(((final.ido2 / alvoGdp) * 100).toFixed(1))
    const adequacaoTermicaInicial = Number(((inicial.ido2 / inicial.alvoIdo2Termico) * 100).toFixed(1))
    const adequacaoTermicaFinal = Number(((final.ido2 / final.alvoIdo2Termico) * 100).toFixed(1))
    const lactatoRatio = inicial.lactato > 0 ? Number((final.lactato / inicial.lactato).toFixed(2)) : null
    const deltaHb = Number((final.hb - inicial.hb).toFixed(2))
    const deltaIdo2 = Number((final.ido2 - inicial.ido2).toFixed(1))
    const deltaIdo2Percentual = inicial.ido2
        ? Number((((final.ido2 - inicial.ido2) / inicial.ido2) * 100).toFixed(1))
        : null
    const acidobase = analisarAcidoBase(final)
    const anionGap = Number.isFinite(final.na) && Number.isFinite(final.cl) && Number.isFinite(final.hco3)
        ? Number((final.na - (final.cl + final.hco3)).toFixed(1))
        : null
    const deltaDelta = Number.isFinite(anionGap) && final.hco3 !== 24
        ? Number(((anionGap - 12) / (24 - final.hco3)).toFixed(2))
        : null
    const debito = casoClinico?.debito_urinario
    const debitoMlKgH = debito?.volume_ml && debito?.tempo_min && paciente.peso
        ? Number((debito.volume_ml / paciente.peso / (debito.tempo_min / 60)).toFixed(2))
        : null
    const pressoes = casoClinico?.operacional
    const deltaMembrana = Number.isFinite(transformarNumero(pressoes?.pressao_pre_membrana_mmhg))
        && Number.isFinite(transformarNumero(pressoes?.pressao_pos_membrana_mmhg))
        ? transformarNumero(pressoes.pressao_pre_membrana_mmhg) - transformarNumero(pressoes.pressao_pos_membrana_mmhg)
        : null
    const volumeSanguineoEstimado = paciente.peso
        ? paciente.peso * (String(paciente.sexo).toLowerCase().startsWith('f') ? 65 : 70)
        : null
    const cec = casoClinico?.cec || {}
    const anticoagulacao = casoClinico?.anticoagulacao || {}
    const tcaBasal = transformarNumero(anticoagulacao.tca_basal_s)
    const tcaCec = transformarNumero(anticoagulacao.tca_cec_s)
    const tcaPos = transformarNumero(anticoagulacao.tca_pos_neutralizacao_s)
    const cargaCristaloideNominal = Number.isFinite(transformarNumero(cec.prime_ml))
        ? transformarNumero(cec.prime_ml) - (transformarNumero(cec.rap_ml) || 0) + (transformarNumero(cec.cardioplegia_ml) || 0)
        : null
    const proporcaoCristaloide = volumeSanguineoEstimado && Number.isFinite(cargaCristaloideNominal)
        ? Number(((cargaCristaloideNominal / volumeSanguineoEstimado) * 100).toFixed(1))
        : null
    const pontosRecalculados = dados.filter(exame => Number.isFinite(exame.ido2Calculado)).length
    const pontosInconsistentes = dados.filter(exame => ['incompativel', 'discordante', 'divergente'].includes(exame.consistenciaIdo2)).length

    dados.forEach(exame => {
        const adequacaoGdp = Number.isFinite(exame.ido2) ? exame.ido2 / alvoGdp : null
        if(Number.isFinite(adequacaoGdp) && adequacaoGdp < 0.9) alertas.push(criarAlerta('alto', `iDO₂ abaixo do alvo GDP aos ${exame.tempo} min`, `${formatarMetrica(adequacaoGdp * 100)}% de 280 mL/min/m².`))
        else if(Number.isFinite(adequacaoGdp) && adequacaoGdp < 1) alertas.push(criarAlerta('moderado', `iDO₂ limítrofe para GDP aos ${exame.tempo} min`, `${formatarMetrica(adequacaoGdp * 100)}% de 280 mL/min/m².`))
        if(['incompativel', 'discordante', 'divergente'].includes(exame.consistenciaIdo2)){
            alertas.push(criarAlerta('informativo', `Conferir iDO₂ aos ${exame.tempo} min`, descreverOrigemIdo2(exame)))
        }
        if(Number.isFinite(exame.o2er) && exame.o2er > 40) alertas.push(criarAlerta('alto', `Extração de O₂ elevada aos ${exame.tempo} min`, `${formatarMetrica(exame.o2er)}%; critério do protocolo: >40%.`))
        else if(Number.isFinite(exame.o2er) && exame.o2er >= 30) alertas.push(criarAlerta('moderado', `Extração de O₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.o2er)}%.`))
        if(Number.isFinite(exame.gapPco2) && exame.gapPco2 >= 6) alertas.push(criarAlerta('moderado', `Gap PCO₂ aumentado aos ${exame.tempo} min`, `${formatarMetrica(exame.gapPco2)} mmHg.`))
        if(Number.isFinite(exame.relacaoDo2Vo2) && exame.relacaoDo2Vo2 < 2.5) alertas.push(criarAlerta('alto', `Relação DO₂/VO₂ crítica aos ${exame.tempo} min`, `${formatarMetrica(exame.relacaoDo2Vo2, 2)}; equivale a extração de O₂ >40%.`))
        else if(Number.isFinite(exame.relacaoDo2Vo2) && exame.relacaoDo2Vo2 <= 3.33) alertas.push(criarAlerta('moderado', `Relação DO₂/VO₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.relacaoDo2Vo2, 2)}; equivale a extração de O₂ entre 30% e 40%.`))
        if(Number.isFinite(exame.svo2) && exame.svo2 < 65) alertas.push(criarAlerta('alto', `SvO₂ inadequada aos ${exame.tempo} min`, `${formatarMetrica(exame.svo2)}%.`))
        else if(Number.isFinite(exame.svo2) && exame.svo2 <= 70) alertas.push(criarAlerta('moderado', `SvO₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.svo2)}%.`))
        if(Number.isFinite(exame.pam) && exame.pam < 60) alertas.push(criarAlerta('moderado', `PAM reduzida aos ${exame.tempo} min`, `${formatarMetrica(exame.pam, 0)} mmHg; individualizar conforme autorregulação e contexto.`))
        if(Number.isFinite(exame.pao2) && exame.pao2 > 150){
            const fio2Corrigida = fio2CorrigidaHamilton(exame.fio2, exame.pao2, pressaoBarometrica)
            alertas.push(criarAlerta('informativo', `PaO₂ acima de 150 mmHg aos ${exame.tempo} min`, Number.isFinite(fio2Corrigida)
                ? `FiO₂ corrigida para PaO₂ de 150 mmHg pelo método de Hamilton: ${formatarMetrica(fio2Corrigida)}% (Pb ${formatarMetrica(pressaoBarometrica, 0)} mmHg). Métrica de desempenho do oxigenador, não prescrição automática.`
                : 'O método de Hamilton exige FiO₂ simultânea, PaO₂ e pressão barométrica conhecida ou assumida.'))
        }
        if(Number.isFinite(exame.k) && exame.k < 3.5) alertas.push(criarAlerta('moderado', `Potássio reduzido aos ${exame.tempo} min`, `${formatarMetrica(exame.k)} mmol/L.`))
        if(Number.isFinite(exame.glicose) && exame.glicose > 180) alertas.push(criarAlerta('moderado', `Glicose elevada aos ${exame.tempo} min`, `${formatarMetrica(exame.glicose, 0)} mg/dL.`))
        if(Number.isFinite(exame.hb) && exame.hb < 7.5) alertas.push(criarAlerta('moderado', `Hemoglobina abaixo de 7,5 g/dL aos ${exame.tempo} min`, `${formatarMetrica(exame.hb, 2)} g/dL; transfusão não deve ser indicada isoladamente por este valor.`))
    })

    if(final.lactato > 4) alertas.push(criarAlerta('alto', 'Lactato final crítico', `${formatarMetrica(final.lactato, 2)} mmol/L.`))
    else if(final.lactato >= 2) alertas.push(criarAlerta('moderado', 'Lactato final em faixa de atenção', `${formatarMetrica(final.lactato, 2)} mmol/L.`))
    if(lactatoRatio > 1.1) alertas.push(criarAlerta('moderado', 'Lactato em elevação', `Razão final/inicial ${formatarMetrica(lactatoRatio, 2)}; interpretar com tendência e contexto clínico.`))
    if(final.tempo >= 60 && final.tempo <= 120) alertas.push(criarAlerta('moderado', 'Tempo de CEC moderado', `${formatarMetrica(final.tempo, 0)} minutos.`))
    else if(final.tempo > 120) alertas.push(criarAlerta('alto', 'Tempo de CEC elevado', `${formatarMetrica(final.tempo, 0)} minutos.`))
    if(Number.isFinite(tcaCec) && tcaCec < 400){
        alertas.push(criarAlerta('alto', 'TCA abaixo do mínimo terapêutico usual', `${formatarMetrica(tcaCec, 0)} s; conferir dispositivo, protocolo e concentração de heparina.`))
    }else if(Number.isFinite(tcaCec) && tcaCec < 480){
        alertas.push(criarAlerta('moderado', 'TCA abaixo do alvo histórico de 480 s', `${formatarMetrica(tcaCec, 0)} s; alguns dispositivos de ativação máxima utilizam alvo acima de 400 s.`))
    }

    limitacoes.push('O iDO₂ calculado usa 10 × IC × [Hb × 1,36 × SaO₂ + PaO₂ × 0,003]. SaO₂ entra como fração; o painel mostra o resultado em mL/min/m².')
    limitacoes.push('O alvo GDP de 280 mL/min/m² deriva do ensaio randomizado de Ranucci; a tabela térmica do prompt é exibida separadamente como protocolo configurável.')
    limitacoes.push('AUC e tempo abaixo do alvo usam interpolação linear entre amostras; intervalos longos podem ocultar oscilações ocorridas entre as medições.')
    if(dados.some(exame => !Number.isFinite(exame.temperatura))) limitacoes.push('Temperatura ausente em parte da série: foi usado 223 mL/min/m² apenas para a análise térmica local nesses pontos.')
    if(dados.some(exame => !Number.isFinite(exame.ivo2))) limitacoes.push('iVO₂ ausente em parte da série: O₂ER e relação DO₂/VO₂ não podem ser recalculadas em todos os momentos.')
    if(dados.some(exame => Number.isFinite(exame.ido2Informado) && !Number.isFinite(exame.ido2Calculado))) limitacoes.push('Há iDO₂ informado sem SaO₂ arterial medida. Esses pontos são exibidos, mas não podem ser recalculados independentemente pela equação de conteúdo arterial.')
    if(dados.some(exame => exame.consistenciaIdo2 === 'incompativel')) limitacoes.push('Pelo menos um iDO₂ informado exigiria SaO₂ acima de 100% para fechar com Hb, IC e PaO₂ do mesmo registro; confirme alinhamento temporal, unidade e transcrição.')
    if(dados.some(exame => exame.consistenciaIdo2 === 'discordante')) limitacoes.push('Pelo menos um iDO₂ informado produz SaO₂ implícita discordante da PaO₂ simultânea; confirme se os parâmetros pertencem à mesma amostra e ao mesmo tempo de CEC.')
    if(dados.some(exame => exame.consistenciaIdo2 === 'divergente')) limitacoes.push('Quando SaO₂ medida está disponível, o painel usa o iDO₂ calculado; valores informados com diferença superior a 5% permanecem apenas para auditoria.')
    if(dados.some(exame => Number.isFinite(exame.diferencaRelacao) && Math.abs(exame.diferencaRelacao) > 0.05)) limitacoes.push('A relação DO₂/VO₂ é sempre recalculada como iDO₂/iVO₂. O valor arredondado informado no arquivo é preservado somente para conferência.')
    if(dados.some(exame => !Number.isFinite(exame.cl))) limitacoes.push('Cloreto ausente: ânion gap e delta-delta não são calculáveis com segurança.')
    if(dados.some(exame => Number.isFinite(exame.ca))) limitacoes.push('Confirmar se cálcio está em mg/dL e se representa cálcio ionizado ou total antes de classificar.')
    if(!casoClinico?.operacional?.bis) limitacoes.push('BIS/supressão cerebral não documentados; risco neurológico não pode ser estratificado por esse parâmetro.')
    if(!Number.isFinite(anionGap)) limitacoes.push('Ânion gap não calculado por ausência de Na⁺, Cl⁻ ou HCO₃⁻ simultâneos.')
    if(Number.isFinite(proporcaoCristaloide)) limitacoes.push('A carga cristaloide é nominal: o volume efetivamente intravascular da cardioplegia e as perdas do circuito não foram informados.')
    if(!Number.isFinite(transformarNumero(casoClinico?.operacional?.pressao_barometrica_mmhg))) limitacoes.push('A correção de FiO₂ de Hamilton assumiu pressão barométrica de 760 mmHg; informar a pressão local melhora a estimativa.')
    if(Number.isFinite(tcaCec)) limitacoes.push('O alvo de TCA depende do método/dispositivo: 480 s é referência histórica aproximada; sistemas de ativação máxima podem usar valores acima de 400 s.')
    if(!Number.isFinite(tcaPos)) limitacoes.push('TCA pós-neutralização não documentado; não é possível avaliar reversão da heparina ou suspeita de rebote.')
    if(Number.isFinite(transformarNumero(anticoagulacao.heparina_mg))) limitacoes.push('Dose de heparina em mg não foi convertida para UI/kg porque concentração e apresentação do produto não foram documentadas.')
    const avisosConversao = casoClinico?.metadados_conversao?.avisos
    if(Array.isArray(avisosConversao)){
        avisosConversao.forEach(aviso => limitacoes.push(aviso))
    }

    const hipoxiaOculta = final.svo2 >= 70 && (final.lactato >= 2 || final.gapPco2 >= 6 || final.o2er >= 30)
    if(hipoxiaOculta) alertas.push(criarAlerta('informativo', 'Marcadores metabólicos discordantes', 'SvO₂ preservada com pelo menos um marcador metabólico ou de extração alterado; o achado não confirma hipóxia tecidual isoladamente.'))
    if(hipoxiaOculta) limitacoes.push('A associação entre SvO₂ preservada e marcador metabólico alterado é apenas descritiva; não foi usada como diagnóstico de “hipóxia oculta” nem para elevar o risco global.')

    const quantidadeAltos = alertas.filter(alerta => alerta.nivel === 'alto').length
    const quantidadeModerados = alertas.filter(alerta => alerta.nivel === 'moderado').length
    const risco = quantidadeAltos > 0 ? 'ALTO' : quantidadeModerados >= 2 ? 'MODERADO' : 'BAIXO'

    return {
        dados,
        risco,
        alertas,
        limitacoes,
        resumo: [
            { rotulo: 'BSA / IMC', valor: `${formatarMetrica(SC, 2)} m² / ${formatarMetrica(bmi)} kg/m²` },
            { rotulo: 'Adequação GDP (280)', valor: `${formatarMetrica(adequacaoGdpInicial)}% → ${formatarMetrica(adequacaoGdpFinal)}%` },
            { rotulo: 'Status GDP final', valor: adequacaoGdpFinal >= 100 ? 'ADEQUADO' : adequacaoGdpFinal >= 90 ? 'LIMÍTROFE' : 'INADEQUADO' }
        ],
        metricas: [
            ['Alvo GDP de iDO₂', `${alvoGdp} mL/min/m²`],
            ['Verificação do iDO₂', `${pontosRecalculados}/${dados.length} recalculados · ${pontosInconsistentes} ponto(s) a conferir`],
            ['AUC abaixo de 280', `${formatarMetrica(aucGdp.auc)} (mL/min/m²) × min`],
            ['Tempo abaixo de 280', `${formatarMetrica(aucGdp.tempoAbaixo)} min`],
            ['Alvo térmico local inicial/final', `${formatarMetrica(inicial.alvoIdo2Termico)} → ${formatarMetrica(final.alvoIdo2Termico)} mL/min/m²`],
            ['Adequação térmica local', `${formatarMetrica(adequacaoTermicaInicial)}% → ${formatarMetrica(adequacaoTermicaFinal)}%`],
            ['AUC abaixo do alvo térmico local', `${formatarMetrica(aucTermica.auc)} (mL/min/m²) × min`],
            ['O₂ER inicial/final', `${formatarMetrica(inicial.o2er)}% → ${formatarMetrica(final.o2er)}%`],
            ['DO₂/VO₂ inicial/final', `${formatarMetrica(inicial.relacaoDo2Vo2, 2)} → ${formatarMetrica(final.relacaoDo2Vo2, 2)}`],
            ['Razão de lactato final/inicial', formatarMetrica(lactatoRatio, 2)],
            ['Delta Hb', `${formatarMetrica(deltaHb, 2)} g/dL`],
            ['Delta iDO₂', `${formatarMetrica(deltaIdo2)} mL/min/m² (${formatarMetrica(deltaIdo2Percentual)}%)`],
            ['Ânion gap final', Number.isFinite(anionGap) ? `${formatarMetrica(anionGap)} mEq/L` : 'Não calculável'],
            ['Delta-delta final', formatarMetrica(deltaDelta, 2)],
            ['Ácido-base final', `${acidobase.resumo}. ${acidobase.detalhe}`],
            ['Débito urinário', Number.isFinite(debitoMlKgH) ? `${formatarMetrica(debitoMlKgH, 2)} mL/kg/h` : 'Não calculável'],
            ['Delta de membrana', Number.isFinite(deltaMembrana) ? `${formatarMetrica(deltaMembrana, 0)} mmHg` : 'Não calculável'],
            ['Carga cristaloide nominal / volemia', Number.isFinite(proporcaoCristaloide) ? `${formatarMetrica(proporcaoCristaloide)}%` : 'Não calculável'],
            ['TCA basal / CEC / pós-neutralização', `${formatarMetrica(tcaBasal, 0)} / ${formatarMetrica(tcaCec, 0)} / ${formatarMetrica(tcaPos, 0)} s`]
        ]
    }
}

function renderizarAnalisePerfusional(analise){
    const riscoGlobal = document.getElementById('riscoGlobal')
    const resumo = document.getElementById('resumoPerfusional')
    const metricas = document.getElementById('metricasPerfusionais')
    const alertas = document.getElementById('alertasPerfusionais')
    const qualidade = document.getElementById('qualidadeDados')
    const coresRisco = { BAIXO: 'bg-emerald-600', MODERADO: 'bg-amber-500', ALTO: 'bg-red-600' }

    riscoGlobal.textContent = `Risco integrado: ${analise.risco}`
    riscoGlobal.className = `self-start rounded-lg px-4 py-2 text-white font-semibold ${coresRisco[analise.risco]}`
    resumo.innerHTML = ''
    analise.resumo.forEach(item => {
        const card = document.createElement('div')
        card.className = 'border border-slate-700 rounded-2xl p-4'
        const rotulo = document.createElement('p')
        rotulo.className = 'text-slate-500'
        rotulo.textContent = item.rotulo
        const valor = document.createElement('p')
        valor.className = 'text-xl text-slate-100 mt-1'
        valor.textContent = item.valor
        card.append(rotulo, valor)
        resumo.appendChild(card)
    })

    metricas.innerHTML = ''
    analise.metricas.forEach(([rotulo, valor]) => {
        const linha = document.createElement('div')
        linha.className = 'metric-row flex justify-between gap-4 border-b border-slate-800 pb-2'
        const nome = document.createElement('span')
        const resultado = document.createElement('strong')
        nome.textContent = rotulo
        resultado.textContent = valor
        resultado.className = 'text-right text-slate-100'
        linha.append(nome, resultado)
        metricas.appendChild(linha)
    })

    alertas.innerHTML = ''
    if(!analise.alertas.length){
        alertas.textContent = 'Nenhum desvio identificado pelas regras configuradas.'
        alertas.className = 'text-emerald-400'
    }else{
        alertas.className = 'space-y-3'
        analise.alertas.forEach(alerta => {
            const bloco = document.createElement('div')
            const cores = {
                alto: 'border-red-500 bg-red-950/40',
                moderado: 'border-amber-400 bg-amber-950/30',
                informativo: 'border-blue-500 bg-blue-950/30'
            }
            bloco.className = `border-l-4 p-3 rounded ${cores[alerta.nivel]}`
            const titulo = document.createElement('strong')
            titulo.className = 'block text-slate-100'
            titulo.textContent = alerta.titulo
            const detalhe = document.createElement('span')
            detalhe.className = 'text-slate-300'
            detalhe.textContent = alerta.detalhe
            bloco.append(titulo, detalhe)
            alertas.appendChild(bloco)
        })
    }

    qualidade.innerHTML = ''
    analise.limitacoes.forEach(texto => {
        const item = document.createElement('li')
        item.textContent = texto
        qualidade.appendChild(item)
    })

    const campoScore = document.getElementById('campoScore')
    const classificacaoScore = document.getElementById('classificacaoScore')
    const coresRiscoCard = {
        BAIXO: 'bg-emerald-600',
        MODERADO: 'bg-amber-500',
        ALTO: 'bg-red-600'
    }
    campoScore.textContent = analise.risco
    classificacaoScore.classList.remove('bg-red-500', 'bg-red-600', 'bg-amber-400', 'bg-amber-500', 'bg-emerald-600')
    classificacaoScore.classList.add(coresRiscoCard[analise.risco])
    classificacaoScore.textContent = `${analise.alertas.filter(alerta => alerta.nivel === 'alto').length} alto(s) · ${analise.alertas.filter(alerta => alerta.nivel === 'moderado').length} moderado(s)`
}


document.addEventListener('DOMContentLoaded', () => {
    let paciente = JSON.parse(localStorage.getItem('paciente'))
    const casoClinico = JSON.parse(localStorage.getItem('casoClinicoImportado') || '{}')

    //Validar se eiste a variável
    if(!paciente){
        alert('Nenhum dado do paciente encontrado, Volte a página inicial e inicie uma nova simulação!')
        window.location.href = 'index.html'
        return
    }

    //Resgatar as variáveis
    let idade = transformarNumero(paciente.idade)
    let peso = transformarNumero(paciente.peso)
    let altura = transformarNumero(paciente.alturaNum)
    let sao2 = transformarNumero(paciente.sao2)
    let hemoglobina = transformarNumero(paciente.hemoglobina)
    let fluxo = transformarNumero(paciente.fluxo)
    let hct = transformarNumero(paciente.hematocrito)
    let lactato = transformarNumero(paciente.lactato)

    //Resgatar e imprimir os dados
    let campoSexo = document.getElementById('campoSexo')
    let campoIdade = document.getElementById('campoIdade')
    let campoPeso = document.getElementById('campoPeso')
    let campoSC = document.getElementById('campoSC')
    let campoido2 = document.getElementById('campoido2')
    let origemIdo2 = document.getElementById('origemIdo2')
    let campoHb = document.getElementById('campoHb')
    let campoHct = document.getElementById('campoHct')
    let campoLactato = document.getElementById('campoLactato')
    let campoIC = document.getElementById('campoIC')
    let classificacaoido2 = document.getElementById('classificacaoido2')
    let classificacaoHb = document.getElementById('classificacaoHb')
    let classificacaoHct = document.getElementById('classificacaoHct')
    let classificacaoLactato = document.getElementById('classificacaoLactato')
    let classificacaoIC = document.getElementById('classificacaoIC')
    let campoScore = document.getElementById('campoScore')
    let classificacaoScore = document.getElementById('classificacaoScore')
    let btnExames = document.getElementById('btnExames')
    let btnNovosExames = document.getElementById('btnNovosExames')
    let btnVerMais = document.getElementById('btnVerMais')
    let btnVerMenos = document.getElementById('btnVerMenos')
    let maisExames = document.getElementById('maisExames')
    let tabelaExames = document.getElementById('tabelaExames')
    let buttonsGrafico = document.getElementById('buttonsGrafico')
    let btnGraficoLactato = document.getElementById('btnGraficoLactato')
    let btnGraficoido2 = document.getElementById('btnGraficoido2')
    let btnGraficoHCT = document.getElementById('btnGraficoHCT')
    let btnGraficoHB = document.getElementById('btnGraficoHB')
    let btnGraficoIC = document.getElementById('btnGraficoIC')
    let btnGraficoSvo2 = document.getElementById('btnGraficoSvo2')
    let btnGraficoO2er = document.getElementById('btnGraficoO2er')
    let btnRelatorio = document.getElementById('btnRelatorio')
    
    //Conteúdo Header
    campoSexo.textContent = `Paciente: ${paciente.sexo}`
    campoIdade.textContent = `${idade} anos`
    campoPeso.textContent = `${peso} Kg`

    //Conteúdo cards

    //Hemoglobina
    campoHb.textContent = hemoglobina
    classificarHemoglobina(hemoglobina, classificacaoHb)
    
    //Hematócrito
    campoHct.textContent = hct
    classificarHematocrito(hct, classificacaoHct)

    //Lactato
    campoLactato.textContent = lactato
    classificarLactato(lactato, classificacaoLactato)

    //Superfície Corporal
    let SC = superficieCorporal(peso,altura)
    campoSC.textContent = `SC: ${formatarMetrica(SC, 2)} m²`

    //Oferta de oxigênio iDO²
    let ido2 = ofertaOxigenio(hemoglobina, sao2, fluxo, SC)
    campoido2.textContent = ido2
    classificarOfertaOxigenio(ido2, classificacaoido2)
    
    

    //Índice cardíaco
    let IC = indiceCardiaco(fluxo, SC)
    campoIC.textContent = IC
    classificarIC(IC, classificacaoIC)
    

    // Índice interno mantido apenas nos registros para compatibilidade histórica.
    let scoreTotal = score(ido2, hct, lactato, IC)


    //Guardar os dados em um array de objetos
    let historicoExames = []

    let examesIniciais = completarExame({
        tempo: 0,
        sao2: sao2,
        sao2Informada: Number.isFinite(sao2),
        hb: hemoglobina,
        hct: hct,
        lactato: lactato,
        fluxo
    }, SC)

    const historicoImportado = JSON.parse(localStorage.getItem('historicoImportado') || 'null')
    historicoExames = Array.isArray(historicoImportado) && historicoImportado.length
        ? historicoImportado.map(exame => completarExame(exame, SC))
        : [examesIniciais]
    console.log('Exames Iniciais: ', historicoExames)
    
    //Resgatar os dados
        let tempo = document.getElementById('tempo')
        let ph = document.getElementById('ph')
        let pao2 = document.getElementById('pao2')
        let paco2 = document.getElementById('paco2')
        let hco3 = document.getElementById('hco3')
        let be = document.getElementById('be')
        let lactatoAtt = document.getElementById('lactatoAtt')
        let unidadeLactato = document.getElementById('unidadeLactato')
        let k = document.getElementById('k')
        let ca = document.getElementById('ca2')
        let hb = document.getElementById('hb')
        let hctAtt = document.getElementById('hctAtt')
        let svo2 = document.getElementById('svo2')
        let sao2Att = document.getElementById('sao2Att')
        let campoPh = document.getElementById('campoPh')
        let campoPao2 = document.getElementById('campoPao2')
        let campoPaco2 = document.getElementById('campoPaco2')
        let campoSao2 = document.getElementById('campoSao2')
        let campoHco3 = document.getElementById('campoHco3')
        let campoBe = document.getElementById('campoBe')
        let campoLactatoExame = document.getElementById('campoLactatoExame')
        let campoK = document.getElementById('campoK')
        let campoCa = document.getElementById('campoCa')
        let campoHbExame = document.getElementById('campoHbExame')
        let campoHctExame = document.getElementById('campoHctExame')
        let campoSvo2 = document.getElementById('campoSvo2')
        let campoTempo = document.getElementById('campoTempo')
        let campoFluxo = document.getElementById('campoFluxo')
        let fluxoInput = document.getElementById('fluxoInput')
        let temperaturaAtt = document.getElementById('temperaturaAtt')
        let pamAtt = document.getElementById('pamAtt')
        let fio2 = document.getElementById('fio2')
        let ivo2 = document.getElementById('ivo2')
        let gapPco2 = document.getElementById('gapPco2')
        let na = document.getElementById('na')
        let cl = document.getElementById('cl')
        let glicose = document.getElementById('glicose')
        let campoTemperaturaAtt = document.getElementById('campoTemperaturaAtt')
        let campoPamAtt = document.getElementById('campoPamAtt')
        let campoFio2 = document.getElementById('campoFio2')
        let campoIvo2 = document.getElementById('campoIvo2')
        let campoGapPco2 = document.getElementById('campoGapPco2')
        let campoNa = document.getElementById('campoNa')
        let campoCl = document.getElementById('campoCl')
        let campoGlicose = document.getElementById('campoGlicose')
    

        const camposExames = [
        {input: tempo, campo: campoTempo, unidade: 'min'},
        {input: fluxoInput, campo: campoFluxo, unidade: 'L/min'},
        {input: ph, campo: campoPh, unidade: ''},
        {input: pao2, campo: campoPao2, unidade: 'mmHg'},
        {input: paco2, campo: campoPaco2, unidade: 'mmHg'},
        {input: hco3, campo: campoHco3, unidade: 'mEq/L'},
        {input: be, campo: campoBe, unidade: 'mEq/L'},
        {input: lactatoAtt, campo: campoLactatoExame, unidade: () => unidadeLactato.value},
        {input: k, campo: campoK, unidade: 'mEq/L'},
        {input: ca, campo: campoCa, unidade: 'mmol/L'},
        {input: hb, campo: campoHbExame, unidade: 'g/dL'},
        {input: hctAtt, campo: campoHctExame, unidade: '%'},
        {input: svo2, campo: campoSvo2, unidade: '%'},
        {input: sao2Att, campo: campoSao2, unidade: '%'},
        {input: temperaturaAtt, campo: campoTemperaturaAtt, unidade: '°C'},
        {input: pamAtt, campo: campoPamAtt, unidade: 'mmHg'},
        {input: fio2, campo: campoFio2, unidade: '%'},
        {input: ivo2, campo: campoIvo2, unidade: 'mL/min/m²'},
        {input: gapPco2, campo: campoGapPco2, unidade: 'mmHg'},
        {input: na, campo: campoNa, unidade: 'mmol/L'},
        {input: cl, campo: campoCl, unidade: 'mmol/L'},
        {input: glicose, campo: campoGlicose, unidade: 'mg/dL'},
    ]

    const limites = {'lactato': 4, 'ido2': 280, 'HbAdulto': 7.5, 'HbPediatrico': 9, 'HctAdulto': 22, 'HctPediatrico':25, 'IC': 2.2, 'svo2': 70, 'o2er': 30}


    //Tabela Monitorização
    historicoExames.forEach(exame => AtualizarTabela(exame, tabelaExames, exame.ido2, exame.IC))

    const exameMaisRecente = historicoExames[historicoExames.length - 1]
    origemIdo2.textContent = descreverOrigemIdo2(exameMaisRecente)
    hemoglobina = exameMaisRecente.hb
    hct = exameMaisRecente.hct
    lactato = exameMaisRecente.lactato
    fluxo = exameMaisRecente.fluxo
    sao2 = exameMaisRecente.sao2
    ido2 = exameMaisRecente.ido2
    IC = exameMaisRecente.IC
    campoHb.textContent = hemoglobina
    campoHct.textContent = hct
    campoLactato.textContent = lactato
    campoido2.textContent = ido2
    campoIC.textContent = IC
    classificarHemoglobina(hemoglobina, classificacaoHb)
    classificarHematocrito(hct, classificacaoHct)
    classificarLactato(lactato, classificacaoLactato)
    classificarOfertaOxigenio(ido2, classificacaoido2)
    classificarIC(IC, classificacaoIC)
    if (historicoExames.length > 1) {
        criarGrafico('ido2', historicoExames, limites.ido2)
    }

    let analiseAtual = montarAnalisePerfusional(paciente, historicoExames, casoClinico, SC)
    renderizarAnalisePerfusional(analiseAtual)

    


    //Monitorização Laboratorial
    btnExames.addEventListener('click', () => {
    
        camposExames.forEach(item => {
            if(item.input.value){
                const unidade = typeof item.unidade === 'function' ? item.unidade() : item.unidade
                item.campo.textContent = `${item.input.value} ${unidade}`
                item.input.classList.add('hidden')
                item.campo.classList.remove('hidden')
            }
        })

        if(fluxoInput.value){
            fluxo = Number(fluxoInput.value)
        }
        
       
        
        //Atualizar os dados

        //hemoglobina e hematócrito
        if(hb.value && hctAtt.value){
            hemoglobina = Number(hb.value)
            hct = Number(hctAtt.value)
        }else if(hb.value && !hctAtt.value){
            hemoglobina = Number(hb.value)
            hct = calcularHct(hemoglobina)
        }else if(!hb.value && hctAtt.value){
            hct = Number(hctAtt.value)
            hemoglobina = calcularHb(hct)
        }
        campoHb.textContent = hemoglobina
        classificarHemoglobina(hemoglobina, classificacaoHb)
        campoHct.textContent = hct
        classificarHematocrito(hct, classificacaoHct)

        //Lactato
        const lactatoConvertido = converterLactatoParaMmol(lactatoAtt.value, unidadeLactato.value)
        if(lactatoConvertido !== null){
            lactato = lactatoConvertido
        }
        campoLactato.textContent = lactato
        classificarLactato(lactato, classificacaoLactato)

        //IC
        fluxo = Number(fluxoInput.value)
        IC = indiceCardiaco(fluxo, SC)
        campoIC.textContent = IC
        classificarIC(IC, classificacaoIC)

        //iDO²
        sao2 = Number(sao2Att.value)
        ido2 = ofertaOxigenio(hemoglobina, sao2, fluxo, SC, transformarNumero(pao2.value))
        campoido2.textContent = ido2
        classificarOfertaOxigenio(ido2, classificacaoido2)

        const examesObrigatorios = [tempo, fluxoInput, sao2Att]
        if(examesObrigatorios.some(exame => exame.value === '' || exame.value === null)){
            alert('Preencha os exames Obrigatórios! Tempo de CEC, fluxo, hemoglobina ou hematócrito e SaO2')
            return
        }

        if(!hb.value && !hctAtt.value){
            alert('Informe a Hemoglobina ou Hematócrito, se informar apenas um o sistema calcula automaticamente!')
            return
        }

        // Índice interno mantido no histórico; o card exibe o risco integrado.
        scoreTotal = score(ido2, hct, lactato, IC)

        //Adicionar valores ao dicionário
        const exames = completarExame({
            tempo: Number(tempo.value),
            fluxo: Number(fluxo),
            ph: transformarNumero(ph.value),
            pao2: transformarNumero(pao2.value),
            paco2: transformarNumero(paco2.value),
            hco3: transformarNumero(hco3.value),
            be: transformarNumero(be.value),
            lactato: Number(lactato),
            lactatoOriginal: transformarNumero(lactatoAtt.value),
            unidadeLactatoOriginal: unidadeLactato.value,
            lactatoMgDl: unidadeLactato.value === 'mg/dL'
                ? transformarNumero(lactatoAtt.value)
                : null,
            k: transformarNumero(k.value),
            ca: transformarNumero(ca.value),
            hb: Number(hemoglobina),
            hct: Number(hct),
            svo2: transformarNumero(svo2.value),
            sao2: Number(sao2),
            sao2Informada: true,
            temperatura: transformarNumero(temperaturaAtt.value),
            pam: transformarNumero(pamAtt.value),
            fio2: transformarNumero(fio2.value),
            ivo2: transformarNumero(ivo2.value),
            gapPco2: transformarNumero(gapPco2.value),
            na: transformarNumero(na.value),
            cl: transformarNumero(cl.value),
            glicose: transformarNumero(glicose.value)
        }, SC)
        historicoExames.push(exames)
        origemIdo2.textContent = descreverOrigemIdo2(exames)
        console.log('Histórico atualizado:', historicoExames)

        //Atualizar tabela exames
        AtualizarTabela(exames, tabelaExames, exames.ido2, exames.IC)

        //Criar  gráfico
        criarGrafico('ido2', historicoExames, limites.ido2)
        buttonsGrafico.classList.remove('hidden')
        analiseAtual = montarAnalisePerfusional(paciente, historicoExames, casoClinico, SC)
        renderizarAnalisePerfusional(analiseAtual)
    })
    
    btnNovosExames.addEventListener('click', () =>{
        resetarExames(camposExames)
    })

    btnVerMais.addEventListener('click', () => {
        maisExames.classList.remove('hidden')
        btnVerMais.classList.add('hidden')
        btnVerMenos.classList.remove('hidden')
    })

    btnVerMenos.addEventListener('click', () => {
        maisExames.classList.add('hidden')
        btnVerMenos.classList.add('hidden')
        btnVerMais.classList.remove('hidden')
    })

    btnGraficoido2.addEventListener('click', () => {
        criarGrafico('ido2', historicoExames, limites.ido2)
    })

    btnGraficoLactato.addEventListener('click', () => {
        criarGrafico('lactato', historicoExames, limites.lactato)
    })

    btnGraficoHB.addEventListener('click', () => {
        criarGrafico('hb', historicoExames, limites.HbAdulto)
    })

    btnGraficoHCT.addEventListener('click', () => {
        criarGrafico('hct', historicoExames, limites.HctAdulto)
    })

    btnGraficoIC.addEventListener('click', () => {
        criarGrafico('IC', historicoExames, limites.IC)
    })

    btnGraficoSvo2.addEventListener('click', () => {
        criarGrafico('svo2', historicoExames, limites.svo2)
    })

    btnGraficoO2er.addEventListener('click', () => {
        criarGrafico('o2er', historicoExames, limites.o2er)
    })

    btnRelatorio.addEventListener('click', () => {
        const relatorio = document.getElementById('relatorio')
        const relatorioPaciente = document.getElementById('relatorioPaciente')
        const relatorioTabela = document.getElementById('relatorioTabela')
        const relatorioAnalise = document.getElementById('relatorioAnalise')
        const relatorioGraficos = document.getElementById('relatorioGraficos')
        relatorio.classList.remove('hidden')
        relatorio.style.position = 'absolute'
        relatorio.style.left = '-10000px'
        relatorio.style.width = '1000px'
        document.getElementById('relatorioGeradoEm').textContent =
            `Gerado em ${new Date().toLocaleString('pt-BR')}`

        relatorioPaciente.innerHTML = `
            <p><strong>Sexo:</strong> ${paciente.sexo}</p>
            <p><strong>Idade:</strong> ${idade} anos</p>
            <p><strong>Peso:</strong> ${peso} kg</p>
            <p><strong>Altura:</strong> ${altura} cm</p>
            <p><strong>Superfície corporal:</strong> ${formatarMetrica(SC, 2)} m²</p>
            <p><strong>Registros:</strong> ${historicoExames.length}</p>
        `
        relatorioTabela.innerHTML = ''
        const tabelaRelatorio = tabelaExames.cloneNode(true)
        tabelaRelatorio.removeAttribute('id')
        relatorioTabela.appendChild(tabelaRelatorio)
        relatorioAnalise.innerHTML = ''
        const analiseRelatorio = document.getElementById('analisePerfusional').cloneNode(true)
        analiseRelatorio.removeAttribute('id')
        analiseRelatorio.className = 'border border-slate-400 rounded-xl p-4'
        relatorioAnalise.appendChild(analiseRelatorio)
        relatorioGraficos.innerHTML = ''
        criarGraficoRelatorio(relatorioGraficos, 'Oferta de oxigênio indexada (iDO2)', 'ido2', historicoExames, limites.ido2)
        criarGraficoRelatorio(relatorioGraficos, 'Lactato', 'lactato', historicoExames, limites.lactato)
        criarGraficoRelatorio(relatorioGraficos, 'Índice cardíaco', 'IC', historicoExames, limites.IC)
        criarGraficoRelatorio(relatorioGraficos, 'Hemoglobina', 'hb', historicoExames, limites.HbAdulto)
        criarGraficoRelatorio(relatorioGraficos, 'Hematócrito', 'hct', historicoExames, limites.HctAdulto)
        criarGraficoRelatorio(relatorioGraficos, 'SvO2', 'svo2', historicoExames, limites.svo2)
        criarGraficoRelatorio(relatorioGraficos, 'Extração de O2', 'o2er', historicoExames, limites.o2er)
        window.addEventListener('afterprint', () => {
            relatorio.classList.add('hidden')
            relatorio.removeAttribute('style')
        }, { once: true })
        setTimeout(() => window.print(), 250)
    })
    



})
