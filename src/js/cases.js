const API_BASE_URL = typeof window !== 'undefined' && window.PerfuseLabConfig
    ? window.PerfuseLabConfig.getApiBaseUrl()
    : ''

const CHECKLIST_SECOES = Object.freeze([
    { id: 'identificacao', titulo: 'Identificacao e equipe', itens: ['Paciente, procedimento, data e sala cirurgica conferidos', 'Perfusionista da montagem, responsavel pela CEC e perfusionista check identificados', 'Peso, altura, BSA e metas iniciais revisados', 'Exames/laboratorio basal disponiveis'] },
    { id: 'preparo-bomba', titulo: 'Preparo da bomba', itens: ['Maquina de CEC conferida', 'Aparelho de TCA disponivel e funcional', 'Cardioplegia/rolete conferidos', 'Bateria da maquina testada', 'Equipamentos de seguranca, manivela/hand crank e luz de emergencia disponiveis', 'Painel da bomba com SC/tubo/L/min conferido', 'Circulador de agua e controle termico funcionando', 'Vaporizador de gas conferido quando aplicavel', 'Conferencia de vazamentos e retirada de bolhas do circuito', 'Pincas, conectores e tubos apos passagem esteril conferidos', 'Drogas, cardioplegia, gelo quando necessario, sangue e derivados disponiveis', 'Canulas arteriais e venosas disponiveis'] },
    { id: 'bomba-posicionada', titulo: 'Bomba posicionada', itens: ['Aquecimento do prime conferido', 'Cronometro, fluxometro e blender testados', 'Aparelho de vacuo testado e funcionando', 'Sensores de temperatura posicionados/testados', 'Planejamento da CEC alinhado com equipe cirurgica e anestesica', 'Perfusato conferido', 'Transdutores de pressao funcionando', 'Teste de pulso e resistencia documentado', 'Calculos da CEC revisados antes do inicio'] },
    { id: 'circuito', titulo: 'Circuito e insumos', itens: ['Circuito montado e revisado', 'Oxigenador e reservatorio conferidos', 'Prime/RAP/cardioplegia revisados'] },
    { id: 'anticoagulacao', titulo: 'Anticoagulacao', itens: ['TCA basal registrado', 'Dose de heparina/protocolo conferidos', 'Heparinizacao comunicada e documentada', 'TCA pre-CEC ou pos-heparina dentro do alvo institucional'] },
    { id: 'inicio-cec', titulo: 'Inicio da CEC', itens: ['Canulacao e linhas sem intercorrencias aparentes', 'Fluxo inicial e indice cardiaco avaliados', 'Pressoes do circuito monitoradas', 'Gasometria inicial documentada'] },
    { id: 'manutencao-cec', titulo: 'Manutencao da CEC', itens: ['Gasometrias e eletrolitos acompanhados', 'iDO2, lactato, SvO2/O2ER revisados', 'Temperatura e estrategia acido-base acompanhadas'] },
    { id: 'saida-cec', titulo: 'Saida da CEC', itens: ['Reaquecimento e condicoes de saida conferidos', 'Volume/hemoconcentracao/transfusao avaliados', 'Horario de inicio/fim da CEC e tempo de clampeamento registrados', 'Comunicacao com equipe cirurgica/anestesica registrada'] },
    { id: 'pos-cec', titulo: 'Pos-CEC', itens: ['Protamina/reversao e TCA pos documentados', 'Debito urinario e balanco revisados', 'Ocorrencias, intercorrencias tecnicas e pendencias registradas'] }
])

let casosCarregados = []
let casoAtual = null

function escapeHtml(valor){
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function formatarData(valor){
    if(!valor) return 'Nao informado'
    const data = new Date(valor)
    return Number.isNaN(data.getTime())
        ? escapeHtml(valor)
        : data.toLocaleString('pt-BR')
}

function valorOuTraco(valor, unidade = ''){
    if(valor === undefined || valor === null || valor === '') return '---'
    return `${escapeHtml(valor)}${unidade ? ` ${unidade}` : ''}`
}

function tempoMinutosOuVazio(valor){
    if(valor === undefined || valor === null || valor === '') return ''
    return `${valor} min`
}

function resumoChecklist(estado = {}){
    const ids = CHECKLIST_SECOES.flatMap(secao => secao.itens.map((_, indice) => `${secao.id}-${indice}`))
    const total = ids.length
    const concluidos = ids.filter(id => estado[id]?.status === 'concluido').length
    return { total, concluidos, pendentes: total - concluidos }
}

function montarLinhaInfo(rotulo, valor){
    return `
        <div class="case-info-card">
            <span>${escapeHtml(rotulo)}</span>
            <strong>${valorOuTraco(valor)}</strong>
        </div>
    `
}

function obterPerfusionista(caso){
    return {
        ...(caso?.checklist?.metadata || {}),
        ...(caso?.perfusionist || {})
    }
}

function montarResumoCaso(caso){
    const paciente = caso.patient || {}
    const perfusionista = obterPerfusionista(caso)
    const procedimento = perfusionista.procedimento || paciente.procedimento || caso.clinicalCase?.paciente?.procedimento
    return {
        paciente,
        perfusionista,
        procedimento,
        idade: paciente.idade ? `${paciente.idade} anos` : 'idade nao informada',
        sexo: paciente.sexo || 'sexo nao informado'
    }
}

async function buscarJson(url, opcoes){
    const fetchApi = window.PerfuseLabConfig?.authenticatedFetch || fetch
    const resposta = await fetchApi(url, opcoes)
    const corpo = await resposta.json().catch(() => ({}))
    if(!resposta.ok){
        throw new Error(corpo.error || 'Nao foi possivel carregar os dados.')
    }
    return corpo
}

async function carregarCasos(){
    const status = document.getElementById('statusCasos')
    const contador = document.getElementById('contadorCasos')
    status.textContent = 'Carregando casos...'
    try {
        const termo = document.getElementById('buscaCasos').value.trim()
        const params = new URLSearchParams({ limit: '60' })
        if(termo) params.set('search', termo)
        const corpo = await buscarJson(`${API_BASE_URL}/api/cases?${params.toString()}`)
        casosCarregados = corpo.data || []
        contador.textContent = casosCarregados.length
        renderizarListaCasos()
        status.textContent = casosCarregados.length
            ? 'Selecione um caso para consultar.'
            : 'Nenhum caso ativo encontrado no banco.'
    } catch (erro) {
        casosCarregados = []
        contador.textContent = '0'
        renderizarListaCasos()
        status.textContent = `Erro: ${erro.message} Confira se o servidor com MongoDB esta rodando.`
    }
}

function renderizarListaCasos(){
    const lista = document.getElementById('listaCasos')
    lista.innerHTML = ''
    casosCarregados.forEach(caso => {
        const resumo = montarResumoCaso(caso)
        const check = caso.checklist?.summary || resumoChecklist(caso.checklist?.state)
        const botao = document.createElement('button')
        botao.type = 'button'
        botao.className = 'case-list-item'
        botao.dataset.id = caso._id
        botao.innerHTML = `
            <strong>${escapeHtml(caso.title || resumo.procedimento || 'Caso PerfuseLab')}</strong>
            <span>${escapeHtml(resumo.sexo)} · ${escapeHtml(resumo.idade)} · ${formatarData(caso.updatedAt)}</span>
            <small>Checklist: ${check.concluidos ?? 0}/${check.total ?? 0} · Risco: ${escapeHtml(caso.analysis?.risco || 'nao calculado')}</small>
        `
        botao.addEventListener('click', () => carregarDetalheCaso(caso._id))
        lista.appendChild(botao)
    })
}

async function carregarDetalheCaso(id){
    const status = document.getElementById('statusCasos')
    status.textContent = 'Abrindo caso...'
    try {
        const corpo = await buscarJson(`${API_BASE_URL}/api/cases/${id}`)
        casoAtual = corpo.data
        renderizarDetalheCaso(casoAtual)
        status.textContent = 'Caso carregado.'
    } catch (erro) {
        status.textContent = `Erro: ${erro.message}`
    }
}

function renderizarDetalheCaso(caso){
    const vazio = document.getElementById('casoVazio')
    const painel = document.getElementById('casoSelecionado')
    const resumo = montarResumoCaso(caso)
    const paciente = resumo.paciente
    const perfusionista = resumo.perfusionista

    vazio.classList.add('hidden')
    painel.classList.remove('hidden')
    document.getElementById('tituloCasoSelecionado').textContent = caso.title || resumo.procedimento || 'Caso PerfuseLab'
    document.getElementById('subtituloCasoSelecionado').textContent = `${resumo.sexo} · ${resumo.idade} · atualizado em ${formatarData(caso.updatedAt)}`

    document.getElementById('dadosPacienteCaso').innerHTML = [
        montarLinhaInfo('Sexo', paciente.sexo),
        montarLinhaInfo('Idade', paciente.idade ? `${paciente.idade} anos` : ''),
        montarLinhaInfo('Peso', paciente.peso ? `${paciente.peso} kg` : ''),
        montarLinhaInfo('Altura', paciente.alturaNum || paciente.altura ? `${paciente.alturaNum || paciente.altura} cm` : ''),
        montarLinhaInfo('Procedimento', resumo.procedimento),
        montarLinhaInfo('Registros', Array.isArray(caso.monitoring) ? caso.monitoring.length : 0)
    ].join('')

    document.getElementById('dadosPerfusionistaCaso').innerHTML = [
        montarLinhaInfo('Data', perfusionista.data),
        montarLinhaInfo('Sala cirurgica', perfusionista.salaCirurgica),
        montarLinhaInfo('Inicio da CEC', perfusionista.horarioInicioCec),
        montarLinhaInfo('Fim da CEC', perfusionista.horarioFimCec),
        montarLinhaInfo('Tempo clampeamento', tempoMinutosOuVazio(perfusionista.tempoClampeamento)),
        montarLinhaInfo('Resp. montagem', perfusionista.responsavelMontagem),
        montarLinhaInfo('Resp. CEC', perfusionista.responsavelCec),
        montarLinhaInfo('Perfusionista check', perfusionista.perfusionistaCheck),
        montarLinhaInfo('Responsavel final', perfusionista.responsavelFinal),
        montarLinhaInfo('Intercorrencias tecnicas', perfusionista.intercorrenciasTecnicas)
    ].join('')

    document.getElementById('relatorioCaso').innerHTML = montarRelatorioHtml(caso)
    document.getElementById('checklistCaso').innerHTML = montarChecklistHtml(caso)
}

function obterValorRegistro(item, campos){
    for(const campo of campos){
        const valor = item?.[campo]
        if(valor !== undefined && valor !== null && valor !== '') return valor
    }
    return null
}

function valorMonitorizacao(item, campos, unidade = ''){
    return valorOuTraco(obterValorRegistro(item, campos), unidade)
}

function montarTabelaMonitorizacao(dados = [], modo = 'simples'){
    if(!Array.isArray(dados) || !dados.length) return '<p class="case-muted">Sem monitorizacao salva.</p>'
    const completo = modo === 'completo'
    const colunasEssenciais = [
        { titulo: 'Tempo', valor: item => valorMonitorizacao(item, ['tempo'], 'min') },
        { titulo: 'Fluxo', valor: item => valorMonitorizacao(item, ['fluxo'], 'L/min') },
        { titulo: 'IC', valor: item => valorMonitorizacao(item, ['IC', 'ic'], 'L/min/m²') },
        { titulo: 'iDO2', valor: item => valorMonitorizacao(item, ['ido2'], 'mL/min/m²') },
        { titulo: 'Hb', valor: item => valorMonitorizacao(item, ['hb'], 'g/dL') },
        { titulo: 'Hct', valor: item => valorMonitorizacao(item, ['hct'], '%') },
        { titulo: 'Lactato', valor: item => valorMonitorizacao(item, ['lactato'], 'mmol/L') },
        { titulo: 'SvO2', valor: item => valorMonitorizacao(item, ['svo2'], '%') }
    ]
    const colunasCompletas = [
        ...colunasEssenciais,
        { titulo: 'SaO2', valor: item => valorMonitorizacao(item, ['sao2'], '%') },
        { titulo: 'O2ER', valor: item => valorMonitorizacao(item, ['o2er'], '%') },
        { titulo: 'DO2/VO2', valor: item => valorMonitorizacao(item, ['relacaoDo2Vo2', 'do2_vo2']) },
        { titulo: 'pH', valor: item => valorMonitorizacao(item, ['ph']) },
        { titulo: 'PaCO2', valor: item => valorMonitorizacao(item, ['paco2'], 'mmHg') },
        { titulo: 'HCO3', valor: item => valorMonitorizacao(item, ['hco3'], 'mEq/L') },
        { titulo: 'PAM', valor: item => valorMonitorizacao(item, ['pam'], 'mmHg') },
        { titulo: 'Temp.', valor: item => valorMonitorizacao(item, ['temperatura'], '°C') }
    ]
    const colunas = completo ? colunasCompletas : colunasEssenciais
    const linhas = dados.map(item => `
        <tr>
            ${colunas.map(coluna => `<td>${coluna.valor(item)}</td>`).join('')}
        </tr>
    `).join('')
    return `
        <div class="case-table-wrap">
            <table class="case-data-table ${completo ? 'case-data-table--complete' : ''}">
                <thead>
                    <tr>${colunas.map(coluna => `<th>${coluna.titulo}</th>`).join('')}</tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `
}

function simplificarAlertaRelatorioCaso(alerta){
    const titulo = String(alerta?.titulo || 'Alerta')
    const detalhe = String(alerta?.detalhe || '')

    if(/PaO[₂2] acima/i.test(titulo) || /Hamilton|FiO[₂2] corrigida|press[aã]o barom[eé]trica/i.test(detalhe)){
        return {
            nivel: alerta?.nivel || 'informativo',
            titulo,
            detalhe: 'PaO2 acima de 150 mmHg. Revisar oxigenacao conforme contexto e consultar Informacoes tecnicas.'
        }
    }

    return {
        nivel: alerta?.nivel || 'informativo',
        titulo,
        detalhe: detalhe.replace(/;\s*equivale a extra[çc][aã]o de O[₂2].*$/i, '.')
    }
}

function selecionarAlertasRelatorioCaso(alertas = [], modo = 'simples'){
    const completo = modo === 'completo'
    const niveis = completo ? ['alto', 'moderado', 'informativo'] : ['alto', 'moderado']
    return alertas
        .filter(alerta => niveis.includes(alerta?.nivel))
        .map(simplificarAlertaRelatorioCaso)
        .slice(0, completo ? 8 : 5)
}

function montarIndicadoresRelatorioCaso(caso, modo = 'simples'){
    const analise = caso.analysis || {}
    const dados = Array.isArray(caso.monitoring) ? caso.monitoring : []
    const inicial = dados[0] || {}
    const final = dados[dados.length - 1] || {}
    const completo = modo === 'completo'
    const itens = [
        montarLinhaInfo('Risco integrado', analise.risco || 'nao calculado'),
        montarLinhaInfo('Tempo em CEC', valorMonitorizacao(final, ['tempo'], 'min')),
        montarLinhaInfo('Registros', dados.length),
        montarLinhaInfo('iDO2 final', valorMonitorizacao(final, ['ido2'], 'mL/min/m²')),
        montarLinhaInfo('IC final', valorMonitorizacao(final, ['IC', 'ic'], 'L/min/m²')),
        montarLinhaInfo('Hb final', valorMonitorizacao(final, ['hb'], 'g/dL')),
        montarLinhaInfo('Lactato inicial/final', `${valorMonitorizacao(inicial, ['lactato'], 'mmol/L')} -> ${valorMonitorizacao(final, ['lactato'], 'mmol/L')}`),
        montarLinhaInfo('SvO2 final', valorMonitorizacao(final, ['svo2'], '%')),
        montarLinhaInfo('O2ER final', valorMonitorizacao(final, ['o2er'], '%'))
    ]

    if(completo){
        itens.push(
            montarLinhaInfo('DO2/VO2 final', valorMonitorizacao(final, ['relacaoDo2Vo2', 'do2_vo2'])),
            montarLinhaInfo('pH final', valorMonitorizacao(final, ['ph'])),
            montarLinhaInfo('PAM final', valorMonitorizacao(final, ['pam'], 'mmHg')),
            montarLinhaInfo('Temperatura final', valorMonitorizacao(final, ['temperatura'], '°C'))
        )
    }

    return itens.join('')
}

function montarRelatorioHtml(caso, modo = 'simples'){
    const analise = caso.analysis || {}
    const alertas = Array.isArray(analise.alertas) ? analise.alertas : []
    const alertasRelatorio = selecionarAlertasRelatorioCaso(alertas, modo)
    const completo = modo === 'completo'
    const textoInterpretacao = {
        BAIXO: 'Sem alertas altos ou multiplos alertas moderados pelas regras configuradas.',
        MODERADO: 'Ha pontos de atencao que merecem revisao da tendencia e do contexto clinico.',
        ALTO: 'Ha pelo menos um alerta alto nas regras configuradas. Priorizar conferencia dos dados e discussao com a equipe.'
    }

    return `
        <div class="case-report-risk">Relatorio ${completo ? 'completo' : 'simples'} · Risco integrado: <strong>${escapeHtml(analise.risco || 'nao calculado')}</strong></div>
        <h4>Resumo</h4>
        <div class="case-report-grid">${montarIndicadoresRelatorioCaso(caso, modo)}</div>
        <h4>Interpretacao</h4>
        <p class="case-report-note">${escapeHtml(textoInterpretacao[analise.risco] || textoInterpretacao.MODERADO)}</p>
        <h4>${completo ? 'Monitorizacao ampliada' : 'Monitorizacao essencial'}</h4>
        ${montarTabelaMonitorizacao(caso.monitoring, modo)}
        <h4>Alertas principais</h4>
        <ul class="case-list-plain">
            ${alertasRelatorio.map(alerta => `<li><strong>${escapeHtml(alerta.titulo)}:</strong> ${escapeHtml(alerta.detalhe)}</li>`).join('') || '<li>Nenhum alerta principal salvo.</li>'}
        </ul>
        <p class="case-report-note">Formulas, limites detalhados e correcoes, incluindo FiO2/PaO2, ficam na pagina Informacoes tecnicas.</p>
    `
}

function montarChecklistHtml(caso){
    const estado = caso.checklist?.state || {}
    const resumo = resumoChecklist(estado)
    const metadata = obterPerfusionista(caso)
    const secoes = CHECKLIST_SECOES.map(secao => `
        <section class="case-check-section">
            <h4>${escapeHtml(secao.titulo)}</h4>
            ${secao.itens.map((texto, indice) => {
                const id = `${secao.id}-${indice}`
                const item = estado[id] || {}
                const concluido = item.status === 'concluido'
                return `
                    <div class="case-check-item ${concluido ? 'is-done' : 'is-pending'}">
                        <span>${concluido ? 'Concluido' : 'Pendente'}</span>
                        <p>${escapeHtml(texto)}</p>
                        ${item.observacao ? `<small>${escapeHtml(item.observacao)}</small>` : ''}
                    </div>
                `
            }).join('')}
        </section>
    `).join('')
    return `
        <div class="case-report-risk">Checklist: <strong>${resumo.concluidos}/${resumo.total} concluidos</strong> · ${resumo.pendentes} pendente(s)</div>
        <div class="case-report-grid">
            ${montarLinhaInfo('Data', metadata.data)}
            ${montarLinhaInfo('Sala cirurgica', metadata.salaCirurgica)}
            ${montarLinhaInfo('Inicio da CEC', metadata.horarioInicioCec)}
            ${montarLinhaInfo('Fim da CEC', metadata.horarioFimCec)}
            ${montarLinhaInfo('Tempo clampeamento', tempoMinutosOuVazio(metadata.tempoClampeamento))}
            ${montarLinhaInfo('Resp. montagem', metadata.responsavelMontagem)}
            ${montarLinhaInfo('Resp. CEC', metadata.responsavelCec)}
            ${montarLinhaInfo('Perfusionista check', metadata.perfusionistaCheck)}
            ${montarLinhaInfo('Responsavel final', metadata.responsavelFinal)}
            ${montarLinhaInfo('Intercorrencias tecnicas', metadata.intercorrenciasTecnicas)}
        </div>
        <div class="case-check-grid">${secoes}</div>
    `
}

function imprimirConteudo(tipo, modo = 'simples'){
    if(!casoAtual) return
    const resumo = montarResumoCaso(casoAtual)
    const printArea = document.getElementById('casePrintArea')
    const titulo = tipo === 'checklist'
        ? 'Checklist de perfusao'
        : `Relatorio ${modo === 'completo' ? 'completo' : 'simples'} PerfuseLab`
    const conteudo = tipo === 'checklist'
        ? montarChecklistHtml(casoAtual)
        : montarRelatorioHtml(casoAtual, modo)
    printArea.innerHTML = `
        <header class="case-print-header">
            <h1>${titulo}</h1>
            <p>${escapeHtml(casoAtual.title || resumo.procedimento || 'Caso PerfuseLab')}</p>
            <p>Paciente: ${escapeHtml(resumo.sexo)} · ${escapeHtml(resumo.idade)} · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </header>
        ${conteudo}
        <footer class="case-print-footer">Documento de apoio educacional/operacional. Validar com protocolo institucional e equipe assistencial.</footer>
    `
    printArea.classList.remove('hidden')
    document.body.classList.add('case-printing')
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('case-printing')
        printArea.classList.add('hidden')
        printArea.innerHTML = ''
    }, { once: true })
    window.print()
}

function abrirModalCaso(id){
    const modal = document.getElementById(id)
    if(!modal) return
    modal.classList.remove('hidden')
    document.body.classList.add('modal-open')
}

function fecharModalCaso(id){
    const modal = document.getElementById(id)
    if(!modal) return
    modal.classList.add('hidden')
    document.body.classList.remove('modal-open')
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAtualizarCasos').addEventListener('click', carregarCasos)
    document.getElementById('buscaCasos').addEventListener('input', () => {
        window.clearTimeout(window.__perfuseLabBuscaCasos)
        window.__perfuseLabBuscaCasos = window.setTimeout(carregarCasos, 350)
    })
    document.getElementById('btnGerarRelatorioCaso').addEventListener('click', () => abrirModalCaso('caseReportOptionsModal'))
    document.getElementById('btnFecharOpcoesRelatorioCaso').addEventListener('click', () => fecharModalCaso('caseReportOptionsModal'))
    document.getElementById('btnImprimirRelatorioSimplesCaso').addEventListener('click', () => {
        fecharModalCaso('caseReportOptionsModal')
        imprimirConteudo('relatorio', 'simples')
    })
    document.getElementById('btnImprimirRelatorioCompletoCaso').addEventListener('click', () => {
        fecharModalCaso('caseReportOptionsModal')
        imprimirConteudo('relatorio', 'completo')
    })
    document.getElementById('btnImprimirChecklist').addEventListener('click', () => imprimirConteudo('checklist'))
    document.querySelectorAll('[data-close-modal]').forEach(elemento => {
        elemento.addEventListener('click', () => fecharModalCaso(elemento.dataset.closeModal))
    })
    document.addEventListener('keydown', evento => {
        if(evento.key === 'Escape') fecharModalCaso('caseReportOptionsModal')
    })
    carregarCasos()
})
