# Protótipo pré-CEC — decisões e referências

Página independente: `prototipo-pre-cec.html`, na raiz. Abra diretamente no navegador. CSS/JS incorporados; imagem local `medias/pre-cec-parallax.png`. Não está incluída no build original. A integração depende de autorização do usuário.

## Experiência

Dados básicos → fluxo e temperatura → plano pronto, aguardando CEC. Rascunho local, retomada com nova revisão e exportação JSON. Não cria exames fictícios nem inicia CEC. Usa exclusivamente a chave `perfuselab.prototype.precec.v1`, sem alterar paciente ou históricos do sistema original. A página é restrita a adultos em CEC convencional; não cobre parada circulatória ou hipotermia profunda.

## Matemática e limites

- SC = √(peso × altura / 3600), sem arredondamento intermediário.
- Q de referência = SC × IC. IC inicial 2,4 L/min/m², editável.
- CaO₂ = 1,36 × Hb esperada durante CEC × SaO₂/100 + 0,003 × PaO₂ esperada.
- Q GDP = meta iDO₂ × SC / (10 × CaO₂).
- iDO₂ previsto = 10 × Q escolhido × CaO₂ / SC.
- GDP exige as três hipóteses explícitas. Hb basal não substitui Hb após hemodiluição. Não há estimativa automática de SaO₂ pela PaO₂.
- Dois fluxos distintos são apresentados; o profissional escolhe o planejado. Os botões arredondam para cima a 0,01 L/min, com aviso.
- Meta térmica informada pela equipe, entre 28–37 °C, sem inversão automática do fluxo em temperatura ideal. Faixas de entrada são limites deste protótipo, não intervalos clínicos de normalidade.
- Não se reutiliza a tabela térmica local antiga para prescrever resfriamento. Os alvos 280/300 são referências discutidas em normotermia; a interface avisa da limitação em hipotermia e não reduz o alvo automaticamente.
- IMC ≥30 sinaliza necessidade de individualizar a indexação. O cálculo não incorpora drenagem, cânulas, shunts, resistência ou capacidade do circuito.

## Fontes primárias consultadas em 25/10/2026

1. Wahba et al. **2024 EACTS/EACTAIC/EBCP Guidelines on cardiopulmonary bypass in adult cardiac surgery**, publicada em 2025. DOI 10.1093/ejcts/ezae354. [PubMed 39949326](https://pubmed.ncbi.nlm.nih.gov/39949326/) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11826095/). Seção 9.5: fluxo, superfície corporal e temperatura; uso habitual de 2,2–2,8 L/min/m². Tabela 43: referência GDP 280–300 em normotermia. Os trechos também foram recuperados por resultados indexados, pois aberturas posteriores do PMC retornaram proteção de navegador.
2. Ranucci et al. **Goal-directed perfusion to reduce acute kidney injury: A randomized trial**, 2018. DOI 10.1016/j.jtcvs.2018.04.045. [PubMed 29778331](https://pubmed.ncbi.nlm.nih.gov/29778331/). Estratégia estudada com iDO₂ ≥280. Não valida este protótipo ou uma previsão individual de fluxo ideal.
3. **STS/SCA/AmSECT Clinical Practice Guidelines for Cardiopulmonary Bypass—Temperature Management During Cardiopulmonary Bypass**, 2015. DOI 10.1016/j.athoracsur.2015.03.126. [Documento oficial STS](https://www.sts.org/sites/default/files/documents/Guidelines_CPB%20Temperature%20Management.pdf). Controle térmico e prevenção de hipertermia; temperatura arterial de saída do oxigenador difere da meta do paciente.
4. **Cardiopulmonary bypass temperature, hematocrit, and cerebral oxygen delivery in humans**. [PubMed 8787461](https://pubmed.ncbi.nlm.nih.gov/8787461/). Interação de temperatura, hemodiluição e oxigenação cerebral; não fornece temperatura ideal individual pelo fluxo.
5. Mosteller, 1987. [PubMed 3657876](https://pubmed.ncbi.nlm.nih.gov/3657876/). Referência de SC já utilizada no projeto.

Não foi identificada nessas fontes uma equação inversa validada de fluxo para temperatura ideal. Por isso, a interface pede a meta térmica da equipe e contextualiza os cálculos, sem sugerir resfriamento para compensar déficit de fluxo.

## ImageGen

Fundo gerado pelo **ImageGen integrado**, sem CLI. Arquivo final: `medias/pre-cec-parallax.png`. Ilustração fotográfica gerada, não fotografia de equipamento clinicamente validado. Parallax limitado à região do hero e desativado em movimento reduzido.

Prompt final:

> Create a premium photographic website background for a Portuguese clinical perfusion planning application. Use case: photorealistic-natural. Asset: wide landscape 16:9 hero background intended for subtle parallax behind a dark navy translucent overlay and white UI typography. Scene: immaculate modern cardiac operating room prepared before surgery, cardiopulmonary bypass pump and clear tubing softly visible on the right, defocused surgical lighting and cool blue teal atmosphere, no patient, no blood, no people. Cinematic restrained editorial hospital photography, believable equipment rather than science fiction, fine natural texture, soft depth of field. Keep the left half calm and dark with negative space for readable headline; right half has refined softly lit equipment. No letters, no numbers, no logos, no watermark. Background only, not a screenshot or UI mockup.

## Testes

`node tools/testar-prototipo-pre-cec.cjs` usa Playwright e Edge headless no runtime local. Testa fórmulas independentemente, entradas inválidas, dados ausentes, idade pediátrica, invariância térmica da meta, rascunho, preparo sem iniciar CEC, edição, isolamento do armazenamento, mobile e movimento reduzido. Capturas em `docs/prototipo-pre-cec/`. Os caminhos do runtime devem ser adaptados em outra máquina.

Para integração futura: separar planejamento de medições, registrar o instante real de início da CEC e criar a primeira monitorização apenas com valores reais. Nenhuma integração foi realizada nesta entrega.
