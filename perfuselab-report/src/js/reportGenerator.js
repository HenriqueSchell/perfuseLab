// reportGenerator.js
document.addEventListener('DOMContentLoaded', function() {
    fetch('../data/exames.json')
        .then(response => response.json())
        .then(data => {
            generateReport(data);
        })
        .catch(error => console.error('Error fetching data:', error));
});

function generateReport(data) {
    const reportContainer = document.getElementById('report-container');
    const historyTable = document.createElement('table');
    historyTable.className = 'report-table';

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Data</th>
        <th>Tempo (min)</th>
        <th>Fluxo (L/min)</th>
        <th>Hemoglobina (g/dL)</th>
        <th>Hematócrito (%)</th>
        <th>Lactato (mmol/L)</th>
        <th>SaO² (%)</th>
        <th>iDO² (ml/min/m²)</th>
        <th>Índice Cardíaco (L/min/m²)</th>
    `;
    historyTable.appendChild(headerRow);

    data.historico.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.data}</td>
            <td>${entry.tempo}</td>
            <td>${entry.fluxo}</td>
            <td>${entry.hb}</td>
            <td>${entry.hct}</td>
            <td>${entry.lactato}</td>
            <td>${entry.sao2}</td>
            <td>${entry.ido2}</td>
            <td>${entry.ic}</td>
        `;
        historyTable.appendChild(row);
    });

    reportContainer.appendChild(historyTable);
    generateCharts(data);
}

function generateCharts(data) {
    const ctx = document.getElementById('report-chart').getContext('2d');
    const chartData = {
        labels: data.historico.map(entry => entry.data),
        datasets: [
            {
                label: 'Hemoglobina (g/dL)',
                data: data.historico.map(entry => entry.hb),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            },
            {
                label: 'Lactato (mmol/L)',
                data: data.historico.map(entry => entry.lactato),
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            },
            {
                label: 'Índice Cardíaco (L/min/m²)',
                data: data.historico.map(entry => entry.ic),
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false
            }
        ]
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}