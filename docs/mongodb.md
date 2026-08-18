# MongoDB no PerfuseLab

O backend Node/Express persiste casos do PerfuseLab no MongoDB Atlas.

## Variaveis necessarias

Crie um arquivo `.env` local a partir de `.env.example` e preencha:

```env
MONGO_URI=
MONGODB_DB=
PORT=
FRONTEND_URL=
```

`MONGO_URI` deve conter a string real do MongoDB Atlas. Nunca coloque essa URI no codigo, em arquivos publicos ou no frontend.

`MONGODB_URI` ainda e aceito pelo backend como compatibilidade temporaria, mas o nome recomendado daqui para frente e `MONGO_URI`.

## Como rodar localmente

Em um terminal:

```bash
npm install
npm run dev:server
```

Em outro terminal:

```bash
npm run dev:frontend
```

O frontend local fica em:

```text
http://localhost:5173
```

A API local fica em:

```text
http://localhost:3000
```

## Endpoints principais

```text
GET  /api/health
GET  /api/cases
POST /api/cases
POST /api/cases/sync
GET  /api/cases/:id
PUT  /api/cases/:id
PATCH /api/cases/:id/archive
```

## Colecao criada

O MongoDB cria o banco e a colecao automaticamente na primeira gravacao.

Colecao principal:

```text
perfusioncases
```

## Observacao clinica

O banco apenas persiste dados e snapshots de analise. Ele nao transforma o PerfuseLab em sistema autonomo de decisao clinica.
