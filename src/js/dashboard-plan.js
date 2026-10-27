window.renderPlannedDashboard = function(patient, clinicalCase) {
    let plan = clinicalCase?.planejamento_pre_cec;
    if (!plan?.inputs || !patient) return false;
    if (!plan.cecStarted) {
        try { iniciarCecComPlano(patient, clinicalCase); plan = clinicalCase.planejamento_pre_cec; }
        catch { alert('Não foi possível iniciar a CEC. Confira o armazenamento do navegador.'); location.href='planejamento.html'; return true; }
    }
    const pending = false;
    const $ = id => document.getElementById(id);
    const inputs = plan.inputs, estimates = plan.estimates || {};
    const format = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString('pt-BR', {maximumFractionDigits: digits}) : '—';
    $('plannedDashboard').hidden = false;
    $('plannedIdentity').textContent = `${inputs.caseId} · ${inputs.procedure} · Responsável: ${inputs.professional}`;
    $('startPlannedCec').hidden = !pending;
    $('editPlanning').hidden = !pending;
    $('plannedEmpty').hidden = false;
    $('plannedEmpty').textContent = 'Registro inicial (0 min): valores do plano. Novos exames são registrados na monitorização abaixo.';
    if (!pending) {
        $('plannedPhase').textContent = 'CEC INICIADA · PLANO DE REFERÊNCIA';
        $('plannedTitle').textContent = 'Metas do planejamento';
    }
    const metrics = [
        ['Fluxo planejado', `${inputs.plannedFlow} L/min`],
        ['Temperatura planejada', `${inputs.temperature} °C`],
        ['Superfície corporal', `${format(estimates.bsa)} m²`],
        ['iDO₂ previsto', `${format(estimates.ido2, 0)} mL/min/m²`]
    ];
    for (const [label, value] of metrics) {
        const card = document.createElement('article'), title = document.createElement('span'), result = document.createElement('strong');
        title.textContent = label; result.textContent = value; card.append(title, result); $('plannedMetrics').append(card);
    }
    const details = [
        ['Data', inputs.date], ['Idade', `${inputs.age} anos`], ['Sexo', inputs.sex || 'Não informado'],
        ['Peso', `${inputs.weight} kg`], ['Altura', `${inputs.height} cm`],
        ['Hb pré-operatória', inputs.basalHb ? `${inputs.basalHb} g/dL` : 'Não informada'],
        ['Índice de referência', `${inputs.index} L/min/m²`], ['Meta simulada de iDO₂', `${inputs.target} mL/min/m²`],
        ['Hb esperada', inputs.hb ? `${inputs.hb} g/dL` : 'Não informada'],
        ['SaO₂ esperada', inputs.sao2 ? `${inputs.sao2}%` : 'Não informada'],
        ['PaO₂ esperada', inputs.pao2 ? `${inputs.pao2} mmHg` : 'Não informada'],
        ['Fluxo de referência', `${format(estimates.reference)} L/min`], ['Fluxo estimado GDP', `${format(estimates.gdp)} L/min`]
    ];
    for (const [label, value] of details) {
        const item = document.createElement('div'), term = document.createElement('dt'), description = document.createElement('dd');
        term.textContent = label; description.textContent = value; item.append(term, description); $('plannedDetails').append(item);
    }
    return false;
};
