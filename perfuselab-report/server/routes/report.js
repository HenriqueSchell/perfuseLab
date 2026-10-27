const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Rota para gerar o relatório
router.get('/relatorio', (req, res) => {
    // Lê os dados dos exames do arquivo JSON
    fs.readFile(path.join(__dirname, '../../src/data/exames.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Erro ao ler os dados dos exames.');
        }

        const exames = JSON.parse(data);

        // Renderiza o arquivo report.html com os dados dos exames
        res.render('report', { exames });
    });
});

module.exports = router;