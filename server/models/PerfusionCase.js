const mongoose = require('mongoose')

const Mixed = mongoose.Schema.Types.Mixed

const perfusionCaseSchema = new mongoose.Schema(
    {
        clientCaseKey: {
            type: String
        },
        title: {
            type: String,
            trim: true,
            default: 'Caso PerfuseLab'
        },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
            index: true
        },
        patient: {
            type: Mixed,
            required: true
        },
        perfusionist: {
            type: Mixed,
            default: {}
        },
        clinicalCase: {
            type: Mixed,
            default: {}
        },
        monitoring: {
            type: [Mixed],
            default: []
        },
        checklist: {
            key: String,
            state: {
                type: Mixed,
                default: {}
            },
            summary: {
                type: Mixed,
                default: {}
            }
        },
        analysis: {
            type: Mixed,
            default: {}
        },
        report: {
            type: Mixed,
            default: {}
        },
        source: {
            type: String,
            enum: ['dashboard', 'import', 'manual', 'api'],
            default: 'dashboard'
        },
        notes: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true,
        minimize: false
    }
)

perfusionCaseSchema.index({ clientCaseKey: 1 }, { unique: true, sparse: true })
perfusionCaseSchema.index({ createdAt: -1 })
perfusionCaseSchema.index({
    title: 'text',
    'patient.sexo': 'text',
    'patient.procedimento': 'text',
    'clinicalCase.procedimento.tipo_cirurgia': 'text',
    'clinicalCase.procedimento.nome': 'text',
    'perfusionist.responsavelCec': 'text',
    'perfusionist.responsavelMontagem': 'text',
    'perfusionist.procedimento': 'text',
    'perfusionist.perfusionistaCheck': 'text',
    notes: 'text'
})

module.exports = mongoose.model('PerfusionCase', perfusionCaseSchema)
