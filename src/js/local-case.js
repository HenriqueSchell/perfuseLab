// Evita combinar paciente novo com histórico antigo se uma gravação falhar.
function salvarEntradaLocal(valores) {
    const anteriores = Object.fromEntries(Object.keys(valores).map(chave => [chave, localStorage.getItem(chave)]))
    try {
        for (const [chave, valor] of Object.entries(valores)) localStorage.setItem(chave, JSON.stringify(valor))
    } catch (erro) {
        for (const [chave, valor] of Object.entries(anteriores)) {
            try {
                if (valor === null) localStorage.removeItem(chave)
                else localStorage.setItem(chave, valor)
            } catch { /* O erro original será apresentado ao usuário. */ }
        }
        throw erro
    }
}

// Entrar no dashboard inicia a CEC. A origem do primeiro registro é preservada.
function iniciarCecComPlano(patient, clinicalCase) {
    const plan = clinicalCase.planejamento_pre_cec;
    if (plan.cecStarted) return;
    const p = plan.inputs;
    const number = value => value === '' || value == null ? null : Number(value);
    const now = new Date();
    const sample = {tempo:0, origem:'planejamento', fluxo:number(p.plannedFlow), temperatura:number(p.temperature),
        hb:number(p.hb), hct:null, lactato:null, pam:null, sao2:number(p.sao2), sao2Informada:false,
        pao2:number(p.pao2), ido2Informado:plan.estimates?.ido2 ?? null};
    sample.hct = Number.isFinite(sample.hb) ? Number((sample.hb * 3).toFixed(2)) : null;
    sample.hctEstimado = sample.hct !== null;
    const updatedPatient = {...patient, fluxo:sample.fluxo, temperatura:sample.temperatura, hemoglobina:sample.hb,
        hematocrito:sample.hct, lactato:null, pam:null, sao2:sample.sao2};
    const updatedPlan = {...plan, status:'started', cecStarted:true, startedAt:now.toISOString(), measurements:[]};
    const updatedCase = {...clinicalCase, planejamento_pre_cec:updatedPlan, tempos_cirurgicos:{...clinicalCase.tempos_cirurgicos,
        inicio_cec:now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), inicio_cec_iso:now.toISOString()}};
    salvarEntradaLocal({paciente:updatedPatient,historicoImportado:[sample],casoClinicoImportado:updatedCase,'perfuselab.precec.v1':updatedPlan});
    Object.assign(patient, updatedPatient);
    Object.assign(clinicalCase, updatedCase);
}

