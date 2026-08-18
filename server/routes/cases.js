const express = require('express')
const PerfusionCase = require('../models/PerfusionCase')

const router = express.Router()

function montarTitulo(payload) {
    const patient = payload.patient || payload.paciente || {}
    const idade = patient.idade !== undefined ? `${patient.idade} anos` : 'idade não informada'
    const sexo = patient.sexo || 'sexo não informado'
    const procedimento = patient.procedimento || payload.clinicalCase?.paciente?.procedimento
    return procedimento
        ? `${procedimento} · ${sexo} · ${idade}`
        : `Caso PerfuseLab · ${sexo} · ${idade}`
}

function normalizarPayload(body) {
    const patient = body.patient || body.paciente
    if (!patient) {
        const erro = new Error('Campo patient/paciente é obrigatório.')
        erro.status = 400
        throw erro
    }

    return {
        clientCaseKey: body.clientCaseKey,
        title: body.title || montarTitulo(body),
        status: body.status || 'active',
        patient,
        perfusionist: body.perfusionist || body.perfusionista || {},
        clinicalCase: body.clinicalCase || body.casoClinico || {},
        monitoring: body.monitoring || body.monitorizacao || [],
        checklist: body.checklist || {},
        analysis: body.analysis || body.analise || {},
        report: body.report || {},
        source: body.source || 'dashboard',
        notes: body.notes || ''
    }
}

router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 30, 100)
        const filtro = { status: req.query.status || 'active' }
        if (req.query.search) {
            filtro.$text = { $search: req.query.search }
        }
        const cases = await PerfusionCase.find(filtro)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('title status patient perfusionist monitoring checklist.summary analysis.risco createdAt updatedAt')
        res.json({ data: cases })
    } catch (error) {
        next(error)
    }
})

router.post('/', async (req, res, next) => {
    try {
        const payload = normalizarPayload(req.body)
        const created = await PerfusionCase.create(payload)
        res.status(201).json({ data: created })
    } catch (error) {
        next(error)
    }
})

router.post('/sync', async (req, res, next) => {
    try {
        const payload = normalizarPayload(req.body)
        if (!payload.clientCaseKey) {
            const created = await PerfusionCase.create(payload)
            res.status(201).json({ data: created, mode: 'created' })
            return
        }

        const updated = await PerfusionCase.findOneAndUpdate(
            { clientCaseKey: payload.clientCaseKey },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        res.json({ data: updated, mode: 'synced' })
    } catch (error) {
        next(error)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const found = await PerfusionCase.findById(req.params.id)
        if (!found) {
            res.status(404).json({ error: 'Caso não encontrado.' })
            return
        }
        res.json({ data: found })
    } catch (error) {
        next(error)
    }
})

router.put('/:id', async (req, res, next) => {
    try {
        const payload = normalizarPayload(req.body)
        const updated = await PerfusionCase.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true, runValidators: true }
        )
        if (!updated) {
            res.status(404).json({ error: 'Caso não encontrado.' })
            return
        }
        res.json({ data: updated })
    } catch (error) {
        next(error)
    }
})

router.patch('/:id/archive', async (req, res, next) => {
    try {
        const updated = await PerfusionCase.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'archived' } },
            { new: true }
        )
        if (!updated) {
            res.status(404).json({ error: 'Caso não encontrado.' })
            return
        }
        res.json({ data: updated })
    } catch (error) {
        next(error)
    }
})

module.exports = router
