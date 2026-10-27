# PerfuseLab — roteiro do apresentador

Apresentação de 30 slides. Insira os prints nos slides 17 e 18. Complete nome, instituição e congresso na capa. O caso é inteiramente simulado.

## 01. PerfuseLab

Apresentar o PerfuseLab como projeto em desenvolvimento para organização e estudo de dados de perfusão. Acrescentar nome, instituição e evento nos campos editáveis antes da apresentação. A imagem é uma ilustração gerada com ImageGen, não o registro de uma sala ou equipamento real. Fonte técnica: código do projeto, versão local de 25/10/2026.

## 02. O problema que motivou o projeto

Apresentar como motivação de desenvolvimento, sem afirmar que foi demonstrada uma redução de erros ou melhora de desfechos. Explicar que a leitura depende do momento de coleta, da unidade e do contexto cirúrgico.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 03. O que é o PerfuseLab

O projeto começou como hobby e passou a integrar módulos clínicos e operacionais. As análises do motor atual são determinísticas: fórmulas e limiares. Não há um modelo de IA realizando inferência clínica em tempo de execução.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 04. Objetivo e escopo atual

Separar objetivo de benefício comprovado. Os casos pediátricos presentes nos arquivos de teste não constituem validação de um motor pediátrico. O planejamento atual é restrito à CEC adulta convencional.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 05. Fluxo de uso

O fluxo foi ajustado para preparar o aplicativo antes da CEC. Ao abrir o dashboard, o sistema registra o horário atual como início. O registro zero preserva a origem no planejamento. Atualizar a página não reinicia o horário.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 06. As variáveis se organizam por função

Unidades: peso kg; altura cm; fluxo L/min; PAM e pressões gasosas mmHg; Hb g/dL; Hct e saturações %; temperatura °C; lactato mmol/L ou mg/dL com conversão. O iVO₂ é informado em mL/min/m². Registro contextual não significa que existe regra automática para cada variável.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 07. Superfície corporal e fluxo

A fórmula de Mosteller indexa fluxo pela superfície corporal. O índice inicial da interface é 2,4 L/min/m² e pode ser editado. A indexação não incorpora automaticamente composição corporal, drenagem, shunts ou limites das cânulas.

Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317:1098. DOI: 10.1056/NEJM198710223171717. https://pubmed.ncbi.nlm.nih.gov/3657876/

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 08. Conteúdo arterial de oxigênio

Coeficientes preservados do motor do projeto. No planejamento, as três hipóteses são necessárias para a estimativa GDP. No histórico, a ausência de PaO₂ omite a parcela dissolvida. Explicar que SaO₂ alta não compensa, por si só, uma Hb baixa.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 09. Oferta de oxigênio e planejamento GDP

O fator 10 compatibiliza litros de fluxo e decilitros do conteúdo arterial. A seleção de 300 no plano não altera automaticamente o alvo de 280 do motor do dashboard. O fluxo matemático deve ser contextualizado com o procedimento e condições do circuito.

Wahba A et al. 2024 EACTS/EACTAIC/EBCP Guidelines on cardiopulmonary bypass in adult cardiac surgery. Publicação 2025. DOI: 10.1093/ejcts/ezae354. https://pubmed.ncbi.nlm.nih.gov/39949326/ e https://pmc.ncbi.nlm.nih.gov/articles/PMC11947607/

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 10. Temperatura e oferta de oxigênio

O aplicativo não reduz automaticamente a meta GDP ao resfriar. A tabela térmica histórica do motor é uma regra local sem validação clínica demonstrada nesta revisão. A diretriz STS recomenda limitar a saída arterial a menos de 37 °C para evitar hipertermia cerebral. Isso não equivale a prescrever a mesma meta para o paciente.

Engelman R et al. STS/SCA/AmSECT Clinical Practice Guidelines: Temperature Management During Cardiopulmonary Bypass. Ann Thorac Surg. 2015;100:748–757. DOI: 10.1016/j.athoracsur.2015.03.126. https://www.sts.org/sites/default/files/documents/Guidelines_CPB%20Temperature%20Management.pdf

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 11. Hemoglobina, hematócrito e lactato

A relação Hb/Hct é aproximação e não substitui determinação laboratorial. O card calcula Hct quando a Hb está disponível e o Hct ausente. O lactato aceita duas unidades e é normalizado. Um valor isolado não estabelece causalidade nem identifica sozinho o mecanismo de alteração.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 12. Oferta, consumo e extração

Essas relações dependem de dados simultâneos e unidades compatíveis. No projeto, O₂ER ≥30% gera atenção e >40% alerta alto. As relações são matematicamente dependentes e podem contribuir para contagens de alerta relacionadas, uma limitação do sistema de risco.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 13. Outras dimensões da monitorização

O gap PCO₂ chega informado. O delta-delta é (AG−12)/(24−HCO₃), quando calculável. A correção exploratória de FiO₂ usa FiO₂ em fração − PaO₂/(Pb−47) + 0,21, com Pb padrão 760 mmHg; a atribuição “Hamilton” no código não foi validada nesta revisão. Não apresentar como prescrição. A unidade de cálcio precisa ser harmonizada. Prime, RAP, cardioplegia, anticoagulação e tempos cirúrgicos podem constar do contexto importado. Há alerta de hipocalemia, mas não uma regra equivalente de hipercalemia.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 14. A dimensão temporal da perfusão

AUC de déficit = integral de max(0, alvo − iDO₂) no tempo. O código usa interpolação linear entre amostras. A unidade resultante é mL/m² quando iDO₂ está em mL/min/m² e tempo em min. Tempo abaixo do alvo não é monitorização contínua real. Intervalos de coleta influenciam a estimativa.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 15. Alertas e risco integrado

Regras implementadas, não uma escala prognóstica validada. Alertas dependentes podem contar separadamente. O card de iDO₂ usa limiar visual <260, diferente do alerta alto <252. O histórico de alertas pode manter risco alto mesmo após melhora. Ausência de alerta não prova segurança. Enquanto só há o registro do plano, o indicador informa que a análise usa valores planejados.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 16. Origem dos dados e rastreabilidade

O código preserva origem=planejamento, SaO₂ não medida e iDO₂ previsto. Valores ausentes não devem virar normalidade. O histórico conserva a origem. Importações aceitam iDO₂ externo, mas auditam a concordância com o calculado e sinalizam divergências. O índice informado pode ter prioridade sobre fluxo/SC.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 17. Interface de planejamento

Inserir o print do planejamento feito pelo apresentador. Demonstrar identificação do caso, peso e altura, fluxo de referência, hipóteses de oxigenação, temperatura da equipe e botão de entrada no dashboard. Não usar dados identificáveis de pacientes.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 18. Interface de monitorização

Inserir o print do dashboard feito pelo apresentador. Mostrar iDO₂ com duas casas, Hct calculado quando ausente, lactato com unidade e temperatura sempre visível. Destacar a diferença entre origem planejada e medição real.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 19. Checklist e relatórios

O checklist deve representar verificações realmente realizadas. A impressão não substitui documentação institucional. O relatório simples limita a quantidade de alertas exibidos, assim como o completo, e não contém necessariamente toda a lista do motor. As explicações longas ficam na página Informações.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 20. Arquitetura e persistência

Salvar o caso no banco é uma ação explícita. O armazenamento local não aplica criptografia pelo aplicativo e exige atenção em computadores compartilhados. CSV e JSON alimentam o mesmo fluxo normalizado de análise. Não há conexão automática comprovada com equipamentos de perfusão nem extração automática de prontuário.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 21. Evidência que orienta o projeto

Ensaio multicêntrico: 350 participantes incluídos, 326 analisados. RR de AKIN estágio 1 = 0,45, IC95% 0,25–0,83. Sem diferença demonstrada em AKIN 2–3 ou desfechos secundários. Não atribuir o efeito do ensaio ao PerfuseLab.

Ranucci M et al. Goal-directed perfusion to reduce acute kidney injury: A randomized trial. J Thorac Cardiovasc Surg. 2018;156:1918–1927.e2. DOI: 10.1016/j.jtcvs.2018.04.045. https://pubmed.ncbi.nlm.nih.gov/29778331/

Wahba A et al. 2024 EACTS/EACTAIC/EBCP Guidelines on cardiopulmonary bypass in adult cardiac surgery. Publicação 2025. DOI: 10.1093/ejcts/ezae354. https://pubmed.ncbi.nlm.nih.gov/39949326/ e https://pmc.ncbi.nlm.nih.gov/articles/PMC11947607/

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 22. Caso clínico simulado

Todos os valores deste caso foram construídos para demonstração matemática. Não é relato de paciente real, não há intervenção comprovada nem desfecho clínico observado. A escolha de fluxo nos pontos posteriores é uma hipótese de cenário, não uma recomendação terapêutica.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 23. Planejamento do caso

SC exata = sqrt(75×170/3600) = 1,8819316318. Q de referência exato = 4,5166359163. O aplicativo arredonda para cima a 0,01 no botão de seleção. A temperatura é um dado do cenário e não foi calculada a partir do fluxo.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 24. Evolução simulada dos registros

Dados sintéticos. SaO₂ constante de 98%, PaO₂ de 150 mmHg e temperatura de 36 °C nos quatro pontos. Cada iDO₂ foi recalculado por 10×(Q/SC)×(1,36×Hb×0,98+0,003×150), SC=1,8819316318. Hct pode ser aproximado por Hb×3 se ausente. São medições fictícias do cenário, distintas do ponto inicial oriundo do planejamento.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 25. Queda da Hb com fluxo constante

Série sintética de iDO₂: 320,4864565;255,3312734;288,6353525;307,0487738 mL/min/m². Linha de referência 280. O gráfico demonstra a dependência matemática da oferta em relação a Hb e fluxo, com SaO₂/PaO₂ constantes. A linha é interpolação entre pontos, não uma gravação contínua.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 26. Leitura integrada do caso

Aos 40 min, iDO₂=288,64 e lactato=2,5. Aos 60 min, iDO₂=307,05 e lactato=2,1. Não inferir causa, reversão de hipóxia ou benefício clínico a partir da simulação. Não foi modelada drenagem, limite de cânulas, shunt ou comportamento do circuito.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 27. Verificação técnica do projeto

O comando tools/validate-dashboard.js processou 40 arquivos de teste do repositório. Há testes de navegador para o fluxo de planejamento e inclusão de exames. Esse número não representa pacientes nem validação clínica. Testes detectam falhas de implementação, mas não comprovam segurança assistencial, eficácia ou generalização.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 28. Limites e próximos estudos

Acrescentar padronização dos limiares visuais e clínicos, unidades de cálcio, tratamento de dados ausentes e separação explícita entre estimativas e medições em todos os outputs. Pesquisa com pacientes depende de protocolo, aprovação ética aplicável e proteção de dados. Essas etapas são propostas, não resultados concluídos.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 29. Contribuição do PerfuseLab

Fechar retomando a contribuição concreta: integração e transparência de cálculos. Evitar prometer prevenção de complicações ou superioridade a sistemas existentes. Abrir discussão sobre usabilidade, validação e adequação dos dados às rotinas da equipe.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## 30. Referências essenciais

Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317:1098. DOI: 10.1056/NEJM198710223171717. https://pubmed.ncbi.nlm.nih.gov/3657876/

Ranucci M et al. Goal-directed perfusion to reduce acute kidney injury: A randomized trial. J Thorac Cardiovasc Surg. 2018;156:1918–1927.e2. DOI: 10.1016/j.jtcvs.2018.04.045. https://pubmed.ncbi.nlm.nih.gov/29778331/

Wahba A et al. 2024 EACTS/EACTAIC/EBCP Guidelines on cardiopulmonary bypass in adult cardiac surgery. Publicação 2025. DOI: 10.1093/ejcts/ezae354. https://pubmed.ncbi.nlm.nih.gov/39949326/ e https://pmc.ncbi.nlm.nih.gov/articles/PMC11947607/

Engelman R et al. STS/SCA/AmSECT Clinical Practice Guidelines: Temperature Management During Cardiopulmonary Bypass. Ann Thorac Surg. 2015;100:748–757. DOI: 10.1016/j.athoracsur.2015.03.126. https://www.sts.org/sites/default/files/documents/Guidelines_CPB%20Temperature%20Management.pdf

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

Fonte: código do PerfuseLab, versão local de 25/10/2026. Arquivos principais: src/js/pre-cec.js, dashboard.js, dashboard-plan.js, local-case.js, index.js e server/models/PerfusionCase.js.

## Crédito da capa

Imagem criada com a ferramenta nativa ImageGen. Arquivo: `output/apresentacao/capa-perfuselab.png`. Trata-se de uma ilustração artística, não um registro clínico real.

Prompt utilizado:

Use case: productivity-visual. Asset: widescreen 16:9 keynote cover background for PerfuseLab, a cardiopulmonary bypass data and planning research project. Create a breathtaking, restrained, editorial photographic illustration of an empty modern cardiac operating room with a plausible heart-lung perfusion circuit and oxygenator dominating the RIGHT third, polished translucent medical tubing and subtle deep red blood tone in a closed circuit, cyan and mint reflections on glass, soft overhead surgical lights far out of focus. LEFT 60 percent is very dark navy negative space with subtle atmospheric gradation, reserved for editable title added later. Cinematic depth of field, sophisticated realistic materials, navy #102b37, muted teal and mint highlights, no people, no patient, no gore, no labels, no lettering, no logo, no watermark, no UI, no diagrams. The image is an artistic illustration not a factual equipment schematic.