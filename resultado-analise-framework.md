# Resultado revisado da análise do framework

Arquivo processado: `entrada-paciente-valvular.json`

## Resultado principal

- Paciente: feminino, 46 anos, 54 kg, 155 cm
- Superfície corporal de Mosteller: 1,524795 m², exibida como 1,52 m²
- Risco integrado pelas regras configuradas: **MODERADO**
- iDO₂: **0/4 pontos recalculáveis**, porque a SaO₂ arterial não foi informada
- Pontos com inconsistência matemática ou fisiológica: **3/4**
- Status GDP final: **ADEQUADO apenas segundo o iDO₂ informado**

## Monitorização processada

| Tempo | IC | Hb | PaO₂ | iDO₂ informado | SaO₂ implícita | Checagem | iVO₂ | O₂ER | DO₂/VO₂ recalculado |
|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|
| 0 min | 2,4 | 12,0 | 264 | 272 | 64,6% | Discordante da PaO₂ | 56 | 20,6% | 4,86 |
| 35 min | 2,5 | 7,4 | 240 | 281 | 104,5% | Matematicamente impossível | 33 | 11,7% | 8,52 |
| 60 min | 2,5 | 7,45 | 149 | 292 | 110,9% | Matematicamente impossível | 52 | 17,8% | 5,62 |
| 90 min | 2,7 | 8,7 | 149 | 327 | 98,6% | Plausível, mas não verificável | 58 | 17,7% | 5,64 |

## Fórmulas utilizadas

- BSA: `sqrt(peso × altura / 3600)`
- CaO₂: `Hb × 1,36 × SaO₂ + PaO₂ × 0,003`
- iDO₂: `10 × IC × CaO₂`
- O₂ER: `iVO₂ / iDO₂ × 100`
- DO₂/VO₂: `iDO₂ / iVO₂`
- Lactato: `mg/dL / 9,009 = mmol/L`

A SaO₂ entra na fórmula como fração. O sistema mantém precisão completa da BSA e arredonda somente a exibição.

## Métricas sobre os valores informados

- AUC abaixo de iDO₂ 280: 124,4 (mL/min/m²) × min
- Tempo estimado abaixo de 280: 31,1 min
- O₂ER inicial/final: 20,6% → 17,7%
- DO₂/VO₂ inicial/final: 4,86 → 5,64
- Razão de lactato final/inicial: 1,77
- Lactato: 1,44 → 2,55 mmol/L
- Delta Hb: -3,30 g/dL
- Delta iDO₂ informado: +55 mL/min/m²

A AUC usa interpolação linear entre amostras. O hematócrito foi estimado como `Hb × 3`, pois não havia Hct medido no prompt.

## Motivo da divergência

O prompt original possui cinco valores de IC, mas apenas quatro valores de iDO₂, iVO₂ e quatro tempos de monitorização. Temperatura, PAM, Hb e glicose também têm séries de comprimentos diferentes. Portanto, o pareamento adotado no arquivo não pode ser confirmado sem os horários originais de cada amostra.

O framework anterior ainda estimava SaO₂ como 100% a partir da PaO₂. Essa estimativa foi removida: PaO₂ não substitui uma SaO₂ arterial medida por co-oximetria para o recálculo preciso do iDO₂.

## Referências principais

- Mosteller RD. *Simplified calculation of body-surface area*. 1987. https://pubmed.ncbi.nlm.nih.gov/3657876/
- Ranucci et al. Goal-directed perfusion com alvo de iDO₂ ≥280 mL/min/m². 2018. https://pubmed.ncbi.nlm.nih.gov/29778331/
- Oshita et al. Fórmula operacional de iDO₂ e limiares observacionais em CEC. 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC12039435/
- Diretriz EACTS/EACTAIC/EBCP 2024, publicada em 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC11826095/
- Fórmulas de conteúdo arterial e venoso de oxigênio. https://pmc.ncbi.nlm.nih.gov/articles/PMC10488867/

Este relatório é suporte de auditoria dos dados. As conclusões sobre adequação perfusional dependem da confirmação do pareamento temporal e da SaO₂ arterial medida.
