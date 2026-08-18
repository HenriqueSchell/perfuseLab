const fs = require('fs/promises')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outputDir = path.join(root, 'casos-completos-cirurgicos')

function round(value, digits = 2) {
    const factor = 10 ** digits
    return Math.round((value + Number.EPSILON) * factor) / factor
}

function bsaMosteller(weightKg, heightCm) {
    return Math.sqrt((weightKg * heightCm) / 3600)
}

function oxygenDeliveryIndex(row, bsa) {
    const ic = row.ic ?? row.fluxo / bsa
    const arterialContent = (row.hb * 1.36 * (row.sao2 / 100)) + ((row.pao2 || 0) * 0.003)
    return 10 * ic * arterialContent
}

function enrichCase(caso) {
    const bsa = bsaMosteller(caso.paciente.peso, caso.paciente.altura)
    caso.paciente.procedimento = caso.procedimento.tipo_cirurgia
    caso.paciente.temperatura = caso.monitorizacao[0].temperatura
    caso.paciente.pam = caso.monitorizacao[0].pam
    caso.operacional.temperatura_c = caso.monitorizacao.map(row => row.temperatura)
    caso.operacional.pam_mmhg = caso.monitorizacao.map(row => row.pam)
    caso.debito_urinario = {
        volume_ml: caso.balanco_hidrico.debito_urinario_ml,
        tempo_min: caso.tempos_cirurgicos.tempo_cec_min
    }
    caso.metadados_conversao = {
        superficie_corporal_m2: round(bsa, 3),
        observacao: 'Caso sintetico realista para treino. Nao representa paciente real.'
    }
    caso.monitorizacao = caso.monitorizacao.map(row => {
        const ic = row.ic ?? row.fluxo / bsa
        const ido2 = oxygenDeliveryIndex({ ...row, ic }, bsa)
        return {
            ...row,
            ic: round(ic, 2),
            ido2_informado: round(ido2, 0),
            ivo2: row.ivo2,
            do2_vo2: row.ivo2 ? round(ido2 / row.ivo2, 2) : null,
            lactato_mg_dl: round(row.lactato * 9.009, 1)
        }
    })
    return caso
}

const casos = [
    {
        arquivo: '01_revascularizacao_miocardio_eletiva.json',
        metadados: { id_caso: 'CC-001', categoria: 'adulto', finalidade: 'Treino de CEC adulta estavel' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 03', prontuario_simulado: 'SIM-CC-001' },
        paciente: {
            sexo: 'masculino',
            idade: 64,
            peso: 88,
            altura: 174,
            comorbidades: ['Doenca arterial coronariana triarterial', 'Hipertensao arterial', 'Diabetes mellitus tipo 2'],
            risco_pre_operatorio: { euroscore_ii: 1.8, creatinina_mg_dl: 1.0, hematocrito_preop: 39 }
        },
        procedimento: {
            tipo_cirurgia: 'Revascularizacao do miocardio eletiva',
            descricao: 'CRM com enxertos mamaria esquerda e safena',
            carater: 'eletiva'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista A',
            responsavel_cec: 'Perfusionista A',
            perfusionista_check: 'Perfusionista B'
        },
        tempos_cirurgicos: {
            entrada_sala: '07:00',
            inducao: '07:18',
            incisao: '08:02',
            heparinizacao: '08:18',
            inicio_cec: '08:31',
            inicio_clampeamento: '08:39',
            primeira_cardioplegia: '08:41',
            fim_clampeamento: '09:33',
            inicio_reaquecimento: '09:38',
            fim_cec: '09:53',
            protamina: '09:58',
            fechamento: '10:42',
            tempo_cec_min: 82,
            tempo_clampeamento_min: 54
        },
        cec: {
            configuracao: 'Circuito adulto convencional',
            oxigenador: 'Adulto de fibra oca com reservatorio venoso',
            filtro_arterial: true,
            prime_ml: 1400,
            rap_ml: 350,
            ultrafiltracao_ml: 0,
            hemoconcentrador: false,
            cardioplegia: 'Sanguinea fria 4:1 anterograda',
            cardioplegia_ml: 1450,
            canula_arterial_fr: 22,
            canulas_venosas_fr: [36, 32],
            drenagem_venosa: 'gravidade',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 300,
            tca_basal_s: 128,
            tca_pos_heparina_s: 612,
            tca_cec_s: 698,
            protamina_mg: 280,
            tca_pos_neutralizacao_s: 136
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: 0,
            pressao_pre_membrana_mmhg: 210,
            pressao_pos_membrana_mmhg: 178,
            fluxo_gas_l_min: [2.8, 2.6, 2.5, 2.4, 2.4],
            sweep_fio2_percentual: [70, 60, 55, 50, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1200,
            hemocomponentes: { concentrado_hemacias_ml: 0, plasma_ml: 0, plaquetas_ml: 0 },
            ultrafiltracao_ml: 0,
            debito_urinario_ml: 550,
            balanco_estimado_ml: 650
        },
        eventos: ['Entrada em CEC sem intercorrencias', 'Cardioplegia repetida a cada 20 minutos', 'Saida de CEC com baixo suporte vasoativo'],
        monitorizacao: [
            { tempo: 0, fluxo: 5.0, hb: 10.8, hct: 32.4, lactato: 1.2, sao2: 99, ph: 7.39, svo2: 78, pao2: 245, paco2: 39, hco3: 23.5, be: -1, k: 4.2, ca: 1.16, na: 138, cl: 104, glicose: 142, fio2: 70, ivo2: 72, gap_pco2: 4, pam: 68, temperatura: 35.8 },
            { tempo: 20, fluxo: 5.1, hb: 9.6, hct: 28.8, lactato: 1.3, sao2: 99, ph: 7.38, svo2: 80, pao2: 198, paco2: 40, hco3: 23.8, be: -1, k: 4.5, ca: 1.13, na: 137, cl: 105, glicose: 156, fio2: 60, ivo2: 68, gap_pco2: 4, pam: 72, temperatura: 34.2 },
            { tempo: 45, fluxo: 5.0, hb: 9.1, hct: 27.3, lactato: 1.4, sao2: 98, ph: 7.37, svo2: 76, pao2: 174, paco2: 42, hco3: 24.1, be: -1, k: 4.3, ca: 1.12, na: 138, cl: 105, glicose: 168, fio2: 55, ivo2: 75, gap_pco2: 5, pam: 70, temperatura: 33.8 },
            { tempo: 70, fluxo: 5.2, hb: 9.0, hct: 27.0, lactato: 1.5, sao2: 99, ph: 7.40, svo2: 79, pao2: 158, paco2: 38, hco3: 23.6, be: -1, k: 4.1, ca: 1.17, na: 139, cl: 106, glicose: 172, fio2: 50, ivo2: 70, gap_pco2: 4, pam: 74, temperatura: 35.5 },
            { tempo: 82, fluxo: 4.8, hb: 9.4, hct: 28.2, lactato: 1.6, sao2: 99, ph: 7.41, svo2: 77, pao2: 152, paco2: 37, hco3: 23.2, be: -1, k: 4.0, ca: 1.19, na: 140, cl: 106, glicose: 166, fio2: 50, ivo2: 73, gap_pco2: 4, pam: 76, temperatura: 36.2 }
        ]
    },
    {
        arquivo: '02_troca_valvar_aortica_estenose.json',
        metadados: { id_caso: 'CC-002', categoria: 'adulto', finalidade: 'Treino de troca valvar com hemodiluicao moderada' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 04', prontuario_simulado: 'SIM-CC-002' },
        paciente: {
            sexo: 'feminino',
            idade: 72,
            peso: 62,
            altura: 158,
            comorbidades: ['Estenose aortica importante', 'Hipertensao arterial', 'Doenca renal cronica estagio 2'],
            risco_pre_operatorio: { euroscore_ii: 3.1, creatinina_mg_dl: 1.25, hematocrito_preop: 36 }
        },
        procedimento: {
            tipo_cirurgia: 'Troca valvar aortica por bioprotese',
            descricao: 'Estenose aortica calcificada com implante de bioprotese',
            carater: 'eletiva'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista C',
            responsavel_cec: 'Perfusionista C',
            perfusionista_check: 'Perfusionista D'
        },
        tempos_cirurgicos: {
            entrada_sala: '07:10',
            inducao: '07:29',
            incisao: '08:12',
            heparinizacao: '08:31',
            inicio_cec: '08:43',
            inicio_clampeamento: '08:51',
            primeira_cardioplegia: '08:53',
            fim_clampeamento: '10:01',
            inicio_reaquecimento: '09:52',
            fim_cec: '10:15',
            protamina: '10:21',
            fechamento: '11:02',
            tempo_cec_min: 92,
            tempo_clampeamento_min: 70
        },
        cec: {
            configuracao: 'Circuito adulto reduzido',
            oxigenador: 'Adulto baixo prime',
            filtro_arterial: true,
            prime_ml: 1050,
            rap_ml: 250,
            ultrafiltracao_ml: 600,
            hemoconcentrador: true,
            cardioplegia: 'Del Nido adulto anterograda',
            cardioplegia_ml: 1250,
            canula_arterial_fr: 20,
            canulas_venosas_fr: [32, 28],
            drenagem_venosa: 'gravidade assistida',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 240,
            tca_basal_s: 119,
            tca_pos_heparina_s: 548,
            tca_cec_s: 602,
            protamina_mg: 220,
            tca_pos_neutralizacao_s: 128
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -25,
            pressao_pre_membrana_mmhg: 225,
            pressao_pos_membrana_mmhg: 190,
            fluxo_gas_l_min: [2.2, 2.0, 2.0, 1.9, 1.8],
            sweep_fio2_percentual: [70, 60, 55, 50, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 900,
            hemocomponentes: { concentrado_hemacias_ml: 300, plasma_ml: 0, plaquetas_ml: 0 },
            ultrafiltracao_ml: 600,
            debito_urinario_ml: 380,
            balanco_estimado_ml: 520
        },
        eventos: ['RAP parcial realizado antes da CEC', 'Hemoconcentracao durante reaquecimento', 'Uma unidade de concentrado de hemacias preparada por queda de Hb'],
        monitorizacao: [
            { tempo: 0, fluxo: 3.7, hb: 10.2, hct: 30.6, lactato: 1.0, sao2: 99, ph: 7.38, svo2: 76, pao2: 232, paco2: 40, hco3: 23.6, be: -1, k: 4.0, ca: 1.14, na: 137, cl: 104, glicose: 128, fio2: 70, ivo2: 62, gap_pco2: 4, pam: 65, temperatura: 35.6 },
            { tempo: 25, fluxo: 3.8, hb: 8.6, hct: 25.8, lactato: 1.2, sao2: 98, ph: 7.36, svo2: 74, pao2: 188, paco2: 42, hco3: 23.0, be: -2, k: 4.4, ca: 1.09, na: 136, cl: 105, glicose: 146, fio2: 60, ivo2: 66, gap_pco2: 5, pam: 68, temperatura: 33.4 },
            { tempo: 50, fluxo: 3.9, hb: 8.1, hct: 24.3, lactato: 1.5, sao2: 98, ph: 7.35, svo2: 72, pao2: 164, paco2: 43, hco3: 22.8, be: -3, k: 4.2, ca: 1.08, na: 136, cl: 105, glicose: 158, fio2: 55, ivo2: 70, gap_pco2: 5, pam: 70, temperatura: 32.8 },
            { tempo: 75, fluxo: 4.0, hb: 8.4, hct: 25.2, lactato: 1.8, sao2: 99, ph: 7.39, svo2: 76, pao2: 152, paco2: 38, hco3: 22.6, be: -2, k: 3.9, ca: 1.16, na: 138, cl: 106, glicose: 164, fio2: 50, ivo2: 66, gap_pco2: 4, pam: 73, temperatura: 35.2 },
            { tempo: 92, fluxo: 3.6, hb: 8.8, hct: 26.4, lactato: 2.0, sao2: 99, ph: 7.40, svo2: 75, pao2: 146, paco2: 37, hco3: 22.9, be: -2, k: 3.8, ca: 1.18, na: 139, cl: 106, glicose: 160, fio2: 50, ivo2: 68, gap_pco2: 4, pam: 76, temperatura: 36.1 }
        ]
    },
    {
        arquivo: '03_retroca_mitral_reoperacao.json',
        metadados: { id_caso: 'CC-003', categoria: 'adulto', finalidade: 'Treino de reoperacao valvar prolongada' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 02', prontuario_simulado: 'SIM-CC-003' },
        paciente: {
            sexo: 'feminino',
            idade: 56,
            peso: 68,
            altura: 164,
            comorbidades: ['Proteses valvares previas', 'Hipertensao pulmonar', 'Fibrilacao atrial', 'Anemia pre-operatoria'],
            risco_pre_operatorio: { euroscore_ii: 7.2, creatinina_mg_dl: 1.1, hematocrito_preop: 31 }
        },
        procedimento: {
            tipo_cirurgia: 'Retroca de protese mitral em reoperacao',
            descricao: 'Reentrada esternal, retirada de protese disfuncionante e implante mitral',
            carater: 'eletiva de alto risco'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista E',
            responsavel_cec: 'Perfusionista F',
            perfusionista_check: 'Perfusionista E'
        },
        tempos_cirurgicos: {
            entrada_sala: '06:45',
            inducao: '07:06',
            incisao: '07:55',
            heparinizacao: '08:35',
            inicio_cec: '08:48',
            inicio_clampeamento: '09:05',
            primeira_cardioplegia: '09:07',
            fim_clampeamento: '10:48',
            inicio_reaquecimento: '10:22',
            fim_cec: '11:13',
            protamina: '11:20',
            fechamento: '12:18',
            tempo_cec_min: 145,
            tempo_clampeamento_min: 103
        },
        cec: {
            configuracao: 'Circuito adulto com hemoconcentrador',
            oxigenador: 'Adulto alta eficiencia',
            filtro_arterial: true,
            prime_ml: 1300,
            rap_ml: 200,
            ultrafiltracao_ml: 1200,
            hemoconcentrador: true,
            cardioplegia: 'Del Nido adulto anterograda e retrograda',
            cardioplegia_ml: 1800,
            canula_arterial_fr: 20,
            canulas_venosas_fr: [32, 30],
            drenagem_venosa: 'vacuo assistido',
            alvo_ic_l_min_m2: 2.5
        },
        anticoagulacao: {
            heparina_mg: 280,
            tca_basal_s: 132,
            tca_pos_heparina_s: 594,
            tca_cec_s: 642,
            protamina_mg: 260,
            tca_pos_neutralizacao_s: 146
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -35,
            pressao_pre_membrana_mmhg: 238,
            pressao_pos_membrana_mmhg: 198,
            fluxo_gas_l_min: [2.5, 2.4, 2.6, 2.7, 2.4, 2.2],
            sweep_fio2_percentual: [80, 70, 60, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1500,
            hemocomponentes: { concentrado_hemacias_ml: 600, plasma_ml: 300, plaquetas_ml: 0 },
            ultrafiltracao_ml: 1200,
            debito_urinario_ml: 420,
            balanco_estimado_ml: 1250
        },
        eventos: ['Adesoes importantes na reentrada', 'Drenagem venosa assistida por vacuo', 'Reposicao de hemacias por hemodiluicao e tempo prolongado'],
        monitorizacao: [
            { tempo: 0, fluxo: 4.2, hb: 9.6, hct: 28.8, lactato: 1.5, sao2: 99, ph: 7.36, svo2: 73, pao2: 268, paco2: 42, hco3: 23.4, be: -2, k: 4.3, ca: 1.10, na: 136, cl: 104, glicose: 134, fio2: 80, ivo2: 72, gap_pco2: 5, pam: 64, temperatura: 35.2 },
            { tempo: 30, fluxo: 4.3, hb: 8.0, hct: 24.0, lactato: 1.8, sao2: 98, ph: 7.33, svo2: 69, pao2: 212, paco2: 45, hco3: 22.8, be: -3, k: 4.8, ca: 1.04, na: 135, cl: 105, glicose: 150, fio2: 70, ivo2: 78, gap_pco2: 6, pam: 62, temperatura: 32.6 },
            { tempo: 60, fluxo: 4.5, hb: 7.5, hct: 22.5, lactato: 2.2, sao2: 98, ph: 7.31, svo2: 66, pao2: 176, paco2: 47, hco3: 22.0, be: -4, k: 4.6, ca: 1.02, na: 134, cl: 105, glicose: 166, fio2: 60, ivo2: 84, gap_pco2: 7, pam: 60, temperatura: 31.8 },
            { tempo: 95, fluxo: 4.7, hb: 8.1, hct: 24.3, lactato: 2.8, sao2: 99, ph: 7.34, svo2: 70, pao2: 168, paco2: 41, hco3: 21.5, be: -4, k: 4.2, ca: 1.12, na: 136, cl: 106, glicose: 184, fio2: 60, ivo2: 80, gap_pco2: 6, pam: 68, temperatura: 34.0 },
            { tempo: 125, fluxo: 4.6, hb: 8.7, hct: 26.1, lactato: 3.2, sao2: 99, ph: 7.38, svo2: 72, pao2: 154, paco2: 38, hco3: 21.9, be: -3, k: 3.8, ca: 1.18, na: 138, cl: 106, glicose: 192, fio2: 55, ivo2: 78, gap_pco2: 5, pam: 72, temperatura: 35.5 },
            { tempo: 145, fluxo: 4.0, hb: 9.2, hct: 27.6, lactato: 3.5, sao2: 99, ph: 7.39, svo2: 71, pao2: 148, paco2: 37, hco3: 22.2, be: -3, k: 3.7, ca: 1.20, na: 139, cl: 106, glicose: 186, fio2: 50, ivo2: 80, gap_pco2: 5, pam: 74, temperatura: 36.0 }
        ]
    },
    {
        arquivo: '04_bentall_aorta_ascendente.json',
        metadados: { id_caso: 'CC-004', categoria: 'adulto', finalidade: 'Treino de cirurgia de aorta com hipotermia moderada' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 01', prontuario_simulado: 'SIM-CC-004' },
        paciente: {
            sexo: 'masculino',
            idade: 48,
            peso: 92,
            altura: 182,
            comorbidades: ['Aneurisma de raiz de aorta', 'Insuficiencia aortica importante', 'Sindrome de Marfan suspeita'],
            risco_pre_operatorio: { euroscore_ii: 4.5, creatinina_mg_dl: 0.9, hematocrito_preop: 42 }
        },
        procedimento: {
            tipo_cirurgia: 'Bentall-De Bono com troca de aorta ascendente',
            descricao: 'Tubo valvado, reimplante de coronarias e substituicao de aorta ascendente',
            carater: 'eletiva'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista G',
            responsavel_cec: 'Perfusionista G',
            perfusionista_check: 'Perfusionista H'
        },
        tempos_cirurgicos: {
            entrada_sala: '06:50',
            inducao: '07:12',
            incisao: '08:06',
            heparinizacao: '08:28',
            inicio_cec: '08:42',
            inicio_clampeamento: '08:57',
            primeira_cardioplegia: '08:59',
            fim_clampeamento: '11:01',
            inicio_reaquecimento: '10:18',
            fim_cec: '11:30',
            protamina: '11:37',
            fechamento: '12:40',
            tempo_cec_min: 168,
            tempo_clampeamento_min: 124
        },
        cec: {
            configuracao: 'Circuito adulto com linha para perfusao cerebral seletiva disponivel',
            oxigenador: 'Adulto alta performance',
            filtro_arterial: true,
            prime_ml: 1500,
            rap_ml: 300,
            ultrafiltracao_ml: 900,
            hemoconcentrador: true,
            cardioplegia: 'Sanguinea fria anterograda e ostial',
            cardioplegia_ml: 2200,
            canula_arterial_fr: 22,
            canulas_venosas_fr: [34, 32],
            drenagem_venosa: 'gravidade assistida',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 340,
            tca_basal_s: 121,
            tca_pos_heparina_s: 655,
            tca_cec_s: 710,
            protamina_mg: 320,
            tca_pos_neutralizacao_s: 142
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -20,
            pressao_pre_membrana_mmhg: 246,
            pressao_pos_membrana_mmhg: 205,
            fluxo_gas_l_min: [3.2, 3.0, 2.8, 3.0, 2.6, 2.4],
            sweep_fio2_percentual: [80, 70, 65, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1600,
            hemocomponentes: { concentrado_hemacias_ml: 300, plasma_ml: 300, plaquetas_ml: 250 },
            ultrafiltracao_ml: 900,
            debito_urinario_ml: 620,
            balanco_estimado_ml: 1180
        },
        eventos: ['Resfriamento ate 26 C', 'Perfusao cerebral seletiva preparada e nao utilizada', 'Reaquecimento gradual com controle de gradiente'],
        monitorizacao: [
            { tempo: 0, fluxo: 5.4, hb: 11.4, hct: 34.2, lactato: 1.1, sao2: 99, ph: 7.40, svo2: 79, pao2: 286, paco2: 38, hco3: 23.8, be: 0, k: 4.1, ca: 1.15, na: 138, cl: 104, glicose: 116, fio2: 80, ivo2: 76, gap_pco2: 4, pam: 70, temperatura: 35.7 },
            { tempo: 35, fluxo: 5.2, hb: 9.2, hct: 27.6, lactato: 1.4, sao2: 98, ph: 7.37, svo2: 76, pao2: 238, paco2: 41, hco3: 23.1, be: -2, k: 4.6, ca: 1.08, na: 136, cl: 105, glicose: 134, fio2: 70, ivo2: 74, gap_pco2: 5, pam: 66, temperatura: 30.5 },
            { tempo: 70, fluxo: 4.8, hb: 8.6, hct: 25.8, lactato: 1.8, sao2: 98, ph: 7.34, svo2: 72, pao2: 210, paco2: 44, hco3: 22.5, be: -3, k: 4.4, ca: 1.04, na: 135, cl: 105, glicose: 152, fio2: 65, ivo2: 78, gap_pco2: 6, pam: 63, temperatura: 26.4 },
            { tempo: 105, fluxo: 5.3, hb: 8.8, hct: 26.4, lactato: 2.2, sao2: 99, ph: 7.36, svo2: 74, pao2: 184, paco2: 40, hco3: 21.8, be: -3, k: 4.0, ca: 1.12, na: 136, cl: 106, glicose: 166, fio2: 60, ivo2: 76, gap_pco2: 5, pam: 68, temperatura: 31.2 },
            { tempo: 140, fluxo: 5.5, hb: 9.4, hct: 28.2, lactato: 2.6, sao2: 99, ph: 7.39, svo2: 76, pao2: 162, paco2: 37, hco3: 22.2, be: -2, k: 3.7, ca: 1.19, na: 138, cl: 106, glicose: 174, fio2: 55, ivo2: 74, gap_pco2: 5, pam: 72, temperatura: 35.0 },
            { tempo: 168, fluxo: 4.9, hb: 9.8, hct: 29.4, lactato: 2.9, sao2: 99, ph: 7.40, svo2: 75, pao2: 150, paco2: 36, hco3: 22.0, be: -3, k: 3.8, ca: 1.21, na: 139, cl: 106, glicose: 170, fio2: 50, ivo2: 78, gap_pco2: 5, pam: 76, temperatura: 36.1 }
        ]
    },
    {
        arquivo: '05_disseccao_aguda_aorta_hipotermia.json',
        metadados: { id_caso: 'CC-005', categoria: 'adulto', finalidade: 'Treino de emergencia de aorta com alto risco metabolico' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 01', prontuario_simulado: 'SIM-CC-005' },
        paciente: {
            sexo: 'feminino',
            idade: 61,
            peso: 70,
            altura: 165,
            comorbidades: ['Disseccao aguda de aorta tipo A', 'Hipertensao arterial', 'Choque inicial revertido'],
            risco_pre_operatorio: { euroscore_ii: 18.5, creatinina_mg_dl: 1.45, hematocrito_preop: 34 }
        },
        procedimento: {
            tipo_cirurgia: 'Correcao de disseccao aguda de aorta tipo A',
            descricao: 'Substituicao de aorta ascendente e hemiarco com hipotermia profunda curta',
            carater: 'emergencia'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista I',
            responsavel_cec: 'Perfusionista J',
            perfusionista_check: 'Perfusionista I'
        },
        tempos_cirurgicos: {
            entrada_sala: '02:12',
            inducao: '02:27',
            incisao: '03:02',
            heparinizacao: '03:20',
            inicio_cec: '03:34',
            inicio_clampeamento: '03:49',
            parada_circulatoria_inicio: '04:24',
            parada_circulatoria_fim: '04:48',
            primeira_cardioplegia: '03:51',
            fim_clampeamento: '06:07',
            inicio_reaquecimento: '05:16',
            fim_cec: '07:14',
            protamina: '07:23',
            fechamento: '08:35',
            tempo_cec_min: 220,
            tempo_clampeamento_min: 138,
            parada_circulatoria_min: 24
        },
        cec: {
            configuracao: 'Circuito adulto para cirurgia de aorta',
            oxigenador: 'Adulto alta performance',
            filtro_arterial: true,
            prime_ml: 1600,
            rap_ml: 150,
            ultrafiltracao_ml: 1800,
            hemoconcentrador: true,
            cardioplegia: 'Sanguinea fria anterograda/ostial',
            cardioplegia_ml: 2600,
            canula_arterial_fr: 20,
            canulas_venosas_fr: [34, 30],
            drenagem_venosa: 'vacuo assistido',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 300,
            tca_basal_s: 116,
            tca_pos_heparina_s: 534,
            tca_cec_s: 580,
            protamina_mg: 300,
            tca_pos_neutralizacao_s: 152
        },
        operacional: {
            estrategia_ph: 'pH-stat no resfriamento profundo; alfa-stat no reaquecimento',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -40,
            pressao_pre_membrana_mmhg: 252,
            pressao_pos_membrana_mmhg: 207,
            fluxo_gas_l_min: [2.8, 3.0, 2.2, 2.4, 2.6, 2.4, 2.2],
            sweep_fio2_percentual: [90, 80, 70, 70, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 2200,
            hemocomponentes: { concentrado_hemacias_ml: 900, plasma_ml: 600, plaquetas_ml: 300 },
            ultrafiltracao_ml: 1800,
            debito_urinario_ml: 300,
            balanco_estimado_ml: 2100
        },
        eventos: ['Caso iniciado em emergencia', 'Hipotermia profunda com parada circulatoria curta', 'Lactato crescente durante reaquecimento'],
        monitorizacao: [
            { tempo: 0, fluxo: 4.2, hb: 10.0, hct: 30.0, lactato: 2.1, sao2: 99, ph: 7.31, svo2: 72, pao2: 302, paco2: 46, hco3: 22.4, be: -4, k: 4.0, ca: 1.08, na: 137, cl: 105, glicose: 178, fio2: 90, ivo2: 78, gap_pco2: 6, pam: 58, temperatura: 35.0 },
            { tempo: 40, fluxo: 4.1, hb: 8.4, hct: 25.2, lactato: 2.8, sao2: 98, ph: 7.28, svo2: 68, pao2: 260, paco2: 49, hco3: 21.7, be: -5, k: 4.7, ca: 1.02, na: 135, cl: 106, glicose: 210, fio2: 80, ivo2: 86, gap_pco2: 7, pam: 55, temperatura: 28.5 },
            { tempo: 80, fluxo: 3.2, hb: 8.0, hct: 24.0, lactato: 3.6, sao2: 98, ph: 7.24, svo2: 65, pao2: 220, paco2: 52, hco3: 20.6, be: -7, k: 5.0, ca: 0.98, na: 134, cl: 107, glicose: 236, fio2: 70, ivo2: 88, gap_pco2: 8, pam: 52, temperatura: 23.8 },
            { tempo: 120, fluxo: 4.3, hb: 8.3, hct: 24.9, lactato: 4.2, sao2: 99, ph: 7.27, svo2: 67, pao2: 198, paco2: 45, hco3: 20.1, be: -7, k: 4.6, ca: 1.05, na: 136, cl: 107, glicose: 248, fio2: 70, ivo2: 90, gap_pco2: 8, pam: 60, temperatura: 29.5 },
            { tempo: 165, fluxo: 4.6, hb: 8.8, hct: 26.4, lactato: 4.9, sao2: 99, ph: 7.32, svo2: 69, pao2: 168, paco2: 39, hco3: 19.8, be: -6, k: 4.1, ca: 1.15, na: 138, cl: 108, glicose: 242, fio2: 60, ivo2: 86, gap_pco2: 7, pam: 65, temperatura: 34.2 },
            { tempo: 200, fluxo: 4.7, hb: 9.4, hct: 28.2, lactato: 5.3, sao2: 99, ph: 7.35, svo2: 70, pao2: 154, paco2: 36, hco3: 19.6, be: -6, k: 3.8, ca: 1.20, na: 140, cl: 108, glicose: 232, fio2: 55, ivo2: 84, gap_pco2: 6, pam: 70, temperatura: 35.8 },
            { tempo: 220, fluxo: 4.1, hb: 9.8, hct: 29.4, lactato: 5.4, sao2: 99, ph: 7.36, svo2: 69, pao2: 146, paco2: 35, hco3: 19.4, be: -6, k: 3.9, ca: 1.22, na: 140, cl: 108, glicose: 224, fio2: 50, ivo2: 86, gap_pco2: 6, pam: 72, temperatura: 36.2 }
        ]
    },
    {
        arquivo: '06_crm_troca_aortica_obesidade_diabetes.json',
        metadados: { id_caso: 'CC-006', categoria: 'adulto', finalidade: 'Treino de cirurgia combinada com controle glicemico' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 05', prontuario_simulado: 'SIM-CC-006' },
        paciente: {
            sexo: 'masculino',
            idade: 67,
            peso: 104,
            altura: 170,
            comorbidades: ['Doenca arterial coronariana', 'Estenose aortica', 'Obesidade', 'Diabetes mellitus tipo 2'],
            risco_pre_operatorio: { euroscore_ii: 5.8, creatinina_mg_dl: 1.2, hematocrito_preop: 38 }
        },
        procedimento: {
            tipo_cirurgia: 'CRM associada a troca valvar aortica',
            descricao: 'Revascularizacao do miocardio e troca valvar aortica por bioprotese',
            carater: 'eletiva'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista K',
            responsavel_cec: 'Perfusionista K',
            perfusionista_check: 'Perfusionista L'
        },
        tempos_cirurgicos: {
            entrada_sala: '07:05',
            inducao: '07:22',
            incisao: '08:11',
            heparinizacao: '08:30',
            inicio_cec: '08:44',
            inicio_clampeamento: '08:55',
            primeira_cardioplegia: '08:57',
            fim_clampeamento: '10:24',
            inicio_reaquecimento: '10:10',
            fim_cec: '10:52',
            protamina: '10:59',
            fechamento: '11:55',
            tempo_cec_min: 128,
            tempo_clampeamento_min: 89
        },
        cec: {
            configuracao: 'Circuito adulto convencional',
            oxigenador: 'Adulto alta eficiencia',
            filtro_arterial: true,
            prime_ml: 1450,
            rap_ml: 250,
            ultrafiltracao_ml: 700,
            hemoconcentrador: true,
            cardioplegia: 'Sanguinea fria 4:1 anterograda',
            cardioplegia_ml: 1900,
            canula_arterial_fr: 24,
            canulas_venosas_fr: [36, 32],
            drenagem_venosa: 'gravidade',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 380,
            tca_basal_s: 126,
            tca_pos_heparina_s: 578,
            tca_cec_s: 650,
            protamina_mg: 350,
            tca_pos_neutralizacao_s: 140
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: 0,
            pressao_pre_membrana_mmhg: 260,
            pressao_pos_membrana_mmhg: 220,
            fluxo_gas_l_min: [3.4, 3.2, 3.0, 3.0, 2.8, 2.6],
            sweep_fio2_percentual: [80, 70, 60, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1400,
            hemocomponentes: { concentrado_hemacias_ml: 300, plasma_ml: 0, plaquetas_ml: 0 },
            ultrafiltracao_ml: 700,
            debito_urinario_ml: 700,
            balanco_estimado_ml: 920
        },
        eventos: ['Controle glicemico com insulina conforme protocolo institucional', 'Gradiente transmembrana estavel', 'Reaquecimento sem gradiente excessivo'],
        monitorizacao: [
            { tempo: 0, fluxo: 5.9, hb: 10.6, hct: 31.8, lactato: 1.6, sao2: 99, ph: 7.37, svo2: 75, pao2: 272, paco2: 41, hco3: 23.4, be: -2, k: 4.3, ca: 1.13, na: 137, cl: 104, glicose: 198, fio2: 80, ivo2: 82, gap_pco2: 5, pam: 66, temperatura: 35.8 },
            { tempo: 30, fluxo: 6.0, hb: 8.8, hct: 26.4, lactato: 2.0, sao2: 98, ph: 7.34, svo2: 71, pao2: 216, paco2: 44, hco3: 22.8, be: -3, k: 4.7, ca: 1.08, na: 136, cl: 105, glicose: 224, fio2: 70, ivo2: 88, gap_pco2: 6, pam: 63, temperatura: 33.0 },
            { tempo: 60, fluxo: 6.2, hb: 8.0, hct: 24.0, lactato: 2.4, sao2: 98, ph: 7.32, svo2: 68, pao2: 184, paco2: 46, hco3: 22.0, be: -4, k: 4.5, ca: 1.06, na: 136, cl: 106, glicose: 242, fio2: 60, ivo2: 92, gap_pco2: 7, pam: 62, temperatura: 32.2 },
            { tempo: 90, fluxo: 6.3, hb: 8.4, hct: 25.2, lactato: 2.8, sao2: 99, ph: 7.36, svo2: 72, pao2: 164, paco2: 40, hco3: 21.8, be: -4, k: 4.0, ca: 1.14, na: 138, cl: 106, glicose: 236, fio2: 60, ivo2: 86, gap_pco2: 6, pam: 68, temperatura: 34.8 },
            { tempo: 115, fluxo: 6.1, hb: 8.9, hct: 26.7, lactato: 3.0, sao2: 99, ph: 7.38, svo2: 73, pao2: 152, paco2: 38, hco3: 22.1, be: -3, k: 3.8, ca: 1.18, na: 139, cl: 106, glicose: 218, fio2: 55, ivo2: 84, gap_pco2: 5, pam: 73, temperatura: 35.8 },
            { tempo: 128, fluxo: 5.7, hb: 9.2, hct: 27.6, lactato: 3.1, sao2: 99, ph: 7.39, svo2: 72, pao2: 148, paco2: 37, hco3: 22.0, be: -3, k: 3.9, ca: 1.20, na: 139, cl: 106, glicose: 206, fio2: 50, ivo2: 86, gap_pco2: 5, pam: 75, temperatura: 36.1 }
        ]
    },
    {
        arquivo: '07_endocardite_dupla_troca_valvar.json',
        metadados: { id_caso: 'CC-007', categoria: 'adulto', finalidade: 'Treino de caso infeccioso com transfusao e acidose' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 06', prontuario_simulado: 'SIM-CC-007' },
        paciente: {
            sexo: 'feminino',
            idade: 39,
            peso: 57,
            altura: 160,
            comorbidades: ['Endocardite infecciosa', 'Insuficiencia mitral grave', 'Insuficiencia aortica moderada', 'Anemia inflamatoria'],
            risco_pre_operatorio: { euroscore_ii: 9.8, creatinina_mg_dl: 0.95, hematocrito_preop: 29 }
        },
        procedimento: {
            tipo_cirurgia: 'Dupla troca valvar por endocardite',
            descricao: 'Troca mitral e aortica com desbridamento de tecido infectado',
            carater: 'urgencia'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista M',
            responsavel_cec: 'Perfusionista N',
            perfusionista_check: 'Perfusionista M'
        },
        tempos_cirurgicos: {
            entrada_sala: '10:05',
            inducao: '10:24',
            incisao: '11:10',
            heparinizacao: '11:33',
            inicio_cec: '11:46',
            inicio_clampeamento: '11:58',
            primeira_cardioplegia: '12:00',
            fim_clampeamento: '13:48',
            inicio_reaquecimento: '13:15',
            fim_cec: '14:22',
            protamina: '14:30',
            fechamento: '15:45',
            tempo_cec_min: 156,
            tempo_clampeamento_min: 112
        },
        cec: {
            configuracao: 'Circuito adulto reduzido com hemoconcentrador',
            oxigenador: 'Adulto baixo prime',
            filtro_arterial: true,
            prime_ml: 1150,
            rap_ml: 200,
            ultrafiltracao_ml: 1000,
            hemoconcentrador: true,
            cardioplegia: 'Del Nido adulto anterograda e retrograda',
            cardioplegia_ml: 2000,
            canula_arterial_fr: 20,
            canulas_venosas_fr: [32, 28],
            drenagem_venosa: 'vacuo assistido',
            alvo_ic_l_min_m2: 2.5
        },
        anticoagulacao: {
            heparina_mg: 240,
            tca_basal_s: 138,
            tca_pos_heparina_s: 510,
            tca_cec_s: 552,
            protamina_mg: 230,
            tca_pos_neutralizacao_s: 150
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -35,
            pressao_pre_membrana_mmhg: 228,
            pressao_pos_membrana_mmhg: 190,
            fluxo_gas_l_min: [2.2, 2.3, 2.4, 2.5, 2.2, 2.0],
            sweep_fio2_percentual: [80, 70, 65, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1300,
            hemocomponentes: { concentrado_hemacias_ml: 600, plasma_ml: 300, plaquetas_ml: 250 },
            ultrafiltracao_ml: 1000,
            debito_urinario_ml: 260,
            balanco_estimado_ml: 1480
        },
        eventos: ['Tecido valvar friavel e tempo cirurgico prolongado', 'Reposicao de hemocomponentes conforme sangramento', 'Lactato e glicemia acompanhados em tendencia'],
        monitorizacao: [
            { tempo: 0, fluxo: 3.5, hb: 8.9, hct: 26.7, lactato: 1.9, sao2: 99, ph: 7.34, svo2: 72, pao2: 256, paco2: 42, hco3: 22.4, be: -3, k: 4.1, ca: 1.10, na: 135, cl: 103, glicose: 126, fio2: 80, ivo2: 68, gap_pco2: 5, pam: 62, temperatura: 35.4 },
            { tempo: 30, fluxo: 3.6, hb: 7.4, hct: 22.2, lactato: 2.3, sao2: 98, ph: 7.30, svo2: 66, pao2: 214, paco2: 47, hco3: 21.7, be: -5, k: 4.8, ca: 1.02, na: 134, cl: 104, glicose: 146, fio2: 70, ivo2: 78, gap_pco2: 7, pam: 58, temperatura: 32.8 },
            { tempo: 65, fluxo: 3.8, hb: 7.8, hct: 23.4, lactato: 2.9, sao2: 98, ph: 7.28, svo2: 64, pao2: 188, paco2: 49, hco3: 20.8, be: -6, k: 4.5, ca: 1.05, na: 134, cl: 105, glicose: 166, fio2: 65, ivo2: 82, gap_pco2: 8, pam: 60, temperatura: 31.8 },
            { tempo: 100, fluxo: 3.9, hb: 8.3, hct: 24.9, lactato: 3.4, sao2: 99, ph: 7.31, svo2: 68, pao2: 170, paco2: 43, hco3: 20.5, be: -6, k: 4.0, ca: 1.12, na: 136, cl: 106, glicose: 184, fio2: 60, ivo2: 78, gap_pco2: 7, pam: 66, temperatura: 34.0 },
            { tempo: 130, fluxo: 3.8, hb: 8.8, hct: 26.4, lactato: 3.8, sao2: 99, ph: 7.35, svo2: 70, pao2: 156, paco2: 38, hco3: 20.8, be: -5, k: 3.7, ca: 1.18, na: 138, cl: 106, glicose: 190, fio2: 55, ivo2: 76, gap_pco2: 6, pam: 70, temperatura: 35.5 },
            { tempo: 156, fluxo: 3.4, hb: 9.2, hct: 27.6, lactato: 4.0, sao2: 99, ph: 7.36, svo2: 69, pao2: 146, paco2: 36, hco3: 20.4, be: -5, k: 3.8, ca: 1.20, na: 139, cl: 106, glicose: 182, fio2: 50, ivo2: 78, gap_pco2: 6, pam: 72, temperatura: 36.1 }
        ]
    },
    {
        arquivo: '08_crm_emergencia_iam.json',
        metadados: { id_caso: 'CC-008', categoria: 'adulto', finalidade: 'Treino de CRM de urgencia com instabilidade inicial' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico 03', prontuario_simulado: 'SIM-CC-008' },
        paciente: {
            sexo: 'masculino',
            idade: 58,
            peso: 76,
            altura: 172,
            comorbidades: ['Infarto agudo do miocardio recente', 'Lesao de tronco de coronaria esquerda', 'Uso de balao intra-aortico'],
            risco_pre_operatorio: { euroscore_ii: 12.4, creatinina_mg_dl: 1.35, hematocrito_preop: 37 }
        },
        procedimento: {
            tipo_cirurgia: 'CRM de emergencia por lesao de tronco',
            descricao: 'Revascularizacao miocardica em contexto de IAM e instabilidade hemodinamica',
            carater: 'emergencia'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista O',
            responsavel_cec: 'Perfusionista P',
            perfusionista_check: 'Perfusionista O'
        },
        tempos_cirurgicos: {
            entrada_sala: '18:20',
            inducao: '18:38',
            incisao: '19:08',
            heparinizacao: '19:23',
            inicio_cec: '19:35',
            inicio_clampeamento: '19:42',
            primeira_cardioplegia: '19:44',
            fim_clampeamento: '20:38',
            inicio_reaquecimento: '20:22',
            fim_cec: '20:55',
            protamina: '21:02',
            fechamento: '22:05',
            tempo_cec_min: 80,
            tempo_clampeamento_min: 56
        },
        cec: {
            configuracao: 'Circuito adulto convencional',
            oxigenador: 'Adulto com reservatorio venoso',
            filtro_arterial: true,
            prime_ml: 1350,
            rap_ml: 250,
            ultrafiltracao_ml: 400,
            hemoconcentrador: true,
            cardioplegia: 'Sanguinea fria 4:1 anterograda',
            cardioplegia_ml: 1500,
            canula_arterial_fr: 22,
            canulas_venosas_fr: [36, 32],
            drenagem_venosa: 'gravidade',
            alvo_ic_l_min_m2: 2.4
        },
        anticoagulacao: {
            heparina_mg: 300,
            tca_basal_s: 118,
            tca_pos_heparina_s: 566,
            tca_cec_s: 622,
            protamina_mg: 280,
            tca_pos_neutralizacao_s: 132
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: 0,
            pressao_pre_membrana_mmhg: 218,
            pressao_pos_membrana_mmhg: 184,
            fluxo_gas_l_min: [2.6, 2.5, 2.6, 2.4, 2.3],
            sweep_fio2_percentual: [80, 70, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 1250,
            hemocomponentes: { concentrado_hemacias_ml: 300, plasma_ml: 0, plaquetas_ml: 0 },
            ultrafiltracao_ml: 400,
            debito_urinario_ml: 240,
            balanco_estimado_ml: 980
        },
        eventos: ['Balao intra-aortico mantido em standby durante CEC', 'PAM baixa no inicio com resposta a ajuste de fluxo e vasopressor', 'Saida de CEC com suporte inotropico'],
        monitorizacao: [
            { tempo: 0, fluxo: 4.5, hb: 10.4, hct: 31.2, lactato: 2.4, sao2: 99, ph: 7.33, svo2: 70, pao2: 264, paco2: 44, hco3: 22.6, be: -3, k: 4.4, ca: 1.12, na: 137, cl: 104, glicose: 172, fio2: 80, ivo2: 80, gap_pco2: 6, pam: 56, temperatura: 35.5 },
            { tempo: 20, fluxo: 4.8, hb: 9.0, hct: 27.0, lactato: 2.8, sao2: 98, ph: 7.31, svo2: 66, pao2: 210, paco2: 46, hco3: 21.8, be: -5, k: 4.7, ca: 1.07, na: 136, cl: 105, glicose: 192, fio2: 70, ivo2: 86, gap_pco2: 7, pam: 58, temperatura: 33.8 },
            { tempo: 40, fluxo: 4.9, hb: 8.6, hct: 25.8, lactato: 3.1, sao2: 98, ph: 7.32, svo2: 68, pao2: 182, paco2: 43, hco3: 21.5, be: -5, k: 4.2, ca: 1.10, na: 137, cl: 106, glicose: 204, fio2: 60, ivo2: 84, gap_pco2: 7, pam: 62, temperatura: 33.2 },
            { tempo: 60, fluxo: 4.9, hb: 8.9, hct: 26.7, lactato: 3.3, sao2: 99, ph: 7.36, svo2: 71, pao2: 160, paco2: 39, hco3: 21.9, be: -4, k: 3.9, ca: 1.16, na: 138, cl: 106, glicose: 196, fio2: 55, ivo2: 80, gap_pco2: 6, pam: 68, temperatura: 35.2 },
            { tempo: 80, fluxo: 4.4, hb: 9.5, hct: 28.5, lactato: 3.2, sao2: 99, ph: 7.38, svo2: 72, pao2: 150, paco2: 37, hco3: 22.1, be: -3, k: 3.8, ca: 1.18, na: 139, cl: 106, glicose: 184, fio2: 50, ivo2: 78, gap_pco2: 5, pam: 72, temperatura: 36.0 }
        ]
    },
    {
        arquivo: '09_correcao_tetralogia_fallot_pediatrico.json',
        metadados: { id_caso: 'CC-009', categoria: 'pediatrico', finalidade: 'Treino de ficha perfusional pediatrica' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico Pediatrico', prontuario_simulado: 'SIM-CC-009' },
        paciente: {
            sexo: 'masculino',
            idade: 4,
            peso: 16,
            altura: 102,
            comorbidades: ['Tetralogia de Fallot', 'Cianose aos esforcos', 'Saturacao basal reduzida'],
            risco_pre_operatorio: { rac_subgrupo: 'cardiopatia congenita', creatinina_mg_dl: 0.35, hematocrito_preop: 46 }
        },
        procedimento: {
            tipo_cirurgia: 'Correcao total de Tetralogia de Fallot',
            descricao: 'Fechamento de CIV e ampliacao da via de saida do ventriculo direito',
            carater: 'eletiva pediatrica'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista Pediatrico A',
            responsavel_cec: 'Perfusionista Pediatrico A',
            perfusionista_check: 'Perfusionista Pediatrico B'
        },
        tempos_cirurgicos: {
            entrada_sala: '07:30',
            inducao: '07:48',
            incisao: '08:35',
            heparinizacao: '08:55',
            inicio_cec: '09:05',
            inicio_clampeamento: '09:14',
            primeira_cardioplegia: '09:16',
            fim_clampeamento: '10:22',
            inicio_reaquecimento: '10:04',
            fim_cec: '10:47',
            protamina: '10:52',
            fechamento: '11:35',
            tempo_cec_min: 102,
            tempo_clampeamento_min: 68
        },
        cec: {
            configuracao: 'Circuito pediatrico',
            oxigenador: 'Pediatrico baixo prime',
            filtro_arterial: true,
            prime_ml: 450,
            rap_ml: 60,
            ultrafiltracao_ml: 350,
            hemoconcentrador: true,
            cardioplegia: 'Del Nido pediatrica',
            cardioplegia_ml: 420,
            canula_arterial_fr: 12,
            canulas_venosas_fr: [18, 16],
            drenagem_venosa: 'gravidade assistida',
            alvo_ic_l_min_m2: 3.0
        },
        anticoagulacao: {
            heparina_mg: 55,
            tca_basal_s: 130,
            tca_pos_heparina_s: 590,
            tca_cec_s: 620,
            protamina_mg: 50,
            tca_pos_neutralizacao_s: 140
        },
        operacional: {
            estrategia_ph: 'Alfa-stat',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -15,
            pressao_pre_membrana_mmhg: 128,
            pressao_pos_membrana_mmhg: 106,
            fluxo_gas_l_min: [0.9, 0.8, 0.8, 0.75, 0.7],
            sweep_fio2_percentual: [70, 60, 55, 50, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 420,
            hemocomponentes: { concentrado_hemacias_ml: 120, plasma_ml: 0, plaquetas_ml: 0 },
            ultrafiltracao_ml: 350,
            debito_urinario_ml: 95,
            balanco_estimado_ml: 210
        },
        eventos: ['Prime pediatrico balanceado com hemacias conforme protocolo local', 'Ultrafiltracao modificada apos CEC', 'Controle rigoroso de temperatura no reaquecimento'],
        monitorizacao: [
            { tempo: 0, fluxo: 2.0, hb: 12.6, hct: 37.8, lactato: 1.3, sao2: 99, ph: 7.38, svo2: 76, pao2: 238, paco2: 40, hco3: 23.5, be: -1, k: 4.1, ca: 1.18, na: 138, cl: 104, glicose: 102, fio2: 70, ivo2: 84, gap_pco2: 4, pam: 48, temperatura: 35.2 },
            { tempo: 25, fluxo: 2.05, hb: 10.8, hct: 32.4, lactato: 1.5, sao2: 98, ph: 7.36, svo2: 73, pao2: 188, paco2: 42, hco3: 22.8, be: -2, k: 4.6, ca: 1.10, na: 137, cl: 105, glicose: 118, fio2: 60, ivo2: 88, gap_pco2: 5, pam: 46, temperatura: 32.8 },
            { tempo: 50, fluxo: 2.1, hb: 10.2, hct: 30.6, lactato: 1.8, sao2: 98, ph: 7.34, svo2: 71, pao2: 164, paco2: 44, hco3: 22.1, be: -3, k: 4.3, ca: 1.08, na: 136, cl: 105, glicose: 132, fio2: 55, ivo2: 92, gap_pco2: 6, pam: 45, temperatura: 31.8 },
            { tempo: 78, fluxo: 2.1, hb: 10.6, hct: 31.8, lactato: 2.0, sao2: 99, ph: 7.38, svo2: 74, pao2: 154, paco2: 38, hco3: 22.4, be: -2, k: 3.9, ca: 1.18, na: 138, cl: 106, glicose: 142, fio2: 50, ivo2: 88, gap_pco2: 5, pam: 50, temperatura: 35.4 },
            { tempo: 102, fluxo: 1.9, hb: 11.2, hct: 33.6, lactato: 2.1, sao2: 99, ph: 7.40, svo2: 75, pao2: 146, paco2: 36, hco3: 22.2, be: -2, k: 3.8, ca: 1.20, na: 139, cl: 106, glicose: 136, fio2: 50, ivo2: 86, gap_pco2: 5, pam: 52, temperatura: 36.2 }
        ]
    },
    {
        arquivo: '10_switch_arterial_neonatal.json',
        metadados: { id_caso: 'CC-010', categoria: 'neonatal', finalidade: 'Treino de ficha perfusional neonatal complexa' },
        identificacao: { data_cirurgia: '2026-08-18', sala: 'Centro Cirurgico Pediatrico', prontuario_simulado: 'SIM-CC-010' },
        paciente: {
            sexo: 'feminino',
            idade: 0.02,
            peso: 3.4,
            altura: 51,
            comorbidades: ['Transposicao das grandes arterias', 'Septostomia atrial previa', 'Uso de prostaglandina'],
            risco_pre_operatorio: { rac_subgrupo: 'neonato', creatinina_mg_dl: 0.55, hematocrito_preop: 44 }
        },
        procedimento: {
            tipo_cirurgia: 'Switch arterial neonatal',
            descricao: 'Correcao anatomica de TGA com transferencia coronariana',
            carater: 'urgencia neonatal'
        },
        equipe_perfusao: {
            responsavel_montagem: 'Perfusionista Pediatrico C',
            responsavel_cec: 'Perfusionista Pediatrico D',
            perfusionista_check: 'Perfusionista Pediatrico C'
        },
        tempos_cirurgicos: {
            entrada_sala: '06:30',
            inducao: '06:50',
            incisao: '07:38',
            heparinizacao: '07:58',
            inicio_cec: '08:08',
            inicio_clampeamento: '08:19',
            primeira_cardioplegia: '08:21',
            fim_clampeamento: '09:45',
            inicio_reaquecimento: '09:18',
            fim_cec: '10:36',
            protamina: '10:42',
            fechamento: '12:05',
            tempo_cec_min: 148,
            tempo_clampeamento_min: 86
        },
        cec: {
            configuracao: 'Circuito neonatal baixo prime',
            oxigenador: 'Neonatal',
            filtro_arterial: true,
            prime_ml: 280,
            rap_ml: 20,
            ultrafiltracao_ml: 220,
            hemoconcentrador: true,
            cardioplegia: 'Del Nido neonatal',
            cardioplegia_ml: 180,
            canula_arterial_fr: 8,
            canulas_venosas_fr: [12, 10],
            drenagem_venosa: 'gravidade assistida',
            alvo_ic_l_min_m2: 3.0
        },
        anticoagulacao: {
            heparina_mg: 12,
            tca_basal_s: 145,
            tca_pos_heparina_s: 640,
            tca_cec_s: 690,
            protamina_mg: 12,
            tca_pos_neutralizacao_s: 152
        },
        operacional: {
            estrategia_ph: 'pH-stat no resfriamento; alfa-stat no reaquecimento',
            pressao_barometrica_mmhg: 760,
            delta_vav_mmhg: -10,
            pressao_pre_membrana_mmhg: 92,
            pressao_pos_membrana_mmhg: 78,
            fluxo_gas_l_min: [0.35, 0.32, 0.30, 0.30, 0.28, 0.25],
            sweep_fio2_percentual: [80, 70, 65, 60, 55, 50]
        },
        balanco_hidrico: {
            entrada_cristaloide_ml: 260,
            hemocomponentes: { concentrado_hemacias_ml: 120, plasma_ml: 40, plaquetas_ml: 40 },
            ultrafiltracao_ml: 220,
            debito_urinario_ml: 28,
            balanco_estimado_ml: 168
        },
        eventos: ['Prime neonatal com hemacias', 'Transferencia coronariana com tempo de clampeamento prolongado', 'Lactato em elevacao durante reaquecimento'],
        monitorizacao: [
            { tempo: 0, fluxo: 0.72, hb: 13.2, hct: 39.6, lactato: 2.0, sao2: 99, ph: 7.36, svo2: 74, pao2: 246, paco2: 42, hco3: 23.1, be: -2, k: 4.2, ca: 1.22, na: 139, cl: 105, glicose: 96, fio2: 80, ivo2: 96, gap_pco2: 5, pam: 38, temperatura: 34.8 },
            { tempo: 30, fluxo: 0.74, hb: 11.5, hct: 34.5, lactato: 2.5, sao2: 98, ph: 7.32, svo2: 68, pao2: 204, paco2: 46, hco3: 22.0, be: -4, k: 4.8, ca: 1.14, na: 138, cl: 106, glicose: 112, fio2: 70, ivo2: 108, gap_pco2: 7, pam: 35, temperatura: 30.2 },
            { tempo: 60, fluxo: 0.76, hb: 10.8, hct: 32.4, lactato: 3.1, sao2: 98, ph: 7.29, svo2: 64, pao2: 178, paco2: 49, hco3: 21.2, be: -5, k: 4.6, ca: 1.08, na: 137, cl: 107, glicose: 132, fio2: 65, ivo2: 116, gap_pco2: 8, pam: 34, temperatura: 28.0 },
            { tempo: 95, fluxo: 0.78, hb: 11.0, hct: 33.0, lactato: 3.6, sao2: 99, ph: 7.31, svo2: 66, pao2: 162, paco2: 43, hco3: 20.6, be: -5, k: 4.1, ca: 1.18, na: 138, cl: 107, glicose: 148, fio2: 60, ivo2: 112, gap_pco2: 7, pam: 38, temperatura: 32.0 },
            { tempo: 125, fluxo: 0.78, hb: 11.6, hct: 34.8, lactato: 4.0, sao2: 99, ph: 7.35, svo2: 69, pao2: 150, paco2: 38, hco3: 20.8, be: -5, k: 3.8, ca: 1.22, na: 139, cl: 107, glicose: 142, fio2: 55, ivo2: 106, gap_pco2: 6, pam: 42, temperatura: 35.0 },
            { tempo: 148, fluxo: 0.70, hb: 12.0, hct: 36.0, lactato: 4.2, sao2: 99, ph: 7.36, svo2: 68, pao2: 144, paco2: 36, hco3: 20.4, be: -5, k: 3.9, ca: 1.24, na: 140, cl: 107, glicose: 136, fio2: 50, ivo2: 108, gap_pco2: 6, pam: 44, temperatura: 36.1 }
        ]
    }
]

const readme = `Casos completos cirurgicos PerfuseLab

Esta pasta contem 10 casos sinteticos realistas para treino no PerfuseLab.
Eles nao representam pacientes reais e nao devem ser usados como protocolo assistencial.

Formato:
- Cada arquivo JSON pode ser importado diretamente na landing page pelo botao "Entrar com arquivo".
- O campo paciente.procedimento tambem e preenchido para organizar o titulo no banco de dados.
- Alem da monitorizacao, os arquivos trazem tempos cirurgicos, dados de CEC, anticoagulacao, circuito, cardioplegia, balanco hidrico, eventos e equipe de perfusao.

Campos cirurgicos incluidos:
- tipo de cirurgia/procedimento;
- data, sala e identificacao simulada;
- horarios de entrada, inducao, incisao, heparinizacao, inicio/fim da CEC, clampeamento, reaquecimento, protamina e fechamento;
- tempo total de CEC e tempo de clampeamento;
- configuracao do circuito, oxigenador, prime, RAP, hemoconcentrador, ultrafiltracao, cardioplegia e canulas;
- heparina, TCA basal, TCA pos-heparina, TCA em CEC, protamina e TCA pos-neutralizacao;
- monitorizacao seriada com fluxo, IC, iDO2, Hb, Hct, lactato, gasometria, eletrolitos, glicose, PAM, temperatura, FiO2, iVO2 e gap PCO2.

Referencias usadas como guia de campos, nao como prescricao:
- AmSECT Pump Templates: https://amsect.org/policy-practice/pump-templates
- AmSECT Standards and Guidelines for Perfusion Practice: https://amsect.org/Policy-Practice/Perfusion-Safety/AmSECT-Standards-and-Guidelines-For-Perfusion-Practice-2017
- STS/SCA/AmSECT Anticoagulation During Cardiopulmonary Bypass: https://pmc.ncbi.nlm.nih.gov/articles/PMC5850589/
- Ranucci et al. Goal-directed perfusion trial: https://pubmed.ncbi.nlm.nih.gov/29778331/
`

async function main() {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'LEIA-ME.txt'), readme, 'utf8')

    for (const caso of casos.map(enrichCase)) {
        const filePath = path.join(outputDir, caso.arquivo)
        const { arquivo, ...conteudo } = caso
        await fs.writeFile(filePath, `${JSON.stringify(conteudo, null, 2)}\n`, 'utf8')
    }

    console.log(`Gerados ${casos.length} casos completos em ${outputDir}`)
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
