// Este arquivo contém a lógica JavaScript para o dashboard, incluindo a manipulação de dados do paciente e a atualização da interface.

document.addEventListener('DOMContentLoaded', () => {
    // Simulação de dados do paciente
    const paciente = {
        sexo: 'Masculino',
        idade: 45,
        peso: 75,
        altura: 1.80,
        sc: 'Normal'
    };

    // Atualiza os campos do paciente no dashboard
    document.getElementById('campoSexo').innerText = `Sexo: ${paciente.sexo}`;
    document.getElementById('campoIdade').innerText = `Idade: ${paciente.idade} anos`;
    document.getElementById('campoPeso').innerText = `Peso: ${paciente.peso} kg`;
    document.getElementById('campoAltura').innerText = `Altura: ${paciente.altura} m`;
    document.getElementById('campoSC').innerText = `Estado Clínico: ${paciente.sc}`;

    // Simulação de dados de exames
    const historicoExames = [
        { tempo: 30, fluxo: 5.0, hb: 14.5, hct: 45, lactato: 1.2, sao2: 98 },
        { tempo: 45, fluxo: 4.5, hb: 13.8, hct: 43, lactato: 1.0, sao2: 97 },
        // Adicione mais dados conforme necessário
    ];

    // Função para atualizar a tabela de exames
    function atualizarTabelaExames() {
        const tabela = document.getElementById('tabelaExames').getElementsByTagName('tbody')[0];

        historicoExames.forEach((exame, index) => {
            let row = tabela.insertRow(index);
            row.insertCell(0).innerText = exame.tempo;
            row.insertCell(1).innerText = exame.fluxo;
            row.insertCell(2).innerText = exame.hb;
            row.insertCell(3).innerText = exame.hct;
            row.insertCell(4).innerText = exame.lactato;
            row.insertCell(5).innerText = exame.sao2;
        });
    }

    atualizarTabelaExames();

    // Função para gerar gráficos
    function gerarGraficos() {
        // Aqui você pode chamar funções do charts.js para gerar gráficos
        // Exemplo: gerarGraficoLactato(historicoExames);
    }

    gerarGraficos();
});