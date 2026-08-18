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
    { id: 'saida-cec', titulo: 'Saida da CEC', itens: ['Reaquecimento e condicoes de saida conferidos', 'Volume/hemoconcentracao/transfusao avaliados', 'Comunicacao com equipe cirurgica/anestesica registrada'] },
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
    const resposta = await fetch(url, opcoes)
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
        montarLinhaInfo('Resp. montagem', perfusionista.responsavelMontagem),
        montarLinhaInfo('Resp. CEC', perfusionista.responsavelCec),
        montarLinhaInfo('Perfusionista check', perfusionista.perfusionistaCheck),
        montarLinhaInfo('Responsavel final', perfusionista.responsavelFinal),
        montarLinhaInfo('Intercorrencias tecnicas', perfusionista.intercorrenciasTecnicas)
    ].join('')

    document.getElementById('relatorioCaso').innerHTML = montarRelatorioHtml(caso)
    document.getElementById('checklistCaso').innerHTML = montarChecklistHtml(caso)
}

function montarTabelaMonitorizacao(dados = []){
    if(!Array.isArray(dados) || !dados.length) return '<p class="case-muted">Sem monitorizacao salva.</p>'
    const linhas = dados.map(item => `
        <tr>
            <td>${valorOuTraco(item.tempo)}</td>
            <td>${valorOuTraco(item.hb)}</td>
            <td>${valorOuTraco(item.hct)}</td>
            <td>${valorOuTraco(item.lactato)}</td>
            <td>${valorOuTraco(item.ido2)}</td>
            <td>${valorOuTraco(item.IC ?? item.ic)}</td>
            <td>${valorOuTraco(item.svo2)}</td>
            <td>${valorOuTraco(item.o2er)}</td>
        </tr>
    `).join('')
    return `
        <div class="case-table-wrap">
            <table class="case-data-table">
                <thead>
                    <tr>
                        <th>Tempo</th>
                        <th>Hb</th>
                        <th>Hct</th>
                        <th>Lactato</th>
                        <th>iDO2</th>
                        <th>IC</th>
                        <th>SvO2</th>
                        <th>O2ER</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `
}

function montarRelatorioHtml(caso){
    const analise = caso.analysis || {}
    const resumo = Array.isArray(analise.resumo) ? analise.resumo : []
    const metricas = Array.isArray(analise.metricas) ? analise.metricas : []
    const alertas = Array.isArray(analise.alertas) ? analise.alertas : []
    const limitacoes = Array.isArray(analise.limitacoes) ? analise.limitacoes : []
    return `
        <div class="case-report-risk">Risco integrado: <strong>${escapeHtml(analise.risco || 'nao calculado')}</strong></div>
        <div class="case-report-grid">
            ${resumo.map(item => montarLinhaInfo(item.rotulo, item.valor)).join('') || '<p class="case-muted">Sem resumo salvo.</p>'}
        </div>
        <h4>Monitorizacao</h4>
        ${montarTabelaMonitorizacao(caso.monitoring)}
        <h4>Metricas calculadas</h4>
        <ul class="case-list-plain">
            ${metricas.map(([rotulo, valor]) => `<li><strong>${escapeHtml(rotulo)}:</strong> ${escapeHtml(valor)}</li>`).join('') || '<li>Sem metricas salvas.</li>'}
        </ul>
        <h4>Alertas</h4>
        <ul class="case-list-plain">
            ${alertas.map(alerta => `<li><strong>${escapeHtml(alerta.titulo)}:</strong> ${escapeHtml(alerta.detalhe)}</li>`).join('') || '<li>Nenhum alerta salvo.</li>'}
        </ul>
        <h4>Qualidade e limitacoes</h4>
        <ul class="case-list-plain">
            ${limitacoes.map(texto => `<li>${escapeHtml(texto)}</li>`).join('') || '<li>Sem limitacoes salvas.</li>'}
        </ul>
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
            ${montarLinhaInfo('Resp. montagem', metadata.responsavelMontagem)}
            ${montarLinhaInfo('Resp. CEC', metadata.responsavelCec)}
            ${montarLinhaInfo('Perfusionista check', metadata.perfusionistaCheck)}
            ${montarLinhaInfo('Responsavel final', metadata.responsavelFinal)}
            ${montarLinhaInfo('Intercorrencias tecnicas', metadata.intercorrenciasTecnicas)}
        </div>
        <div class="case-check-grid">${secoes}</div>
    `
}

function imprimirConteudo(tipo){
    if(!casoAtual) return
    const resumo = montarResumoCaso(casoAtual)
    const printArea = document.getElementById('casePrintArea')
    const titulo = tipo === 'checklist'
        ? 'Checklist de perfusao'
        : 'Relatorio final PerfuseLab'
    const conteudo = tipo === 'checklist'
        ? montarChecklistHtml(casoAtual)
        : montarRelatorioHtml(casoAtual)
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAtualizarCasos').addEventListener('click', carregarCasos)
    document.getElementById('buscaCasos').addEventListener('input', () => {
        window.clearTimeout(window.__perfuseLabBuscaCasos)
        window.__perfuseLabBuscaCasos = window.setTimeout(carregarCasos, 350)
    })
    document.getElementById('btnImprimirRelatorio').addEventListener('click', () => imprimirConteudo('relatorio'))
    document.getElementById('btnImprimirChecklist').addEventListener('click', () => imprimirConteudo('checklist'))
    carregarCasos()
})
