# Publicacao em producao

Este projeto esta preparado para frontend estatico na Netlify, backend Node/Express no Render e banco MongoDB Atlas.

## Estrutura

- Frontend: arquivos estaticos na raiz (`index.html`, `dashboard.html`, `cases.html`, `checklist-modelo.html`) e assets em `src/` e `medias/`.
- Backend: `server/`, com entrada em `server/index.js`.
- Build publico do frontend: `dist/`, gerado por `npm run build:frontend`.

## Variaveis do backend

Cadastre no Render:

```text
NODE_ENV=production
MONGO_URI=
MONGODB_DB=
FRONTEND_URL=
PERFUSELAB_AUTH_USER=
PERFUSELAB_AUTH_PASSWORD=
PERFUSELAB_AUTH_SECRET=
PERFUSELAB_AUTH_TOKEN_TTL_HOURS=8
```

Observacoes:

- `PORT` e definido automaticamente pelo Render. Nao precisa cadastrar, salvo necessidade especifica.
- `MONGO_URI` deve ser a URI real do MongoDB Atlas.
- `MONGODB_DB` e opcional se a URI ja apontar para o banco correto.
- `FRONTEND_URL` deve ser a URL oficial da Netlify, sem barra final.
- `PERFUSELAB_AUTH_USER` e `PERFUSELAB_AUTH_PASSWORD` sao o login da aplicacao para acessar casos salvos.
- `PERFUSELAB_AUTH_SECRET` assina os tokens de sessao. Gere um valor longo e aleatorio, por exemplo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `PERFUSELAB_AUTH_TOKEN_TTL_HOURS` define por quantas horas o login fica valido na aba do navegador.

## Deploy do backend no Render

Crie um novo Web Service no Render apontando para o repositorio.

Use:

```text
Root Directory: .
Build Command: npm ci
Start Command: npm start
Node: 20 ou superior
```

Importante: o start command correto e `npm start`. Nao use `node start`, porque isso faz o Render procurar um arquivo chamado `start` e o deploy falha com `Cannot find module '/opt/render/project/src/start'`.

Depois cadastre as variaveis de ambiente do backend e publique.

Endpoint de teste:

```text
https://<seu-backend-render>/api/health
```

Resposta esperada quando a API e o Mongo estiverem ativos:

```json
{
  "ok": true,
  "service": "perfuselab-api",
  "database": "connected"
}
```

## Variavel do frontend na Netlify

Cadastre na Netlify:

```text
VITE_API_URL=https://<seu-backend-render>
```

Depois de cadastrar ou alterar essa variavel, faca um novo deploy da Netlify. O build gera `dist/src/js/runtime-env.js` com essa URL publica.

Configuracao da Netlify:

```text
Build Command: npm run build:frontend
Publish Directory: dist
```

Esses valores tambem estao em `netlify.toml`.

## Desenvolvimento local

Crie `.env` local a partir de `.env.example`.

Backend:

```bash
npm install
npm run dev:server
```

Frontend:

```bash
npm run dev:frontend
```

Abra:

```text
http://localhost:5173
```

O servidor local do frontend injeta `http://localhost:3000` como API por padrao.

## Checklist de teste

1. Backend online:
   - Acesse `/api/health`.
   - Deve retornar `ok: true`.

2. MongoDB conectado:
   - Em `/api/health`, `database` deve ser `connected`.
   - Se vier `disconnected`, revise `MONGO_URI`, permissao de rede do Atlas e usuario/senha.

3. Frontend acessando a API:
   - Abra a Netlify.
   - Entre em "Casos salvos".
   - Informe o usuario e a senha cadastrados no Render.
   - Se a lista carregar ou retornar "nenhum caso", a chamada autenticada chegou na API.

4. Persistencia:
   - Abra um caso no dashboard.
   - Clique em "Salvar caso".
   - Confirme no MongoDB Atlas se surgiu documento em `perfusioncases`.
   - Abra "Casos salvos" no frontend e confira se o caso aparece.

## Seguranca

- Nao versionar `.env`.
- Nao colocar `MONGO_URI` no frontend.
- Nao colocar `PERFUSELAB_AUTH_PASSWORD` ou `PERFUSELAB_AUTH_SECRET` no frontend.
- Nao usar origem aberta em producao.
- Nao publicar a raiz inteira do repositorio na Netlify; use `dist/`.
- Se uma credencial real tiver sido enviada para GitHub, rotacione usuario/senha no MongoDB Atlas.
