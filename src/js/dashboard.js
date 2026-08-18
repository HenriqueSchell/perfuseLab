
let graficoAtual = null
const API_BASE_URL = typeof window !== 'undefined' && window.PerfuseLabConfig
    ? window.PerfuseLabConfig.getApiBaseUrl()
    : ''
const CONSTANTES_OXIGENIO = Object.freeze({
    capacidadeHb: 1.36,
    solubilidadePlasmatica: 0.003
})

const LIMIARES = Object.freeze({
    ido2: { alvoGdp: 280, cardCritico: 260, alertaAltoRazao: 0.9 },
    hb: { atencao: 7.5, preservada: 10, pediatricoGrafico: 9 },
    hct: { critico: 22, limítrofe: 24, pediatricoGrafico: 25 },
    lactato: { atencao: 2, critico: 4, elevacaoRazao: 1.1 },
    ic: { critico: 2.2, adequado: 2.4 },
    o2er: { moderado: 30, alto: 40 },
    do2vo2: { moderado: 3.33, alto: 2.5 },
    svo2: { moderado: 70, alto: 65 },
    gapPco2: { moderado: 6 },
    pam: { moderado: 60 },
    pao2: { informativo: 150 },
    k: { baixo: 3.5 },
    glicose: { alto: 180 },
    tempoCec: { moderadoMin: 60, moderadoMax: 120, alto: 120 },
    tca: { minimoUsual: 400, historico: 480 },
    acidoBase: { phBaixo: 7.35, phAlto: 7.45, paco2Baixo: 35, paco2Alto: 45, hco3Baixo: 22, hco3Alto: 26, hco3Compensacao: 24 }
})

const INDICES_CARDIACOS_CONVERSAO = Object.freeze([2.0, 2.2, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2])

const REFERENCIAS_PARAMETROS = Object.freeze([
    { nome: 'Lactato', unidade: 'mmol/L', referencia: `< ${LIMIARES.lactato.atencao}`, atencao: `${LIMIARES.lactato.atencao} a ${LIMIARES.lactato.critico}`, critico: `> ${LIMIARES.lactato.critico}`, observacao: 'Usado internamente em mmol/L; mg/dL é convertido por 9,009.' },
    { nome: 'Hematócrito', unidade: '%', referencia: `>= ${LIMIARES.hct.limítrofe}`, atencao: `${LIMIARES.hct.critico} a < ${LIMIARES.hct.limítrofe}`, critico: `< ${LIMIARES.hct.critico}`, observacao: 'Limites gerais do dashboard; pediatria/neonatal exigem validação própria.' },
    { nome: 'Hemoglobina', unidade: 'g/dL', referencia: `>= ${LIMIARES.hb.preservada}`, atencao: `< ${LIMIARES.hb.preservada}`, critico: `Atenção PBM se < ${LIMIARES.hb.atencao}`, observacao: 'O alerta não indica transfusão isoladamente.' },
    { nome: 'pH', unidade: '', referencia: `${LIMIARES.acidoBase.phBaixo} a ${LIMIARES.acidoBase.phAlto}`, atencao: 'Avaliar com PaCO₂/HCO₃⁻', critico: 'A preencher', observacao: 'Regras atuais classificam distúrbio ácido-base por combinação de pH, PaCO₂ e HCO₃⁻.' },
    { nome: 'PaO₂', unidade: 'mmHg', referencia: 'A preencher', atencao: `Informativo se > ${LIMIARES.pao2.informativo}`, critico: 'A preencher', observacao: 'O dashboard usa PaO₂ alta para métrica de FiO₂ corrigida de Hamilton.' },
    { nome: 'PaCO₂', unidade: 'mmHg', referencia: `${LIMIARES.acidoBase.paco2Baixo} a ${LIMIARES.acidoBase.paco2Alto}`, atencao: 'Fora da faixa com pH/HCO₃⁻ alterados', critico: 'A preencher', observacao: 'Usado apenas na interpretação ácido-base.' },
    { nome: 'Bicarbonato', unidade: 'mEq/L', referencia: `${LIMIARES.acidoBase.hco3Baixo} a ${LIMIARES.acidoBase.hco3Alto}`, atencao: 'Fora da faixa com pH/PaCO₂ alterados', critico: 'A preencher', observacao: 'Usado no resumo ácido-base, ânion gap e delta-delta.' },
    { nome: 'Base excess', unidade: 'mEq/L', referencia: 'A preencher', atencao: 'A preencher', critico: 'A preencher', observacao: 'Campo registrado, sem alerta específico no código atual.' },
    { nome: 'Cálcio', unidade: 'mmol/L ou mg/dL', referencia: 'A preencher', atencao: 'A preencher', critico: 'A preencher', observacao: 'O sistema pede confirmar unidade e tipo antes de classificar.' },
    { nome: 'Potássio', unidade: 'mmol/L', referencia: `>= ${LIMIARES.k.baixo}`, atencao: `< ${LIMIARES.k.baixo}`, critico: 'A preencher', observacao: 'Há alerta para potássio baixo; potássio alto ainda não eleva risco.' },
    { nome: 'Glicemia', unidade: 'mg/dL', referencia: `<= ${LIMIARES.glicose.alto}`, atencao: `> ${LIMIARES.glicose.alto}`, critico: 'A preencher', observacao: 'Regra local de alerta metabólico.' },
    { nome: 'Índice cardíaco', unidade: 'L/min/m²', referencia: `>= ${LIMIARES.ic.adequado}`, atencao: `${LIMIARES.ic.critico} a < ${LIMIARES.ic.adequado}`, critico: `< ${LIMIARES.ic.critico}`, observacao: 'Calculado como fluxo da bomba / superfície corporal.' },
    { nome: 'Fluxo da bomba', unidade: 'L/min', referencia: 'A preencher', atencao: 'A preencher', critico: 'A preencher', observacao: 'Dado operacional; o índice cardíaco deriva dele quando há BSA.' },
    { nome: 'DO₂ / iDO₂', unidade: 'mL/min/m²', referencia: `>= ${LIMIARES.ido2.alvoGdp}`, atencao: `${LIMIARES.ido2.cardCritico} a < ${LIMIARES.ido2.alvoGdp}`, critico: `< ${LIMIARES.ido2.cardCritico} no card; alto se < ${LIMIARES.ido2.alertaAltoRazao * 100}% do alvo na análise`, observacao: 'Alvo GDP fixo; alvo térmico é exibido separadamente.' },
    { nome: 'VO₂ / iVO₂', unidade: 'mL/min/m²', referencia: 'A preencher', atencao: 'A preencher', critico: 'A preencher', observacao: 'iVO₂ é informado pelo usuário/arquivo; o dashboard não calcula VO₂ diretamente.' },
    { nome: 'Extração de oxigênio', unidade: '%', referencia: `< ${LIMIARES.o2er.moderado}`, atencao: `${LIMIARES.o2er.moderado} a ${LIMIARES.o2er.alto}`, critico: `> ${LIMIARES.o2er.alto}`, observacao: 'Calculada como iVO₂ / iDO₂ × 100 quando iVO₂ está disponível.' },
    { nome: 'DO₂/VO₂', unidade: 'razão', referencia: `> ${LIMIARES.do2vo2.moderado}`, atencao: `${LIMIARES.do2vo2.alto} a ${LIMIARES.do2vo2.moderado}`, critico: `< ${LIMIARES.do2vo2.alto}`, observacao: 'Equivalente inverso da extração.' },
    { nome: 'Saturação venosa', unidade: '%', referencia: `> ${LIMIARES.svo2.moderado}`, atencao: `${LIMIARES.svo2.alto} a ${LIMIARES.svo2.moderado}`, critico: `< ${LIMIARES.svo2.alto}`, observacao: 'SvO₂ preservada não exclui discordância metabólica.' },
    { nome: 'Gap PCO₂', unidade: 'mmHg', referencia: `< ${LIMIARES.gapPco2.moderado}`, atencao: `>= ${LIMIARES.gapPco2.moderado}`, critico: 'A preencher', observacao: 'Marcador contextual de fluxo/perfusão regional.' },
    { nome: 'PAM', unidade: 'mmHg', referencia: `>= ${LIMIARES.pam.moderado}`, atencao: `< ${LIMIARES.pam.moderado}`, critico: 'A preencher', observacao: 'Regra geral do app; individualizar por autorregulação e contexto.' }
])

const FORMULAS_REFERENCIA = Object.freeze([
    { nome: 'Superfície corporal (BSA/SC)', equacao: 'SC = √(peso × altura / 3600)', variaveis: 'peso em kg; altura em cm', unidades: 'm²' },
    { nome: 'Índice cardíaco', equacao: 'IC = fluxo da bomba / SC', variaveis: 'fluxo em L/min; SC em m²', unidades: 'L/min/m²' },
    { nome: 'Conteúdo arterial de O₂ (CaO₂)', equacao: 'CaO₂ = Hb × 1,36 × SaO₂ + PaO₂ × 0,003', variaveis: 'Hb em g/dL; SaO₂ como fração; PaO₂ em mmHg', unidades: 'mL/dL' },
    { nome: 'Oferta de oxigênio indexada (iDO₂)', equacao: 'iDO₂ = 10 × IC × CaO₂', variaveis: 'IC em L/min/m²; CaO₂ em mL/dL', unidades: 'mL/min/m²' },
    { nome: 'Oferta de oxigênio por fluxo total', equacao: 'DO₂ = fluxo × CaO₂ × 10; iDO₂ = DO₂ / SC', variaveis: 'fluxo em L/min; SC em m²', unidades: 'mL/min e mL/min/m²' },
    { nome: 'SaO₂ implícita por iDO₂ informado', equacao: 'SaO₂ = ((iDO₂ / (10 × IC) - PaO₂ × 0,003) / (Hb × 1,36)) × 100', variaveis: 'Usada apenas para auditoria quando falta SaO₂ medida', unidades: '%' },
    { nome: 'Extração de oxigênio', equacao: 'O₂ER = iVO₂ / iDO₂ × 100', variaveis: 'iVO₂ informado; iDO₂ calculado ou informado', unidades: '%' },
    { nome: 'Relação DO₂/VO₂', equacao: 'DO₂/VO₂ = iDO₂ / iVO₂', variaveis: 'iDO₂ e iVO₂ indexados', unidades: 'razão' },
    { nome: 'Hemoglobina estimada por hematócrito', equacao: 'Hb = Hct / 3', variaveis: 'Regra simples usada quando só Hct é informado', unidades: 'g/dL' },
    { nome: 'Hematócrito estimado por hemoglobina', equacao: 'Hct = Hb × 3', variaveis: 'Regra simples usada quando só Hb é informada', unidades: '%' },
    { nome: 'Lactato em mg/dL para mmol/L', equacao: 'lactato mmol/L = lactato mg/dL / 9,009', variaveis: 'Conversão de unidade', unidades: 'mmol/L' },
    { nome: 'Ânion gap', equacao: 'AG = Na⁺ - (Cl⁻ + HCO₃⁻)', variaveis: 'Na, Cl e HCO₃ simultâneos', unidades: 'mEq/L' },
    { nome: 'Delta-delta', equacao: 'Δ/Δ = (AG - 12) / (24 - HCO₃⁻)', variaveis: 'Calculado quando AG e HCO₃ são disponíveis', unidades: 'razão' },
    { nome: 'AUC de déficit de iDO₂', equacao: 'Área entre alvo e iDO₂ quando iDO₂ < alvo, por interpolação linear', variaveis: 'Série temporal de iDO₂ e alvo', unidades: '(mL/min/m²) × min' },
    { nome: 'FiO₂ corrigida de Hamilton', equacao: 'FiO₂corr = FiO₂ - PaO₂/(Pb - 47) + 0,21', variaveis: 'FiO₂ em fração; PaO₂ e pressão barométrica em mmHg', unidades: '%' },
    { nome: 'Conteúdo venoso / VO₂ direto', equacao: 'A preencher', variaveis: 'Não implementado como cálculo direto no dashboard atual', unidades: 'A preencher' }
])

const CHECKLIST_SECOES = Object.freeze([
    { id: 'identificacao', titulo: 'Identificação e equipe', itens: ['Paciente, procedimento, data e sala cirúrgica conferidos', 'Perfusionista da montagem, responsável pela CEC e perfusionista check identificados', 'Peso, altura, BSA e metas iniciais revisados', 'Exames/laboratório basal disponíveis'] },
    { id: 'preparo-bomba', titulo: 'Preparo da bomba', itens: ['Máquina de CEC conferida', 'Aparelho de TCA disponível e funcional', 'Cardioplegia/rolete conferidos', 'Bateria da máquina testada', 'Equipamentos de segurança, manivela/hand crank e luz de emergência disponíveis', 'Painel da bomba com SC/tubo/L/min conferido', 'Circulador de água e controle térmico funcionando', 'Vaporizador de gás conferido quando aplicável', 'Conferência de vazamentos e retirada de bolhas do circuito', 'Pinças, conectores e tubos após passagem estéril conferidos', 'Drogas, cardioplegia, gelo quando necessário, sangue e derivados disponíveis', 'Cânulas arteriais e venosas disponíveis'] },
    { id: 'bomba-posicionada', titulo: 'Bomba posicionada', itens: ['Aquecimento do prime conferido', 'Cronômetro, fluxômetro e blender testados', 'Aparelho de vácuo testado e funcionando', 'Sensores de temperatura posicionados/testados', 'Planejamento da CEC alinhado com equipe cirúrgica e anestésica', 'Perfusato conferido', 'Transdutores de pressão funcionando', 'Teste de pulso e resistência documentado', 'Cálculos da CEC revisados antes do início'] },
    { id: 'circuito', titulo: 'Circuito e insumos', itens: ['Circuito montado e revisado', 'Oxigenador e reservatório conferidos', 'Prime/RAP/cardioplegia revisados'] },
    { id: 'anticoagulacao', titulo: 'Anticoagulação', itens: ['TCA basal registrado', 'Dose de heparina/protocolo conferidos', 'Heparinização comunicada e documentada', 'TCA pré-CEC ou pós-heparina dentro do alvo institucional'] },
    { id: 'inicio-cec', titulo: 'Início da CEC', itens: ['Canulação e linhas sem intercorrências aparentes', 'Fluxo inicial e índice cardíaco avaliados', 'Pressões do circuito monitoradas', 'Gasometria inicial documentada'] },
    { id: 'manutencao-cec', titulo: 'Manutenção da CEC', itens: ['Gasometrias e eletrólitos acompanhados', 'iDO₂, lactato, SvO₂/O₂ER revisados', 'Temperatura e estratégia ácido-base acompanhadas'] },
    { id: 'saida-cec', titulo: 'Saída da CEC', itens: ['Reaquecimento e condições de saída conferidos', 'Volume/hemoconcentração/transfusão avaliados', 'Horário de início/fim da CEC e tempo de clampeamento registrados', 'Comunicação com equipe cirúrgica/anestésica registrada'] },
    { id: 'pos-cec', titulo: 'Pós-CEC', itens: ['Protamina/reversão e TCA pós documentados', 'Débito urinário e balanço revisados', 'Ocorrências, intercorrências técnicas e pendências registradas'] }
])

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
    if(valor < LIMIARES.hb.atencao){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Atenção PBM'
    }else if(valor >= LIMIARES.hb.atencao && valor < LIMIARES.hb.preservada){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Avaliar contexto'
    }else if(valor >= LIMIARES.hb.preservada){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = 'Preservada'
    }
}

function classificarHematocrito(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-600','bg-emerald-600')
    if(valor < LIMIARES.hct.critico){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Zona Crítica'
    }else if(valor >= LIMIARES.hct.critico && valor < LIMIARES.hct.limítrofe){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Zona Limítrofe'
    }else if(valor >= LIMIARES.hct.limítrofe){
        elemento.classList.add('bg-emerald-600')
        elemento.textContent = `Acima de ${LIMIARES.hct.limítrofe}%`
    }
}

function classificarLactato(valor, elemento){
    elemento.classList.remove('bg-red-500','bg-amber-400','bg-emerald-600')
    if(valor > LIMIARES.lactato.critico){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Crítico'
    }else if(valor >= LIMIARES.lactato.atencao && valor <= LIMIARES.lactato.critico){
        elemento.classList.add('bg-amber-400')
        elemento.textContent = 'Atenção'
    }else if(valor < LIMIARES.lactato.atencao){
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
    if(valor < LIMIARES.ic.critico){
        elemento.classList.add('bg-red-500')
        elemento.textContent = 'Zona Crítica'
    }else if(valor >= LIMIARES.ic.critico && valor < LIMIARES.ic.adequado){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Zona Limítrofe'
    }else if(valor >= LIMIARES.ic.adequado){
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
    if(valor < LIMIARES.ido2.cardCritico){
        elemento.classList.add('bg-red-500')
        elemento.textContent = `Abaixo de ${LIMIARES.ido2.cardCritico}`
    }else if(valor >= LIMIARES.ido2.cardCritico && valor < LIMIARES.ido2.alvoGdp){
        elemento.classList.add('bg-amber-600')
        elemento.textContent = 'Abaixo do alvo GDP'
    }else if(valor >= LIMIARES.ido2.alvoGdp){
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
    if(lactato < LIMIARES.lactato.atencao){
        scoreLactato = 2
    }else if(lactato >= LIMIARES.lactato.atencao && lactato <= 3){
        scoreLactato = 1
    }else if(lactato > 3){
        scoreLactato = 0
    }
    
    //Score IC
    if(IC >= LIMIARES.ic.adequado){
        scoreIC = 2
    }else if(IC >= LIMIARES.ic.critico && IC < LIMIARES.ic.adequado){
        scoreIC = 1
    }else if(IC < LIMIARES.ic.critico){
        scoreIC = 0
    }
    
    //Somatória
    let scoreTotal = scoreIdo2 + scoreHct + scoreLactato + scoreIC

    //Regra de corte fisiológica
    if(hct < LIMIARES.hct.critico && IC < LIMIARES.ic.critico){
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

    if(typeof Chart === 'undefined'){
        graficoAtual = null
        local.innerHTML = '<p class="text-slate-400 text-center py-6">Gráfico indisponível: Chart.js não carregou.</p>'
        return
    }

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

function escaparHtml(valor){
    const mapa = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }
    return String(valor ?? '').replace(/[&<>"']/g, caractere => mapa[caractere])
}

function formatarValorRelatorio(valor, casas = 1, unidade = ''){
    const numero = transformarNumero(valor)
    if(!Number.isFinite(numero)) return '—'
    return `${formatarMetrica(numero, casas)}${unidade ? ` ${unidade}` : ''}`
}

function criarTabelaMonitorizacaoRelatorio(historico, completo = false){
    const colunasEssenciais = [
        { titulo: 'Tempo', valor: exame => formatarValorRelatorio(exame.tempo, 0, 'min') },
        { titulo: 'Fluxo', valor: exame => formatarValorRelatorio(exame.fluxo, 2, 'L/min') },
        { titulo: 'IC', valor: exame => formatarValorRelatorio(exame.IC, 2, 'L/min/m²') },
        { titulo: 'iDO₂', valor: exame => formatarValorRelatorio(exame.ido2, 0, 'mL/min/m²') },
        { titulo: 'Hb', valor: exame => formatarValorRelatorio(exame.hb, 2, 'g/dL') },
        { titulo: 'Hct', valor: exame => formatarValorRelatorio(exame.hct, 1, '%') },
        { titulo: 'Lactato', valor: exame => formatarValorRelatorio(exame.lactato, 2, 'mmol/L') },
        { titulo: 'SvO₂', valor: exame => formatarValorRelatorio(exame.svo2, 0, '%') }
    ]
    const colunasCompletas = [
        ...colunasEssenciais,
        { titulo: 'SaO₂', valor: exame => formatarValorRelatorio(exame.sao2, 0, '%') },
        { titulo: 'O₂ER', valor: exame => formatarValorRelatorio(exame.o2er, 1, '%') },
        { titulo: 'DO₂/VO₂', valor: exame => formatarValorRelatorio(exame.relacaoDo2Vo2, 2) },
        { titulo: 'pH', valor: exame => formatarValorRelatorio(exame.ph, 2) },
        { titulo: 'PaCO₂', valor: exame => formatarValorRelatorio(exame.paco2, 0, 'mmHg') },
        { titulo: 'HCO₃', valor: exame => formatarValorRelatorio(exame.hco3, 1, 'mEq/L') },
        { titulo: 'PAM', valor: exame => formatarValorRelatorio(exame.pam, 0, 'mmHg') },
        { titulo: 'Temp.', valor: exame => formatarValorRelatorio(exame.temperatura, 1, '°C') }
    ]
    const colunas = completo ? colunasCompletas : colunasEssenciais

    return `
        <table class="relatorio-tabela-basica">
            <caption>${completo ? 'Monitorização ampliada' : 'Monitorização essencial'}</caption>
            <thead>
                <tr>${colunas.map(coluna => `<th>${coluna.titulo}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${historico.map(exame => `
                    <tr>${colunas.map(coluna => `<td>${escaparHtml(coluna.valor(exame))}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `
}

function simplificarAlertaRelatorio(alerta){
    const titulo = String(alerta?.titulo || 'Alerta')
    const detalhe = String(alerta?.detalhe || '')

    if(/PaO[₂2] acima/i.test(titulo) || /Hamilton|FiO[₂2] corrigida|press[aã]o barom[eé]trica/i.test(detalhe)){
        return {
            nivel: alerta?.nivel || 'informativo',
            titulo,
            detalhe: 'PaO₂ acima de 150 mmHg. Revisar oxigenação conforme contexto e consultar Informações técnicas.'
        }
    }

    return {
        nivel: alerta?.nivel || 'informativo',
        titulo,
        detalhe: detalhe.replace(/;\s*equivale a extra[çc][aã]o de O[₂2].*$/i, '.')
    }
}

function selecionarAlertasRelatorio(alertas = [], completo = false){
    const niveisPermitidos = completo ? ['alto', 'moderado', 'informativo'] : ['alto', 'moderado']
    return alertas
        .filter(alerta => niveisPermitidos.includes(alerta?.nivel))
        .map(simplificarAlertaRelatorio)
        .slice(0, completo ? 8 : 5)
}

function renderizarAnaliseRelatorio(container, analise, historico, SC, completo = false){
    const inicial = historico[0] || {}
    const final = historico[historico.length - 1] || {}
    const alertasPrioritarios = selecionarAlertasRelatorio(analise.alertas, completo)
    const interpretacoes = {
        BAIXO: 'Sem alertas altos ou múltiplos alertas moderados pelas regras configuradas.',
        MODERADO: 'Há pontos de atenção que merecem revisão da tendência e do contexto clínico.',
        ALTO: 'Há pelo menos um alerta alto nas regras configuradas. Priorizar conferência dos dados e discussão com a equipe.'
    }
    const itensChave = [
        ['Risco integrado', analise.risco],
        ['Tempo em CEC', formatarValorRelatorio(final.tempo, 0, 'min')],
        ['SC', formatarValorRelatorio(SC, 2, 'm²')],
        ['iDO₂ final', formatarValorRelatorio(final.ido2, 0, 'mL/min/m²')],
        ['IC final', formatarValorRelatorio(final.IC, 2, 'L/min/m²')],
        ['Hb final', formatarValorRelatorio(final.hb, 2, 'g/dL')],
        ['Lactato inicial/final', `${formatarValorRelatorio(inicial.lactato, 2, 'mmol/L')} → ${formatarValorRelatorio(final.lactato, 2, 'mmol/L')}`],
        ['SvO₂ final', formatarValorRelatorio(final.svo2, 0, '%')],
        ['O₂ER final', formatarValorRelatorio(final.o2er, 1, '%')]
    ]
    const itensCompletos = [
        ['DO₂/VO₂ final', formatarValorRelatorio(final.relacaoDo2Vo2, 2)],
        ['pH final', formatarValorRelatorio(final.ph, 2)],
        ['PAM final', formatarValorRelatorio(final.pam, 0, 'mmHg')],
        ['Temperatura final', formatarValorRelatorio(final.temperatura, 1, '°C')],
        ['Registros', String(historico.length)]
    ]
    const itens = completo ? [...itensChave, ...itensCompletos] : itensChave

    container.innerHTML = `
        <section class="relatorio-bloco-basico">
            <h2>Resumo do caso</h2>
            <div class="relatorio-resumo-grid">
                ${itens.map(([rotulo, valor]) => `
                    <div>
                        <span>${escaparHtml(rotulo)}</span>
                        <strong>${escaparHtml(valor)}</strong>
                    </div>
                `).join('')}
            </div>
        </section>
        <section class="relatorio-bloco-basico">
            <h2>Interpretação</h2>
            <p class="relatorio-interpretacao">${escaparHtml(interpretacoes[analise.risco] || interpretacoes.MODERADO)}</p>
        </section>
        <section class="relatorio-bloco-basico">
            <h2>Alertas principais</h2>
            ${alertasPrioritarios.length
                ? `<ul class="relatorio-alertas-basico">${alertasPrioritarios.map(alerta => `
                    <li>
                        <strong>${escaparHtml(alerta.titulo)}</strong>
                        <span>${escaparHtml(alerta.detalhe)}</span>
                    </li>
                `).join('')}</ul>`
                : '<p>Nenhum alerta alto ou moderado identificado pelas regras configuradas.</p>'}
        </section>
        <section class="relatorio-bloco-basico relatorio-info-tecnica">
            <p>Fórmulas, limites detalhados e correções, incluindo FiO₂/PaO₂, ficam na página <strong>Informações técnicas</strong>.</p>
        </section>
    `
}

function prepararRelatorioImpressao(modo, contexto){
    const {
        paciente,
        idade,
        peso,
        altura,
        SC,
        historicoExames,
        analiseAtual,
        tabelaExames,
        limites
    } = contexto
    const relatorio = document.getElementById('relatorio')
    const relatorioTitulo = document.getElementById('relatorioTitulo')
    const relatorioDescricao = document.getElementById('relatorioDescricao')
    const relatorioPaciente = document.getElementById('relatorioPaciente')
    const relatorioTabela = document.getElementById('relatorioTabela')
    const relatorioAnalise = document.getElementById('relatorioAnalise')
    const relatorioGraficos = document.getElementById('relatorioGraficos')
    const simples = modo === 'simples' || modo === 'basico'
    const completo = !simples

    relatorio.classList.remove('hidden', 'relatorio--basico', 'relatorio--avancado', 'relatorio--simples', 'relatorio--completo')
    relatorio.classList.add(simples ? 'relatorio--simples' : 'relatorio--completo')
    relatorio.style.position = 'absolute'
    relatorio.style.left = '-10000px'
    relatorio.style.width = simples ? '820px' : '1000px'

    relatorioTitulo.textContent = simples
        ? 'PerfuseLab - Relatório simples de monitorização'
        : 'PerfuseLab - Relatório completo de monitorização'
    relatorioDescricao.textContent = simples
        ? 'Resumo essencial para comunicação rápida e impressão enxuta.'
        : 'Relatório ampliado com tabela, interpretação organizada e gráficos de tendência.'
    document.getElementById('relatorioGeradoEm').textContent =
        `Gerado em ${new Date().toLocaleString('pt-BR')}`

    relatorioPaciente.innerHTML = `
        <p><strong>Sexo:</strong> ${escaparHtml(paciente.sexo)}</p>
        <p><strong>Idade:</strong> ${formatarValorRelatorio(idade, 0, 'anos')}</p>
        <p><strong>Peso:</strong> ${formatarValorRelatorio(peso, 1, 'kg')}</p>
        <p><strong>Altura:</strong> ${formatarValorRelatorio(altura, 0, 'cm')}</p>
        <p><strong>Superfície corporal:</strong> ${formatarValorRelatorio(SC, 2, 'm²')}</p>
        <p><strong>Registros:</strong> ${historicoExames.length}</p>
    `

    relatorioTabela.innerHTML = ''
    relatorioAnalise.innerHTML = ''
    relatorioGraficos.innerHTML = ''

    relatorioTabela.innerHTML = criarTabelaMonitorizacaoRelatorio(historicoExames, completo)
    renderizarAnaliseRelatorio(relatorioAnalise, analiseAtual, historicoExames, SC, completo)

    if(simples){
        criarGraficoRelatorio(relatorioGraficos, 'iDO₂', 'ido2', historicoExames, limites.ido2)
        criarGraficoRelatorio(relatorioGraficos, 'Lactato', 'lactato', historicoExames, limites.lactato)
        criarGraficoRelatorio(relatorioGraficos, 'Índice cardíaco', 'IC', historicoExames, limites.IC)
        return relatorio
    }

    criarGraficoRelatorio(relatorioGraficos, 'iDO₂', 'ido2', historicoExames, limites.ido2)
    criarGraficoRelatorio(relatorioGraficos, 'Lactato', 'lactato', historicoExames, limites.lactato)
    criarGraficoRelatorio(relatorioGraficos, 'Índice cardíaco', 'IC', historicoExames, limites.IC)
    criarGraficoRelatorio(relatorioGraficos, 'Hemoglobina', 'hb', historicoExames, limites.HbAdulto)
    criarGraficoRelatorio(relatorioGraficos, 'SvO2', 'svo2', historicoExames, limites.svo2)
    return relatorio
}

function imprimirRelatorio(modo, contexto){
    const relatorio = prepararRelatorioImpressao(modo, contexto)
    window.addEventListener('afterprint', () => {
        relatorio.classList.add('hidden')
        relatorio.classList.remove('relatorio--basico', 'relatorio--avancado', 'relatorio--simples', 'relatorio--completo')
        relatorio.removeAttribute('style')
    }, { once: true })
    setTimeout(() => window.print(), 450)
}

function criarGraficoRelatorio(container, titulo, campo, dados, valorCritico){
    const bloco = document.createElement('div')
    const cabecalho = document.createElement('h3')
    const canvas = document.createElement('canvas')
    const valores = dados.map(item => transformarNumero(item[campo]))
    const temValores = valores.some(Number.isFinite)
    cabecalho.textContent = titulo
    cabecalho.className = 'text-xl font-bold mb-2'
    canvas.className = 'report-chart-canvas'
    canvas.width = 320
    canvas.height = 180
    bloco.append(cabecalho, canvas)
    container.appendChild(bloco)

    if(!temValores){
        canvas.replaceWith(Object.assign(document.createElement('p'), {
            className: 'text-slate-600',
            textContent: 'Sem dados suficientes para este gráfico.'
        }))
        return
    }

    if(typeof Chart === 'undefined'){
        canvas.replaceWith(Object.assign(document.createElement('p'), {
            className: 'text-slate-600',
            textContent: 'Gráfico indisponível: Chart.js não carregou.'
        }))
        return
    }

    const grafico = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dados.map(item => item.tempo),
            datasets: [
                {
                    label: titulo,
                    data: valores.map(valor => Number.isFinite(valor) ? valor : null),
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
            responsive: false,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { title: { display: true, text: 'Tempo em CEC (min)' } }
            }
        }
    })
    grafico.update('none')
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
    if(exame.ph < LIMIARES.acidoBase.phBaixo && exame.paco2 > LIMIARES.acidoBase.paco2Alto){
        return { resumo: 'Acidose respiratória', detalhe: 'pH reduzido com PaCO₂ elevada; avaliar componente metabólico associado.' }
    }
    if(exame.ph < LIMIARES.acidoBase.phBaixo && exame.hco3 < LIMIARES.acidoBase.hco3Baixo){
        return { resumo: 'Acidose metabólica', detalhe: 'pH e HCO₃⁻ reduzidos; verificar compensação respiratória e ânion gap.' }
    }
    if(exame.ph > LIMIARES.acidoBase.phAlto && exame.paco2 < LIMIARES.acidoBase.paco2Baixo){
        return { resumo: 'Alcalose respiratória', detalhe: 'pH elevado com PaCO₂ reduzida.' }
    }
    if(exame.ph > LIMIARES.acidoBase.phAlto && exame.hco3 > LIMIARES.acidoBase.hco3Alto){
        return { resumo: 'Alcalose metabólica', detalhe: 'pH e HCO₃⁻ elevados.' }
    }
    if(exame.paco2 < LIMIARES.acidoBase.paco2Baixo && exame.hco3 <= LIMIARES.acidoBase.hco3Compensacao){
        return { resumo: 'Provável alcalose respiratória compensada', detalhe: 'PaCO₂ reduzida com queda de HCO₃⁻ e pH próximo da faixa normal.' }
    }
    if(exame.paco2 > LIMIARES.acidoBase.paco2Alto && exame.hco3 >= LIMIARES.acidoBase.hco3Compensacao){
        return { resumo: 'Provável acidose respiratória compensada', detalhe: 'PaCO₂ elevada com retenção de HCO₃⁻ e pH próximo da faixa normal.' }
    }
    return { resumo: 'Sem distúrbio primário evidente', detalhe: 'Interpretar em conjunto com temperatura, estratégia alfa-stat e tendência.' }
}

function montarAnalisePerfusional(paciente, historico, casoClinico, SC){
    const alvoGdp = LIMIARES.ido2.alvoGdp
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
    const informacoesTecnicas = []
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
        if(Number.isFinite(adequacaoGdp) && adequacaoGdp < LIMIARES.ido2.alertaAltoRazao) alertas.push(criarAlerta('alto', `iDO₂ abaixo do alvo GDP aos ${exame.tempo} min`, `${formatarMetrica(adequacaoGdp * 100)}% de ${alvoGdp} mL/min/m².`))
        else if(Number.isFinite(adequacaoGdp) && adequacaoGdp < 1) alertas.push(criarAlerta('moderado', `iDO₂ limítrofe para GDP aos ${exame.tempo} min`, `${formatarMetrica(adequacaoGdp * 100)}% de ${alvoGdp} mL/min/m².`))
        if(['incompativel', 'discordante', 'divergente'].includes(exame.consistenciaIdo2)){
            alertas.push(criarAlerta('informativo', `Conferir iDO₂ aos ${exame.tempo} min`, descreverOrigemIdo2(exame)))
        }
        if(Number.isFinite(exame.o2er) && exame.o2er > LIMIARES.o2er.alto) alertas.push(criarAlerta('alto', `Extração de O₂ elevada aos ${exame.tempo} min`, `${formatarMetrica(exame.o2er)}%; critério do protocolo: >${LIMIARES.o2er.alto}%.`))
        else if(Number.isFinite(exame.o2er) && exame.o2er >= LIMIARES.o2er.moderado) alertas.push(criarAlerta('moderado', `Extração de O₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.o2er)}%.`))
        if(Number.isFinite(exame.gapPco2) && exame.gapPco2 >= LIMIARES.gapPco2.moderado) alertas.push(criarAlerta('moderado', `Gap PCO₂ aumentado aos ${exame.tempo} min`, `${formatarMetrica(exame.gapPco2)} mmHg.`))
        if(Number.isFinite(exame.relacaoDo2Vo2) && exame.relacaoDo2Vo2 < LIMIARES.do2vo2.alto) alertas.push(criarAlerta('alto', `Relação DO₂/VO₂ crítica aos ${exame.tempo} min`, `${formatarMetrica(exame.relacaoDo2Vo2, 2)}; equivale a extração de O₂ >${LIMIARES.o2er.alto}%.`))
        else if(Number.isFinite(exame.relacaoDo2Vo2) && exame.relacaoDo2Vo2 <= LIMIARES.do2vo2.moderado) alertas.push(criarAlerta('moderado', `Relação DO₂/VO₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.relacaoDo2Vo2, 2)}; equivale a extração de O₂ entre ${LIMIARES.o2er.moderado}% e ${LIMIARES.o2er.alto}%.`))
        if(Number.isFinite(exame.svo2) && exame.svo2 < LIMIARES.svo2.alto) alertas.push(criarAlerta('alto', `SvO₂ inadequada aos ${exame.tempo} min`, `${formatarMetrica(exame.svo2)}%.`))
        else if(Number.isFinite(exame.svo2) && exame.svo2 <= LIMIARES.svo2.moderado) alertas.push(criarAlerta('moderado', `SvO₂ limítrofe aos ${exame.tempo} min`, `${formatarMetrica(exame.svo2)}%.`))
        if(Number.isFinite(exame.pam) && exame.pam < LIMIARES.pam.moderado) alertas.push(criarAlerta('moderado', `PAM reduzida aos ${exame.tempo} min`, `${formatarMetrica(exame.pam, 0)} mmHg; individualizar conforme autorregulação e contexto.`))
        if(Number.isFinite(exame.pao2) && exame.pao2 > LIMIARES.pao2.informativo){
            const fio2Corrigida = fio2CorrigidaHamilton(exame.fio2, exame.pao2, pressaoBarometrica)
            alertas.push(criarAlerta('informativo', `PaO₂ acima de 150 mmHg aos ${exame.tempo} min`, 'Revisar oxigenação conforme contexto e consultar Informações técnicas.'))
            informacoesTecnicas.push({
                titulo: `Correção FiO₂/PaO₂ aos ${exame.tempo} min`,
                detalhe: Number.isFinite(fio2Corrigida)
                    ? `FiO₂ corrigida para PaO₂ de 150 mmHg pelo método de Hamilton: ${formatarMetrica(fio2Corrigida)}% (Pb ${formatarMetrica(pressaoBarometrica, 0)} mmHg). Métrica de desempenho do oxigenador, não prescrição automática.`
                    : 'O método de Hamilton exige FiO₂ simultânea, PaO₂ e pressão barométrica conhecida ou assumida.'
            })
        }
        if(Number.isFinite(exame.k) && exame.k < LIMIARES.k.baixo) alertas.push(criarAlerta('moderado', `Potássio reduzido aos ${exame.tempo} min`, `${formatarMetrica(exame.k)} mmol/L.`))
        if(Number.isFinite(exame.glicose) && exame.glicose > LIMIARES.glicose.alto) alertas.push(criarAlerta('moderado', `Glicose elevada aos ${exame.tempo} min`, `${formatarMetrica(exame.glicose, 0)} mg/dL.`))
        if(Number.isFinite(exame.hb) && exame.hb < LIMIARES.hb.atencao) alertas.push(criarAlerta('moderado', `Hemoglobina abaixo de ${String(LIMIARES.hb.atencao).replace('.', ',')} g/dL aos ${exame.tempo} min`, `${formatarMetrica(exame.hb, 2)} g/dL; transfusão não deve ser indicada isoladamente por este valor.`))
    })

    if(final.lactato > LIMIARES.lactato.critico) alertas.push(criarAlerta('alto', 'Lactato final crítico', `${formatarMetrica(final.lactato, 2)} mmol/L.`))
    else if(final.lactato >= LIMIARES.lactato.atencao) alertas.push(criarAlerta('moderado', 'Lactato final em faixa de atenção', `${formatarMetrica(final.lactato, 2)} mmol/L.`))
    if(lactatoRatio > LIMIARES.lactato.elevacaoRazao) alertas.push(criarAlerta('moderado', 'Lactato em elevação', `Razão final/inicial ${formatarMetrica(lactatoRatio, 2)}; interpretar com tendência e contexto clínico.`))
    if(final.tempo >= LIMIARES.tempoCec.moderadoMin && final.tempo <= LIMIARES.tempoCec.moderadoMax) alertas.push(criarAlerta('moderado', 'Tempo de CEC moderado', `${formatarMetrica(final.tempo, 0)} minutos.`))
    else if(final.tempo > LIMIARES.tempoCec.alto) alertas.push(criarAlerta('alto', 'Tempo de CEC elevado', `${formatarMetrica(final.tempo, 0)} minutos.`))
    if(Number.isFinite(tcaCec) && tcaCec < LIMIARES.tca.minimoUsual){
        alertas.push(criarAlerta('alto', 'TCA abaixo do mínimo terapêutico usual', `${formatarMetrica(tcaCec, 0)} s; conferir dispositivo, protocolo e concentração de heparina.`))
    }else if(Number.isFinite(tcaCec) && tcaCec < LIMIARES.tca.historico){
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
    if(!Number.isFinite(transformarNumero(casoClinico?.operacional?.pressao_barometrica_mmhg))) informacoesTecnicas.push({
        titulo: 'Pressão barométrica assumida',
        detalhe: 'A correção de FiO₂ de Hamilton assumiu pressão barométrica de 760 mmHg; informar a pressão local melhora a estimativa.'
    })
    if(Number.isFinite(tcaCec)) limitacoes.push('O alvo de TCA depende do método/dispositivo: 480 s é referência histórica aproximada; sistemas de ativação máxima podem usar valores acima de 400 s.')
    if(!Number.isFinite(tcaPos)) limitacoes.push('TCA pós-neutralização não documentado; não é possível avaliar reversão da heparina ou suspeita de rebote.')
    if(Number.isFinite(transformarNumero(anticoagulacao.heparina_mg))) limitacoes.push('Dose de heparina em mg não foi convertida para UI/kg porque concentração e apresentação do produto não foram documentadas.')
    const avisosConversao = casoClinico?.metadados_conversao?.avisos
    if(Array.isArray(avisosConversao)){
        avisosConversao.forEach(aviso => limitacoes.push(aviso))
    }

    const hipoxiaOculta = final.svo2 >= LIMIARES.svo2.moderado && (final.lactato >= LIMIARES.lactato.atencao || final.gapPco2 >= LIMIARES.gapPco2.moderado || final.o2er >= LIMIARES.o2er.moderado)
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
        informacoesTecnicas,
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
        card.className = 'analysis-summary-card border border-slate-700 rounded-2xl p-4'
        const rotulo = document.createElement('p')
        rotulo.className = 'analysis-summary-label text-slate-500'
        rotulo.textContent = item.rotulo
        const valor = document.createElement('p')
        valor.className = 'analysis-summary-value text-xl text-slate-100 mt-1'
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
            bloco.className = `analysis-alert border-l-4 p-3 rounded ${cores[alerta.nivel]}`
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
    campoScore.textContent = analise.risco === 'MODERADO' ? 'MOD.' : analise.risco
    campoScore.title = `Risco integrado: ${analise.risco}`
    campoScore.setAttribute('aria-label', `Risco integrado: ${analise.risco}`)
    classificacaoScore.classList.remove('bg-red-500', 'bg-red-600', 'bg-amber-400', 'bg-amber-500', 'bg-emerald-600')
    classificacaoScore.classList.add(coresRiscoCard[analise.risco])
    classificacaoScore.textContent = `${analise.alertas.filter(alerta => alerta.nivel === 'alto').length} alto(s) · ${analise.alertas.filter(alerta => alerta.nivel === 'moderado').length} moderado(s)`
}

function abrirModuloDashboard(id){
    const modal = document.getElementById(id)
    if(!modal) return
    modal.classList.remove('hidden')
    document.body.classList.add('modal-open')
}

function fecharModuloDashboard(id){
    const modal = document.getElementById(id)
    if(!modal) return
    modal.classList.add('hidden')
    document.body.classList.remove('modal-open')
}

function criarChaveCaso(paciente, casoClinico = {}){
    const origem = casoClinico?.paciente?.procedimento || casoClinico?.metadados?.arquivo || 'caso-local'
    const partes = [
        'perfuselab-checklist',
        paciente?.sexo || 'sem-sexo',
        paciente?.idade ?? 'sem-idade',
        paciente?.peso ?? 'sem-peso',
        paciente?.alturaNum ?? 'sem-altura',
        origem
    ]
    return partes.map(parte => String(parte).toLowerCase().replace(/\s+/g, '-')).join(':')
}

function criarEstadoChecklistPadrao(){
    return CHECKLIST_SECOES.reduce((estado, secao) => {
        secao.itens.forEach((texto, indice) => {
            estado[`${secao.id}-${indice}`] = {
                status: 'pendente',
                observacao: ''
            }
        })
        return estado
    }, {})
}

function carregarEstadoChecklist(chave){
    const padrao = criarEstadoChecklistPadrao()
    try {
        const salvo = JSON.parse(localStorage.getItem(chave) || '{}')
        return Object.fromEntries(
            Object.entries(padrao).map(([id, item]) => [id, { ...item, ...(salvo[id] || {}) }])
        )
    } catch {
        return padrao
    }
}

function salvarEstadoChecklist(chave, estado){
    localStorage.setItem(chave, JSON.stringify(estado))
}

function criarDadosChecklistPadrao(casoClinico = {}){
    return {
        data: new Date().toISOString().slice(0, 10),
        salaCirurgica: '',
        horarioInicioCec: '',
        horarioFimCec: '',
        tempoClampeamento: '',
        responsavelMontagem: '',
        responsavelCec: '',
        perfusionistaCheck: '',
        responsavelFinal: '',
        procedimento: casoClinico?.paciente?.procedimento || '',
        intercorrenciasTecnicas: ''
    }
}

function chaveDadosChecklist(chave){
    return `${chave}:dados-perfusionista`
}

function carregarDadosChecklist(chave, casoClinico = {}){
    const padrao = criarDadosChecklistPadrao(casoClinico)
    try {
        const salvo = JSON.parse(localStorage.getItem(chaveDadosChecklist(chave)) || '{}')
        return { ...padrao, ...salvo }
    } catch {
        return padrao
    }
}

function salvarDadosChecklist(chave, dados){
    localStorage.setItem(chaveDadosChecklist(chave), JSON.stringify(dados))
}

function sincronizarCamposDadosChecklist(chave, dados){
    const campos = {
        data: document.getElementById('checklistData'),
        salaCirurgica: document.getElementById('checklistSala'),
        horarioInicioCec: document.getElementById('checklistInicioCec'),
        horarioFimCec: document.getElementById('checklistFimCec'),
        tempoClampeamento: document.getElementById('checklistTempoClampeamento'),
        responsavelMontagem: document.getElementById('checklistRespMontagem'),
        responsavelCec: document.getElementById('checklistRespCec'),
        perfusionistaCheck: document.getElementById('checklistPerfusionistaCheck'),
        responsavelFinal: document.getElementById('checklistResponsavelFinal'),
        procedimento: document.getElementById('checklistProcedimento'),
        intercorrenciasTecnicas: document.getElementById('checklistIntercorrencias')
    }

    Object.entries(campos).forEach(([campo, elemento]) => {
        if(!elemento) return
        elemento.value = dados[campo] || ''
        elemento.addEventListener('input', () => {
            dados[campo] = elemento.value
            salvarDadosChecklist(chave, dados)
        })
    })
}

function calcularResumoChecklist(estado){
    const itens = Object.values(estado)
    const total = itens.length
    const concluidos = itens.filter(item => item.status === 'concluido').length
    const pendentes = total - concluidos
    return { total, concluidos, pendentes }
}

function atualizarResumoChecklist(estado){
    const resumo = calcularResumoChecklist(estado)
    const texto = `Checklist: ${resumo.concluidos}/${resumo.total} concluídos`
    const resumoHeader = document.getElementById('resumoChecklist')
    const progresso = document.getElementById('progressoChecklist')
    const pendencias = document.getElementById('pendenciasChecklist')
    if(resumoHeader){
        resumoHeader.textContent = resumo.pendentes > 0
            ? `${texto} · ${resumo.pendentes} pendente(s)`
            : `${texto} · sem pendências`
        resumoHeader.classList.toggle('text-amber-300', resumo.pendentes > 0)
        resumoHeader.classList.toggle('text-emerald-300', resumo.pendentes === 0)
    }
    if(progresso) progresso.textContent = texto
    if(pendencias) pendencias.textContent = resumo.pendentes > 0
        ? `${resumo.pendentes} item(ns) ainda pendente(s)`
        : 'Sem pendências registradas'
}

function renderizarChecklist(estado, chave){
    const container = document.getElementById('checklistConteudo')
    if(!container) return
    container.innerHTML = ''

    CHECKLIST_SECOES.forEach(secao => {
        const bloco = document.createElement('article')
        bloco.className = 'checklist-section'
        const titulo = document.createElement('h3')
        titulo.textContent = secao.titulo
        bloco.appendChild(titulo)

        secao.itens.forEach((texto, indice) => {
            const id = `${secao.id}-${indice}`
            const item = estado[id]
            const linha = document.createElement('div')
            linha.className = 'checklist-item'

            const topo = document.createElement('div')
            topo.className = 'checklist-item__top'

            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = item.status === 'concluido'
            checkbox.id = `check-${id}`

            const label = document.createElement('label')
            label.setAttribute('for', checkbox.id)
            label.textContent = texto

            const status = document.createElement('span')
            status.className = `checklist-status ${item.status === 'concluido' ? 'is-done' : 'is-pending'}`
            status.textContent = item.status === 'concluido' ? 'Concluído' : 'Pendente'

            const observacao = document.createElement('input')
            observacao.type = 'text'
            observacao.value = item.observacao || ''
            observacao.placeholder = 'Observação curta...'
            observacao.className = 'checklist-note'

            checkbox.addEventListener('change', () => {
                item.status = checkbox.checked ? 'concluido' : 'pendente'
                status.textContent = checkbox.checked ? 'Concluído' : 'Pendente'
                status.classList.toggle('is-done', checkbox.checked)
                status.classList.toggle('is-pending', !checkbox.checked)
                salvarEstadoChecklist(chave, estado)
                atualizarResumoChecklist(estado)
            })

            observacao.addEventListener('input', () => {
                item.observacao = observacao.value
                salvarEstadoChecklist(chave, estado)
            })

            topo.append(checkbox, label, status)
            linha.append(topo, observacao)
            bloco.appendChild(linha)
        })

        container.appendChild(bloco)
    })

    atualizarResumoChecklist(estado)
}

function renderizarReferencias(){
    const valores = document.getElementById('referenciasValores')
    const formulas = document.getElementById('referenciasFormulas')
    if(valores){
        valores.innerHTML = ''
        REFERENCIAS_PARAMETROS.forEach(parametro => {
            const card = document.createElement('article')
            card.className = 'reference-card'
            card.innerHTML = `
                <div class="reference-card__header">
                    <h3>${parametro.nome}</h3>
                    <span>${parametro.unidade || 'sem unidade'}</span>
                </div>
                <dl>
                    <div><dt>Referência</dt><dd>${parametro.referencia}</dd></div>
                    <div><dt>Atenção</dt><dd>${parametro.atencao}</dd></div>
                    <div><dt>Crítico</dt><dd>${parametro.critico}</dd></div>
                </dl>
                <p>${parametro.observacao}</p>
            `
            valores.appendChild(card)
        })
    }

    if(formulas){
        formulas.innerHTML = ''
        FORMULAS_REFERENCIA.forEach(formula => {
            const bloco = document.createElement('article')
            bloco.className = 'formula-card'
            bloco.innerHTML = `
                <h3>${formula.nome}</h3>
                <code>${formula.equacao}</code>
                <p><strong>Variáveis:</strong> ${formula.variaveis}</p>
                <p><strong>Unidades:</strong> ${formula.unidades}</p>
            `
            formulas.appendChild(bloco)
        })
    }
}

function alternarAbaReferencias(aba){
    const valores = document.getElementById('referenciasValores')
    const formulas = document.getElementById('referenciasFormulas')
    const abaValores = document.getElementById('abaValoresReferencia')
    const abaFormulas = document.getElementById('abaFormulasReferencia')
    const mostrarFormulas = aba === 'formulas'
    valores?.classList.toggle('hidden', mostrarFormulas)
    formulas?.classList.toggle('hidden', !mostrarFormulas)
    abaValores?.classList.toggle('is-active', !mostrarFormulas)
    abaFormulas?.classList.toggle('is-active', mostrarFormulas)
}

function atualizarResumoFluxoIndice(fluxoAtual, SC){
    const fluxoNumerico = transformarNumero(fluxoAtual)
    const indice = indiceCardiaco(fluxoNumerico, SC)
    const resumoFluxo = document.getElementById('resumoFluxoBomba')
    const resumoIndice = document.getElementById('resumoIndiceCardiaco')
    const resumoSC = document.getElementById('resumoSuperficieCorporal')
    if(resumoFluxo) resumoFluxo.textContent = Number.isFinite(fluxoNumerico) ? `${formatarMetrica(fluxoNumerico, 2)} L/min` : '— L/min'
    if(resumoIndice) resumoIndice.textContent = Number.isFinite(indice) ? `${formatarMetrica(indice, 2)} L/min/m²` : '— L/min/m²'
    if(resumoSC) resumoSC.textContent = Number.isFinite(SC) ? `${formatarMetrica(SC, 2)} m²` : '— m²'
}

function renderizarConversaoIndiceFluxo(SC){
    const corpoTabela = document.getElementById('tabelaConversaoIcFluxo')
    const scAtual = document.getElementById('conversaoScAtual')
    if(!corpoTabela) return

    const superficie = transformarNumero(SC)
    if(scAtual){
        scAtual.textContent = Number.isFinite(superficie)
            ? `SC: ${formatarMetrica(superficie, 2)} m²`
            : 'SC: — m²'
    }

    if(!Number.isFinite(superficie) || superficie <= 0){
        corpoTabela.innerHTML = '<tr><td colspan="4">Informe peso e altura para calcular.</td></tr>'
        return
    }

    const linhas = []
    for(let indice = 0; indice < INDICES_CARDIACOS_CONVERSAO.length; indice += 2){
        const primeiroIndice = INDICES_CARDIACOS_CONVERSAO[indice]
        const segundoIndice = INDICES_CARDIACOS_CONVERSAO[indice + 1]
        const primeiroFluxo = primeiroIndice * superficie
        const segundoFluxo = segundoIndice ? segundoIndice * superficie : null
        linhas.push(`
            <tr>
                <td>${formatarMetrica(primeiroIndice, 1)}</td>
                <td>${formatarMetrica(primeiroFluxo, 2)}</td>
                <td>${segundoIndice ? formatarMetrica(segundoIndice, 1) : '—'}</td>
                <td>${Number.isFinite(segundoFluxo) ? formatarMetrica(segundoFluxo, 2) : '—'}</td>
            </tr>
        `)
    }
    corpoTabela.innerHTML = linhas.join('')
}

function salvarHistoricoCaso(historico){
    localStorage.setItem('historicoImportado', JSON.stringify(historico))
}

function montarSnapshotBanco(paciente, casoClinico, historico, analise, estadoChecklist, chaveChecklist, dadosChecklist = {}){
    const resumoChecklist = calcularResumoChecklist(estadoChecklist)
    return {
        clientCaseKey: chaveChecklist,
        title: dadosChecklist.procedimento
            ? `${dadosChecklist.procedimento} · ${paciente?.sexo || 'sexo não informado'} · ${paciente?.idade || 'idade não informada'} anos`
            : undefined,
        patient: paciente,
        perfusionist: dadosChecklist,
        clinicalCase: casoClinico || {},
        monitoring: historico,
        checklist: {
            key: chaveChecklist,
            metadata: dadosChecklist,
            state: estadoChecklist,
            summary: resumoChecklist
        },
        analysis: {
            risco: analise?.risco,
            resumo: analise?.resumo || [],
            metricas: analise?.metricas || [],
            alertas: analise?.alertas || [],
            limitacoes: analise?.limitacoes || [],
            informacoesTecnicas: analise?.informacoesTecnicas || []
        },
        source: 'dashboard'
    }
}

function atualizarStatusBanco(mensagem, tipo = 'neutro'){
    const status = document.getElementById('statusBanco')
    if(!status) return
    status.textContent = mensagem
    status.classList.remove('text-slate-500', 'text-emerald-300', 'text-amber-300', 'text-red-300')
    const classes = {
        neutro: 'text-slate-500',
        sucesso: 'text-emerald-300',
        alerta: 'text-amber-300',
        erro: 'text-red-300'
    }
    status.classList.add(classes[tipo] || classes.neutro)
}

async function salvarCasoNoBanco(snapshot){
    if(typeof fetch !== 'function'){
        throw new Error('Fetch não está disponível neste ambiente.')
    }

    const fetchApi = window.PerfuseLabConfig?.authenticatedFetch || fetch
    const resposta = await fetchApi(`${API_BASE_URL}/api/cases/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
    })

    const corpo = await resposta.json().catch(() => ({}))
    if(!resposta.ok){
        throw new Error(corpo.error || 'Não foi possível salvar o caso no banco.')
    }
    return corpo
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
    let btnRelatorioSimples = document.getElementById('btnRelatorioSimples')
    let btnRelatorioCompleto = document.getElementById('btnRelatorioCompleto')
    let btnChecklist = document.getElementById('btnChecklist')
    let btnReferencias = document.getElementById('btnReferencias')
    let btnSalvarBanco = document.getElementById('btnSalvarBanco')
    let btnFecharChecklist = document.getElementById('btnFecharChecklist')
    let btnFecharRelatorioOpcoes = document.getElementById('btnFecharRelatorioOpcoes')
    let btnFecharReferencias = document.getElementById('btnFecharReferencias')
    let abaValoresReferencia = document.getElementById('abaValoresReferencia')
    let abaFormulasReferencia = document.getElementById('abaFormulasReferencia')
    
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
    atualizarResumoFluxoIndice(fluxo, SC)
    renderizarConversaoIndiceFluxo(SC)

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
        {input: k, campo: campoK, unidade: 'mmol/L'},
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

    const limites = {
        lactato: LIMIARES.lactato.critico,
        ido2: LIMIARES.ido2.alvoGdp,
        HbAdulto: LIMIARES.hb.atencao,
        HbPediatrico: LIMIARES.hb.pediatricoGrafico,
        HctAdulto: LIMIARES.hct.critico,
        HctPediatrico: LIMIARES.hct.pediatricoGrafico,
        IC: LIMIARES.ic.critico,
        svo2: LIMIARES.svo2.moderado,
        o2er: LIMIARES.o2er.moderado
    }


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
    atualizarResumoFluxoIndice(fluxo, SC)
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

    const chaveChecklist = criarChaveCaso(paciente, casoClinico)
    const estadoChecklist = carregarEstadoChecklist(chaveChecklist)
    const dadosChecklist = carregarDadosChecklist(chaveChecklist, casoClinico)
    renderizarChecklist(estadoChecklist, chaveChecklist)
    sincronizarCamposDadosChecklist(chaveChecklist, dadosChecklist)
    renderizarReferencias()
    atualizarStatusBanco('Banco: caso ainda não salvo', 'neutro')




    btnChecklist?.addEventListener('click', () => abrirModuloDashboard('checklistModal'))
    btnRelatorio?.addEventListener('click', () => abrirModuloDashboard('relatorioOpcoesModal'))
    btnReferencias?.addEventListener('click', () => abrirModuloDashboard('referenciasModal'))
    btnSalvarBanco?.addEventListener('click', async () => {
        try {
            btnSalvarBanco.disabled = true
            atualizarStatusBanco('Banco: salvando...', 'alerta')
            salvarDadosChecklist(chaveChecklist, dadosChecklist)
            const snapshot = montarSnapshotBanco(paciente, casoClinico, historicoExames, analiseAtual, estadoChecklist, chaveChecklist, dadosChecklist)
            await salvarCasoNoBanco(snapshot)
            atualizarStatusBanco('Banco: caso salvo', 'sucesso')
        } catch (erro) {
            atualizarStatusBanco(`Banco: ${erro.message}`, 'erro')
        } finally {
            btnSalvarBanco.disabled = false
        }
    })
    btnFecharChecklist?.addEventListener('click', () => fecharModuloDashboard('checklistModal'))
    btnFecharRelatorioOpcoes?.addEventListener('click', () => fecharModuloDashboard('relatorioOpcoesModal'))
    btnFecharReferencias?.addEventListener('click', () => fecharModuloDashboard('referenciasModal'))
    document.querySelectorAll('[data-close-modal]').forEach(elemento => {
        elemento.addEventListener('click', () => fecharModuloDashboard(elemento.dataset.closeModal))
    })
    document.addEventListener('keydown', evento => {
        if(evento.key === 'Escape'){
            fecharModuloDashboard('checklistModal')
            fecharModuloDashboard('relatorioOpcoesModal')
            fecharModuloDashboard('referenciasModal')
        }
    })
    abaValoresReferencia?.addEventListener('click', () => alternarAbaReferencias('valores'))
    abaFormulasReferencia?.addEventListener('click', () => alternarAbaReferencias('formulas'))
    fluxoInput.addEventListener('input', () => {
        atualizarResumoFluxoIndice(transformarNumero(fluxoInput.value) ?? fluxo, SC)
    })

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
        salvarHistoricoCaso(historicoExames)
        origemIdo2.textContent = descreverOrigemIdo2(exames)
        atualizarResumoFluxoIndice(exames.fluxo, SC)
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

    const contextoRelatorio = () => ({
        paciente,
        idade,
        peso,
        altura,
        SC,
        historicoExames,
        analiseAtual,
        tabelaExames,
        limites
    })
    btnRelatorioSimples?.addEventListener('click', () => {
        fecharModuloDashboard('relatorioOpcoesModal')
        imprimirRelatorio('simples', contextoRelatorio())
    })
    btnRelatorioCompleto?.addEventListener('click', () => {
        fecharModuloDashboard('relatorioOpcoesModal')
        imprimirRelatorio('completo', contextoRelatorio())
    })
    



})
