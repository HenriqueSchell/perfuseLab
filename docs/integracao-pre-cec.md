# Integração da entrada pré-CEC

Revisão: 25/10/2026.

O `index.html` apresenta o projeto; `planejamento.html` reúne a entrada pré-CEC e usa a identidade do protótipo: fotografia gerada anteriormente com ImageGen, parallax com suporte a movimento reduzido, fundo azul profundo, detalhes verdes e cartões claros. O protótipo independente foi preservado. `informacoes.html` compartilha `src/css/pre-cec.css` e reúne explicações, fórmulas, limitações e referências.

## Caminho do usuário

1. Preencher identificação, dados antropométricos e responsável.
2. Escolher fluxo e temperatura planejados; as hipóteses de Hb/SaO₂/PaO₂ são opcionais e necessárias somente para estimar GDP.
3. Salvar rascunho ou preparar o plano, sem criar monitorização.
4. Abrir o dashboard com o plano: ele mostra dados básicos, fluxo e temperatura planejados, estimativas e hipóteses. O histórico permanece vazio; gráficos e classificações clínicas aguardam medições.
5. No dashboard, registrar início da CEC, minuto da coleta, fluxo, Hb, hematócrito, SaO₂, PaO₂, lactato, temperatura e PAM para iniciar a monitorização. O plano continua disponível como referência. O usuário continua salvando no banco pelo fluxo existente do dashboard.

As hipóteses não preenchem campos de medição automaticamente. O horário de início mais o tempo da coleta não pode estar no futuro (tolerância de um minuto). A preparação exige armazenamento local bem-sucedido. Rascunhos recuperados precisam ser revisados e confirmados novamente.

## Compatibilidade e dados

- Novo armazenamento: `perfuselab.precec.v1`; a chave do protótipo permanece independente.
- `src/js/index.js` mantém o importador CSV/JSON e modelo CSV; remove apenas os eventos da entrada antiga.
- A primeira medição popula `paciente`, `historicoImportado` e `casoClinicoImportado` nos formatos existentes.
- `casoClinicoImportado.planejamento_pre_cec` preserva hipóteses, resultados e temperatura definida pela equipe. O snapshot existente do dashboard preserva o objeto clínico original.
- Novos casos recebem UUID para separar seus checklists, inclusive com dados demográficos iguais.
- Gravações agrupadas tentam restaurar os valores anteriores caso alguma chave falhe. Falha persistente do próprio armazenamento também pode impedir a restauração.
- Exportar plano JSON não produz um histórico de monitorização; não é formato de entrada para o importador clínico.

## Decisões científicas

A temperatura continua definida pela equipe, sem inversão do fluxo em temperatura ideal. As justificativas e fontes do protótipo foram transferidas para Informações. O planejamento permite metas de 280 ou 300 mL/min/m²; o alvo do motor histórico permanece 280. As informações distinguem os limiares de alerta dos limiares visuais e identificam a tabela térmica histórica como regra local. Nenhum limiar do motor foi alterado nesta integração.

## Verificação

- `npm run check`: sintaxe, validação do motor/importador com 40 arquivos de casos e build do frontend.
- `node tools/testar-entrada-pre-cec.cjs`: teste em Edge com perfil isolado, fórmulas, ausência de hipóteses, restrição adulta, invariância térmica, persistência, medições separadas, importação CSV, restauração após falha simulada de armazenamento e telas desktop/mobile.
- Capturas em `docs/entrada-pre-cec/`, inspecionadas visualmente.

Os testes são de software e não constituem validação clínica. O script de navegador utiliza o Playwright instalado no runtime local do Codex e o executável local do Edge.

A persistência agrupada é compartilhada em `src/js/local-case.js`. O estado pré-CEC do dashboard fica em `src/js/dashboard-plan.js`, evitando executar o motor de classificação antes da primeira medição. O plano e a identidade do caso permanecem após recarregar a página.

## Fluxo atual: abrir o dashboard inicia a CEC

A entrada foi ajustada conforme o fluxo do profissional: “Iniciar CEC e abrir dashboard” registra o início no horário atual e habilita todos os módulos imediatamente. O tempo zero contém os valores disponíveis do plano, com `origem: planejamento`; Hb/SaO₂/PaO₂ esperadas permanecem identificadas como hipóteses e o iDO₂ é previsto, não medido. Hct, lactato e PAM ausentes não são inventados. O início não é reiniciado ao atualizar a página.

Novas medições são inseridas pelo formulário normal do dashboard. Quando elas existem, a análise clínica usa somente medições, excluindo o registro do plano de suas tendências e AUC. Enquanto só existe o plano, o indicador de risco mostra “Análise inicial: valores do plano”. Histórico e gráficos preservam o registro inicial, identificado na tabela como “0 (plano)”.
