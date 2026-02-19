// Transformar número
function transformarNumero(valor){
    if(!valor) return 0
    return Number(String(valor).replace(',','.'))
}
// Calcular superficie corporal
function superficieCorporal(peso, altura){
    return Number(Math.sqrt((peso * altura) / 3600).toFixed(2))
}

// Calcular oferta de oxigênio
function ofertaOxigenio(hemoglobina, sao2, fluxo, SC){
    const cao2 = hemoglobina * 1.34 * sao2
    const do2 = fluxo * cao2 * 10
    return (do2 / SC).toFixed(2)
}

//Calcular Índice cardíaco
function indiceCardiaco(fluxo, SC){
    return (fluxo / SC).toFixed(2)
}

//Função para resetar exames
function resetarExames(camposExames){
    camposExames.forEach(item => {
        item.input.value = ''
        item.input.classList.remove('hidden')

        item.campo.value = ''
        item.campo.classList.add('hidden')
    })
}



document.addEventListener('DOMContentLoaded', () => {
    const paciente = JSON.parse(localStorage.getItem('paciente'))

    //Validar se eiste a variável
    if(!paciente){
        alert('Nenhum dado do paciente encontrado, Volte a página inicial e inicie uma nova simulação!')
        window.location.href = 'index.html'
        return
    }

    //Resgatar as variáveis
    const idade = transformarNumero(paciente.idade)
    const peso = transformarNumero(paciente.peso)
    const altura = transformarNumero(paciente.alturaNum)
    const sao2 = transformarNumero(paciente.sao2) / 100
    const hemoglobina = transformarNumero(paciente.hemoglobina)
    const fluxo = transformarNumero(paciente.fluxo)
    const hct = transformarNumero(paciente.hematocrito)
    const lactato = transformarNumero(paciente.lactato)

    //Resgatar e imprimir os dados
    const campoSexo = document.getElementById('campoSexo')
    const campoIdade = document.getElementById('campoIdade')
    const campoPeso = document.getElementById('campoPeso')
    const campoSC = document.getElementById('campoSC')
    const campoido2 = document.getElementById('campoido2')
    const campoHb = document.getElementById('campoHb')
    const campoHct = document.getElementById('campoHct')
    const campoLactato = document.getElementById('campoLactato')
    const campoIC = document.getElementById('campoIC')
    const classificacaoido2 = document.getElementById('classificacaoido2')
    const classificacaoHb = document.getElementById('classificacaoHb')
    const classificacaoHct = document.getElementById('classificacaoHct')
    const classificacaoLactato = document.getElementById('classificacaoLactato')
    const campoScore = document.getElementById('campoScore')
    const classificacaoScore = document.getElementById('classificacaoScore')
    const btnExames = document.getElementById('btnExames')
    const btnNovosExames = document.getElementById('btnNovosExames')

    //Conteúdo Header
    campoSexo.textContent = `Paciente: ${paciente.sexo}`
    campoIdade.textContent = `${idade} anos`
    campoPeso.textContent = `${peso} Kg`

    //Conteúdo cards

    //Hemoglobina
    campoHb.textContent = hemoglobina
    if(hemoglobina < 8){
        classificacaoHb.classList.add('bg-red-500')
        classificacaoHb.textContent = 'Zona Crítica'
    }else if(hemoglobina >= 8 && hemoglobina < 10){
        classificacaoHb.classList.add('bg-amber-400')
        classificacaoHb.textContent = 'Zona Limítrofe'
    }else if(hemoglobina >= 10){
        classificacaoHb.classList.add('bg-emerald-600')
        classificacaoHb.textContent = 'Zona Segura'
    }

    //Hematócrito
    campoHct.textContent = hct
    if(hct < 22){
        classificacaoHct.classList.add('bg-red-500')
        classificacaoHct.textContent = 'Zona Crítica'
    }else if(hct >= 22 && hct < 24){
        classificacaoHct.classList.add('bg-amber-400')
        classificacaoHct.textContent = 'Zona Limítrofe'
    }else if(hct >=24){
        classificacaoHct.classList.add('bg-emerald-600')
        classificacaoHct.textContent = 'Zona Segura'
    }

    //Lactato
    campoLactato.textContent = lactato
    if(lactato >= 3){
        classificacaoLactato.classList.add('bg-red-500')
        classificacaoLactato.textContent = 'Zona Crítica'
    }else if(lactato < 3 && lactato > 2){
        classificacaoLactato.classList.add('bg-amber-400')
        classificacaoLactato.textContent = 'Zona Limítrofe'
    }else if(lactato <= 2){
        classificacaoLactato.classList.add('bg-emerald-600')
        classificacaoLactato.textContent = 'Zona Segura'
    }

    //Superfície Corporal
    const SC = superficieCorporal(peso,altura)
    campoSC.textContent = `SC: ${SC} m²`

    //Oferta de oxigênio iDO²
    const ido2 = ofertaOxigenio(hemoglobina, sao2, fluxo, SC)
    campoido2.textContent = ido2
    if(ido2 < 260){
        classificacaoido2.classList.add('bg-red-500')
        classificacaoido2.textContent = 'Zona Crítica'
    }else if(ido2 >= 260 && ido2 < 300){
        classificacaoido2.classList.add('bg-amber-400')
        classificacaoido2.textContent = 'Zona Limítrofe'
    }else if(ido2 >= 300){
        classificacaoido2.classList.add('bg-emerald-600')
        classificacaoido2.textContent = 'Zona Segura'
    }

    //Índice cardíaco
    const IC = indiceCardiaco(fluxo, SC)
    campoIC.textContent = IC

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
    }else if(lactato > 2 && lactato <= 3){
        scoreLactato = 1
    }else if(lactato > 3){
        scoreLactato = 0
    }
    
    //Score IC
    if(IC >= 2.4){
        scoreIC = 2
    }else if(IC > 2.2 && IC < 2.4){
        scoreIC = 1
    }else if(IC < 2.2){
        scoreIC = 0
    }
    
    //Somatória
    let scoreTotal = scoreIdo2 + scoreHct + scoreLactato + scoreIC

    //Regras de corte fisiológica
    if(ido2 < 260 && lactato > 3){
        classificacaoScore.classList.add('bg-red-500')
        classificacaoScore.textContent = 'Perfusão Inadequada'
    }
    if(hct < 22 && IC < 2.2){
        scoreTotal -= 1
    }

    campoScore.textContent = scoreTotal


    //Classificação do Score
    if(scoreTotal >= 9){
        classificacaoScore.classList.add('bg-emerald-600')
        classificacaoScore.textContent = 'Perfusão ótima'
    }if(scoreTotal >= 7 && scoreTotal < 9){
        classificacaoScore.classList.add('bg-emerald-600')
        classificacaoScore.textContent = 'Perfusão Adequada'
    }if(scoreTotal >= 5 && scoreTotal < 7){
        classificacaoScore.classList.add('bg-amber-400')
        classificacaoScore.textContent = 'Perfusão Limítrofe'
    }if(scoreTotal <= 4){
        classificacaoScore.classList.add('bg-red-500')
        classificacaoScore.textContent = 'Perfusão Inadequada'
    }

    let historicoExames = []
    //Resgatar os dados
        const tempo = document.getElementById('tempo')
        const ph = document.getElementById('ph')
        const pao2 = document.getElementById('pao2')
        const paco2 = document.getElementById('paco2')
        const hco3 = document.getElementById('hco3')
        const be = document.getElementById('be')
        const lactatoAtt = document.getElementById('lactatoAtt')
        const k = document.getElementById('k')
        const ca = document.getElementById('ca2')
        const hb = document.getElementById('hb')
        const hctAtt = document.getElementById('hctAtt')
        const svo2 = document.getElementById('svo2')
        const campoPh = document.getElementById('campoPh')
        const campoPao2 = document.getElementById('campoPao2')
        const campoPaco2 = document.getElementById('campoPaco2')
        const campoHco3 = document.getElementById('campoHco3')
        const campoBe = document.getElementById('campoBe')
        const campoLactatoExame = document.getElementById('campoLactatoExame')
        const campoK = document.getElementById('campoK')
        const campoCa = document.getElementById('campoCa')
        const campoHbExame = document.getElementById('campoHbExame')
        const campoHctExame = document.getElementById('campoHctExame')
        const campoSvo2 = document.getElementById('campoSvo2')
        const campoTempo = document.getElementById('campoTempo')

        const camposExames = [
        {input: tempo, campo: campoTempo, unidade: 'min'},
        {input: ph, campo: campoPh, unidade: ''},
        {input: pao2, campo: campoPao2, unidade: 'mmHg'},
        {input: paco2, campo: campoPaco2, unidade: 'mmHg'},
        {input: hco3, campo: campoHco3, unidade: 'mEq/L'},
        {input: be, campo: campoBe, unidade: 'mEq/L'},
        {input: lactatoAtt, campo: campoLactatoExame, unidade: 'mmol/L'},
        {input: k, campo: campoK, unidade: 'mEq/L'},
        {input: ca, campo: campoCa, unidade: 'mmol/L'},
        {input: hb, campo: campoHbExame, unidade: 'g/dL'},
        {input: hctAtt, campo: campoHctExame, unidade: '%'},
        {input: svo2, campo: campoSvo2, unidade: '%'},
    ]

    //Monitorização Laboratorial
    btnExames.addEventListener('click', () => {
    
        camposExames.forEach(item => {
            if(item.input.value){
                item.campo.textContent = `${item.input.value} ${item.unidade}`
                item.input.classList.add('hidden')
                item.campo.classList.remove('hidden')
            }
        })
        
        //Adicionar valores ao dicionário
        const exames = {
            tempo: Number(tempo.value),
            ph: Number(ph.value),
            pao2: Number(pao2.value),
            paco2: Number(paco2.value),
            hco3: Number(hco3.value),
            be: Number(be.value),
            lactato: Number(lactatoAtt.value),
            k: Number(k.value),
            ca: Number(ca.value),
            hb: Number(hb.value),
            hct: Number(hctAtt.value),
            svo2: Number(svo2.value)
        }
        historicoExames.push(exames)
        console.log('Histórico atualizado:', historicoExames)
        




    })
    
    btnNovosExames.addEventListener('click', () =>{
        resetarExames(camposExames)
    })


})