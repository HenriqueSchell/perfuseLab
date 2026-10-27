// src/js/charts.js

function createChart(ctx, labels, data, label) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
                fill: true,
            }]
        },
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

function renderCharts(examData) {
    const ctxHb = document.getElementById('chartHb').getContext('2d');
    const ctxLactato = document.getElementById('chartLactato').getContext('2d');
    const ctxIC = document.getElementById('chartIC').getContext('2d');
    const ctxIdo2 = document.getElementById('chartIdo2').getContext('2d');

    const labels = examData.map(exam => exam.date);
    const hbData = examData.map(exam => exam.hb);
    const lactatoData = examData.map(exam => exam.lactato);
    const icData = examData.map(exam => exam.ic);
    const ido2Data = examData.map(exam => exam.ido2);

    createChart(ctxHb, labels, hbData, 'Hemoglobina (g/dL)');
    createChart(ctxLactato, labels, lactatoData, 'Lactato (mmol/L)');
    createChart(ctxIC, labels, icData, 'Índice Cardíaco (L/min/m²)');
    createChart(ctxIdo2, labels, ido2Data, 'iDO² (mL/min/m²)');
}

export { renderCharts };