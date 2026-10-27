# PerfuseLab Report

Este projeto é uma aplicação web para monitoramento e geração de relatórios de dados de pacientes, focando em exames relacionados à perfusão.

## Estrutura do Projeto

O projeto é organizado da seguinte forma:

```
perfuselab-report
├── src
│   ├── dashboard.html        # Interface do dashboard para exibição em tempo real dos dados do paciente.
│   ├── report.html           # Relatório separado que apresenta os dados do paciente e gráficos.
│   ├── css
│   │   └── style.css         # Estilos CSS utilizados no dashboard e no relatório.
│   ├── js
│   │   ├── dashboard.js      # Lógica JavaScript para o dashboard.
│   │   ├── charts.js         # Geração de gráficos utilizando Chart.js.
│   │   └── reportGenerator.js # Lógica para gerar o relatório a partir dos dados do histórico de exames.
│   └── data
│       └── exames.json       # Dados dos exames do paciente em formato JSON.
├── server
│   ├── index.js              # Ponto de entrada do servidor.
│   └── routes
│       └── report.js         # Rotas relacionadas ao relatório.
├── .gitignore                 # Arquivos e pastas a serem ignorados pelo Git.
├── package.json               # Configurações do npm e dependências do projeto.
└── README.md                  # Documentação do projeto.
```

## Instalação

1. Clone o repositório:
   ```
   git clone <URL_DO_REPOSITORIO>
   ```

2. Navegue até o diretório do projeto:
   ```
   cd perfuselab-report
   ```

3. Instale as dependências:
   ```
   npm install
   ```

## Uso

1. Inicie o servidor:
   ```
   npm start
   ```

2. Acesse o dashboard em seu navegador:
   ```
   http://localhost:3000
   ```

3. Para visualizar o relatório, navegue até:
   ```
   http://localhost:3000/report
   ```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.