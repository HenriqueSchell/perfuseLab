# PerfuseLab — Dossiê técnico e guia de estudo para congresso

**Data da revisão:** 25 de outubro de 2026. **Versão declarada da aplicação principal:** 0.1.0. **Commit de referência:** `09a3243f141fba0ad5a371b08237e87d0c2bef64`, acrescido dos arquivos locais presentes, inclusive `perfuselab-report/`, que estava não rastreado pelo Git. Este documento descreve o estado encontrado no computador, não uma versão de produção verificada.

## Como estudar este documento

Leia os capítulos 1–4 para entender o produto; 5–10 para dominar variáveis, equações e regras; 11–14 para compreender limitações e preparar a apresentação. Os apêndices trazem resultados recalculados, campos dos arquivos, identificadores técnicos e inventário das fontes. As fórmulas aqui descritas representam o programa auditado. As regras experimentais não constituem validação clínica nem recomendação de tratamento.

O escopo inclui os arquivos textuais locais, JavaScript, Python, HTML, CSS, configurações, JSON, CSV e o texto extraído dos dois DOCX. Imagens foram inventariadas como recursos visuais; não foi feita transcrição de texto contido exclusivamente em capturas. O banco remoto, outros computadores, conversas anteriores não incluídas nos arquivos e histórico completo de commits não integram esta revisão. Dependências de terceiros e metadados internos de `.git` não são código autoral do projeto.

## 1. O que é o projeto

O PerfuseLab é uma aplicação web educacional e operacional voltada à organização e interpretação de dados de perfusão durante circulação extracorpórea (CEC). Reúne identificação do paciente, monitorização seriada, cálculo de oferta de oxigênio, avaliação de tendências, alertas por regras, checklist de perfusão, relatórios imprimíveis e persistência de casos em MongoDB.

Seu problema central é transformar registros dispersos — fluxo, hemoglobina, saturação, gasometria, lactato, temperatura e informações operacionais — em uma representação temporal que permita conferir os cálculos e explicar a evolução do caso. O produto não mede essas grandezas diretamente: recebe digitação ou importação. Não há integração demonstrada com bomba, gasômetro, prontuário hospitalar ou aquisição contínua de sinais.

Uma formulação apropriada para o congresso é: **“Desenvolvimento de uma plataforma web para integração, auditoria matemática e visualização longitudinal de dados de perfusão extracorpórea, com regras interpretativas explícitas e casos sintéticos para ensino.”**

### 1.1. Qual é a participação de inteligência artificial?

O arquivo `promptCEC.txt` registra uma proposta de análise por IA e cita Gemini; o manual didático registra apoio de Codex/OpenAI no desenvolvimento. Porém, o motor executado no navegador é determinístico: funções JavaScript aplicam fórmulas e condições. Não foi encontrada chamada a modelo externo no caminho atual de cálculo. Não apresentar o risco integrado como predição de uma rede neural, nem atribuir capacidade de aprendizado automático ao programa atual.

### 1.2. O que diferencia o projeto

- Integra oferta, consumo informado, extração, metabolismo e contexto operacional.
- Expõe a origem do iDO₂: calculado, informado e/ou inconsistente.
- Quantifica duração e magnitude de exposição abaixo de um alvo por AUC.
- Conserva registros originais e informações cirúrgicas em casos estruturados.
- Oferece exemplos em que o rótulo automático e a leitura fisiológica exigem discussão.

Essas são funcionalidades observadas, não evidência de redução de complicações. Não há, nos materiais examinados, estudo clínico de eficácia do PerfuseLab.

## 2. Arquitetura e organização

```text
Digitação / CSV / JSON
        ↓
index.js: leitura, normalização, validação inicial
        ↓
localStorage: paciente, histórico e caso original
        ↓
dashboard.js: completar exames → fórmulas → análise → visualização
        ├── gráficos Chart.js e tabelas
        ├── checklist local
        ├── impressão simples/completa
        └── snapshot → API Express → MongoDB
                                      ↓
                          cases.html: consulta e impressão
```

| Componente | Responsabilidade e fonte |
|---|---|
| `index.html`, `src/js/index.js` | Entrada manual e importação CSV/JSON; dados iniciais |
| `dashboard.html`, `src/js/dashboard.js` | Motor matemático, alertas, gráficos, checklist, impressão e salvamento |
| `cases.html`, `src/js/cases.js` | Busca, listagem, detalhes e impressão dos casos persistidos |
| `checklist-modelo.html` | Modelo independente para preenchimento/impressão |
| `informacoes.html` | Fórmulas e limites em página de consulta |
| `src/css/style.css` | Layout responsivo, modais, tabelas e impressão |
| `src/js/config.js`, `runtime-env.js` | URL da API, sessão e chamadas autenticadas |
| `server/` | API Express, autenticação, CORS e modelo Mongoose |
| `tools/` | Build, servidor estático local, validação e geração de materiais |
| `casos-clinicos-didaticos/` | 30 CSV, 30 interpretações TXT, manual DOCX e instruções |
| `casos-completos-cirurgicos/` | 10 JSON sintéticos com contexto cirúrgico ampliado |
| `perfuselab-report/` | Protótipo separado de relatórios, com dados simulados e servidor próprio |

O frontend principal é HTML/CSS/JavaScript sem framework de componentes. Usa Chart.js para gráficos e Tailwind via CDN em páginas. O backend principal declara Express, Mongoose, cors e dotenv; requer Node ≥20. O build copia uma lista de páginas e recursos para `dist/` e gera a configuração pública de runtime. A configuração de publicação prevê Netlify para frontend, Render para API e MongoDB Atlas para persistência; isso não confirma que os serviços estejam publicados ou funcionais hoje.

O subprojeto `perfuselab-report` não é a implementação principal de relatórios. Seu dashboard contém dados fixos; o README menciona `/report`, enquanto a rota efetivamente montada para renderização é `/report/relatorio`, e o servidor não configura mecanismo de views. Há divergência entre `date` em `charts.js` e `data` em outro gerador. Portanto, tratá-lo como protótipo separado, não como integração concluída.

## 3. Funcionalidades e fluxo de uso

1. Informar paciente e valores iniciais, ou importar arquivo CSV/JSON.
2. Normalizar nomes de colunas, números decimais e unidades de lactato.
3. Calcular superfície corporal e completar cada ponto de monitorização.
4. Mostrar cards de Hb, Hct, lactato, IC e iDO₂, tabela e curvas temporais.
5. Gerar análise integrada com alertas, métricas, limitações e notas técnicas.
6. Consultar conversão entre índice de fluxo e fluxo total para a SC do paciente.
7. Preencher checklist e dados dos perfusionistas.
8. Imprimir relatório simples ou completo pelo navegador, inclusive salvar como PDF pelo diálogo de impressão.
9. Salvar snapshot na API e consultar casos salvos por busca textual.

### 3.1. Importação

CSV aceita vírgula ou ponto e vírgula como delimitador, com tratamento de aspas por linha; não é um parser completo para campos que contenham quebras de linha. Nomes são normalizados removendo acentos, espaços e sinais. JSON aceita `paciente`/`patient` e `monitorizacao`/`monitoring`/`exames`.

No início são exigidos sexo, idade, peso, altura, Hb, Hct, fluxo e lactato após normalização, além de SaO₂ medida ou iDO₂ informado. Hct pode ser derivado de Hb; fluxo pode ser derivado de IC × SC. O importador não oferece simetria completa Hb↔Hct: sua entrada exige Hb; já a inserção manual de um novo exame aceita Hb ou Hct e estima o outro.

Se houver simultaneamente lactato em mmol/L e mg/dL, prevalece o campo mmol/L. Se faltar tempo, o importador usa o índice da linha, que **não comprova minutos reais**. Temperatura e PAM podem vir da linha ou de arrays operacionais pareados pela posição.

### 3.2. Monitorização e relatórios

As curvas selecionáveis no dashboard são iDO₂, lactato, Hb, Hct, IC, SvO₂ e O₂ER. Os limiares pediátricos de Hb 9 e Hct 25 existem em constantes, mas os botões de Hb/Hct usam os limiares adultos nessa implementação.

O relatório simples e o completo são sínteses. A seleção de alertas limita a quantidade exibida; no módulo de casos salvos, são até cinco no simples e oito no completo. Logo, “completo” não significa reprodução de todos os alertas, campos JSON e detalhes técnicos. O snapshot preserva mais dados que o documento impresso.

### 3.3. Checklist

São nove seções e 46 itens: identificação/equipe (4), preparo da bomba (12), bomba posicionada (9), circuito/insumos (3), anticoagulação (4), início da CEC (4), manutenção (3), saída (4) e pós-CEC (3).

Cada item tem `status` e `observacao`. O total de concluídos conta `status === 'concluido'`; pendentes = total − concluídos. Dados associados incluem data, sala, início/fim de CEC, tempo de clampeamento, procedimento, responsáveis pela montagem/CEC/check/final e intercorrências. O checklist registra uma conferência do usuário, não verifica fisicamente equipamentos nem garante cumprimento de protocolo.

## 4. Três níveis de informação

| Nível | Exemplos | Significado |
|---|---|---|
| Medido ou informado | Hb, fluxo, SaO₂, PaO₂, lactato, PAM, iVO₂ | O programa recebe o valor; não atesta calibração ou coleta |
| Derivado | SC, IC, iDO₂, O₂ER, AUC, AG | Resultado calculado sob pressupostos explícitos |
| Interpretado por regra | Alerta, risco, status GDP, resumo ácido-base | Classificação local dependente dos dados disponíveis |

Há ainda valores estimados (Hb/Hct), contextuais (comorbidades, cânulas, eventos) e históricos/propostos (peso ideal, ajustes por choque/sepse). Um campo aparecer no JSON não significa que participe do risco. A matriz de variáveis a seguir descreve esse uso.

## 5. Dicionário clínico e operacional

### 5.1. Paciente e contexto pré-operatório

| Campo(s) | Unidade/tipo | Uso e relação |
|---|---|---|
| `sexo` | Texto | Identificação; coeficiente de volemia 65 se começa com “f”, 70 nos demais casos |
| `idade` | Anos, admite decimal | Identificação; neonatos representados por frações de ano; não seleciona motor neonatal |
| `peso` | kg | SC, IMC, volemia e diurese indexada |
| `altura`, `alturaNum` | cm | SC e IMC; a interface inicial exige altura inteira |
| `procedimento` | Texto | Exibição, título, busca e chave local |
| `comorbidades` | Lista de textos | Contexto preservado, sem pesos automáticos |
| `risco_pre_operatorio.euroscore_ii` | Valor informado | Não calculado pelo PerfuseLab e não confundível com risco integrado |
| `creatinina_mg_dl` | mg/dL | Contexto; não calcula AKI ou eGFR |
| `hematocrito_preop` | % | Contexto pré-operatório |
| `identificacao.data_cirurgia`, `sala`, `prontuario_simulado` | Data/texto | Identificação dos exemplos cirúrgicos |
| `procedimento.tipo_cirurgia`, `descricao`, `carater` | Texto | Natureza e descrição da operação |
| `metadados.id_caso`, `categoria`, `finalidade` | Texto | Organização dos casos sintéticos |

### 5.2. Todas as grandezas da monitorização normalizada

| Campo canônico e aliases principais | Unidade | Como participa |
|---|---|---|
| `tempo` (`tempo_min`, `tempomin`) | min | Ordenação da análise, AUC, tempo final usado como duração |
| `fluxo` | L/min | Fluxo total da bomba, base do IC |
| `icInformado` (`ic`, `indicecardiaco`, `ic_informado`) | L/min/m² | Tem prioridade sobre IC derivado do fluxo |
| `hb` (`hemoglobina`) | g/dL | CaO₂, iDO₂, alerta de Hb e score |
| `hct` (`hematocrito`) | % | Card, score; pode ser Hb × 3 |
| `sao2` (`saturacao`) | % na entrada | Divide por 100 na equação; necessária para recálculo independente de iDO₂ |
| `sao2Informada` | Booleano | Marca disponibilidade da SaO₂; `false` impede seu uso como medida |
| `pao2` | mmHg | Componente dissolvido de O₂ e correção FiO₂/PaO₂ |
| `ido2Informado` (`ido2`, `ido2_informado`) | mL/min/m² | Oferta externa; fallback quando recálculo indisponível |
| `ivo2` | mL/min/m² | Consumo informado; origem precisa ser conhecida; não é calculado por Fick |
| `relacaoInformada` / entrada `do2_vo2` | Adimensional | Mantida para comparar com relação recalculada |
| `svo2` | % | Alerta venoso e discordância metabólica; local de coleta precisa ser contextualizado |
| `lactato` | mmol/L | Card, score, alerta final e razão final/inicial |
| `lactatoMgDl`, `lactato_mg_dl` | mg/dL | Conversão por 9,009; conservado para rastrear unidade |
| `lactatoOriginal`, `unidadeLactatoOriginal` | Valor + texto | Rastreio de entrada manual e conversão |
| `ph` | Adimensional | Classificação ácido-base final |
| `paco2` | mmHg | Classificação ácido-base; não basta para calcular gap sem PCO₂ venosa |
| `hco3` | mEq/L | Ácido-base, ânion gap e delta-delta |
| `be` | mEq/L | Base excess registrado, sem alerta específico |
| `gapPco2` (`gap_pco2`) | mmHg | Recebido pronto; alerta ≥6; não derivado de PvCO₂ no motor |
| `na` (`sodio`) | mmol/L | Ânion gap; sem alerta específico de hiponatremia/hipernatremia |
| `cl` (`cloro`) | mmol/L | Ânion gap; exige simultaneidade com Na e HCO₃ |
| `k` (`potassio`) | mmol/L | Alerta se <3,5; não há regra de hipercalemia |
| `ca` (`calcio`) | Unidade a confirmar | Interface mostra mmol/L; caso original traz mg/dL; não classifica automaticamente nem converte |
| `glicose` (`glucose`) | mg/dL | Alerta se >180 |
| `fio2` | % na entrada | Correção de Hamilton; não confundir 60% com fração 0,60 na entrada |
| `pam` | mmHg | Alerta se <60; não é calculada a partir de PAS/PAD |
| `temperatura` | °C | Interpolação de alvo térmico local; não corrige gasometria |

### 5.3. CEC, anticoagulação e variáveis cirúrgicas

| Grupo/campos | Unidade/tipo | Uso real |
|---|---|---|
| `cec.configuracao`, `oxigenador`, `cardioplegia`, `drenagem_venosa` | Texto | Descrição do circuito e técnica |
| `filtro_arterial`, `hemoconcentrador` | Booleano | Registro contextual |
| `prime_ml`, `rap_ml`, `cardioplegia_ml` | mL | Carga nominal = prime − RAP + cardioplegia |
| `ultrafiltracao_ml` | mL | Armazenada; não descontada automaticamente da carga nominal |
| `canula_arterial_fr`, `canulas_venosas_fr` | French; valor/lista | Registro, sem cálculo de resistência ou seleção de cânula |
| `alvo_ic_l_min_m2` | L/min/m² | Meta registrada no JSON; não substitui automaticamente os limiares globais |
| `heparina_mg`, `protamina_mg` | mg | Registro; não calcula dose terapêutica, UI/kg ou neutralização |
| `tca_basal_s`, `tca_pos_heparina_s`, `tca_cec_s`, `tca_pos_neutralizacao_s` | s | TCA basal/CEC/pós no resumo; o alerta usa especificamente `tca_cec_s` |
| `operacional.estrategia_ph` | Texto | Alfa-stat/pH-stat contextual; não muda as equações |
| `pressao_barometrica_mmhg` | mmHg | Correção FiO₂; padrão 760 |
| `delta_vav_mmhg` | mmHg | Pressão/vácuo assistido informado, sem alerta específico |
| `pressao_pre_membrana_mmhg`, `pressao_pos_membrana_mmhg` | mmHg | Diferença pré − pós |
| `fluxo_gas_l_min` | L/min; série | Sweep gas contextual, sem cálculo de troca gasosa |
| `sweep_fio2_percentual` | %; série | Contexto; a correção usa a FiO₂ de cada exame |
| `temperatura_c`, `pam_mmhg` | Séries | Fallback de importação por posição |
| `bis`, supressão cerebral mencionada no prompt | Índice/descrição | Apenas contexto/aviso de ausência; sem classificação neurológica validada |
| `debito_urinario.volume_ml`, `tempo_min` | mL e min | Diurese por kg por hora |
| `balanco_hidrico.entrada_cristaloide_ml` | mL | Registro do JSON |
| `hemocomponentes.concentrado_hemacias_ml`, `plasma_ml`, `plaquetas_ml` | mL | Registro do JSON |
| `balanco_hidrico.ultrafiltracao_ml`, `debito_urinario_ml`, `balanco_estimado_ml` | mL | Valores fornecidos; o dashboard não reconstrói balanço completo |
| `eventos` | Lista textual | Contexto; alimenta intercorrências do checklist |

Horários em `tempos_cirurgicos`: `entrada_sala`, `inducao`, `incisao`, `heparinizacao`, `inicio_cec`, `inicio_clampeamento`, `primeira_cardioplegia`, `fim_clampeamento`, `inicio_reaquecimento`, `fim_cec`, `protamina` e `fechamento`. São textos de horário. `tempo_cec_min` e `tempo_clampeamento_min` são minutos informados. A regra de duração do risco usa o último `tempo` da monitorização ordenada, não a subtração automática dos horários cirúrgicos.

### 5.4. Variáveis derivadas e de auditoria

| Identificador | Significado |
|---|---|
| `SC`, `bmi` | Superfície corporal e IMC |
| `icCalculado`, `IC` | Fluxo/SC e IC escolhido após prioridade do informado |
| `ido2Calculado`, `ido2` | Oferta recalculada e oferta efetivamente usada |
| `fonteIdo2` | `calculado` ou `informado`; conferir valor finito antes de interpretar |
| `consistenciaIdo2` | `calculado`, `compativel`, `divergente`, `incompativel`, `discordante`, `nao_verificavel` ou `informado` |
| `diferencaIdo2Percentual` | 100 × (calculado − informado)/informado |
| `sao2Implicita` | Saturação necessária para fechar o iDO₂ informado com Hb, IC e PaO₂ |
| `o2er`, `relacaoDo2Vo2`, `diferencaRelacao` | Extração, oferta/consumo e diferença para a relação informada |
| `score`, `scoreTotal` | Índice experimental histórico; não é o risco integrado |
| `alvoIdo2Termico` | Meta da tabela local por temperatura |
| `adequacaoGdpInicial/Final`, `adequacaoTermicaInicial/Final` | Percentuais do alvo correspondente |
| `aucGdp`, `aucTermica` | Objetos com `auc` e `tempoAbaixo` |
| `lactatoRatio`, `deltaHb`, `deltaIdo2`, `deltaIdo2Percentual` | Comparações entre primeiro e último ponto ordenados |
| `anionGap`, `deltaDelta`, `acidobase` | Equilíbrio ácido-base final e descrição |
| `debitoMlKgH`, `deltaMembrana` | Diurese indexada e gradiente de pressão |
| `volumeSanguineoEstimado`, `cargaCristaloideNominal`, `proporcaoCristaloide` | Estimativa volumétrica nominal |
| `pontosRecalculados`, `pontosInconsistentes` | Contadores de auditoria do iDO₂ |
| `hipoxiaOculta` | Nome interno de condição descritiva de discordância; não diagnóstico |
| `alertas`, `limitacoes`, `informacoesTecnicas` | Listas que explicam o resultado |
| `quantidadeAltos`, `quantidadeModerados`, `risco` | Contagem e classe integrada |
| `resumo`, `metricas`, `dados` | Estruturas de saída da análise |

## 6. Equações, unidades e relações

### 6.1. Antropometria e fluxo

**SC = √(peso × altura / 3600)**, com kg e cm, resultado em m². A função mantém precisão da raiz; a tela costuma mostrar duas casas. **IMC = peso / (altura/100)²**, em kg/m², arredondado a uma casa na análise.

**IC = Q/SC**, sendo Q o fluxo da bomba em L/min. Em CEC, “índice cardíaco” no app representa índice de fluxo extracorpóreo; não é uma medição independente de débito cardíaco nativo. A função arredonda IC para duas casas. Se um IC for informado, ele tem prioridade no cálculo subsequente. A relação inversa **Q = IC × SC** preenche fluxo ausente e monta a tabela de conversão para IC 2,0; 2,2; 2,4; 2,5; 2,6; 2,8; 3,0 e 3,2.

Para um mesmo fluxo, maior SC implica menor IC. Isso explica o caso de obesidade com fluxo absoluto aparentemente elevado e índice baixo. O programa não calcula peso ideal nem altera a indexação pela obesidade.

### 6.2. Conteúdo e oferta de oxigênio

**CaO₂ = 1,36 × Hb × (SaO₂/100) + 0,003 × PaO₂**, em mL O₂/dL.

O primeiro termo representa O₂ associado à Hb. A constante 1,36 é a capacidade adotada no projeto; o segundo termo representa oxigênio dissolvido. **DO₂ = 10 × Q × CaO₂**, em mL/min. O fator 10 converte litros em decilitros. **iDO₂ = DO₂/SC = 10 × IC × CaO₂**, em mL/min/m².

Exemplo matemático: Hb 10 g/dL, SaO₂ 98%, PaO₂ 150 mmHg e IC 2,4 produzem CaO₂ = 13,778 mL/dL e iDO₂ = 330,672, exibido como **330,67**. Mantidos os outros termos, Hb 8 produz **266,70**. Elevar PaO₂ em 100 mmHg acrescenta apenas 0,3 mL/dL ao conteúdo e 7,2 mL/min/m² à oferta para IC 2,4. Esses exemplos explicam a equação, não prescrevem intervenção.

Relações de sensibilidade, deduzidas da fórmula e não expostas como calculadora no app:

- ∂iDO₂/∂Hb = 13,6 × IC × SaO₂ em fração.
- ∂iDO₂/∂PaO₂ = 0,03 × IC.
- ∂iDO₂/∂SaO₂ em pontos percentuais = 0,136 × IC × Hb.
- ∂iDO₂/∂IC = 10 × CaO₂.

As funções aceitam ausência de PaO₂ substituindo a contribuição dissolvida por zero. Portanto, o rótulo “calculado” pode corresponder a uma fórmula incompleta nesse componente. SaO₂ ausente não é estimada a partir de PaO₂.

### 6.3. Auditoria de iDO₂

**SaO₂ implícita (%) = 100 × { [iDO₂ informado/(10 × IC) − 0,003 × PaO₂] / (1,36 × Hb) }.**

Quando há SaO₂ medida, o sistema prefere iDO₂ calculado e compara com o informado: diferença absoluta ≤5% é compatível; >5% é divergente. Quando falta SaO₂, usa o informado e calcula a saturação implícita para auditoria. Fora de 0–100% é matematicamente incompatível; PaO₂ ≥100 junto de SaO₂ implícita <90% gera “discordante”; nos demais casos, permanece não verificável. Essa regra não reconstrói uma curva de dissociação individual.

### 6.4. Oferta, consumo e extração

**O₂ER (%) = 100 × iVO₂/iDO₂** e **DO₂/VO₂ = iDO₂/iVO₂**. Para a mesma SC e mesmo momento, a razão entre grandezas indexadas é igual à razão entre valores absolutos. Portanto, **DO₂/VO₂ = 100/O₂ER (%)**.

Extração de 20%, 30% e 40% equivale a relações 5,00; 3,33… e 2,50. Os dois indicadores são matematicamente dependentes; tratá-los como evidências independentes inflaria a interpretação. iVO₂ é informado; não há cálculo direto de CvO₂ ou VO₂ pelo princípio de Fick. A presença de SvO₂, isoladamente, não muda isso.

### 6.5. Hb, Hct e lactato

**Hb estimada = Hct/3**; **Hct estimado = 3 × Hb**. São aproximações e não medições adicionais. A interface não mantém um marcador de origem completo para toda estimativa de Hb/Hct; o caso valvar registra essa origem nas notas de conversão.

**Lactato mmol/L = lactato mg/dL / 9,009**; conversão inversa = mmol/L × 9,009. O conversor arredonda a duas casas. **Razão de lactato = final/inicial**, válida no motor quando o inicial é >0. É adimensional e não mede velocidade de depuração. Um aumento de 1,1 para 1,4 resulta em 1,27 e dispara tendência mesmo com valor final baixo. O prompt chama isso de LRS; o código implementa uma razão, não um escore prognóstico validado.

### 6.6. Tendências

**ΔHb = Hb final − Hb inicial**. **ΔiDO₂ = iDO₂ final − inicial**. **ΔiDO₂ (%) = 100 × ΔiDO₂ / iDO₂ inicial**, se denominador não nulo. O prompt propõe ΔDO₂/VO₂, mas o resumo atual mostra os valores inicial/final, sem uma métrica separada de delta da razão.

### 6.7. Alvo GDP e alvo térmico

O alvo fixo do código é **280 mL/min/m²**. A referência local cita o ensaio de Ranucci; esse estudo investigou uma estratégia de GDP com alvo ≥280 e lesão renal aguda. Isso fundamenta a origem do alvo, não valida o score, o risco integrado ou todo o software. [Ranucci et al., 2018](https://pubmed.ncbi.nlm.nih.gov/29778331/).

| Temperatura (°C) | Alvo térmico local (mL/min/m²) |
|---:|---:|
| 25 | 110 |
| 28 | 152 |
| 30 | 180 |
| 33 | 223 |
| 35 | 252 |
| 37 | 280 |

Entre pontos, interpolação linear: A(T) = A₁ + (T−T₁)/(T₂−T₁) × (A₂−A₁). Abaixo de 25 mantém 110, acima de 37 mantém 280. Temperatura ausente usa 223 com aviso. A tabela é uma regra local do prompt, não uma equação de consumo individual validada. Ajustes de +20% por choque, +15% por sepse e +10% por hipertireoidismo aparecem no prompt, mas não são aplicados pelo código.

**Adequação = 100 × iDO₂/alvo.** O status GDP final é adequado ≥100%; limítrofe ≥90% e <100%; inadequado <90%. O alvo térmico é exibido separadamente e não substitui a referência fixa na regra de risco.

### 6.8. AUC de déficit e tempo abaixo

Defina d(t) = alvo(t) − iDO₂(t). AUC = integral de max(d(t), 0) no tempo. Unidade: (mL/min/m²) × min, dimensionalmente mL/m². Esse déficit relativo a um alvo não mede diretamente uma dívida metabólica real de oxigênio.

Para cada intervalo Δt entre amostras:

- Se ambos os déficits são positivos: área = (d₁+d₂) × Δt/2; todo o intervalo está abaixo.
- Se ambos são não positivos: contribuição zero.
- Se há cruzamento: fração abaixo = d positivo/(|d₁|+|d₂|); tempo abaixo = fração × Δt; área triangular = d positivo × tempo abaixo/2.

O algoritmo ordena a série na análise, ignora pares sem ofertas/alvos finitos e usa intervalo não negativo. Lacunas não são reconstruídas como monitorização contínua. A saída arredonda área e tempo a uma casa. Exemplo: 272→281 em 35 min cruza 280 após 35 × 8/9 = 31,11 min; área = 8 × 31,11/2 = **124,44**, exibida **124,4**.

### 6.9. Ácido-base

**AG = Na − (Cl + HCO₃)**, sem potássio, em mEq/L. Não há correção por albumina. **Delta-delta = (AG − 12)/(24 − HCO₃)**; só calculado se AG finito e HCO₃ diferente de 24. Os valores 12 e 24 são referências fixas do cálculo, não personalizadas.

A função ácido-base usa o último exame, nesta ordem:

1. pH <7,35 e PaCO₂ >45: acidose respiratória.
2. pH <7,35 e HCO₃ <22: acidose metabólica.
3. pH >7,45 e PaCO₂ <35: alcalose respiratória.
4. pH >7,45 e HCO₃ >26: alcalose metabólica.
5. PaCO₂ <35 e HCO₃ ≤24: provável alcalose respiratória compensada.
6. PaCO₂ >45 e HCO₃ ≥24: provável acidose respiratória compensada.
7. Restante: sem distúrbio primário evidente pela regra.

Faltando pH, PaCO₂ ou HCO₃, retorna não calculável. A precedência pode ocultar distúrbio misto. O programa não resolve Henderson–Hasselbalch, fórmula de Winter, compensação aguda/crônica nem correção por temperatura, apesar de esses temas aparecerem no prompt. O termo “compensada” é uma saída heurística, não comprovação quantitativa de compensação.

### 6.10. Oxigenador, volume e diurese

**FiO₂ corrigida (%) = 100 × [FiO₂ entrada/100 − PaO₂/(Pb−47) + 0,21].** A implementação denomina a expressão “Hamilton” e a apresenta quando PaO₂ >150. Pb padrão =760 mmHg. A função não limita o resultado a 21–100% nem protege especificamente Pb=47. A atribuição bibliográfica exata dessa expressão não foi comprovada nesta revisão; manter como métrica implementada que requer referência primária antes de sustentá-la como método validado no congresso. Não é prescrição automática de FiO₂.

**ΔP membrana = pressão pré − pressão pós**, em mmHg. Não é resistência vascular calculada; o significado depende do fluxo e do circuito.

**Volemia estimada = peso × 65** para sexo começando por “f”; **peso ×70** nos demais casos, em mL. Não há fórmula neonatal específica. **Carga nominal = prime − RAP + cardioplegia**. **Proporção = 100 × carga nominal/volemia**. Essa estimativa não desconta ultrafiltração, perdas ou a fração de cardioplegia que não permaneceu intravascular.

**Diurese = volume urinário / peso / (tempo em minutos/60)**, em mL/kg/h. Não classifica função renal nem diagnostica AKI. O teste por valor verdadeiro no código faz volume zero resultar em “não calculável”, embora matematicamente devesse representar zero se peso e duração forem válidos.

## 7. Regras exatas de alerta e risco integrado

Fonte operacional: `LIMIARES` e `montarAnalisePerfusional`, em `src/js/dashboard.js`. Os cortes abaixo descrevem o software, não metas universais.

| Parâmetro | Moderado | Alto | Abrangência |
|---|---|---|---|
| iDO₂ | 252 ≤ valor <280 | <252 | Cada ponto; 252 =90% de 280 |
| O₂ER | 30–40% inclusive | >40% | Cada ponto |
| DO₂/VO₂ | 2,5–3,33 inclusive | <2,5 | Cada ponto |
| SvO₂ | 65–70% inclusive | <65% | Cada ponto |
| Gap PCO₂ | ≥6 mmHg | Sem corte alto | Cada ponto |
| PAM | <60 mmHg | Sem corte alto | Cada ponto |
| K | <3,5 mmol/L | Sem corte alto | Cada ponto |
| Glicose | >180 mg/dL | Sem corte alto | Cada ponto |
| Hb | <7,5 g/dL | Sem corte alto isolado | Cada ponto |
| Lactato final | 2–4 mmol/L inclusive | >4 | Somente último ponto para esta regra |
| Razão lactato | >1,1 | Sem corte alto | Último/primeiro |
| Tempo de CEC | 60–120 min inclusive | >120 | Último tempo da série |
| TCA em CEC | 400 ≤ TCA <480 s | <400 s | Campo `tca_cec_s` |

PaO₂ >150, inconsistência de iDO₂ e discordância metabólica são informativos. A discordância é testada no último ponto: SvO₂ ≥70 e pelo menos um entre lactato ≥2, gap ≥6 ou O₂ER ≥30. Não eleva o risco por si só.

**Risco ALTO:** pelo menos um alerta alto. **MODERADO:** nenhum alto e pelo menos dois moderados. **BAIXO:** nenhum alto e menos de dois moderados. Informativos não contam.

Consequências que precisam ser compreendidas:

- Um evento alto inicial mantém a classe ALTO mesmo se o caso recuperar no final.
- A mesma alteração moderada em dois tempos já pode produzir MODERADO.
- Mais amostras podem aumentar a quantidade de alertas sem alterar a gravidade fisiológica.
- O₂ER e DO₂/VO₂ podem gerar dois alertas para a mesma relação matemática.
- Lactato crítico transitório que normalizou não recebe necessariamente o alerta de lactato final crítico.
- Não há risco probabilístico, mortalidade estimada, sensibilidade/especificidade ou calibração clínica demonstrados.
- Dados ausentes e achados sem regras podem coexistir com BAIXO. Essa classe não equivale a ausência de risco clínico.

Os cards usam cortes diferentes: iDO₂ <260 é crítico no card, 260–<280 limítrofe, ≥280 adequado. Hct <22 é crítico, 22–<24 limítrofe, ≥24 acima do corte. IC <2,2 crítico, 2,2–<2,4 limítrofe, ≥2,4 adequado. Hb <7,5 atenção PBM, 7,5–<10 avaliar contexto, ≥10 preservada. **Hct e IC não geram alertas independentes no laço de risco**, embora influenciem score e/ou iDO₂.

## 8. Score experimental histórico

A função `score(ido2,hct,lactato,IC)` exige quatro números finitos. O resultado fica no histórico para compatibilidade; a interface atual enfatiza o risco integrado. A justificativa DOCX propõe pesos máximos 40% para iDO₂ e 20% para cada outra variável.

| Variável | Faixa | Pontos |
|---|---|---:|
| iDO₂ | ≥320 / 300–<320 / 260–<300 / <260 | 4 / 3 / 2 / 0 |
| Hct | ≥25 / 22–<25 / <22 | 2 / 1 / 0 |
| Lactato | <2 / 2–3 inclusive / >3 | 2 / 1 / 0 |
| IC | ≥2,4 / 2,2–<2,4 / <2,2 | 2 / 1 / 0 |

Subtrai um ponto se Hct <22 **e** IC <2,2. Não existe piso zero: o resultado possível inclui **−1**, até 10. A função de classificação histórica usa ≥9, 7–<9, 5–<7 e ≤4, com linguagem de índice não validado.

No DOCX antigo, “iDO₂ <260 e lactato >3” forçaria perfusão inadequada. Esse override **não está implementado na função atual**. O documento também sugere lactato ≤2 com dois pontos; o código dá apenas um ponto para exatamente 2. A fonte executável prevalece para descrever o comportamento atual.

Há dependência entre as parcelas: iDO₂ já contém IC e Hb; Hct se relaciona à Hb e pode ser diretamente estimado dela. A soma não representa quatro dimensões estatisticamente independentes. Pesos fisiologicamente motivados não equivalem a pesos estimados e validados em dados clínicos.

## 9. Caso valvar original: auditoria guiada

Fontes: `promptCEC.txt`, `entrada-paciente-valvular.json`, `resultado-analise-framework.md`. Mulher, 46 anos, 54 kg, 155 cm. SC **1,524795 m²**, IMC **22,5 kg/m²**. Cirurgia de troca aórtica e retroca mitral. O prompt original possui séries de comprimentos diferentes; o JSON adota um pareamento que precisa de confirmação nos dados de origem.

| Tempo min | Hb | IC | iDO₂ informado | SaO₂ implícita | O₂ER % | DO₂/VO₂ |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 12 | 2,4 | 272 | 64,6% | 20,6 | 4,86 |
| 35 | 7,4 | 2,5 | 281 | 104,5% | 11,7 | 8,52 |
| 60 | 7,45 | 2,5 | 292 | 110,9% | 17,8 | 5,62 |
| 90 | 8,7 | 2,7 | 327 | 98,6% | 17,7 | 5,64 |

Nenhum dos quatro iDO₂ é independentemente recalculável por falta de SaO₂. Há três pontos a conferir: um discordante e dois matematicamente impossíveis. O quarto é plausível, mas não verificado.

O recálculo em 25/10/2026 confirmou risco MODERADO, AUC GDP 124,4, tempo abaixo 31,1 min, razão de lactato 1,77, ΔHb −3,30 e ΔiDO₂ +55 (+20,2%). A adequação GDP final é 116,8%, **baseada no informado**. O score histórico vai de 8 para 9, demonstrando por que score e risco não devem ser confundidos.

Pressões 214 e 184 dão ΔP=30 mmHg. Volemia estimada=54×65=3510 mL. Carga nominal=500−200+1000=1300 mL, ou 37,0%. Diurese=2500/54/1,5=**30,86 mL/kg/h**; volume/tempo=**27,78 mL/min**, não os 5,25 mL/min já escritos no prompt. O valor original deve ser conferido, não interpretado automaticamente como função renal excelente.

Cloreto não está pareado em todas as linhas: AG e delta-delta finais ficam não calculáveis. Cálcio foi originalmente descrito em mg/dL, sem tipagem robusta no objeto. TCA pós-neutralização não está disponível. O alvo térmico inicial é 205,8 a 31,8°C, não 223 fixo; o final a 33°C é 223. O caso didático 10 é uma versão sintética coerente para comparação, não uma correção comprovada dos dados reais desse prompt.

## 10. Persistência, API e variáveis técnicas

### 10.1. Estado local e banco

`localStorage` conserva `paciente`, `historicoImportado`, `casoClinicoImportado`, checklist e metadados por chave. `sessionStorage` conserva `perfuselab.auth.token` e `perfuselab.auth.expiresAt`. Estado local não é sinônimo de registro salvo no MongoDB.

O modelo `PerfusionCase` inclui `clientCaseKey`, `title`, `status` (`active`/`archived`), `patient`, `perfusionist`, `clinicalCase`, `monitoring`, `checklist.key/state/summary`, `analysis`, `report`, `source`, `notes`, `createdAt`, `updatedAt` e identificador MongoDB. Muitos campos são `Mixed`: preservam flexibilidade, mas não impõem um esquema clínico detalhado nem unidades em cada número.

`analysis` é snapshot produzido no navegador, não uma reanálise obrigatória do servidor. `source` admite `dashboard`, `import`, `manual`, `api`. A chave do caso combina sexo, idade, peso, altura e procedimento/origem. Não é UUID de paciente/procedimento: dois casos distintos com atributos iguais podem compartilhar chave. Como `/sync` usa essa chave para upsert, existe possibilidade de sobreposição; resolver isso é importante para rastreabilidade futura.

### 10.2. Rotas

| Método e rota | Função |
|---|---|
| GET `/api/health` | Estado da conexão MongoDB e serviço |
| GET `/api/auth/status` | Se autenticação está configurada e TTL |
| POST `/api/auth/login` | Valida credenciais e emite token |
| GET `/api/cases` | Lista por status e busca, padrão 30 e máximo 100 |
| POST `/api/cases` | Cria caso |
| POST `/api/cases/sync` | Atualiza/cria por `clientCaseKey` |
| GET `/api/cases/:id` | Consulta um caso |
| PUT `/api/cases/:id` | Atualiza dados |
| PATCH `/api/cases/:id/archive` | Arquiva |

Não há exclusão definitiva implementada nessas rotas. A tela de casos solicita até 60 registros. Autenticação usa usuário/senha configurados no ambiente e token próprio assinado com HMAC-SHA256, contendo `sub`, `iat` e `exp`, com TTL padrão de oito horas. Não é uma gestão multiusuário com papéis e autoria individual de alterações. Em produção, falta de credenciais bloqueia acesso aos casos; em desenvolvimento o middleware pode permitir acesso sem configuração.

### 10.3. Configurações e constantes de infraestrutura

| Nome | Finalidade/padrão |
|---|---|
| `NODE_ENV` | Comportamento produção/desenvolvimento |
| `PORT` | Porta API; padrão 3000 |
| `FRONTEND_PORT` | Servidor frontend local; padrão 5173 |
| `MONGO_URI`, `MONGODB_URI` | Conexão MongoDB; segundo nome é fallback |
| `MONGODB_DB` | Nome opcional do banco |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | Timeout; padrão 10000 ms |
| `FRONTEND_URL`, `CORS_ORIGIN` | Origens permitidas; listas separadas por vírgulas |
| `PERFUSELAB_AUTH_USER`, `PERFUSELAB_AUTH_PASSWORD` | Credenciais de acesso; não incluir valores no documento |
| `PERFUSELAB_AUTH_SECRET` | Chave de assinatura; não pública |
| `PERFUSELAB_AUTH_TOKEN_TTL_HOURS` | Duração da sessão; padrão 8 |
| `VITE_API_URL`, `PERFUSELAB_API_URL` | Endereço público da API para build/runtime |
| `PERFUSELAB_RUNTIME_CONFIG.apiBaseUrl` | Configuração gerada consumida pelo navegador |
| `API_BASE_URL` | URL efetiva usada nas chamadas |
| `CONNECTION_STATES` | Estados disconnected/connected/connecting/disconnecting |

Outras constantes: payload JSON até 10 MB; espera de busca na tela 350 ms; redirecionamento após importação 500 ms. Índices MongoDB cobrem chave única esparsa, data e busca textual em título, paciente, procedimento, perfusionistas e notas. Configuração não prova conformidade regulatória nem controle completo de dados pessoais.

## 11. Divergências e limites encontrados

| Tema | Evidência local | Implicação para o estudo/apresentação |
|---|---|---|
| Número de casos | Manual fala 20; pasta contém 30 CSV e há mais 10 JSON | Apresentar o acervo atual e citar desatualização do manual |
| Score antigo | Override e rótulos do DOCX diferem do código | Explicar como proposta histórica; não demonstrar regra inexistente |
| IA | Prompt menciona IA; execução é JavaScript determinístico | Separar ferramenta de desenvolvimento e motor do produto |
| Alvo térmico | Tabela fixa e fallback 223 | Regra local sem validação específica demonstrada |
| Metas individuais | JSON inclui alvo IC; motor usa globais | Não alegar personalização automática |
| Hb/Hct | Estimativa simples e importação assimétrica | Identificar origem dos dados nos estudos |
| PaO₂ ausente | Componente dissolvido é zerado | “Calculado” não garante todos os componentes medidos |
| IC informado | Prevalece sobre fluxo/SC | Conferência de incoerência IC–fluxo ainda precisa ser ampliada |
| Tempo ausente | Índice da linha vira tempo | AUC pode ter escala fictícia se o arquivo for incompleto |
| Risco por contagem | Alertas repetidos e dependentes contam | Densidade de amostragem pode alterar classe |
| Lactato | Alerta crítico final, não pico obrigatório | Pode omitir a gravidade de elevação transitória |
| Pediatria/neonatos | Mesmas regras gerais de risco | Casos de ensino matemático, não protocolo pediátrico |
| Eletrólitos | Sem alerta para K alto, Na anormal e Ca | Ler todos os exames, não apenas alertas |
| Ácido-base | Regras sequenciais sem compensação quantitativa | Não equivale a diagnóstico completo de distúrbios mistos |
| Balanço | Carga nominal não é balanço real | Não inferir retenção intravascular real |
| Valores ausentes | Algumas operações aritméticas aceitam `null` como zero em JS | Endurecer validações antes de generalizar a dados incompletos |
| Diurese zero | Teste de truthiness suprime zero | Zero precisa ser distinguido de ausência |
| Chave de caso | Derivada de atributos, não única por evento | Risco de colisão e sobrescrita no sync |
| Relatórios | Número de alertas limitado | Relatório completo é síntese, não exportação integral |
| Datas do checklist | `toISOString()` usa UTC | Perto da meia-noite pode diferir da data local |

Nada disso foi alterado na lógica clínica durante esta documentação. São observações rastreáveis que orientam a descrição correta e futuras melhorias.

## 12. O que foi proposto, mas não está implementado como cálculo

O prompt original solicita peso ideal no IMC >30; compensação por Henderson–Hasselbalch; critérios de LRS <0,9/0,9–1,1/>1,1; ajustes térmicos por choque/sepse/hipertireoidismo; nota de aderência em seis domínios; condutas prioritárias e diagnóstico de dívida de O₂/hipóxia oculta. A implementação atual não realiza integralmente esses itens.

Também não calcula diretamente PvO₂, CvO₂, consumo pelo princípio de Fick, gap a partir de PCO₂ arterial/venosa, resistência vascular, seleção de cânulas, dose de heparina/protamina, clearance renal, EuroSCORE II ou prognóstico de mortalidade. Esses conceitos podem compor pesquisa futura; não devem aparecer como funcionalidades concluídas.

## 13. Verificação técnica e maturidade científica

Para esta revisão foram executados o validador existente, que percorre os 40 casos sintéticos, e uma auditoria que importa e recalcula os mesmos casos mais o JSON valvar original, totalizando 41 arquivos. Os resultados completos ficam em `auditoria-documentacao.json`; o apêndice deste documento inclui resumos e saídas de cada caso. O script `tools/auditar-documentacao.cjs` torna o procedimento repetível sem conectar ao banco.

O validador existente verifica que importação e análise executam sem exceção em um ambiente simulado de DOM. Ele não afirma concordância numérica com laboratório de referência, não testa o fluxo visual completo, não confirma impressão e não acessa MongoDB. A auditoria adicional reproduz o motor e documenta saídas; não constitui validação externa independente das próprias fórmulas.

Uma evolução científica justificável seria: congelar versão e dicionário; testar fórmulas contra cálculos independentes e casos-limite; definir dados obrigatórios e origem temporal; avaliar concordância de especialistas; separar adultos/pediatria/neonatos; medir desempenho de classificações em amostra adequada; e só então investigar benefício clínico com desenho apropriado. Não há nos arquivos resultados que permitam alegar redução de AKI, mortalidade ou transfusões pelo PerfuseLab.

## 14. Preparação para o congresso

### 14.1. Roteiro sugerido de apresentação

1. **Problema:** informação perfusional dispersa dificulta leitura longitudinal e auditoria.
2. **Objetivo:** construir uma plataforma para integrar registros e tornar relações matemáticas transparentes.
3. **Método:** aplicação web determinística; fórmulas explícitas; regras documentadas; persistência e acervo sintético.
4. **Demonstração:** caso estável; queda de Hb e oferta; recuperação de fluxo; iDO₂ informado inconsistente.
5. **Resultados de desenvolvimento:** funcionalidades implementadas, 40 casos sintéticos processáveis e auditoria de 41 entradas nesta revisão.
6. **Limitações:** regras não validadas, ausência de integração direta, dependência da qualidade de entrada, generalização etária não estabelecida.
7. **Próximos passos:** validação matemática independente, revisão multiprofissional, rastreabilidade e estudo de desempenho.

### 14.2. Perguntas prováveis e respostas sustentáveis

**O sistema usa IA para decidir?** O motor atual usa regras determinísticas. IA é mencionada nos materiais como apoio ao desenvolvimento/produção de conteúdo.

**O score foi validado?** Não foi demonstrada validação nos arquivos. É um índice experimental histórico, distinto do risco por alertas.

**Por que 280?** É a referência operacional adotada no código e relacionada à estratégia estudada por Ranucci, não limite universal para qualquer paciente e temperatura.

**O que significa risco alto?** Pelo menos uma condição local de alerta alto ocorreu. Não significa uma probabilidade estimada de desfecho.

**Por que um caso estável fica moderado?** Duração de CEC e aumento relativo discreto de lactato podem produzir dois alertas moderados. A classe precisa ser explicada pelos seus determinantes.

**O₂ER e DO₂/VO₂ são independentes?** Não, são inversos quando calculados com as mesmas ofertas e consumos.

**Pode ser usado em neonatos?** Existem casos sintéticos neonatais para estudo do comportamento matemático; as regras atuais não constituem protocolo neonatal validado.

**Qual o achado mais útil da auditoria?** A possibilidade de identificar iDO₂ informado que exigiria SaO₂ acima de 100%, demonstrando inconsistência dos componentes ou do pareamento temporal.

### 14.3. Trilha de estudo

Comece pelos casos 01, 02 e 03: estabilidade, hemodiluição e recuperação. Passe a 05, 07 e 09: extração, contribuição da PaO₂ e alvo térmico. Compare o caso original com o didático 10. Estude 04/19 para lactato com oferta preservada; 14 para indexação; 15 para origem do iDO₂; 17/18 para lacunas de alertas. Finalmente, examine 21–30 e explique por que regras adultas não devem ser generalizadas automaticamente. Os dez JSON cirúrgicos acrescentam equipe, tempos, circuito, anticoagulação e balanço.

## 15. Referências e rastreabilidade

As fontes primárias da descrição do software são os arquivos inventariados no apêndice, especialmente `src/js/dashboard.js`, `src/js/index.js`, modelo/rotas do servidor, prompt, justificativa do score e materiais didáticos. As referências científicas listadas nos materiais não validam automaticamente as escolhas locais.

- [Ranucci et al. — Goal-directed perfusion to reduce acute kidney injury, 2018](https://pubmed.ncbi.nlm.nih.gov/29778331/): consultado online nesta revisão para conferir origem do alvo GDP.
- [2024 EACTS/EACTAIC/EBCP Guidelines on cardiopulmonary bypass in adult cardiac surgery, publicação 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11826095/): identidade, data e escopo adulto conferidos online; não é validação do PerfuseLab.
- [Mosteller, 1987](https://pubmed.ncbi.nlm.nih.gov/3657876/): referência de SC citada nos arquivos; sem nova revisão integral nesta tarefa.
- [Oshita et al., artigo PMC12039435](https://pmc.ncbi.nlm.nih.gov/articles/PMC12039435/): referência de oferta em CEC presente no projeto; sem nova revisão integral.
- [Conteúdo arterial/venoso e monitorização, PMC10488867](https://pmc.ncbi.nlm.nih.gov/articles/PMC10488867/): referência interna; sem nova revisão integral.
- [STS/SCA/AmSECT — anticoagulação, PMC5850589](https://pmc.ncbi.nlm.nih.gov/articles/PMC5850589/): referência interna; sem nova revisão integral.
- [Patient Blood Management, PMC12256976](https://pmc.ncbi.nlm.nih.gov/articles/PMC12256976/): referência interna do manual; sem nova revisão integral.

Antes de submeter resumo científico, conferir bibliografia completa, autoria, instituição e exigências do evento. Nenhum desfecho clínico ou dado de desempenho deve ser inferido dos exemplos sintéticos.

<!-- APENDICES_AUTOMATICOS -->

## Apêndice A — Inventário e cobertura da leitura


Foram lidos integralmente por varredura 124 arquivos textuais ou DOCX, incluindo configurações ocultas disponíveis. O inventário identifica cada fonte; a análise explicativa prioriza o motor, dados e notas clínicas. 13 recursos não textuais foram apenas inventariados. Os arquivos de documentação criados nesta tarefa são excluídos da própria varredura para evitar recursão. O hash completo das fontes está em `inventario-documentacao.json`.


| Arquivo | Tipo | Linhas de texto | SHA-256 (prefixo) |
| --- | --- | --- | --- |

| .env.example | Texto/código/configuração | 16 | dc7d3fdca5d81bf5 |
| .gitignore | Texto/código/configuração | 10 | 789feb9c0abc5ea9 |
| .vscode/settings.json | Texto/código/configuração | 3 | d7c4c5969a13be89 |
| cases.html | Texto/código/configuração | 111 | 8fcbdfd8ba693466 |
| casos-clinicos-didaticos/01_cec_estavel.csv | Texto/código/configuração | 5 | bb330d6452e2f183 |
| casos-clinicos-didaticos/01_cec_estavel_interpretacao.txt | Texto/código/configuração | 35 | 6ff901c2de8b91ec |
| casos-clinicos-didaticos/02_hemodiluicao_baixo_ido2.csv | Texto/código/configuração | 5 | 833104aa20424abe |
| casos-clinicos-didaticos/02_hemodiluicao_baixo_ido2_interpretacao.txt | Texto/código/configuração | 36 | b92a5cd357d79bef |
| casos-clinicos-didaticos/03_recuperacao_com_ajuste_de_fluxo.csv | Texto/código/configuração | 5 | d16dab77ac6ca24c |
| casos-clinicos-didaticos/03_recuperacao_com_ajuste_de_fluxo_interpretacao.txt | Texto/código/configuração | 36 | 05dc928fd789452f |
| casos-clinicos-didaticos/04_lactato_crescente_ido2_preservado.csv | Texto/código/configuração | 5 | 6404fe68c9890533 |
| casos-clinicos-didaticos/04_lactato_crescente_ido2_preservado_interpretacao.txt | Texto/código/configuração | 37 | 36c14be24545375d |
| casos-clinicos-didaticos/05_extracao_elevada_svo2_baixa.csv | Texto/código/configuração | 5 | 602c33adbbad187b |
| casos-clinicos-didaticos/05_extracao_elevada_svo2_baixa_interpretacao.txt | Texto/código/configuração | 39 | 16b67e2d83b81115 |
| casos-clinicos-didaticos/06_acidose_respiratoria.csv | Texto/código/configuração | 5 | 54debbf6a9527ce8 |
| casos-clinicos-didaticos/06_acidose_respiratoria_interpretacao.txt | Texto/código/configuração | 37 | e49bd33c2f8d870d |
| casos-clinicos-didaticos/07_hiperoxia_com_oferta_adequada.csv | Texto/código/configuração | 5 | b33a8677166b23bf |
| casos-clinicos-didaticos/07_hiperoxia_com_oferta_adequada_interpretacao.txt | Texto/código/configuração | 35 | 22756235159f20bc |
| casos-clinicos-didaticos/08_cec_prolongada_anemia_lactato.csv | Texto/código/configuração | 6 | b7be6b9a3ee03ff8 |
| casos-clinicos-didaticos/08_cec_prolongada_anemia_lactato_interpretacao.txt | Texto/código/configuração | 39 | 80d443178a7663f1 |
| casos-clinicos-didaticos/09_hipotermia_e_reaquecimento.csv | Texto/código/configuração | 6 | 27f0ca9e74f17205 |
| casos-clinicos-didaticos/09_hipotermia_e_reaquecimento_interpretacao.txt | Texto/código/configuração | 37 | bfb710268afe1a0c |
| casos-clinicos-didaticos/10_reoperacao_valvar_coerente.csv | Texto/código/configuração | 5 | cd89f5c0a53191d3 |
| casos-clinicos-didaticos/10_reoperacao_valvar_coerente_interpretacao.txt | Texto/código/configuração | 41 | 087e4caa5b6f42ec |
| casos-clinicos-didaticos/11_vasoplegia_pam_baixa_ido2_preservado.csv | Texto/código/configuração | 5 | b33a0808a7a90493 |
| casos-clinicos-didaticos/11_vasoplegia_pam_baixa_ido2_preservado_interpretacao.txt | Texto/código/configuração | 31 | 6dcdf5147b34efe0 |
| casos-clinicos-didaticos/12_hiperglicemia_lactato_do2_preservado.csv | Texto/código/configuração | 5 | 6e75a5e3b132c700 |
| casos-clinicos-didaticos/12_hiperglicemia_lactato_do2_preservado_interpretacao.txt | Texto/código/configuração | 30 | 5ca1b3559737c3b8 |
| casos-clinicos-didaticos/13_hipocalemia_reaquecimento.csv | Texto/código/configuração | 5 | ccfa7446719595db |
| casos-clinicos-didaticos/13_hipocalemia_reaquecimento_interpretacao.txt | Texto/código/configuração | 30 | 4ecaec4845d966d1 |
| casos-clinicos-didaticos/14_obesidade_fluxo_total_alto_indice_baixo.csv | Texto/código/configuração | 5 | adadbfc09c0b16cb |
| casos-clinicos-didaticos/14_obesidade_fluxo_total_alto_indice_baixo_interpretacao.txt | Texto/código/configuração | 32 | 0d48610ef78e9f68 |
| casos-clinicos-didaticos/15_ido2_informado_sem_sao2.csv | Texto/código/configuração | 5 | d91fc136a1ff739d |
| casos-clinicos-didaticos/15_ido2_informado_sem_sao2_interpretacao.txt | Texto/código/configuração | 31 | 6fa626fb535135e4 |
| casos-clinicos-didaticos/16_gap_pco2_alto_svo2_preservada.csv | Texto/código/configuração | 5 | bf7e8245c6360537 |
| casos-clinicos-didaticos/16_gap_pco2_alto_svo2_preservada_interpretacao.txt | Texto/código/configuração | 30 | b45e6cf74043a279 |
| casos-clinicos-didaticos/17_hipercalemia_pos_cardioplegia_limite_do_framework.csv | Texto/código/configuração | 5 | 74e0c7bc36b7cfae |
| casos-clinicos-didaticos/17_hipercalemia_pos_cardioplegia_limite_do_framework_interpretacao.txt | Texto/código/configuração | 30 | b711f624d5d8b0b0 |
| casos-clinicos-didaticos/18_hiponatremia_hemodiluicao.csv | Texto/código/configuração | 5 | 3f15e6a971cbe517 |
| casos-clinicos-didaticos/18_hiponatremia_hemodiluicao_interpretacao.txt | Texto/código/configuração | 31 | 06a6b1310d01da57 |
| casos-clinicos-didaticos/19_acidose_metabolica_lactato_critico.csv | Texto/código/configuração | 5 | ef621c1156c79159 |
| casos-clinicos-didaticos/19_acidose_metabolica_lactato_critico_interpretacao.txt | Texto/código/configuração | 32 | 20ed129fb2132697 |
| casos-clinicos-didaticos/20_queda_sao2_arterial_recuperada.csv | Texto/código/configuração | 5 | 7d25290b506f0e14 |
| casos-clinicos-didaticos/20_queda_sao2_arterial_recuperada_interpretacao.txt | Texto/código/configuração | 32 | fae1cdafef6aa6f8 |
| casos-clinicos-didaticos/21_pediatrico_cec_estavel.csv | Texto/código/configuração | 5 | e280b5658ebfa64f |
| casos-clinicos-didaticos/21_pediatrico_cec_estavel_interpretacao.txt | Texto/código/configuração | 31 | caef5368803699c8 |
| casos-clinicos-didaticos/22_pediatrico_hemodiluicao_baixo_ido2.csv | Texto/código/configuração | 5 | 4175a74e98fae9fe |
| casos-clinicos-didaticos/22_pediatrico_hemodiluicao_baixo_ido2_interpretacao.txt | Texto/código/configuração | 33 | 56779ba543ddb5b1 |
| casos-clinicos-didaticos/23_pediatrico_lactato_critico_ido2_preservado.csv | Texto/código/configuração | 5 | 9fcd46967b50db96 |
| casos-clinicos-didaticos/23_pediatrico_lactato_critico_ido2_preservado_interpretacao.txt | Texto/código/configuração | 32 | 1bd7ddc003a8956e |
| casos-clinicos-didaticos/24_pediatrico_queda_sao2_oxigenador.csv | Texto/código/configuração | 5 | bea698d65964b0b8 |
| casos-clinicos-didaticos/24_pediatrico_queda_sao2_oxigenador_interpretacao.txt | Texto/código/configuração | 32 | 3c7a6cbf63bd476d |
| casos-clinicos-didaticos/25_pediatrico_pam_baixa_gap_pco2.csv | Texto/código/configuração | 5 | 813d8861e86aab04 |
| casos-clinicos-didaticos/25_pediatrico_pam_baixa_gap_pco2_interpretacao.txt | Texto/código/configuração | 31 | c8f155eceed8a1ad |
| casos-clinicos-didaticos/26_neonato_cec_estavel_hb_alta.csv | Texto/código/configuração | 5 | 9424ab67b1b19cdb |
| casos-clinicos-didaticos/26_neonato_cec_estavel_hb_alta_interpretacao.txt | Texto/código/configuração | 32 | 6ed12eb9280a6188 |
| casos-clinicos-didaticos/27_neonato_hemodiluicao_profunda_baixo_ido2.csv | Texto/código/configuração | 5 | 5e5bfa0bef29f996 |
| casos-clinicos-didaticos/27_neonato_hemodiluicao_profunda_baixo_ido2_interpretacao.txt | Texto/código/configuração | 35 | 2ae3d1d9e67e9f10 |
| casos-clinicos-didaticos/28_neonato_lactato_critico_ido2_preservado.csv | Texto/código/configuração | 5 | 7aef1b25aa2e0f6a |
| casos-clinicos-didaticos/28_neonato_lactato_critico_ido2_preservado_interpretacao.txt | Texto/código/configuração | 34 | 13cd3836dc38bb2d |
| casos-clinicos-didaticos/29_neonato_hipoxemia_fluxo_baixo_recuperado.csv | Texto/código/configuração | 5 | 97fc4f376ffa84bb |
| casos-clinicos-didaticos/29_neonato_hipoxemia_fluxo_baixo_recuperado_interpretacao.txt | Texto/código/configuração | 34 | 8b074f0a4aa66fb0 |
| casos-clinicos-didaticos/30_neonato_hipocalemia_reaquecimento.csv | Texto/código/configuração | 5 | 2a5d7a0fc91f9ce6 |
| casos-clinicos-didaticos/30_neonato_hipocalemia_reaquecimento_interpretacao.txt | Texto/código/configuração | 34 | c9f4ced91bb6a64a |
| casos-clinicos-didaticos/LEIA-ME.txt | Texto/código/configuração | 71 | ee49ac2d1fd3e403 |
| casos-clinicos-didaticos/manual_interpretacao_cec_perfuselab.docx | DOCX: texto extraído | 440 | 0599b8fd7769e2b8 |
| casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json | Texto/código/configuração | 284 | 5cfd35c57eb5cb9c |
| casos-completos-cirurgicos/02_troca_valvar_aortica_estenose.json | Texto/código/configuração | 284 | 77c33ad15fab8df2 |
| casos-completos-cirurgicos/03_retroca_mitral_reoperacao.json | Texto/código/configuração | 317 | e9e8783ed71441a8 |
| casos-completos-cirurgicos/04_bentall_aorta_ascendente.json | Texto/código/configuração | 316 | dc51460564ddf2a9 |
| casos-completos-cirurgicos/05_disseccao_aguda_aorta_hipotermia.json | Texto/código/configuração | 351 | 1d4a4c779f3167fc |
| casos-completos-cirurgicos/06_crm_troca_aortica_obesidade_diabetes.json | Texto/código/configuração | 317 | dcd7d6755aafc332 |
| casos-completos-cirurgicos/07_endocardite_dupla_troca_valvar.json | Texto/código/configuração | 317 | 1b7c82873da837e1 |
| casos-completos-cirurgicos/08_crm_emergencia_iam.json | Texto/código/configuração | 284 | ca69362ee545ce5d |
| casos-completos-cirurgicos/09_correcao_tetralogia_fallot_pediatrico.json | Texto/código/configuração | 284 | 6dd653ef64196ac7 |
| casos-completos-cirurgicos/10_switch_arterial_neonatal.json | Texto/código/configuração | 316 | 049dc665eb6bf953 |
| casos-completos-cirurgicos/LEIA-ME.txt | Texto/código/configuração | 24 | 436179c71f0cf02d |
| checklist-modelo.html | Texto/código/configuração | 231 | c74ac2a748f951ba |
| dashboard.html | Texto/código/configuração | 535 | 6c797446f0f8da80 |
| docs/mongodb.md | Texto/código/configuração | 71 | 1b35d7a3983026dc |
| docs/producao.md | Texto/código/configuração | 142 | ef932cef7a4bee22 |
| entrada-paciente-valvular.json | Texto/código/configuração | 171 | 640baa4c0dd4d97a |
| index.html | Texto/código/configuração | 188 | e2424604a3bbe0f2 |
| informacoes.html | Texto/código/configuração | 179 | 9b3dda1c53117c9e |
| justificativa-score.docx | DOCX: texto extraído | 90 | 082c75842c712874 |
| netlify.toml | Texto/código/configuração | 3 | 6d325d4d9fd3159a |
| package-lock.json | Texto/código/configuração | 1106 | 2cd802f7e9edc9f0 |
| package.json | Texto/código/configuração | 26 | 759702511ccce210 |
| perfuselab-report/package.json | Texto/código/configuração | 19 | 7e8c75d44094b08b |
| perfuselab-report/README.md | Texto/código/configuração | 71 | 574a5d308612ee20 |
| perfuselab-report/server/index.js | Texto/código/configuração | 17 | 605ed5aafba94379 |
| perfuselab-report/server/routes/report.js | Texto/código/configuração | 21 | b5c3b28d08dc91ad |
| perfuselab-report/src/css/style.css | Texto/código/configuração | 64 | 0e88932263984931 |
| perfuselab-report/src/dashboard.html | Texto/código/configuração | 33 | 92d8df8730e3d910 |
| perfuselab-report/src/data/exames.json | Texto/código/configuração | 39 | 45c900412a83aa65 |
| perfuselab-report/src/js/charts.js | Texto/código/configuração | 46 | 67e4819d824f88c7 |
| perfuselab-report/src/js/dashboard.js | Texto/código/configuração | 51 | ac0191f1f89f6cc9 |
| perfuselab-report/src/js/reportGenerator.js | Texto/código/configuração | 88 | 692348dd02f96c7d |
| perfuselab-report/src/report.html | Texto/código/configuração | 33 | 96eac55f8cfd23c6 |
| promptCEC.txt | Texto/código/configuração | 10 | 89d8117798c52c51 |
| render.yaml | Texto/código/configuração | 25 | 37d9b069b2bb9445 |
| resultado-analise-framework.md | Texto/código/configuração | 61 | 4eb648e76f8d89dd |
| server/config/cors.js | Texto/código/configuração | 59 | 6689d81aa681a76a |
| server/config/database.js | Texto/código/configuração | 40 | 441f6d0fdc1914b9 |
| server/index.js | Texto/código/configuração | 71 | c036a593297a59ca |
| server/middleware/auth.js | Texto/código/configuração | 146 | 01753af7d0c081ed |
| server/middleware/errorHandler.js | Texto/código/configuração | 22 | a35e08a841f84fd1 |
| server/models/PerfusionCase.js | Texto/código/configuração | 88 | 97308053d6594502 |
| server/routes/auth.js | Texto/código/configuração | 43 | d90269c7bfd4764b |
| server/routes/cases.js | Texto/código/configuração | 142 | 90b95d9687ccf60b |
| src/css/style.css | Texto/código/configuração | 2794 | a66b2880224b7602 |
| src/js/cases.js | Texto/código/configuração | 437 | 0b27937e5361dea6 |
| src/js/checklist-template.js | Texto/código/configuração | 26 | 4b0329a055a78f13 |
| src/js/config.js | Texto/código/configuração | 190 | 89f8adb7aee55fdd |
| src/js/dashboard.js | Texto/código/configuração | 2087 | 2bbb6be4df0a8701 |
| src/js/index.js | Texto/código/configuração | 326 | ce89dd427fa4f230 |
| src/js/runtime-env.js | Texto/código/configuração | 3 | 6cf2d2145dc01b93 |
| tools/auditar-documentacao.cjs | Texto/código/configuração | 29 | cf5763f7e0e4d707 |
| tools/build-frontend.js | Texto/código/configuração | 43 | f5ac89a94df6f1a8 |
| tools/build_manual_interpretacao_cec.py | Texto/código/configuração | 562 | a57e549945830f0f |
| tools/completar-dossie.py | Texto/código/configuração | 149 | 233de33580723bec |
| tools/dev-frontend.js | Texto/código/configuração | 63 | 5000497ec7032311 |
| tools/generate-casos-completos.js | Texto/código/configuração | 967 | 324fa4c21345ec86 |
| tools/validate-dashboard.js | Texto/código/configuração | 94 | 5e680af776c0a28b |


Recursos binários: `docs/checklist-unicamp-preview.png`; `docs/layout-screenshots/dashboard-mobile.png`; `docs/layout-screenshots/dashboard-modal-mobile.png`; `docs/layout-screenshots/dashboard-notebook.png`; `medias/Captura de tela 2026-03-18 160016.png`; `medias/Captura de tela 2026-03-18 160023.png`; `medias/deatails-header-desktop.png`; `medias/deatails-header-mobile.png`; `medias/header-desktop.png`; `medias/header-mobile.png`; `medias/icon.png`; `medias/main-image-desktop.png`; `medias/main-image-mobile.png`.


## Apêndice B — Resultados reproduzidos de todos os casos


Resultados obtidos com as funções reais do programa, em ambiente JavaScript isolado, sem banco ou intervenção clínica. AUC em (mL/min/m²) × min; tempo em minutos. O primeiro arquivo é a conversão do prompt original; os outros 40 são sintéticos.


| Arquivo | N | SC m² | iDO₂ inicial → final | AUC <280 | Min <280 | Risco |
| --- | --- | --- | --- | --- | --- | --- |

| entrada-paciente-valvular.json | 4 | 1.5248 | 272.00 → 327.00 | 124.4 | 31.1 | MODERADO |
| casos-clinicos-didaticos/01_cec_estavel.csv | 4 | 2.0136 | 380.69 → 355.43 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/02_hemodiluicao_baixo_ido2.csv | 4 | 1.5107 | 339.82 → 227.90 | 2586.6 | 47.4 | ALTO |
| casos-clinicos-didaticos/03_recuperacao_com_ajuste_de_fluxo.csv | 4 | 1.8819 | 236.69 → 324.16 | 1093.3 | 34.3 | ALTO |
| casos-clinicos-didaticos/04_lactato_crescente_ido2_preservado.csv | 4 | 1.7654 | 347.15 → 317.08 | 0 | 0 | ALTO |
| casos-clinicos-didaticos/05_extracao_elevada_svo2_baixa.csv | 4 | 2.1213 | 252.64 → 274.56 | 1887.8 | 75 | ALTO |
| casos-clinicos-didaticos/06_acidose_respiratoria.csv | 4 | 1.6330 | 341.06 → 333.67 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/07_hiperoxia_com_oferta_adequada.csv | 4 | 1.9472 | 328.26 → 309.54 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/08_cec_prolongada_anemia_lactato.csv | 5 | 1.6155 | 328.04 → 244.35 | 2909.6 | 129.5 | ALTO |
| casos-clinicos-didaticos/09_hipotermia_e_reaquecimento.csv | 5 | 2.0730 | 296.25 → 275.60 | 3441 | 93 | ALTO |
| casos-clinicos-didaticos/10_reoperacao_valvar_coerente.csv | 4 | 1.5248 | 406.77 → 328.34 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/11_vasoplegia_pam_baixa_ido2_preservado.csv | 4 | 2.0505 | 354.64 → 329.27 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/12_hiperglicemia_lactato_do2_preservado.csv | 4 | 1.7638 | 347.95 → 330.99 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/13_hipocalemia_reaquecimento.csv | 4 | 1.9276 | 376.27 → 339.20 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/14_obesidade_fluxo_total_alto_indice_baixo.csv | 4 | 2.3606 | 287.08 → 267.27 | 2005.8 | 82.8 | ALTO |
| casos-clinicos-didaticos/15_ido2_informado_sem_sao2.csv | 4 | 1.6971 | 310.00 → 275.00 | 970.1 | 55.9 | ALTO |
| casos-clinicos-didaticos/16_gap_pco2_alto_svo2_preservada.csv | 4 | 2.0494 | 321.39 → 306.19 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/17_hipercalemia_pos_cardioplegia_limite_do_framework.csv | 4 | 1.6496 | 357.10 → 341.82 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/18_hiponatremia_hemodiluicao.csv | 4 | 1.6055 | 335.49 → 259.19 | 524.3 | 41.3 | MODERADO |
| casos-clinicos-didaticos/19_acidose_metabolica_lactato_critico.csv | 4 | 1.9720 | 362.70 → 314.65 | 0 | 0 | ALTO |
| casos-clinicos-didaticos/20_queda_sao2_arterial_recuperada.csv | 4 | 1.8819 | 338.38 → 313.95 | 534.3 | 44.2 | MODERADO |
| casos-clinicos-didaticos/21_pediatrico_cec_estavel.csv | 4 | 0.9428 | 416.24 → 379.44 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/22_pediatrico_hemodiluicao_baixo_ido2.csv | 4 | 0.6733 | 301.57 → 219.87 | 2994.3 | 61.6 | ALTO |
| casos-clinicos-didaticos/23_pediatrico_lactato_critico_ido2_preservado.csv | 4 | 1.1155 | 392.94 → 348.85 | 0 | 0 | ALTO |
| casos-clinicos-didaticos/24_pediatrico_queda_sao2_oxigenador.csv | 4 | 0.7993 | 346.70 → 342.24 | 193.6 | 29.9 | MODERADO |
| casos-clinicos-didaticos/25_pediatrico_pam_baixa_gap_pco2.csv | 4 | 1.2910 | 356.93 → 326.91 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/26_neonato_cec_estavel_hb_alta.csv | 4 | 0.2108 | 568.96 → 534.13 | 0 | 0 | MODERADO |
| casos-clinicos-didaticos/27_neonato_hemodiluicao_profunda_baixo_ido2.csv | 4 | 0.1932 | 419.33 → 228.54 | 1036.8 | 31.3 | ALTO |
| casos-clinicos-didaticos/28_neonato_lactato_critico_ido2_preservado.csv | 4 | 0.2280 | 577.06 → 539.51 | 0 | 0 | ALTO |
| casos-clinicos-didaticos/29_neonato_hipoxemia_fluxo_baixo_recuperado.csv | 4 | 0.2021 | 526.20 → 409.11 | 455.8 | 24.5 | ALTO |
| casos-clinicos-didaticos/30_neonato_hipocalemia_reaquecimento.csv | 4 | 0.2195 | 526.46 → 472.79 | 0 | 0 | MODERADO |
| casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json | 5 | 2.0624 | 369.68 → 305.51 | 0 | 0 | MODERADO |
| casos-completos-cirurgicos/02_troca_valvar_aortica_estenose.json | 5 | 1.6496 | 323.22 → 267.84 | 416.4 | 57.6 | MODERADO |
| casos-completos-cirurgicos/03_retroca_mitral_reoperacao.json | 6 | 1.7601 | 328.13 → 291.26 | 284.7 | 43 | ALTO |
| casos-completos-cirurgicos/04_bentall_aorta_ascendente.json | 6 | 2.1566 | 405.17 → 309.74 | 96.5 | 18.6 | ALTO |
| casos-completos-cirurgicos/05_disseccao_aguda_aorta_hipotermia.json | 7 | 1.7912 | 336.26 → 312.19 | 3171.4 | 82.5 | ALTO |
| casos-completos-cirurgicos/06_crm_troca_aortica_obesidade_diabetes.json | 6 | 2.2161 | 401.34 → 329.75 | 0 | 0 | ALTO |
| casos-completos-cirurgicos/07_endocardite_dupla_troca_valvar.json | 6 | 1.5916 | 280.52 → 274.45 | 1947 | 97.8 | ALTO |
| casos-completos-cirurgicos/08_crm_emergencia_iam.json | 5 | 1.9055 | 349.15 → 305.86 | 0 | 0 | MODERADO |
| casos-completos-cirurgicos/09_correcao_tetralogia_fallot_pediatrico.json | 5 | 0.6733 | 525.06 → 437.60 | 0 | 0 | MODERADO |
| casos-completos-cirurgicos/10_switch_arterial_neonatal.json | 6 | 0.2195 | 607.14 → 529.18 | 0 | 0 | ALTO |

### entrada-paciente-valvular


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12 | 36 | 2.4 | 272 | 56 | 20.6 | 4.86 | 1.44 | informado/discordante |
| 35 | 7.4 | 22.2 | 2.5 | 281 | 33 | 11.7 | 8.52 | 1.55 | informado/incompativel |
| 60 | 7.45 | 22.35 | 2.5 | 292 | 52 | 17.8 | 5.62 | 2.11 | informado/incompativel |
| 90 | 8.7 | 26.1 | 2.7 | 327 | 58 | 17.7 | 5.64 | 2.55 | informado/nao_verificavel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Hemoglobina abaixo de 7,5 g/dL
- Potássio reduzido
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 8, 7, 6, 9.


### 01_cec_estavel


Objetivo registrado: Reconhecer uma série perfusional globalmente estável e aprender a não interpretar o rótulo final do framework sem verificar os dados que o produziram.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 11 | 33 | 2.48 | 380.69 | 70 | 18.4 | 5.44 | 1.1 | calculado/calculado |
| 30 | 10.2 | 30.6 | 2.53 | 359.6 | 68 | 18.9 | 5.29 | 1.2 | calculado/calculado |
| 60 | 9.8 | 29.4 | 2.48 | 334.71 | 65 | 19.4 | 5.15 | 1.3 | calculado/calculado |
| 90 | 10.1 | 30.3 | 2.53 | 355.43 | 67 | 18.9 | 5.3 | 1.4 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 02_hemodiluicao_baixo_ido2


Objetivo registrado: Observar como a combinação entre queda da hemoglobina e índice de fluxo reduzido compromete a oferta de oxigênio.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.5 | 31.5 | 2.32 | 339.82 | 60 | 17.7 | 5.66 | 1.2 | calculado/calculado |
| 20 | 8 | 24 | 2.18 | 244.95 | 58 | 23.7 | 4.22 | 1.7 | calculado/calculado |
| 40 | 6.8 | 20.4 | 2.12 | 200.72 | 55 | 27.4 | 3.65 | 2.5 | calculado/calculado |
| 60 | 7.2 | 21.6 | 2.25 | 227.9 | 54 | 23.7 | 4.22 | 3.1 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- Hemoglobina abaixo de 7,5 g/dL
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 9, 3, 0, 1.


### 03_recuperacao_com_ajuste_de_fluxo


Objetivo registrado: Visualizar como a elevação do fluxo pode aumentar o iDO2 mesmo sem grande mudança na hemoglobina.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 8 | 24 | 2.13 | 236.69 | 65 | 27.5 | 3.64 | 1.5 | calculado/calculado |
| 20 | 7.8 | 23.4 | 2.23 | 241.53 | 64 | 26.5 | 3.77 | 1.8 | calculado/calculado |
| 40 | 8.1 | 24.3 | 2.6 | 295.25 | 63 | 21.3 | 4.69 | 2.1 | calculado/calculado |
| 60 | 8.4 | 25.2 | 2.76 | 324.16 | 62 | 19.1 | 5.23 | 1.9 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 3, 4, 6, 10.


### 04_lactato_crescente_ido2_preservado


Objetivo registrado: Evitar a conclusão de que todo aumento de lactato durante a CEC é causado por oferta global insuficiente de oxigênio.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.5 | 28.5 | 2.61 | 347.15 | 55 | 15.8 | 6.31 | 1.2 | calculado/calculado |
| 30 | 9.2 | 27.6 | 2.66 | 341.86 | 56 | 16.4 | 6.1 | 2 | calculado/calculado |
| 60 | 9 | 27 | 2.66 | 333.9 | 57 | 17.1 | 5.86 | 3 | calculado/calculado |
| 90 | 8.8 | 26.4 | 2.61 | 317.08 | 58 | 18.3 | 5.47 | 4.5 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Glicose elevada
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 9, 7.


### 05_extracao_elevada_svo2_baixa


Objetivo registrado: Reconhecer um padrão coerente de oferta limitada com aumento da extração de oxigênio.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9 | 27 | 2.03 | 252.64 | 95 | 37.6 | 2.66 | 1.4 | calculado/calculado |
| 25 | 8.8 | 26.4 | 2.07 | 251.79 | 98 | 38.9 | 2.57 | 1.8 | calculado/calculado |
| 50 | 8.6 | 25.8 | 2.12 | 249.1 | 100 | 40.1 | 2.49 | 2.4 | calculado/calculado |
| 75 | 8.8 | 26.4 | 2.26 | 274.56 | 96 | 35 | 2.86 | 2.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ inadequada
- iDO₂ abaixo do alvo GDP
- Extração de O₂ elevada
- Relação DO₂/VO₂ crítica
- PAM reduzida
- SvO₂ limítrofe
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 4, 4, 3, 6.


### 06_acidose_respiratoria


Objetivo registrado: Separar distúrbio de ventilação do oxigenador de insuficiência de oferta global de oxigênio.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.5 | 28.5 | 2.57 | 341.06 | 62 | 18.2 | 5.5 | 1.3 | calculado/calculado |
| 20 | 9.2 | 27.6 | 2.57 | 329.91 | 61 | 18.5 | 5.41 | 1.4 | calculado/calculado |
| 40 | 9 | 27 | 2.63 | 326.91 | 60 | 18.4 | 5.45 | 1.6 | calculado/calculado |
| 60 | 9.1 | 27.3 | 2.63 | 333.67 | 60 | 18 | 5.56 | 1.7 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 07_hiperoxia_com_oferta_adequada


Objetivo registrado: Entender que PaO2 muito elevada tem contribuição pequena para o conteúdo arterial quando comparada ao oxigênio ligado à hemoglobina.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9 | 27 | 2.47 | 328.26 | 62 | 18.9 | 5.29 | 1.2 | calculado/calculado |
| 20 | 8.9 | 26.7 | 2.47 | 319.72 | 61 | 19.1 | 5.24 | 1.3 | calculado/calculado |
| 40 | 8.8 | 26.4 | 2.52 | 315.96 | 61 | 19.3 | 5.18 | 1.4 | calculado/calculado |
| 60 | 8.8 | 26.4 | 2.52 | 309.54 | 62 | 20 | 4.99 | 1.5 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 9, 9.


### 08_cec_prolongada_anemia_lactato


Objetivo registrado: Integrar duração da CEC, exposição acumulada a baixo iDO2, anemia, metabolismo e eletrólitos.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.35 | 328.04 | 58 | 17.7 | 5.66 | 1.3 | calculado/calculado |
| 45 | 8.6 | 25.8 | 2.35 | 282.68 | 60 | 21.2 | 4.71 | 1.8 | calculado/calculado |
| 90 | 7.8 | 23.4 | 2.41 | 260.66 | 61 | 23.4 | 4.27 | 2.4 | calculado/calculado |
| 135 | 7.3 | 21.9 | 2.48 | 251.33 | 62 | 24.7 | 4.05 | 3.1 | calculado/calculado |
| 180 | 7.1 | 21.3 | 2.48 | 244.35 | 63 | 25.8 | 3.88 | 3.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- iDO₂ abaixo do alvo GDP
- Glicose elevada
- Hemoglobina abaixo de 7,5 g/dL
- Potássio reduzido
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 9, 7, 6, 2, 2.


### 09_hipotermia_e_reaquecimento


Objetivo registrado: Comparar um alvo fixo de iDO2 com a tabela térmica local configurada no framework.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.12 | 296.25 | 62 | 20.9 | 4.78 | 1 | calculado/calculado |
| 25 | 9.3 | 27.9 | 1.83 | 237.93 | 54 | 22.7 | 4.41 | 1.2 | calculado/calculado |
| 50 | 9 | 27 | 1.74 | 216.55 | 48 | 22.2 | 4.51 | 1.4 | calculado/calculado |
| 75 | 8.7 | 26.1 | 2.03 | 244.22 | 55 | 22.5 | 4.44 | 1.6 | calculado/calculado |
| 100 | 8.5 | 25.5 | 2.32 | 275.6 | 60 | 21.8 | 4.59 | 1.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- iDO₂ limítrofe para GDP
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 6, 4, 4, 4, 7.


### 10_reoperacao_valvar_coerente


Objetivo registrado: Apresentar uma versão matematicamente coerente do caso valvar utilizado anteriormente, agora com SaO2 medida e séries temporais alinhadas.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12 | 36 | 2.4 | 406.77 | 56 | 13.8 | 7.26 | 1.44 | calculado/calculado |
| 30 | 8.2 | 24.6 | 2.5 | 294.01 | 50 | 17 | 5.88 | 1.55 | calculado/calculado |
| 60 | 7.8 | 23.4 | 2.6 | 281.91 | 52 | 18.4 | 5.42 | 2.11 | calculado/calculado |
| 90 | 8.7 | 26.1 | 2.7 | 328.34 | 58 | 17.7 | 5.66 | 2.55 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Potássio reduzido
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 7, 6, 9.


### 11_vasoplegia_pam_baixa_ido2_preservado


Objetivo registrado: Treinar a leitura de um caso em que a oferta global de oxigenio esta adequada, mas a pressao arterial media fica baixa durante toda a CEC.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.5 | 31.5 | 2.44 | 354.64 | 68 | 19.2 | 5.22 | 1.3 | calculado/calculado |
| 30 | 10 | 30 | 2.49 | 344.19 | 70 | 20.3 | 4.92 | 1.4 | calculado/calculado |
| 60 | 9.6 | 28.8 | 2.54 | 333.1 | 72 | 21.6 | 4.63 | 1.5 | calculado/calculado |
| 90 | 9.4 | 28.2 | 2.54 | 329.27 | 70 | 21.3 | 4.7 | 1.6 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 12_hiperglicemia_lactato_do2_preservado


Objetivo registrado: Mostrar que lactato e glicose podem piorar mesmo quando a oferta de oxigenio global esta adequada.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.49 | 347.95 | 66 | 19 | 5.27 | 1.6 | calculado/calculado |
| 30 | 9.7 | 29.1 | 2.55 | 344.89 | 68 | 19.7 | 5.07 | 2 | calculado/calculado |
| 60 | 9.4 | 28.2 | 2.61 | 338.34 | 70 | 20.7 | 4.83 | 2.4 | calculado/calculado |
| 90 | 9.2 | 27.6 | 2.61 | 330.99 | 69 | 20.8 | 4.8 | 2.7 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 9, 9.


### 13_hipocalemia_reaquecimento


Objetivo registrado: Treinar a leitura de tendencia eletrolitica, especialmente queda do potassio durante reaquecimento, com oxigenacao global preservada.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.8 | 32.4 | 2.49 | 376.27 | 62 | 16.5 | 6.07 | 1.2 | calculado/calculado |
| 30 | 10.2 | 30.6 | 2.49 | 355.03 | 64 | 18 | 5.55 | 1.3 | calculado/calculado |
| 60 | 9.8 | 29.4 | 2.54 | 343.57 | 67 | 19.5 | 5.13 | 1.5 | calculado/calculado |
| 90 | 9.5 | 28.5 | 2.59 | 339.2 | 69 | 20.3 | 4.92 | 1.7 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Potássio reduzido
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 14_obesidade_fluxo_total_alto_indice_baixo


Objetivo registrado: Ensinar que fluxo total em L/min pode parecer alto, mas ficar insuficiente quando indexado pela superficie corporal.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.8 | 29.4 | 2.12 | 287.08 | 80 | 27.9 | 3.59 | 1.4 | calculado/calculado |
| 30 | 9.2 | 27.6 | 2.03 | 257.74 | 82 | 31.8 | 3.14 | 1.7 | calculado/calculado |
| 60 | 8.8 | 26.4 | 1.99 | 239.08 | 84 | 35.1 | 2.85 | 2 | calculado/calculado |
| 90 | 8.8 | 26.4 | 2.2 | 267.27 | 82 | 30.7 | 3.26 | 2.2 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- iDO₂ abaixo do alvo GDP
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 6, 4, 3, 6.


### 15_ido2_informado_sem_sao2


Objetivo registrado: Mostrar como o PerfuseLab se comporta quando o arquivo informa iDO2, mas nao permite recalculo independente por falta de SaO2 arterial.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.42 | 310 | 65 | 21 | 4.77 | 1.2 | informado/nao_verificavel |
| 30 | 9.2 | 27.6 | 2.36 | 285 | 68 | 23.9 | 4.19 | 1.5 | informado/nao_verificavel |
| 60 | 8.5 | 25.5 | 2.24 | 248 | 78 | 31.5 | 3.18 | 2.1 | informado/nao_verificavel |
| 90 | 8.8 | 26.4 | 2.47 | 275 | 76 | 27.6 | 3.62 | 2.4 | informado/discordante |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- iDO₂ limítrofe para GDP
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 9, 7, 4, 7.


### 16_gap_pco2_alto_svo2_preservada


Objetivo registrado: Treinar a leitura de marcadores metabolicos discordantes: iDO2 e SvO2 bons, mas gap PCO2 e lactato chamando atencao.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.5 | 28.5 | 2.44 | 321.39 | 68 | 21.2 | 4.73 | 1.4 | calculado/calculado |
| 30 | 9.2 | 27.6 | 2.44 | 310.17 | 70 | 22.6 | 4.43 | 1.6 | calculado/calculado |
| 60 | 9 | 27 | 2.49 | 306.09 | 72 | 23.5 | 4.25 | 1.9 | calculado/calculado |
| 90 | 8.9 | 26.7 | 2.49 | 306.19 | 72 | 23.5 | 4.25 | 2.1 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Gap PCO₂ aumentado
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 9, 8.


### 17_hipercalemia_pos_cardioplegia_limite_do_framework


Objetivo registrado: Aprender a identificar um achado clinicamente importante que o conjunto atual de alertas ainda nao classifica como alto ou moderado.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.55 | 357.1 | 64 | 17.9 | 5.58 | 1.1 | calculado/calculado |
| 30 | 9.8 | 29.4 | 2.55 | 349.09 | 66 | 18.9 | 5.29 | 1.3 | calculado/calculado |
| 60 | 9.6 | 28.8 | 2.61 | 345.69 | 68 | 19.7 | 5.08 | 1.5 | calculado/calculado |
| 90 | 9.5 | 28.5 | 2.61 | 341.82 | 66 | 19.3 | 5.18 | 1.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 18_hiponatremia_hemodiluicao


Objetivo registrado: Treinar a interpretacao de queda de hemoglobina, queda de sodio e iDO2 limitrofe sem transformar um valor isolado em decisao terapeutica.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.5 | 28.5 | 2.55 | 335.49 | 66 | 19.7 | 5.08 | 1.5 | calculado/calculado |
| 30 | 8.4 | 25.2 | 2.55 | 296.96 | 70 | 23.6 | 4.24 | 1.7 | calculado/calculado |
| 60 | 7.7 | 23.1 | 2.55 | 269.73 | 72 | 26.7 | 3.75 | 2 | calculado/calculado |
| 90 | 7.3 | 21.9 | 2.55 | 259.19 | 72 | 27.8 | 3.6 | 2.2 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Hemoglobina abaixo de 7,5 g/dL
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 8, 6, 3.


### 19_acidose_metabolica_lactato_critico


Objetivo registrado: Mostrar um caso em que o iDO2 global esta preservado, mas a evolucao metabolica se torna grave.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.59 | 362.7 | 68 | 18.7 | 5.33 | 1.8 | calculado/calculado |
| 30 | 9.5 | 28.5 | 2.59 | 340.37 | 72 | 21.2 | 4.73 | 2.6 | calculado/calculado |
| 60 | 9 | 27 | 2.59 | 321.94 | 76 | 23.6 | 4.24 | 3.8 | calculado/calculado |
| 90 | 8.8 | 26.4 | 2.59 | 314.65 | 78 | 24.8 | 4.03 | 4.6 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Gap PCO₂ aumentado
- Glicose elevada
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 8, 7.


### 20_queda_sao2_arterial_recuperada


Objetivo registrado: Treinar a percepcao de que saturacao arterial baixa reduz o conteudo arterial de oxigenio e pode derrubar o iDO2, mesmo com fluxo razoavel.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.44 | 338.38 | 66 | 19.5 | 5.13 | 1.2 | calculado/calculado |
| 30 | 9 | 27 | 2.39 | 274.15 | 72 | 26.3 | 3.81 | 1.4 | calculado/calculado |
| 60 | 8.8 | 26.4 | 2.39 | 258.87 | 72 | 27.8 | 3.6 | 1.7 | calculado/calculado |
| 90 | 8.9 | 26.7 | 2.55 | 313.95 | 70 | 22.3 | 4.48 | 1.9 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- SvO₂ limítrofe
- Gap PCO₂ aumentado
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 7, 5, 9.


### 21_pediatrico_cec_estavel


Objetivo registrado: Comecar a serie pediatrica por um caso estavel, com boa oferta de oxigenio, baixa extracao e lactato discreto.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.8 | 32.4 | 2.76 | 416.24 | 70 | 16.8 | 5.95 | 1 | calculado/calculado |
| 25 | 10.4 | 31.2 | 2.76 | 400.13 | 72 | 18 | 5.56 | 1.1 | calculado/calculado |
| 50 | 10.1 | 30.3 | 2.76 | 383.95 | 74 | 19.3 | 5.19 | 1.2 | calculado/calculado |
| 80 | 10 | 30 | 2.76 | 379.44 | 72 | 19 | 5.27 | 1.3 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 22_pediatrico_hemodiluicao_baixo_ido2


Objetivo registrado: Mostrar a queda do iDO2 por hemodiluicao importante em uma crianca pequena.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.5 | 28.5 | 2.3 | 301.57 | 76 | 25.2 | 3.97 | 1.2 | calculado/calculado |
| 20 | 8.2 | 24.6 | 2.23 | 249.93 | 82 | 32.8 | 3.05 | 1.7 | calculado/calculado |
| 45 | 7.3 | 21.9 | 2.15 | 212.33 | 90 | 42.4 | 2.36 | 2.3 | calculado/calculado |
| 70 | 6.8 | 20.4 | 2.38 | 219.87 | 95 | 43.2 | 2.31 | 2.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- Extração de O₂ elevada
- Relação DO₂/VO₂ crítica
- SvO₂ inadequada
- Hemoglobina abaixo de 7,5 g/dL
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 8, 4, 0, 2.


### 23_pediatrico_lactato_critico_ido2_preservado


Objetivo registrado: Treinar a leitura de lactato e acidose metabolica quando a oferta global de oxigenio permanece adequada.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.2 | 30.6 | 2.78 | 392.94 | 72 | 18.3 | 5.46 | 1.4 | calculado/calculado |
| 25 | 9.8 | 29.4 | 2.78 | 376.45 | 76 | 20.2 | 4.95 | 2.1 | calculado/calculado |
| 50 | 9.4 | 28.2 | 2.78 | 360.38 | 80 | 22.2 | 4.5 | 3.3 | calculado/calculado |
| 80 | 9.1 | 27.3 | 2.78 | 348.85 | 82 | 23.5 | 4.25 | 4.2 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Gap PCO₂ aumentado
- Glicose elevada
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 9, 8, 8.


### 24_pediatrico_queda_sao2_oxigenador


Objetivo registrado: Mostrar como uma queda de saturacao arterial pode levar o iDO2 para faixa limitrofe, mesmo com fluxo razoavel.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.5 | 346.7 | 68 | 19.6 | 5.1 | 1.1 | calculado/calculado |
| 20 | 9.3 | 27.9 | 2.5 | 282.76 | 72 | 25.5 | 3.93 | 1.4 | calculado/calculado |
| 50 | 8.8 | 26.4 | 2.38 | 267.05 | 74 | 27.7 | 3.61 | 1.8 | calculado/calculado |
| 80 | 9 | 27 | 2.75 | 342.24 | 70 | 20.5 | 4.89 | 1.9 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- SvO₂ limítrofe
- iDO₂ limítrofe para GDP
- Gap PCO₂ aumentado
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 8, 7, 10.


### 25_pediatrico_pam_baixa_gap_pco2


Objetivo registrado: Treinar a leitura de pressao e marcador de fluxo/perfusao regional com iDO2 preservado.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.8 | 29.4 | 2.63 | 356.93 | 68 | 19.1 | 5.25 | 1.3 | calculado/calculado |
| 25 | 9.5 | 28.5 | 2.63 | 344.84 | 70 | 20.3 | 4.93 | 1.6 | calculado/calculado |
| 50 | 9.2 | 27.6 | 2.63 | 330.24 | 72 | 21.8 | 4.59 | 1.9 | calculado/calculado |
| 80 | 9 | 27 | 2.63 | 326.91 | 72 | 22 | 4.54 | 2.2 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Gap PCO₂ aumentado
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 9.


### 26_neonato_cec_estavel_hb_alta


Objetivo registrado: Iniciar a serie neonatal com um caso de alta oferta de oxigenio por Hb elevada e fluxo indexado alto.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 13.5 | 40.5 | 3.08 | 568.96 | 95 | 16.7 | 5.99 | 1.5 | calculado/calculado |
| 20 | 13 | 39 | 3.08 | 547.05 | 98 | 17.9 | 5.58 | 1.6 | calculado/calculado |
| 40 | 12.7 | 38.1 | 3.13 | 542.95 | 100 | 18.4 | 5.43 | 1.7 | calculado/calculado |
| 60 | 12.5 | 37.5 | 3.13 | 534.13 | 98 | 18.3 | 5.45 | 1.8 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 10.


### 27_neonato_hemodiluicao_profunda_baixo_ido2


Objetivo registrado: Mostrar um neonato pequeno em que a queda de Hb e Hct domina a oferta de oxigenio.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12 | 36 | 2.59 | 419.33 | 92 | 21.9 | 4.56 | 1.8 | calculado/calculado |
| 20 | 9.2 | 27.6 | 2.48 | 305.7 | 95 | 31.1 | 3.22 | 2.3 | calculado/calculado |
| 40 | 7.8 | 23.4 | 2.38 | 246.63 | 98 | 39.7 | 2.52 | 3 | calculado/calculado |
| 60 | 7.2 | 21.6 | 2.38 | 228.54 | 100 | 43.8 | 2.29 | 3.6 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- SvO₂ limítrofe
- PAM reduzida
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ inadequada
- iDO₂ abaixo do alvo GDP
- Extração de O₂ elevada
- Relação DO₂/VO₂ crítica
- Glicose elevada
- Hemoglobina abaixo de 7,5 g/dL
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 8, 3, 1.


### 28_neonato_lactato_critico_ido2_preservado


Objetivo registrado: Treinar um caso neonatal em que a oferta global esta muito alta, mas o metabolismo piora.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12.8 | 38.4 | 3.29 | 577.06 | 98 | 17 | 5.89 | 2 | calculado/calculado |
| 20 | 12.5 | 37.5 | 3.29 | 562.92 | 102 | 18.1 | 5.52 | 3 | calculado/calculado |
| 40 | 12.2 | 36.6 | 3.29 | 548.78 | 106 | 19.3 | 5.18 | 4.2 | calculado/calculado |
| 60 | 12 | 36 | 3.29 | 539.51 | 108 | 20 | 5 | 5 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Gap PCO₂ aumentado
- Glicose elevada
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 9, 9, 8, 8.


### 29_neonato_hipoxemia_fluxo_baixo_recuperado


Objetivo registrado: Mostrar um periodo curto de baixa oferta causado por combinacao de SaO2 baixa, Hb menor e fluxo indexado reduzido.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12.5 | 37.5 | 3.07 | 526.2 | 92 | 17.5 | 5.72 | 1.6 | calculado/calculado |
| 20 | 10 | 30 | 2.38 | 268.63 | 94 | 35 | 2.86 | 2 | calculado/calculado |
| 40 | 9.5 | 28.5 | 2.23 | 251.46 | 96 | 38.2 | 2.62 | 2.4 | calculado/calculado |
| 60 | 10 | 30 | 3.07 | 409.11 | 92 | 22.5 | 4.45 | 2.5 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- iDO₂ limítrofe para GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- iDO₂ abaixo do alvo GDP
- SvO₂ inadequada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 6, 4, 9.


### 30_neonato_hipocalemia_reaquecimento


Objetivo registrado: Treinar a leitura de eletrolitos e glicose em um neonato com oferta global preservada durante reaquecimento.


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12 | 36 | 3.19 | 526.46 | 90 | 17.1 | 5.85 | 1.4 | calculado/calculado |
| 20 | 11.5 | 34.5 | 3.19 | 503.77 | 94 | 18.7 | 5.36 | 1.6 | calculado/calculado |
| 40 | 11 | 33 | 3.28 | 495.14 | 98 | 19.8 | 5.05 | 1.9 | calculado/calculado |
| 60 | 10.5 | 31.5 | 3.28 | 472.79 | 100 | 21.2 | 4.73 | 2.1 | calculado/calculado |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Potássio reduzido
- Gap PCO₂ aumentado
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 9.


### 01_revascularizacao_miocardio_eletiva


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.8 | 32.4 | 2.42 | 369.68 | 72 | 19.5 | 5.13 | 1.2 | calculado/compativel |
| 20 | 9.6 | 28.8 | 2.47 | 333.93 | 68 | 20.4 | 4.91 | 1.3 | calculado/compativel |
| 45 | 9.1 | 27.3 | 2.42 | 306.14 | 75 | 24.5 | 4.08 | 1.4 | calculado/compativel |
| 70 | 9 | 27 | 2.52 | 317.31 | 70 | 22.1 | 4.53 | 1.5 | calculado/compativel |
| 82 | 9.4 | 28.2 | 2.33 | 305.51 | 73 | 23.9 | 4.19 | 1.6 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 9, 9, 8.


### 02_troca_valvar_aortica_estenose


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.2 | 30.6 | 2.24 | 323.22 | 62 | 19.2 | 5.21 | 1 | calculado/compativel |
| 25 | 8.6 | 25.8 | 2.3 | 276.6 | 66 | 23.9 | 4.19 | 1.2 | calculado/compativel |
| 50 | 8.1 | 24.3 | 2.36 | 266.39 | 70 | 26.3 | 3.81 | 1.5 | calculado/compativel |
| 75 | 8.4 | 25.2 | 2.42 | 284.73 | 66 | 23.2 | 4.31 | 1.8 | calculado/compativel |
| 92 | 8.8 | 26.4 | 2.18 | 267.84 | 68 | 25.4 | 3.94 | 2 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 9, 7, 6, 8, 5.


### 03_retroca_mitral_reoperacao


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 9.6 | 28.8 | 2.39 | 328.13 | 72 | 21.9 | 4.56 | 1.5 | calculado/compativel |
| 30 | 8 | 24 | 2.44 | 275.68 | 78 | 28.3 | 3.53 | 1.8 | calculado/compativel |
| 60 | 7.5 | 22.5 | 2.56 | 269.41 | 84 | 31.2 | 3.21 | 2.2 | calculado/compativel |
| 95 | 8.1 | 24.3 | 2.67 | 304.64 | 80 | 26.3 | 3.81 | 2.8 | calculado/compativel |
| 125 | 8.7 | 26.1 | 2.61 | 317.79 | 78 | 24.5 | 4.07 | 3.2 | calculado/compativel |
| 145 | 9.2 | 27.6 | 2.27 | 291.26 | 80 | 27.5 | 3.64 | 3.5 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- Extração de O₂ limítrofe
- Relação DO₂/VO₂ limítrofe
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 9, 7, 6, 7, 7, 5.


### 04_bentall_aorta_ascendente


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 11.4 | 34.2 | 2.5 | 405.17 | 76 | 18.8 | 5.33 | 1.1 | calculado/compativel |
| 35 | 9.2 | 27.6 | 2.41 | 312.72 | 74 | 23.7 | 4.23 | 1.4 | calculado/compativel |
| 70 | 8.6 | 25.8 | 2.23 | 269.65 | 78 | 28.9 | 3.46 | 1.8 | calculado/compativel |
| 105 | 8.8 | 26.4 | 2.46 | 305.05 | 76 | 24.9 | 4.01 | 2.2 | calculado/compativel |
| 140 | 9.4 | 28.2 | 2.55 | 335.13 | 74 | 22.1 | 4.53 | 2.6 | calculado/compativel |
| 168 | 9.8 | 29.4 | 2.27 | 309.74 | 78 | 25.2 | 3.97 | 2.9 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ limítrofe para GDP
- Gap PCO₂ aumentado
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 10, 9, 7, 8, 9, 7.


### 05_disseccao_aguda_aorta_hipotermia


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10 | 30 | 2.34 | 336.26 | 78 | 23.2 | 4.31 | 2.1 | calculado/compativel |
| 40 | 8.4 | 25.2 | 2.29 | 274.24 | 86 | 31.4 | 3.19 | 2.8 | calculado/compativel |
| 80 | 8 | 24 | 1.79 | 202.67 | 88 | 43.4 | 2.3 | 3.6 | calculado/compativel |
| 120 | 8.3 | 24.9 | 2.4 | 282.46 | 90 | 31.9 | 3.14 | 4.2 | calculado/compativel |
| 165 | 8.8 | 26.4 | 2.57 | 317.45 | 86 | 27.1 | 3.69 | 4.9 | calculado/compativel |
| 200 | 9.4 | 28.2 | 2.62 | 343.7 | 84 | 24.4 | 4.09 | 5.3 | calculado/compativel |
| 220 | 9.8 | 29.4 | 2.29 | 312.19 | 86 | 27.5 | 3.63 | 5.4 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Gap PCO₂ aumentado
- PAM reduzida
- iDO₂ limítrofe para GDP
- Extração de O₂ limítrofe
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- Glicose elevada
- iDO₂ abaixo do alvo GDP
- Extração de O₂ elevada
- Relação DO₂/VO₂ crítica
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 8, 6, 1, 5, 7, 8, 6.


### 06_crm_troca_aortica_obesidade_diabetes


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.6 | 31.8 | 2.66 | 401.34 | 82 | 20.4 | 4.89 | 1.6 | calculado/compativel |
| 30 | 8.8 | 26.4 | 2.71 | 335.41 | 88 | 26.2 | 3.81 | 2 | calculado/compativel |
| 60 | 8 | 24 | 2.8 | 314 | 92 | 29.3 | 3.41 | 2.4 | calculado/compativel |
| 90 | 8.4 | 25.2 | 2.84 | 335.17 | 86 | 25.7 | 3.9 | 2.8 | calculado/compativel |
| 115 | 8.9 | 26.7 | 2.75 | 342.07 | 84 | 24.6 | 4.07 | 3 | calculado/compativel |
| 128 | 9.2 | 27.6 | 2.57 | 329.75 | 86 | 26.1 | 3.83 | 3.1 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Glicose elevada
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 10, 9, 7, 9, 9, 8.


### 07_endocardite_dupla_troca_valvar


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 8.9 | 26.7 | 2.2 | 280.52 | 68 | 24.2 | 4.13 | 1.9 | calculado/compativel |
| 30 | 7.4 | 22.2 | 2.26 | 237.41 | 78 | 32.9 | 3.04 | 2.3 | calculado/compativel |
| 65 | 7.8 | 23.4 | 2.39 | 261.94 | 82 | 31.3 | 3.19 | 2.9 | calculado/compativel |
| 100 | 8.3 | 24.9 | 2.45 | 286.29 | 78 | 27.2 | 3.67 | 3.4 | calculado/compativel |
| 130 | 8.8 | 26.4 | 2.39 | 294.36 | 76 | 25.8 | 3.87 | 3.8 | calculado/compativel |
| 156 | 9.2 | 27.6 | 2.14 | 274.45 | 78 | 28.4 | 3.52 | 4 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- iDO₂ abaixo do alvo GDP
- Extração de O₂ limítrofe
- Gap PCO₂ aumentado
- Relação DO₂/VO₂ limítrofe
- SvO₂ limítrofe
- PAM reduzida
- Hemoglobina abaixo de 7,5 g/dL
- iDO₂ limítrofe para GDP
- SvO₂ inadequada
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 7, 3, 5, 5, 5, 4.


### 08_crm_emergencia_iam


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 10.4 | 31.2 | 2.36 | 349.15 | 80 | 22.9 | 4.36 | 2.4 | calculado/compativel |
| 20 | 9 | 27 | 2.52 | 318.16 | 86 | 27 | 3.7 | 2.8 | calculado/compativel |
| 40 | 8.6 | 25.8 | 2.57 | 308.61 | 84 | 27.2 | 3.67 | 3.1 | calculado/compativel |
| 60 | 8.9 | 26.7 | 2.57 | 320.3 | 80 | 25 | 4 | 3.3 | calculado/compativel |
| 80 | 9.5 | 28.5 | 2.31 | 305.86 | 78 | 25.5 | 3.92 | 3.2 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- Gap PCO₂ aumentado
- SvO₂ limítrofe
- PAM reduzida
- Glicose elevada
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 8, 8, 7, 8, 6.


### 09_correcao_tetralogia_fallot_pediatrico


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 12.6 | 37.8 | 2.97 | 525.06 | 84 | 16 | 6.25 | 1.3 | calculado/compativel |
| 25 | 10.8 | 32.4 | 3.04 | 454.73 | 88 | 19.4 | 5.17 | 1.5 | calculado/compativel |
| 50 | 10.2 | 30.6 | 3.12 | 439.5 | 92 | 20.9 | 4.78 | 1.8 | calculado/compativel |
| 78 | 10.6 | 31.8 | 3.12 | 459.7 | 88 | 19.1 | 5.22 | 2 | calculado/compativel |
| 102 | 11.2 | 33.6 | 2.82 | 437.6 | 86 | 19.7 | 5.09 | 2.1 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Gap PCO₂ aumentado
- Lactato final em faixa de atenção
- Lactato em elevação
- Tempo de CEC moderado


Índice histórico por amostra: 10, 10, 10, 9, 9.


### 10_switch_arterial_neonatal


| Tempo | Hb | Hct | IC | iDO₂ | iVO₂ | O₂ER | DO₂/VO₂ | Lactato | Origem/consistência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 0 | 13.2 | 39.6 | 3.28 | 607.14 | 96 | 15.8 | 6.32 | 2 | calculado/compativel |
| 30 | 11.5 | 34.5 | 3.37 | 537.15 | 108 | 20.1 | 4.97 | 2.5 | calculado/compativel |
| 60 | 10.8 | 32.4 | 3.46 | 516.52 | 116 | 22.5 | 4.45 | 3.1 | calculado/compativel |
| 95 | 11 | 33 | 3.55 | 543.02 | 112 | 20.6 | 4.85 | 3.6 | calculado/compativel |
| 125 | 11.6 | 34.8 | 3.55 | 570.42 | 106 | 18.6 | 5.38 | 4 | calculado/compativel |
| 148 | 12 | 36 | 3.19 | 529.18 | 108 | 20.4 | 4.9 | 4.2 | calculado/compativel |


Principais determinantes do risco (títulos distintos, preservada a ordem):


- PAM reduzida
- Gap PCO₂ aumentado
- SvO₂ limítrofe
- SvO₂ inadequada
- Lactato final crítico
- Lactato em elevação
- Tempo de CEC elevado


Índice histórico por amostra: 9, 9, 8, 8, 8, 8.


## Apêndice C — Catálogo literal de campos JSON e CSV


Este catálogo cobre os caminhos encontrados nos dados clínicos locais, inclusive campos apenas armazenados. `[]` representa qualquer elemento da lista. Tipos são os efetivamente encontrados nos arquivos; não são validação clínica ou esquema obrigatório. Não inclui a árvore de dependências do package-lock.


| Caminho literal | Tipos | Fonte de exemplo |
| --- | --- | --- |

| [].data[].dataExame | str | perfuselab-report/src/data/exames.json |
| [].data[].fluxo | float | perfuselab-report/src/data/exames.json |
| [].data[].hematocrito | int | perfuselab-report/src/data/exames.json |
| [].data[].hemoglobina | float | perfuselab-report/src/data/exames.json |
| [].data[].ic | float | perfuselab-report/src/data/exames.json |
| [].data[].ido2 | int | perfuselab-report/src/data/exames.json |
| [].data[].lactato | float | perfuselab-report/src/data/exames.json |
| [].data[].sao2 | int | perfuselab-report/src/data/exames.json |
| [].data[].tempoCec | int | perfuselab-report/src/data/exames.json |
| anticoagulacao.heparina_mg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| anticoagulacao.protamina_mg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| anticoagulacao.tca_basal_s | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| anticoagulacao.tca_cec_s | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| anticoagulacao.tca_pos_heparina_s | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| anticoagulacao.tca_pos_neutralizacao_s | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.balanco_estimado_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.debito_urinario_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.entrada_cristaloide_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.hemocomponentes.concentrado_hemacias_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.hemocomponentes.plaquetas_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.hemocomponentes.plasma_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| balanco_hidrico.ultrafiltracao_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.alvo_ic_l_min_m2 | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.canula_arterial_fr | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.canulas_venosas_fr[] | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.cardioplegia | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.cardioplegia_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.configuracao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.drenagem_venosa | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.filtro_arterial | bool | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.hemoconcentrador | bool | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.oxigenador | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.prime_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.rap_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| cec.ultrafiltracao_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| debito_urinario.tempo_min | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| debito_urinario.volume_ml | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| equipe_perfusao.perfusionista_check | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| equipe_perfusao.responsavel_cec | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| equipe_perfusao.responsavel_montagem | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| eventos[] | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| identificacao.data_cirurgia | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| identificacao.prontuario_simulado | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| identificacao.sala | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| metadados.categoria | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| metadados.finalidade | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| metadados.id_caso | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| metadados_conversao.avisos[] | str | entrada-paciente-valvular.json |
| metadados_conversao.fluxo | str | entrada-paciente-valvular.json |
| metadados_conversao.hematocrito | str | entrada-paciente-valvular.json |
| metadados_conversao.lactato | str | entrada-paciente-valvular.json |
| metadados_conversao.observacao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| metadados_conversao.observacao_ido2 | str | entrada-paciente-valvular.json |
| metadados_conversao.sao2 | str | entrada-paciente-valvular.json |
| metadados_conversao.superficie_corporal_m2 | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].be | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].ca | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].cl | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].do2_vo2 | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].fio2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].fluxo | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].gap_pco2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].glicose | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].hb | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].hco3 | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].hct | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].ic | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].ic_informado | float | entrada-paciente-valvular.json |
| monitorizacao[].ido2_informado | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].ivo2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].k | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].lactato | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].lactato_mg_dl | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].na | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].paco2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].pam | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].pao2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].ph | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].sao2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].svo2 | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].temperatura | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| monitorizacao[].tempo | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.delta_vav_mmhg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.estrategia_ph | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.fluxo_gas_l_min[] | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.pam_mmhg[] | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.pressao_barometrica_mmhg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.pressao_pos_membrana_mmhg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.pressao_pre_membrana_mmhg | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.sweep_fio2_percentual[] | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| operacional.temperatura_c[] | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.altura | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.comorbidades[] | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.idade | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.pam | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.peso | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.procedimento | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.risco_pre_operatorio.creatinina_mg_dl | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.risco_pre_operatorio.euroscore_ii | float | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.risco_pre_operatorio.hematocrito_preop | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.risco_pre_operatorio.rac_subgrupo | str | casos-completos-cirurgicos/09_correcao_tetralogia_fallot_pediatrico.json |
| paciente.sexo | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| paciente.temperatura | float, int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| procedimento.carater | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| procedimento.descricao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| procedimento.tipo_cirurgia | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.entrada_sala | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.fechamento | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.fim_cec | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.fim_clampeamento | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.heparinizacao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.incisao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.inducao | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.inicio_cec | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.inicio_clampeamento | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.inicio_reaquecimento | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.parada_circulatoria_fim | str | casos-completos-cirurgicos/05_disseccao_aguda_aorta_hipotermia.json |
| tempos_cirurgicos.parada_circulatoria_inicio | str | casos-completos-cirurgicos/05_disseccao_aguda_aorta_hipotermia.json |
| tempos_cirurgicos.parada_circulatoria_min | int | casos-completos-cirurgicos/05_disseccao_aguda_aorta_hipotermia.json |
| tempos_cirurgicos.primeira_cardioplegia | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.protamina | str | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.tempo_cec_min | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |
| tempos_cirurgicos.tempo_clampeamento_min | int | casos-completos-cirurgicos/01_revascularizacao_miocardio_eletiva.json |


Cabeçalhos CSV encontrados: `altura`, `be`, `cl`, `fio2`, `fluxo`, `gap_pco2`, `glicose`, `hco3`, `hematocrito`, `hemoglobina`, `idade`, `ido2`, `ivo2`, `k`, `lactato`, `na`, `paco2`, `pam`, `pao2`, `peso`, `ph`, `sao2`, `sexo`, `svo2`, `temperatura`, `tempo`.


## Apêndice D — Índice técnico de variáveis, parâmetros e funções


Este índice complementa o dicionário semântico dos capítulos 5–10. As declarações abaixo são transcrições literais com linha de origem; variáveis de interface (`campo…`, `btn…`, `modal`, `container`, `ctx`) representam elementos ou estado visual, não grandezas fisiológicas. A extração lexical de JavaScript lista declarações e assinaturas, não é um analisador semântico completo de todos os escopos; parâmetros de callbacks e propriedades estão disponíveis no código-fonte correspondente. O catálogo clínico acima e as tabelas de propriedades cobrem o contrato de dados.


### perfuselab-report/server/index.js


```text
1: const express = require('express');
2: const path = require('path');
3: const reportRouter = require('./routes/report');
5: const app = express();
6: const PORT = process.env.PORT || 3000;
```


### perfuselab-report/server/routes/report.js


```text
1: const express = require('express');
2: const router = express.Router();
3: const fs = require('fs');
4: const path = require('path');
14: const exames = JSON.parse(data);
```


### perfuselab-report/src/js/charts.js


```text
3: function createChart(ctx, labels, data, label) {
28: function renderCharts(examData) {
29: const ctxHb = document.getElementById('chartHb').getContext('2d');
30: const ctxLactato = document.getElementById('chartLactato').getContext('2d');
31: const ctxIC = document.getElementById('chartIC').getContext('2d');
32: const ctxIdo2 = document.getElementById('chartIdo2').getContext('2d');
34: const labels = examData.map(exam => exam.date);
35: const hbData = examData.map(exam => exam.hb);
36: const lactatoData = examData.map(exam => exam.lactato);
37: const icData = examData.map(exam => exam.ic);
38: const ido2Data = examData.map(exam => exam.ido2);
```


### perfuselab-report/src/js/dashboard.js


```text
5: const paciente = {
21: const historicoExames = [
28: function atualizarTabelaExames() {
29: const tabela = document.getElementById('tabelaExames').getElementsByTagName('tbody')[0];
32: let row = tabela.insertRow(index);
45: function gerarGraficos() {
```


### perfuselab-report/src/js/reportGenerator.js


```text
2: document.addEventListener('DOMContentLoaded', function() {
11: function generateReport(data) {
12: const reportContainer = document.getElementById('report-container');
13: const historyTable = document.createElement('table');
16: const headerRow = document.createElement('tr');
31: const row = document.createElement('tr');
50: function generateCharts(data) {
51: const ctx = document.getElementById('report-chart').getContext('2d');
52: const chartData = {
```


### server/config/cors.js


```text
1: const LOCAL_ORIGINS = Object.freeze([
10: function parseOrigins(value = '') {
17: function getAllowedOrigins() {
18: const configured = [
32: function createCorsOptions() {
33: const allowedOrigins = getAllowedOrigins()
42: const normalizedOrigin = origin.replace(/\/$/, '')
48: const error = new Error('Origem nao permitida pelo CORS.')
```


### server/config/database.js


```text
1: const mongoose = require('mongoose')
3: const CONNECTION_STATES = Object.freeze({
10: function getDatabaseStatus() {
14: async function connectDatabase() {
15: const uri = process.env.MONGO_URI || process.env.MONGODB_URI
```


### server/index.js


```text
3: const cors = require('cors')
4: const express = require('express')
5: const { connectDatabase, getDatabaseStatus } = require('./config/database')
6: const { createCorsOptions, getAllowedOrigins } = require('./config/cors')
7: const { authenticateRequest, isAuthConfigured } = require('./middleware/auth')
8: const authRouter = require('./routes/auth')
9: const casesRouter = require('./routes/cases')
10: const { errorHandler } = require('./middleware/errorHandler')
12: const app = express()
13: const port = Number(process.env.PORT) || 3000
14: const allowedOrigins = getAllowedOrigins()
29: const database = getDatabaseStatus()
30: const ok = database === 'connected'
54: async function bootstrap() {
56: const connection = await connectDatabase()
```


### server/middleware/auth.js


```text
1: const crypto = require('crypto')
3: const DEFAULT_TOKEN_TTL_HOURS = 8
5: function getConfiguredUsername() {
9: function getConfiguredPassword() {
13: function getAuthSecret() {
17: function getTokenTtlHours() {
18: const configuredValue = Number(process.env.PERFUSELAB_AUTH_TOKEN_TTL_HOURS)
24: function isAuthConfigured() {
28: function safeCompare(left, right) {
29: const leftHash = crypto.createHash('sha256').update(String(left)).digest()
30: const rightHash = crypto.createHash('sha256').update(String(right)).digest()
34: function validateCredentials(username, password) {
43: function signPayload(encodedPayload) {
44: const secret = getAuthSecret()
47: const error = new Error('PERFUSELAB_AUTH_SECRET nao foi configurada.')
58: function createAuthToken(username) {
59: const issuedAt = Date.now()
60: const expiresAtMs = issuedAt + getTokenTtlHours() * 60 * 60 * 1000
61: const payload = {
66: const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
67: const signature = signPayload(encodedPayload)
75: function verifyAuthToken(token) {
78: const [encodedPayload, signature] = token.split('.')
81: let expectedSignature
91: const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
100: function authenticateRequest(req, res, next) {
111: const authHeader = req.get('authorization') || ''
112: const match = authHeader.match(/^Bearer\s+(.+)$/i)
120: const payload = verifyAuthToken(match[1])
132: function getAuthStatus() {
```


### server/middleware/errorHandler.js


```text
1: function errorHandler(error, req, res, next) {
7: const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
8: const isProduction = process.env.NODE_ENV === 'production'
9: const message = isProduction && status >= 500
```


### server/models/PerfusionCase.js


```text
1: const mongoose = require('mongoose')
3: const Mixed = mongoose.Schema.Types.Mixed
5: const perfusionCaseSchema = new mongoose.Schema(
```


### server/routes/auth.js


```text
1: const express = require('express')
2: const {
8: const router = express.Router()
16: const { username, password } = req.body || {}
17: const status = getAuthStatus()
31: const session = createAuthToken(username)
```


### server/routes/cases.js


```text
1: const express = require('express')
2: const PerfusionCase = require('../models/PerfusionCase')
4: const router = express.Router()
6: function montarTitulo(payload) {
7: const patient = payload.patient || payload.paciente || {}
8: const idade = patient.idade !== undefined ? `${patient.idade} anos` : 'idade não informada'
9: const sexo = patient.sexo || 'sexo não informado'
10: const procedimento = patient.procedimento
23: function normalizarPayload(body) {
24: const patient = body.patient || body.paciente
26: const erro = new Error('Campo patient/paciente é obrigatório.')
49: const limit = Math.min(Number(req.query.limit) || 30, 100)
50: const filtro = { status: req.query.status || 'active' }
54: const cases = await PerfusionCase.find(filtro)
66: const payload = normalizarPayload(req.body)
67: const created = await PerfusionCase.create(payload)
76: const payload = normalizarPayload(req.body)
78: const created = await PerfusionCase.create(payload)
83: const updated = await PerfusionCase.findOneAndUpdate(
96: const found = await PerfusionCase.findById(req.params.id)
109: const payload = normalizarPayload(req.body)
110: const updated = await PerfusionCase.findByIdAndUpdate(
127: const updated = await PerfusionCase.findByIdAndUpdate(
```


### src/js/cases.js


```text
1: const API_BASE_URL = typeof window !== 'undefined' && window.PerfuseLabConfig
5: const CHECKLIST_SECOES = Object.freeze([
17: let casosCarregados = []
18: let casoAtual = null
20: function escapeHtml(valor){
29: function formatarData(valor){
31: const data = new Date(valor)
37: function valorOuTraco(valor, unidade = ''){
42: function tempoMinutosOuVazio(valor){
47: function resumoChecklist(estado = {}){
48: const ids = CHECKLIST_SECOES.flatMap(secao => secao.itens.map((_, indice) => `${secao.id}-${indice}`))
49: const total = ids.length
50: const concluidos = ids.filter(id => estado[id]?.status === 'concluido').length
54: function montarLinhaInfo(rotulo, valor){
63: function obterPerfusionista(caso){
70: function montarResumoCaso(caso){
71: const paciente = caso.patient || {}
72: const perfusionista = obterPerfusionista(caso)
73: const procedimento = perfusionista.procedimento
88: async function buscarJson(url, opcoes){
89: const fetchApi = window.PerfuseLabConfig?.authenticatedFetch || fetch
90: const resposta = await fetchApi(url, opcoes)
91: const corpo = await resposta.json().catch(() => ({}))
98: async function carregarCasos(){
99: const status = document.getElementById('statusCasos')
100: const contador = document.getElementById('contadorCasos')
103: const termo = document.getElementById('buscaCasos').value.trim()
104: const params = new URLSearchParams({ limit: '60' })
106: const corpo = await buscarJson(`${API_BASE_URL}/api/cases?${params.toString()}`)
121: function renderizarListaCasos(){
122: const lista = document.getElementById('listaCasos')
125: const resumo = montarResumoCaso(caso)
126: const check = caso.checklist?.summary || resumoChecklist(caso.checklist?.state)
127: const botao = document.createElement('button')
141: async function carregarDetalheCaso(id){
142: const status = document.getElementById('statusCasos')
145: const corpo = await buscarJson(`${API_BASE_URL}/api/cases/${id}`)
154: function renderizarDetalheCaso(caso){
155: const vazio = document.getElementById('casoVazio')
156: const painel = document.getElementById('casoSelecionado')
157: const resumo = montarResumoCaso(caso)
158: const paciente = resumo.paciente
159: const perfusionista = resumo.perfusionista
192: function obterValorRegistro(item, campos){
193: for(const campo of campos){
194: const valor = item?.[campo]
200: function valorMonitorizacao(item, campos, unidade = ''){
204: function montarTabelaMonitorizacao(dados = [], modo = 'simples'){
206: const completo = modo === 'completo'
207: const colunasEssenciais = [
217: const colunasCompletas = [
228: const colunas = completo ? colunasCompletas : colunasEssenciais
229: const linhas = dados.map(item => `
246: function simplificarAlertaRelatorioCaso(alerta){
247: const titulo = String(alerta?.titulo || 'Alerta')
248: const detalhe = String(alerta?.detalhe || '')
265: function selecionarAlertasRelatorioCaso(alertas = [], modo = 'simples'){
266: const completo = modo === 'completo'
267: const niveis = completo ? ['alto', 'moderado', 'informativo'] : ['alto', 'moderado']
274: function montarIndicadoresRelatorioCaso(caso, modo = 'simples'){
275: const analise = caso.analysis || {}
276: const dados = Array.isArray(caso.monitoring) ? caso.monitoring : []
277: const inicial = dados[0] || {}
278: const final = dados[dados.length - 1] || {}
279: const completo = modo === 'completo'
280: const itens = [
304: function montarRelatorioHtml(caso, modo = 'simples'){
305: const analise = caso.analysis || {}
306: const alertas = Array.isArray(analise.alertas) ? analise.alertas : []
307: const alertasRelatorio = selecionarAlertasRelatorioCaso(alertas, modo)
308: const completo = modo === 'completo'
309: const textoInterpretacao = {
331: function montarChecklistHtml(caso){
332: const estado = caso.checklist?.state || {}
333: const resumo = resumoChecklist(estado)
334: const metadata = obterPerfusionista(caso)
335: const secoes = CHECKLIST_SECOES.map(secao => `
339: const id = `${secao.id}-${indice}`
340: const item = estado[id] || {}
341: const concluido = item.status === 'concluido'
370: function imprimirConteudo(tipo, modo = 'simples'){
372: const resumo = montarResumoCaso(casoAtual)
373: const printArea = document.getElementById('casePrintArea')
374: const titulo = tipo === 'checklist'
377: const conteudo = tipo === 'checklist'
399: function abrirModalCaso(id){
400: const modal = document.getElementById(id)
406: function fecharModalCaso(id){
407: const modal = document.getElementById(id)
```


### src/js/checklist-template.js


```text
1: function limparModeloChecklist(){
15: function preencherDataAtual(){
16: const campoData = document.querySelector('.checklist-template-paper input[name="data"]')
```


### src/js/config.js


```text
1: (function configurarPerfuseLab(global) {
2: const TOKEN_KEY = 'perfuselab.auth.token'
3: const TOKEN_EXPIRATION_KEY = 'perfuselab.auth.expiresAt'
4: let loginPromise = null
6: function normalizarUrl(valor) {
11: function getApiBaseUrl() {
12: const runtimeConfig = global.PERFUSELAB_RUNTIME_CONFIG || {}
16: function clearAuthSession() {
25: function getStoredSession() {
27: const token = global.sessionStorage.getItem(TOKEN_KEY)
28: const expiresAt = global.sessionStorage.getItem(TOKEN_EXPIRATION_KEY)
42: function setAuthSession(session) {
53: function parseJsonSafe(response) {
57: function buildAuthModal(message) {
58: const overlay = global.document.createElement('div')
88: function requestLogin(message) {
97: const overlay = buildAuthModal(message)
98: const form = overlay.querySelector('form')
99: const errorBox = overlay.querySelector('.auth-modal__error')
100: const cancelButton = overlay.querySelector('[data-auth-cancel]')
102: function close() {
115: const submitButton = form.querySelector('[type="submit"]')
116: const formData = new FormData(form)
117: const username = String(formData.get('username') || '').trim()
118: const password = String(formData.get('password') || '')
126: const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
131: const payload = await parseJsonSafe(response)
151: async function ensureAuthenticated(message) {
152: const session = getStoredSession()
157: function withAuthHeaders(options) {
158: const session = getStoredSession()
159: const headers = new Headers(options.headers || {})
171: async function authenticatedFetch(url, options = {}) {
174: let response = await fetch(url, withAuthHeaders(options))
```


### src/js/dashboard.js


```text
2: let graficoAtual = null
3: const API_BASE_URL = typeof window !== 'undefined' && window.PerfuseLabConfig
6: const CONSTANTES_OXIGENIO = Object.freeze({
11: const LIMIARES = Object.freeze({
30: const INDICES_CARDIACOS_CONVERSAO = Object.freeze([2.0, 2.2, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2])
32: const REFERENCIAS_PARAMETROS = Object.freeze([
55: const FORMULAS_REFERENCIA = Object.freeze([
74: const CHECKLIST_SECOES = Object.freeze([
87: function transformarNumero(valor){
89: const numero = Number(String(valor).replace(',','.'))
93: function converterLactatoParaMmol(valor, unidade){
94: const numero = transformarNumero(valor)
101: function superficieCorporal(peso, altura){
102: const pesoNumerico = transformarNumero(peso)
103: const alturaNumerica = transformarNumero(altura)
111: function ofertaOxigenio(hemoglobina, sao2, fluxo, SC, pao2 = 0){
112: const hb = transformarNumero(hemoglobina)
113: const saturacao = transformarNumero(sao2)
114: const fluxoNumerico = transformarNumero(fluxo)
115: const superficie = transformarNumero(SC)
116: const pressaoOxigenio = transformarNumero(pao2)
121: const oxigenioLigado = hb * CONSTANTES_OXIGENIO.capacidadeHb * (saturacao / 100)
122: const oxigenioDissolvido = Number.isFinite(pressaoOxigenio)
125: const cao2 = oxigenioLigado + oxigenioDissolvido
126: const do2 = fluxoNumerico * cao2 * 10
130: function ofertaOxigenioPorIndice(hemoglobina, sao2, IC, pao2 = 0){
131: const hb = transformarNumero(hemoglobina)
132: const saturacao = transformarNumero(sao2)
133: const indice = transformarNumero(IC)
134: const pressaoOxigenio = transformarNumero(pao2)
139: const cao2 = (hb * CONSTANTES_OXIGENIO.capacidadeHb * (saturacao / 100))
144: function sao2ImplicitaPorIdo2(ido2, hemoglobina, IC, pao2 = 0){
145: const oferta = transformarNumero(ido2)
146: const hb = transformarNumero(hemoglobina)
147: const indice = transformarNumero(IC)
148: const pressaoOxigenio = transformarNumero(pao2)
153: const cao2Necessario = oferta / (10 * indice)
154: const oxigenioDissolvido = Number.isFinite(pressaoOxigenio)
162: function indiceCardiaco(fluxo, SC){
163: const fluxoNumerico = transformarNumero(fluxo)
164: const superficie = transformarNumero(SC)
170: function resetarExames(camposExames){
180: function classificarHemoglobina(valor, elemento){
194: function classificarHematocrito(valor, elemento){
208: function classificarLactato(valor, elemento){
222: function classificarIC(valor, elemento){
241: function classificarOfertaOxigenio(valor, elemento){
260: function calcularHb(hct){
264: function calcularHct(hb){
268: function score(ido2, hct, lactato, IC){
271: let scoreIdo2 = 0
272: let scoreHct = 0
273: let scoreLactato = 0
274: let scoreIC = 0
314: let scoreTotal = scoreIdo2 + scoreHct + scoreLactato + scoreIC
323: function classificarScore(valor, elemento){
340: function AtualizarTabela(exame, tabela, ido2, IC){
341: let linhaTempo = document.getElementById('linhaTempo')
342: let dadoTempo = document.createElement('td')
345: let linhaFluxo = document.getElementById('linhaFluxo')
346: let dadoFluxo = document.createElement('td')
349: let linhaHb = document.getElementById('linhaHb')
350: let dadoHb = document.createElement('td')
353: let linhaHct = document.getElementById('linhaHct')
354: let dadoHct = document.createElement('td')
357: let linhaLactato = document.getElementById('linhaLactato')
358: let dadoLactato = document.createElement('td')
362: let linhaSao2 = document.getElementById('linhaSao2')
363: let dadoSao2 = document.createElement('td')
366: let linhaIdo2 = document.getElementById('linhaIdo2')
367: let dadoIdo2 = document.createElement('td')
370: let linhaIC = document.getElementById('linhaIC')
371: let dadoIC = document.createElement('td')
374: let linhaFonteIdo2 = document.getElementById('linhaFonteIdo2')
375: let dadoFonteIdo2 = document.createElement('td')
378: let linhasEdados = [linhaTempo, dadoTempo, linhaFluxo, dadoFluxo, linhaHb, dadoHb, linhaHct, dadoHct, linhaLactato, dadoLactato, linhaSao2, dadoSao2, linhaIdo2, dadoIdo2, linhaIC, dadoIC, linhaFonteIdo2, dadoFonteIdo2]
406: const linhasAdicionais = [
420: const linha = document.getElementById(id)
421: const dado = document.createElement('td')
429: function criarGrafico(campo, dados, valorCritico = null){
430: let local = document.getElementById('local')
443: let canvas = document.createElement('canvas')
446: let labels = dados.map(d => d.tempo)
447: let valores = dados.map(d => d[campo] ?? null)
449: let linhaCritica = valorCritico !== null ? labels.map(() => valorCritico) : null
451: let config = {
479: function completarExame(exame, SC){
480: const hb = transformarNumero(exame.hb)
481: const hct = transformarNumero(exame.hct)
482: const lactato = transformarNumero(exame.lactato)
483: const fluxo = transformarNumero(exame.fluxo)
484: const sao2 = transformarNumero(exame.sao2)
485: const icCalculado = indiceCardiaco(fluxo, SC)
486: const ido2Informado = transformarNumero(exame.ido2Informado ?? exame.ido2_informado)
487: const icInformado = transformarNumero(exame.icInformado ?? exame.ic_informado)
488: const IC = icInformado ?? icCalculado
489: const sao2Medida = Number.isFinite(sao2) && exame.sao2Informada !== false
490: const ido2Calculado = sao2Medida
493: const ido2 = ido2Calculado ?? ido2Informado
494: const diferencaIdo2Percentual = Number.isFinite(ido2Calculado) && Number.isFinite(ido2Informado) && ido2Informado !== 0
497: const sao2Implicita = !sao2Medida && Number.isFinite(ido2Informado)
500: let consistenciaIdo2 = 'calculado'
517: const ivo2 = transformarNumero(exame.ivo2)
518: const relacaoInformada = transformarNumero(exame.relacaoDo2Vo2 ?? exame.do2_vo2)
519: const o2er = Number.isFinite(ivo2) && Number.isFinite(ido2) && ido2 > 0
522: const relacaoDo2Vo2 = Number.isFinite(ivo2) && Number.isFinite(ido2) && ivo2 > 0
525: const diferencaRelacao = Number.isFinite(relacaoInformada) && Number.isFinite(relacaoDo2Vo2)
554: function descreverOrigemIdo2(exame){
576: function escaparHtml(valor){
577: const mapa = {
587: function formatarValorRelatorio(valor, casas = 1, unidade = ''){
588: const numero = transformarNumero(valor)
593: function criarTabelaMonitorizacaoRelatorio(historico, completo = false){
594: const colunasEssenciais = [
604: const colunasCompletas = [
615: const colunas = completo ? colunasCompletas : colunasEssenciais
632: function simplificarAlertaRelatorio(alerta){
633: const titulo = String(alerta?.titulo || 'Alerta')
634: const detalhe = String(alerta?.detalhe || '')
651: function selecionarAlertasRelatorio(alertas = [], completo = false){
652: const niveisPermitidos = completo ? ['alto', 'moderado', 'informativo'] : ['alto', 'moderado']
659: function renderizarAnaliseRelatorio(container, analise, historico, SC, completo = false){
660: const inicial = historico[0] || {}
661: const final = historico[historico.length - 1] || {}
662: const alertasPrioritarios = selecionarAlertasRelatorio(analise.alertas, completo)
663: const interpretacoes = {
668: const itensChave = [
679: const itensCompletos = [
686: const itens = completo ? [...itensChave, ...itensCompletos] : itensChave
721: function prepararRelatorioImpressao(modo, contexto){
722: const {
733: const relatorio = document.getElementById('relatorio')
734: const relatorioTitulo = document.getElementById('relatorioTitulo')
735: const relatorioDescricao = document.getElementById('relatorioDescricao')
736: const relatorioPaciente = document.getElementById('relatorioPaciente')
737: const relatorioTabela = document.getElementById('relatorioTabela')
738: const relatorioAnalise = document.getElementById('relatorioAnalise')
739: const relatorioGraficos = document.getElementById('relatorioGraficos')
740: const simples = modo === 'simples' || modo === 'basico'
741: const completo = !simples
789: function imprimirRelatorio(modo, contexto){
790: const relatorio = prepararRelatorioImpressao(modo, contexto)
799: function criarGraficoRelatorio(container, titulo, campo, dados, valorCritico){
800: const bloco = document.createElement('div')
801: const cabecalho = document.createElement('h3')
802: const canvas = document.createElement('canvas')
803: const valores = dados.map(item => transformarNumero(item[campo]))
804: const temValores = valores.some(Number.isFinite)
829: const grafico = new Chart(canvas, {
866: function alvoIdo2PorTemperatura(temperatura){
867: const tabela = [
879: for(let i = 1; i < tabela.length; i += 1){
880: const [tempAtual, alvoAtual] = tabela[i]
881: const [tempAnterior, alvoAnterior] = tabela[i - 1]
883: const proporcao = (temperatura - tempAnterior) / (tempAtual - tempAnterior)
890: function calcularAucDeficit(dados, obterAlvo){
891: let auc = 0
892: let tempoAbaixo = 0
893: for(let i = 1; i < dados.length; i += 1){
894: const anterior = dados[i - 1]
895: const atual = dados[i]
896: const alvoAnterior = obterAlvo(anterior)
897: const alvoAtual = obterAlvo(atual)
902: const intervalo = Math.max(0, atual.tempo - anterior.tempo)
903: const deficitAnterior = alvoAnterior - anterior.ido2
904: const deficitAtual = alvoAtual - atual.ido2
910: const deficitPositivo = Math.max(deficitAnterior, deficitAtual)
911: const fracaoAbaixo = deficitPositivo / (Math.abs(deficitAnterior) + Math.abs(deficitAtual))
912: const intervaloAbaixo = intervalo * fracaoAbaixo
923: function fio2CorrigidaHamilton(fio2Percentual, pao2, pressaoBarometrica = 760){
927: const fio2Fracao = fio2Percentual / 100
928: const corrigida = fio2Fracao - (pao2 / (pressaoBarometrica - 47)) + 0.21
932: function formatarMetrica(valor, casas = 1){
936: function criarAlerta(nivel, titulo, detalhe){
940: function analisarAcidoBase(exame){
965: function montarAnalisePerfusional(paciente, historico, casoClinico, SC){
966: const alvoGdp = LIMIARES.ido2.alvoGdp
967: const pressaoBarometrica = transformarNumero(casoClinico?.operacional?.pressao_barometrica_mmhg) || 760
968: const dados = historico
974: const inicial = dados[0]
975: const final = dados[dados.length - 1]
976: const aucGdp = calcularAucDeficit(dados, () => alvoGdp)
977: const aucTermica = calcularAucDeficit(dados, exame => exame.alvoIdo2Termico)
978: const alertas = []
979: const limitacoes = []
980: const informacoesTecnicas = []
981: const bmi = Number((transformarNumero(paciente.peso) / Math.pow(transformarNumero(paciente.alturaNum) / 100, 2)).toFixed(1))
982: const adequacaoGdpInicial = Number(((inicial.ido2 / alvoGdp) * 100).toFixed(1))
983: const adequacaoGdpFinal = Number(((final.ido2 / alvoGdp) * 100).toFixed(1))
984: const adequacaoTermicaInicial = Number(((inicial.ido2 / inicial.alvoIdo2Termico) * 100).toFixed(1))
985: const adequacaoTermicaFinal = Number(((final.ido2 / final.alvoIdo2Termico) * 100).toFixed(1))
986: const lactatoRatio = inicial.lactato > 0 ? Number((final.lactato / inicial.lactato).toFixed(2)) : null
987: const deltaHb = Number((final.hb - inicial.hb).toFixed(2))
988: const deltaIdo2 = Number((final.ido2 - inicial.ido2).toFixed(1))
989: const deltaIdo2Percentual = inicial.ido2
992: const acidobase = analisarAcidoBase(final)
993: const anionGap = Number.isFinite(final.na) && Number.isFinite(final.cl) && Number.isFinite(final.hco3)
996: const deltaDelta = Number.isFinite(anionGap) && final.hco3 !== 24
999: const debito = casoClinico?.debito_urinario
1000: const debitoMlKgH = debito?.volume_ml && debito?.tempo_min && paciente.peso
1003: const pressoes = casoClinico?.operacional
1004: const deltaMembrana = Number.isFinite(transformarNumero(pressoes?.pressao_pre_membrana_mmhg))
1008: const volumeSanguineoEstimado = paciente.peso
1011: const cec = casoClinico?.cec || {}
1012: const anticoagulacao = casoClinico?.anticoagulacao || {}
1013: const tcaBasal = transformarNumero(anticoagulacao.tca_basal_s)
1014: const tcaCec = transformarNumero(anticoagulacao.tca_cec_s)
1015: const tcaPos = transformarNumero(anticoagulacao.tca_pos_neutralizacao_s)
1016: const cargaCristaloideNominal = Number.isFinite(transformarNumero(cec.prime_ml))
1019: const proporcaoCristaloide = volumeSanguineoEstimado && Number.isFinite(cargaCristaloideNominal)
1022: const pontosRecalculados = dados.filter(exame => Number.isFinite(exame.ido2Calculado)).length
1023: const pontosInconsistentes = dados.filter(exame => ['incompativel', 'discordante', 'divergente'].includes(exame.consistenciaIdo2)).length
1026: const adequacaoGdp = Number.isFinite(exame.ido2) ? exame.ido2 / alvoGdp : null
1041: const fio2Corrigida = fio2CorrigidaHamilton(exame.fio2, exame.pao2, pressaoBarometrica)
1088: const avisosConversao = casoClinico?.metadados_conversao?.avisos
1093: const hipoxiaOculta = final.svo2 >= LIMIARES.svo2.moderado && (final.lactato >= LIMIARES.lactato.atencao || final.gapPco2 >= LIMIARES.gapPco2.moderado || final.o2er >= LIMIARES.o2er.moderado)
1097: const quantidadeAltos = alertas.filter(alerta => alerta.nivel === 'alto').length
1098: const quantidadeModerados = alertas.filter(alerta => alerta.nivel === 'moderado').length
1099: const risco = quantidadeAltos > 0 ? 'ALTO' : quantidadeModerados >= 2 ? 'MODERADO' : 'BAIXO'
1136: function renderizarAnalisePerfusional(analise){
1137: const riscoGlobal = document.getElementById('riscoGlobal')
1138: const resumo = document.getElementById('resumoPerfusional')
1139: const metricas = document.getElementById('metricasPerfusionais')
1140: const alertas = document.getElementById('alertasPerfusionais')
1141: const qualidade = document.getElementById('qualidadeDados')
1142: const coresRisco = { BAIXO: 'bg-emerald-600', MODERADO: 'bg-amber-500', ALTO: 'bg-red-600' }
1148: const card = document.createElement('div')
1150: const rotulo = document.createElement('p')
1153: const valor = document.createElement('p')
1162: const linha = document.createElement('div')
1164: const nome = document.createElement('span')
1165: const resultado = document.createElement('strong')
1180: const bloco = document.createElement('div')
1181: const cores = {
1187: const titulo = document.createElement('strong')
1190: const detalhe = document.createElement('span')
1200: const item = document.createElement('li')
1205: const campoScore = document.getElementById('campoScore')
1206: const classificacaoScore = document.getElementById('classificacaoScore')
1207: const coresRiscoCard = {
1220: function abrirModuloDashboard(id){
1221: const modal = document.getElementById(id)
1227: function fecharModuloDashboard(id){
1228: const modal = document.getElementById(id)
1234: function obterProcedimentoCaso(paciente = {}, casoClinico = {}, dadosChecklist = {}){
1244: function criarChaveCaso(paciente, casoClinico = {}){
1245: const origem = obterProcedimentoCaso(paciente, casoClinico) || casoClinico?.metadados?.arquivo || 'caso-local'
1246: const partes = [
1257: function criarEstadoChecklistPadrao(){
1269: function carregarEstadoChecklist(chave){
1270: const padrao = criarEstadoChecklistPadrao()
1272: const salvo = JSON.parse(localStorage.getItem(chave) || '{}')
1281: function salvarEstadoChecklist(chave, estado){
1285: function criarDadosChecklistPadrao(casoClinico = {}, paciente = {}){
1286: const identificacao = casoClinico?.identificacao || {}
1287: const equipe = casoClinico?.equipe_perfusao || casoClinico?.equipePerfusao || {}
1288: const tempos = casoClinico?.tempos_cirurgicos || casoClinico?.temposCirurgicos || {}
1304: function chaveDadosChecklist(chave){
1308: function carregarDadosChecklist(chave, casoClinico = {}, paciente = {}){
1309: const padrao = criarDadosChecklistPadrao(casoClinico, paciente)
1311: const salvo = JSON.parse(localStorage.getItem(chaveDadosChecklist(chave)) || '{}')
1318: function salvarDadosChecklist(chave, dados){
1322: function sincronizarCamposDadosChecklist(chave, dados){
1323: const campos = {
1347: function calcularResumoChecklist(estado){
1348: const itens = Object.values(estado)
1349: const total = itens.length
1350: const concluidos = itens.filter(item => item.status === 'concluido').length
1351: const pendentes = total - concluidos
1355: function atualizarResumoChecklist(estado){
1356: const resumo = calcularResumoChecklist(estado)
1357: const texto = `Checklist: ${resumo.concluidos}/${resumo.total} concluídos`
1358: const resumoHeader = document.getElementById('resumoChecklist')
1359: const progresso = document.getElementById('progressoChecklist')
1360: const pendencias = document.getElementById('pendenciasChecklist')
1374: function renderizarChecklist(estado, chave){
1375: const container = document.getElementById('checklistConteudo')
1380: const bloco = document.createElement('article')
1382: const titulo = document.createElement('h3')
1387: const id = `${secao.id}-${indice}`
1388: const item = estado[id]
1389: const linha = document.createElement('div')
1392: const topo = document.createElement('div')
1395: const checkbox = document.createElement('input')
1400: const label = document.createElement('label')
1404: const status = document.createElement('span')
1408: const observacao = document.createElement('input')
1439: function renderizarReferencias(){
1440: const valores = document.getElementById('referenciasValores')
1441: const formulas = document.getElementById('referenciasFormulas')
1445: const card = document.createElement('article')
1466: const bloco = document.createElement('article')
1479: function alternarAbaReferencias(aba){
1480: const valores = document.getElementById('referenciasValores')
1481: const formulas = document.getElementById('referenciasFormulas')
1482: const abaValores = document.getElementById('abaValoresReferencia')
1483: const abaFormulas = document.getElementById('abaFormulasReferencia')
1484: const mostrarFormulas = aba === 'formulas'
1491: function atualizarResumoFluxoIndice(fluxoAtual, SC){
1492: const fluxoNumerico = transformarNumero(fluxoAtual)
1493: const indice = indiceCardiaco(fluxoNumerico, SC)
1494: const resumoFluxo = document.getElementById('resumoFluxoBomba')
1495: const resumoIndice = document.getElementById('resumoIndiceCardiaco')
1496: const resumoSC = document.getElementById('resumoSuperficieCorporal')
1502: function renderizarConversaoIndiceFluxo(SC){
1503: const corpoTabela = document.getElementById('tabelaConversaoIcFluxo')
1504: const scAtual = document.getElementById('conversaoScAtual')
1507: const superficie = transformarNumero(SC)
1519: const linhas = []
1520: for(let indice = 0; indice < INDICES_CARDIACOS_CONVERSAO.length; indice += 2){
1521: const primeiroIndice = INDICES_CARDIACOS_CONVERSAO[indice]
1522: const segundoIndice = INDICES_CARDIACOS_CONVERSAO[indice + 1]
1523: const primeiroFluxo = primeiroIndice * superficie
1524: const segundoFluxo = segundoIndice ? segundoIndice * superficie : null
1537: function salvarHistoricoCaso(historico){
1541: function montarSnapshotBanco(paciente, casoClinico, historico, analise, estadoChecklist, chaveChecklist, dadosChecklist = {}){
1542: const resumoChecklist = calcularResumoChecklist(estadoChecklist)
1543: const procedimento = obterProcedimentoCaso(paciente, casoClinico, dadosChecklist)
1544: const pacienteSnapshot = {
1575: function atualizarStatusBanco(mensagem, tipo = 'neutro'){
1576: const status = document.getElementById('statusBanco')
1580: const classes = {
1589: async function salvarCasoNoBanco(snapshot){
1594: const fetchApi = window.PerfuseLabConfig?.authenticatedFetch || fetch
1595: const resposta = await fetchApi(`${API_BASE_URL}/api/cases/sync`, {
1601: const corpo = await resposta.json().catch(() => ({}))
1610: let paciente = JSON.parse(localStorage.getItem('paciente'))
1611: const casoClinico = JSON.parse(localStorage.getItem('casoClinicoImportado') || '{}')
1621: let idade = transformarNumero(paciente.idade)
1622: let peso = transformarNumero(paciente.peso)
1623: let altura = transformarNumero(paciente.alturaNum)
1624: let sao2 = transformarNumero(paciente.sao2)
1625: let hemoglobina = transformarNumero(paciente.hemoglobina)
1626: let fluxo = transformarNumero(paciente.fluxo)
1627: let hct = transformarNumero(paciente.hematocrito)
1628: let lactato = transformarNumero(paciente.lactato)
1631: let campoProcedimento = document.getElementById('campoProcedimento')
1632: let campoSexo = document.getElementById('campoSexo')
1633: let campoIdade = document.getElementById('campoIdade')
1634: let campoPeso = document.getElementById('campoPeso')
1635: let campoSC = document.getElementById('campoSC')
1636: let campoido2 = document.getElementById('campoido2')
1637: let origemIdo2 = document.getElementById('origemIdo2')
1638: let campoHb = document.getElementById('campoHb')
1639: let campoHct = document.getElementById('campoHct')
1640: let campoLactato = document.getElementById('campoLactato')
1641: let campoIC = document.getElementById('campoIC')
1642: let classificacaoido2 = document.getElementById('classificacaoido2')
1643: let classificacaoHb = document.getElementById('classificacaoHb')
1644: let classificacaoHct = document.getElementById('classificacaoHct')
1645: let classificacaoLactato = document.getElementById('classificacaoLactato')
1646: let classificacaoIC = document.getElementById('classificacaoIC')
1647: let campoScore = document.getElementById('campoScore')
1648: let classificacaoScore = document.getElementById('classificacaoScore')
1649: let btnExames = document.getElementById('btnExames')
1650: let btnNovosExames = document.getElementById('btnNovosExames')
1651: let btnVerMais = document.getElementById('btnVerMais')
1652: let btnVerMenos = document.getElementById('btnVerMenos')
1653: let maisExames = document.getElementById('maisExames')
1654: let tabelaExames = document.getElementById('tabelaExames')
1655: let buttonsGrafico = document.getElementById('buttonsGrafico')
1656: let btnGraficoLactato = document.getElementById('btnGraficoLactato')
1657: let btnGraficoido2 = document.getElementById('btnGraficoido2')
1658: let btnGraficoHCT = document.getElementById('btnGraficoHCT')
1659: let btnGraficoHB = document.getElementById('btnGraficoHB')
1660: let btnGraficoIC = document.getElementById('btnGraficoIC')
1661: let btnGraficoSvo2 = document.getElementById('btnGraficoSvo2')
1662: let btnGraficoO2er = document.getElementById('btnGraficoO2er')
1663: let btnRelatorio = document.getElementById('btnRelatorio')
1664: let btnRelatorioSimples = document.getElementById('btnRelatorioSimples')
1665: let btnRelatorioCompleto = document.getElementById('btnRelatorioCompleto')
1666: let btnChecklist = document.getElementById('btnChecklist')
1667: let btnReferencias = document.getElementById('btnReferencias')
1668: let btnSalvarBanco = document.getElementById('btnSalvarBanco')
1669: let btnFecharChecklist = document.getElementById('btnFecharChecklist')
1670: let btnFecharRelatorioOpcoes = document.getElementById('btnFecharRelatorioOpcoes')
1671: let btnFecharReferencias = document.getElementById('btnFecharReferencias')
1672: let abaValoresReferencia = document.getElementById('abaValoresReferencia')
1673: let abaFormulasReferencia = document.getElementById('abaFormulasReferencia')
1676: const procedimento = obterProcedimentoCaso(paciente, casoClinico)
1699: let SC = superficieCorporal(peso,altura)
1705: let ido2 = ofertaOxigenio(hemoglobina, sao2, fluxo, SC)
1712: let IC = indiceCardiaco(fluxo, SC)
1718: let scoreTotal = score(ido2, hct, lactato, IC)
1722: let historicoExames = []
1724: let examesIniciais = completarExame({
1734: const historicoImportado = JSON.parse(localStorage.getItem('historicoImportado') || 'null')
1741: let tempo = document.getElementById('tempo')
1742: let ph = document.getElementById('ph')
1743: let pao2 = document.getElementById('pao2')
1744: let paco2 = document.getElementById('paco2')
1745: let hco3 = document.getElementById('hco3')
1746: let be = document.getElementById('be')
1747: let lactatoAtt = document.getElementById('lactatoAtt')
1748: let unidadeLactato = document.getElementById('unidadeLactato')
1749: let k = document.getElementById('k')
1750: let ca = document.getElementById('ca2')
1751: let hb = document.getElementById('hb')
1752: let hctAtt = document.getElementById('hctAtt')
1753: let svo2 = document.getElementById('svo2')
1754: let sao2Att = document.getElementById('sao2Att')
1755: let campoPh = document.getElementById('campoPh')
1756: let campoPao2 = document.getElementById('campoPao2')
1757: let campoPaco2 = document.getElementById('campoPaco2')
1758: let campoSao2 = document.getElementById('campoSao2')
1759: let campoHco3 = document.getElementById('campoHco3')
1760: let campoBe = document.getElementById('campoBe')
1761: let campoLactatoExame = document.getElementById('campoLactatoExame')
1762: let campoK = document.getElementById('campoK')
1763: let campoCa = document.getElementById('campoCa')
1764: let campoHbExame = document.getElementById('campoHbExame')
1765: let campoHctExame = document.getElementById('campoHctExame')
1766: let campoSvo2 = document.getElementById('campoSvo2')
1767: let campoTempo = document.getElementById('campoTempo')
1768: let campoFluxo = document.getElementById('campoFluxo')
1769: let fluxoInput = document.getElementById('fluxoInput')
1770: let temperaturaAtt = document.getElementById('temperaturaAtt')
1771: let pamAtt = document.getElementById('pamAtt')
1772: let fio2 = document.getElementById('fio2')
1773: let ivo2 = document.getElementById('ivo2')
1774: let gapPco2 = document.getElementById('gapPco2')
1775: let na = document.getElementById('na')
1776: let cl = document.getElementById('cl')
1777: let glicose = document.getElementById('glicose')
1778: let campoTemperaturaAtt = document.getElementById('campoTemperaturaAtt')
1779: let campoPamAtt = document.getElementById('campoPamAtt')
1780: let campoFio2 = document.getElementById('campoFio2')
1781: let campoIvo2 = document.getElementById('campoIvo2')
1782: let campoGapPco2 = document.getElementById('campoGapPco2')
1783: let campoNa = document.getElementById('campoNa')
1784: let campoCl = document.getElementById('campoCl')
1785: let campoGlicose = document.getElementById('campoGlicose')
1788: const camposExames = [
1813: const limites = {
1829: const exameMaisRecente = historicoExames[historicoExames.length - 1]
1853: let analiseAtual = montarAnalisePerfusional(paciente, historicoExames, casoClinico, SC)
1856: const chaveChecklist = criarChaveCaso(paciente, casoClinico)
1857: const estadoChecklist = carregarEstadoChecklist(chaveChecklist)
1858: const dadosChecklist = carregarDadosChecklist(chaveChecklist, casoClinico, paciente)
1875: const snapshot = montarSnapshotBanco(paciente, casoClinico, historicoExames, analiseAtual, estadoChecklist, chaveChecklist, dadosChecklist)
1908: const unidade = typeof item.unidade === 'function' ? item.unidade() : item.unidade
1940: const lactatoConvertido = converterLactatoParaMmol(lactatoAtt.value, unidadeLactato.value)
1959: const examesObrigatorios = [tempo, fluxoInput, sao2Att]
1974: const exames = completarExame({
2064: const contextoRelatorio = () => ({
```


### src/js/index.js


```text
1: const btnMain = document.getElementById('btnMain')
2: const btnModal = document.getElementById('btnModal')
3: const btnClose = document.getElementById('btnClose')
4: const main = document.getElementById('main')
5: const modal = document.getElementById('modal')
6: const arquivoDados = document.getElementById('arquivoDados')
7: const btnModeloArquivo = document.getElementById('btnModeloArquivo')
8: const statusArquivo = document.getElementById('statusArquivo')
11: const errorSex = document.getElementById('errorSex')
13: const colunasModelo = [
20: function transformarNumero(valor) {
22: const numero = Number(String(valor).trim().replace(',', '.'))
26: function converterLactatoParaMmol(valor, unidade) {
27: const numero = transformarNumero(valor)
34: function normalizarChave(chave) {
43: function valorDaLinha(linha, ...nomes) {
44: const normalizada = Object.fromEntries(
47: for (const nome of nomes) {
48: const valor = normalizada[normalizarChave(nome)]
54: function valorDeObjeto(objeto, ...nomes) {
59: function separarCSV(linha, delimitador) {
60: const valores = []
61: let atual = ''
62: let entreAspas = false
64: for (let i = 0; i < linha.length; i += 1) {
65: const caractere = linha[i]
82: function lerCSV(texto) {
83: const linhas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter(linha => linha.trim())
86: const delimitador = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ','
87: const cabecalhos = separarCSV(linhas[0], delimitador)
89: const valores = separarCSV(linha, delimitador)
94: function prepararImportacao(conteudo, extensao) {
95: let paciente
96: let monitorizacao
97: let dadosOriginais = null
100: const dados = JSON.parse(conteudo)
109: const primeira = monitorizacao[0]
121: const primeira = monitorizacao[0]
122: const procedimento = valorDeObjeto(paciente, 'procedimento', 'cirurgia', 'tipo_cirurgia', 'tipoCirurgia', 'procedimentoCirurgico')
126: const pacienteNormalizado = {
141: const SC = pacienteNormalizado.peso && pacienteNormalizado.alturaNum
144: const icInicial = transformarNumero(valorDaLinha(primeira, 'ic', 'indicecardiaco', 'icinformado', 'ic_informado'))
145: const hbInicial = transformarNumero(valorDaLinha(primeira, 'hemoglobina', 'hb'))
146: const lactatoInicialMgDl = transformarNumero(valorDaLinha(primeira, 'lactatomgdl', 'lactato_mg_dl'))
147: const ido2Inicial = transformarNumero(valorDaLinha(primeira, 'ido2', 'ido2informado', 'ido2_informado'))
154: const obrigatoriosPaciente = ['sexo', 'idade', 'peso', 'alturaNum', 'hemoglobina', 'hematocrito', 'fluxo', 'lactato']
162: const operacional = dadosOriginais?.operacional || {}
163: const temperaturas = operacional.temperatura_c || []
164: const pressaoArterial = operacional.pam_mmhg || []
165: const historico = monitorizacao.map((linha, indice) => {
166: const hb = transformarNumero(valorDaLinha(linha, 'hemoglobina', 'hb'))
167: const hctInformado = transformarNumero(valorDaLinha(linha, 'hematocrito', 'hct'))
168: const icInformado = transformarNumero(valorDaLinha(linha, 'ic', 'indicecardiaco', 'icinformado', 'ic_informado'))
169: const fluxoInformado = transformarNumero(valorDaLinha(linha, 'fluxo'))
170: const pao2 = transformarNumero(valorDaLinha(linha, 'pao2'))
171: const sao2Entrada = transformarNumero(valorDaLinha(linha, 'sao2', 'saturacao'))
172: const sao2InformadaEntrada = valorDaLinha(linha, 'sao2informada', 'sao2_informada')
173: const lactatoMmol = transformarNumero(valorDaLinha(linha, 'lactato'))
174: const lactatoMgDl = transformarNumero(valorDaLinha(linha, 'lactatomgdl', 'lactato_mg_dl'))
209: const monitorizacaoIncompleta = historico.some(item => {
210: const basicosAusentes = ['fluxo', 'hb', 'hct', 'lactato'].some(campo => item[campo] === null)
220: function exibirStatusArquivo(mensagem, erro = false) {
227: const arquivo = event.target.files[0]
231: const extensao = arquivo.name.split('.').pop().toLowerCase()
233: const importacao = prepararImportacao(await arquivo.text(), extensao)
246: const exemplo = [
251: const url = URL.createObjectURL(new Blob([`\uFEFF${exemplo}`], { type: 'text/csv;charset=utf-8' }))
252: const link = document.createElement('a')
271: const procedimento = document.getElementById('procedimento').value.trim()
272: const sexo = document.getElementById('sexo').value.toLowerCase().trim()
273: const idade = document.getElementById('idade').value
274: const peso = document.getElementById('peso').value.trim()
275: const altura = document.getElementById('altura').value.trim()
276: const hemoglobina = document.getElementById('hemoglobina').value.trim()
277: const hematocrito = document.getElementById('hematocrito').value.trim()
278: const fluxo = document.getElementById('fluxo').value.trim()
279: const temperatura = document.getElementById('temperatura').value.trim()
280: const pam = document.getElementById('pam').value.trim()
281: const lactatoOriginal = document.getElementById('lactato').value.trim()
282: const unidadeLactatoInicial = document.getElementById('unidadeLactatoInicial').value
283: const lactato = converterLactatoParaMmol(lactatoOriginal, unidadeLactatoInicial)
284: const sao2 = document.getElementById('sao2').value.trim()
294: const alturaNum = Number(altura)
300: const campos = [idade, peso, altura, hemoglobina, hematocrito, fluxo, temperatura, pam, lactatoOriginal, sao2]
306: const paciente = {
```


### src/js/runtime-env.js


```text

```


### tools/build-frontend.js


```text
1: const fs = require('fs/promises')
2: const path = require('path')
4: const root = path.resolve(__dirname, '..')
5: const dist = path.join(root, 'dist')
6: const apiBaseUrl = (process.env.VITE_API_URL || process.env.PERFUSELAB_API_URL || '').trim().replace(/\/$/, '')
12: async function copiarArquivo(origem, destino) {
17: async function main() {
```


### tools/build_manual_interpretacao_cec.py


```text
26: def shade_cell(cell, fill):
33: def set_cell_text(cell, text, bold=False, color=None):
44: def add_table(doc, headers, rows, widths=None, header_fill=LIGHT_BLUE):
68: def add_callout(doc, title, body, fill=LIGHT_AMBER):
84: def add_bullets(doc, items):
90: def add_numbered(doc, items):
96: def add_heading(doc, text, level=1):
103: def add_reference(doc, text, url):
111: def set_document_styles(doc):
137: def add_footer(section):
146: def build_manual():
```


Identificadores Python atribuídos/parâmetros: `BLUE`, `DARK`, `LIGHT_AMBER`, `LIGHT_BLUE`, `LIGHT_GRAY`, `LIGHT_GREEN`, `LIGHT_RED`, `MUTED`, `OUTPUT`, `ROOT`, `body`, `bold`, `cases`, `cell`, `cells`, `color`, `doc`, `fill`, `footer`, `header`, `header_cells`, `header_fill`, `headers`, `i`, `idx`, `item`, `items`, `level`, `normal`, `p`, `r`, `row`, `rows`, `run`, `section`, `shd`, `size`, `style`, `style_name`, `styles`, `subtitle`, `table`, `tc_pr`, `text`, `title`, `url`, `value`, `width`, `widths`.


### tools/dev-frontend.js


```text
1: const fs = require('fs/promises')
2: const http = require('http')
3: const path = require('path')
5: const root = path.resolve(__dirname, '..')
6: const port = Number(process.env.FRONTEND_PORT) || 5173
7: const apiBaseUrl = (process.env.VITE_API_URL || process.env.PERFUSELAB_API_URL || 'http://localhost:3000').trim().replace(/\/$/, '')
8: const allowedRoots = [
14: const contentTypes = {
25: function resolverArquivo(urlPath) {
26: const cleanPath = decodeURIComponent(urlPath.split('?')[0])
27: const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '')
28: const resolved = path.resolve(root, relativePath)
29: const allowed = allowedRoots.some(base => resolved === base || resolved.startsWith(`${base}${path.sep}`))
36: const server = http.createServer(async (req, res) => {
43: const arquivo = resolverArquivo(req.url)
51: const data = await fs.readFile(arquivo)
```


### tools/generate-casos-completos.js


```text
1: const fs = require('fs/promises')
2: const path = require('path')
4: const root = path.resolve(__dirname, '..')
5: const outputDir = path.join(root, 'casos-completos-cirurgicos')
7: function round(value, digits = 2) {
8: const factor = 10 ** digits
12: function bsaMosteller(weightKg, heightCm) {
16: function oxygenDeliveryIndex(row, bsa) {
17: const ic = row.ic ?? row.fluxo / bsa
18: const arterialContent = (row.hb * 1.36 * (row.sao2 / 100)) + ((row.pao2 || 0) * 0.003)
22: function enrichCase(caso) {
23: const bsa = bsaMosteller(caso.paciente.peso, caso.paciente.altura)
38: const ic = row.ic ?? row.fluxo / bsa
39: const ido2 = oxygenDeliveryIndex({ ...row, ic }, bsa)
52: const casos = [
925: const readme = `Casos completos cirurgicos PerfuseLab
951: async function main() {
955: for (const caso of casos.map(enrichCase)) {
956: const filePath = path.join(outputDir, caso.arquivo)
957: const { arquivo, ...conteudo } = caso
```


### tools/validate-dashboard.js


```text
1: const fs = require('fs')
2: const path = require('path')
3: const vm = require('vm')
5: const root = path.resolve(__dirname, '..')
6: const noop = () => {}
8: function dummyEl(id = '') {
36: function loadScript(file, context) {
40: function validate() {
41: const indexContext = {
43: Blob: function Blob() {},
53: const dashboardContext = {
64: Chart: function Chart() {},
71: const caseSources = [
75: const files = caseSources.flatMap(source => (
84: const extensao = path.extname(file).slice(1)
85: const importacao = indexContext.prepararImportacao(fs.readFileSync(file, 'utf8'), extensao)
86: const sc = dashboardContext.superficieCorporal(importacao.paciente.peso, importacao.paciente.alturaNum)
87: const historico = importacao.historico.map(exame => dashboardContext.completarExame(exame, sc))
```


## Apêndice E — Campos de formulário e constantes de apresentação


Campos HTML literais permitem localizar entradas, inclusive o modelo de checklist independente. Identificadores de apresentação não são novas variáveis clínicas.


### cases.html


| Elemento literal |
| --- |

| &lt;input id="buscaCasos" type="search" placeholder="Digite para buscar..."&gt; |

### checklist-modelo.html


| Elemento literal |
| --- |

| &lt;input type="date" name="data"&gt; |
| &lt;input type="text" name="sala" placeholder="Sala"&gt; |
| &lt;input type="time" name="inicio-cec"&gt; |
| &lt;input type="time" name="fim-cec"&gt; |
| &lt;input type="text" name="tempo-clampeamento" placeholder="min"&gt; |
| &lt;input type="text" name="paciente" placeholder="Nome / registro"&gt; |
| &lt;input type="text" name="idade" placeholder="Anos"&gt; |
| &lt;input type="text" name="peso" placeholder="kg"&gt; |
| &lt;input type="text" name="altura" placeholder="cm"&gt; |
| &lt;input type="text" name="sc" placeholder="m²"&gt; |
| &lt;input type="text" name="procedimento" placeholder="Procedimento cirúrgico"&gt; |
| &lt;input type="text" name="responsavel-montagem" placeholder="Nome"&gt; |
| &lt;input type="text" name="responsavel-cec" placeholder="Nome"&gt; |
| &lt;input type="text" name="perfusionista-check" placeholder="Nome"&gt; |
| &lt;input type="text" name="responsavel-final" placeholder="Nome"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;input type="checkbox"&gt; |
| &lt;textarea rows="4" placeholder="Descrever intercorrências, ações tomadas e pendências."&gt; |
| &lt;textarea rows="4" placeholder="Registrar pendências, comunicação com equipe e pontos para relatório."&gt; |
| &lt;input type="text"&gt; |
| &lt;input type="text"&gt; |
| &lt;input type="text"&gt; |

### dashboard.html


| Elemento literal |
| --- |

| &lt;input class="rounded-lg w-[30%]" type="number" name="tempo" id="tempo"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="fluxoInput" id="fluxoInput"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="hb" id="hb"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="hctAtt" id="hctAtt"&gt; |
| &lt;input class="rounded-l-lg w-[55%] min-w-0" type="number" step="0.01" name="lactatoAtt" id="lactatoAtt"&gt; |
| &lt;select id="unidadeLactato" class="rounded-r-lg w-[45%] bg-white text-slate-900 text-sm"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="sao2Att" id="sao2Att"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="ph" id="ph"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="svo2" id="svo2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="pao2" id="pao2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="paco2" id="paco2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="hco3" id="hco3"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="be" id="be"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="k" id="k"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="ca2" id="ca2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" step="0.1" name="temperaturaAtt" id="temperaturaAtt"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="pamAtt" id="pamAtt"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="fio2" id="fio2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" step="0.1" name="ivo2" id="ivo2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" step="0.1" name="gapPco2" id="gapPco2"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" step="0.1" name="na" id="na"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" step="0.1" name="cl" id="cl"&gt; |
| &lt;input class="rounded-lg w-[30%]" type="number" name="glicose" id="glicose"&gt; |
| &lt;input id="checklistData" type="date"&gt; |
| &lt;input id="checklistSala" type="text" placeholder="Ex.: sala 3"&gt; |
| &lt;input id="checklistInicioCec" type="time"&gt; |
| &lt;input id="checklistFimCec" type="time"&gt; |
| &lt;input id="checklistTempoClampeamento" type="number" min="0" step="1" placeholder="min"&gt; |
| &lt;input id="checklistRespMontagem" type="text" placeholder="Nome do perfusionista"&gt; |
| &lt;input id="checklistRespCec" type="text" placeholder="Nome do perfusionista"&gt; |
| &lt;input id="checklistPerfusionistaCheck" type="text" placeholder="Dupla checagem"&gt; |
| &lt;input id="checklistResponsavelFinal" type="text" placeholder="Nome do responsável"&gt; |
| &lt;input id="checklistProcedimento" type="text" placeholder="Procedimento cirúrgico"&gt; |
| &lt;input id="checklistIntercorrencias" type="text" placeholder="Registre intercorrências, se houver"&gt; |

### index.html


| Elemento literal |
| --- |

| &lt;input id="arquivoDados" type="file" accept=".csv,.json,text/csv,application/json" class="hidden"&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="procedimento" id="procedimento" placeholder="Tipo de cirurgia/procedimento..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="sexo" id="sexo" placeholder="Sexo..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="idade" id="idade" placeholder="Idade..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="peso" id="peso" placeholder="Peso..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="altura" id="altura" placeholder="Altura..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="hemoglobina" id="hemoglobina" placeholder="Hemoglobina..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="hematocrito" id="hematocrito" placeholder="Hematócrito..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="fluxo" id="fluxo" placeholder="Fluxo..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="temperatura" id="temperatura" placeholder="Temperatura..."&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="pam" id="pam" placeholder="Pressão Arterial Média..."&gt; |
| &lt;input class="rounded-l-2xl pl-2 w-[62%]" type="text" name="lactato" id="lactato" placeholder="Lactato..."&gt; |
| &lt;select id="unidadeLactatoInicial" class="rounded-r-2xl w-[38%] bg-white text-base"&gt; |
| &lt;input class="rounded-2xl pl-2" type="text" name="sao2" id="sao2" placeholder="Saturação de oxigênio..."&gt; |


Variáveis CSS de apresentação:


| Nome | Valor |
| --- | --- |

| --dashboard-border | #1e293b |
| --dashboard-panel | rgba(15, 23, 42, 0.42) |
| --dashboard-panel-strong | rgba(15, 23, 42, 0.68) |
| --dashboard-gap | clamp(0.75rem, 1.4vw, 1.25rem) |
| --dashboard-radius | clamp(1rem, 2vw, 1.4rem) |

## Apêndice F — Notas históricas extraídas dos documentos Word


A transcrição abaixo preserva a justificativa antiga para comparação com a implementação. Seus rótulos e propostas não substituem os capítulos 7 e 8 deste dossiê.


### justificativa-score.docx

```text
1. Fundamentação Teórica
A perfusão extracorpórea moderna tem migrado de estratégias baseadas exclusivamente em fluxo indexado (IC) para modelos orientados pela oferta de oxigênio (DO₂).
Estudos observacionais associam:
iDO₂ < 260–280 mL/min/m²com maior incidência de lesão renal aguda e complicações pós-operatórias.
Assim, o presente sistema foi estruturado com base em quatro eixos fisiológicos principais:
Oferta de oxigênio (iDO₂)
Capacidade de transporte (Hematócrito)
Adequação hemodinâmica (IC)
Resposta metabólica (Lactato)

2. Estrutura Conceitual do Escore
O escore foi construído com ponderação hierárquica baseada na relevância fisiológica:
2.1 Variável Primária
Índice de Oferta de Oxigênio (iDO₂)Peso: 40% do escore total
Justificativa:iDO₂ integra fluxo e conteúdo arterial de oxigênio, representando o determinante direto da disponibilidade tecidual de O₂.

2.2 Variáveis Secundárias
Hematócrito
Peso: 20%
Reflete capacidade de transporte de oxigênio e impacto da hemodiluição.
Lactato
Peso: 20%
Representa marcador metabólico indireto de hipoperfusão ou dependência de oferta.
Índice Cardíaco (IC)
Peso: 20%
Reflete adequação hemodinâmica ajustada à superfície corporal.

3. Estrutura de Pontuação
3.1 iDO₂ (0–4 pontos)
≥ 320 mL/min/m² → 4 pontos
300–319 → 3 pontos
260–299 → 2 pontos
< 260 → 0 pontos

3.2 Hematócrito (0–2 pontos)
≥ 25% → 2 pontos
22–24% → 1 ponto
< 22% → 0 pontos

3.3 Lactato (0–2 pontos)
≤ 2 mmol/L → 2 pontos
2–3 → 1 ponto
3 → 0 pontos

3.4 Índice Cardíaco (0–2 pontos)
≥ 2.4 L/min/m² → 2 pontos
2.2–2.39 → 1 ponto
< 2.2 → 0 pontos

4. Regras de Segurança (Critérios de Override Fisiológico)
Para evitar viés matemático em situações de risco fisiológico evidente, foram implementadas regras de corte:
4.1 Falha de Oferta Crítica
Se:
iDO₂ < 260E
Lactato > 3 mmol/L
Classificação final automaticamente definida como Perfusão Inadequada, independentemente da soma.
Justificativa:Associação de baixa oferta com evidência metabólica de hipoperfusão.

4.2 Hemodiluição com Fluxo Insuficiente
Se:
Hematócrito < 22%E
IC < 2.2
Subtrai-se 1 ponto do escore final.
Justificativa:Redução simultânea da capacidade de transporte e da entrega volumétrica.

5. Classificação Final
Escore
Interpretação Clínica
9–10
Perfusão ótima
7–8
Perfusão adequada
5–6
Perfusão limítrofe
≤ 4
Perfusão inadequada

6. Base Conceitual
O modelo é fundamentado em:
Perfusão orientada por DO₂
Estratégias de Patient Blood Management
Evidências observacionais sobre limiar crítico de oferta
Integração de parâmetros hemodinâmicos e metabólicos

7. Natureza do Sistema
Trata-se de um modelo educacional estruturado para:
Simulação de cenários perfusionais
Ensino de integração fisiológica
Avaliação comparativa de condutas
Não substitui julgamento clínico.

```


O texto do manual Word também foi extraído. Sua cobertura de 20 casos e sua descrição de regras foram comparadas ao acervo atual de 30 CSV e ao motor. O documento original continua disponível em `../casos-clinicos-didaticos/manual_interpretacao_cec_perfuselab.docx`.

