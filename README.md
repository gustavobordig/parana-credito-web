# Fluxo de Crédito: front

Interface para **cadastrar clientes e acompanhar em tempo real** o fluxo de concessão de crédito: cadastro → proposta → emissão de cartões, processados por três microsserviços que se comunicam via RabbitMQ.

| | |
|---|---|
| **Produção** | https://parana-credito-web.vercel.app |
| **Stack** | React 19 · TypeScript · Vite, sem bibliotecas de UI |

## Sumário

- [A solução completa](#a-solução-completa)
- [O que a tela faz](#o-que-a-tela-faz)
- [Como executar localmente](#como-executar-localmente)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura](#estrutura)
- [Build e deploy](#build-e-deploy)

## A solução completa

| Serviço | Responsabilidade | Repositório |
|---|---|---|
| **Clientes** | Cadastra o cliente e publica `ClienteCadastrado` | [parana-clientes-api](https://github.com/gustavobordig/parana-clientes-api) |
| **Propostas** | Calcula o score, decide o crédito e publica `PropostaGerada` | [parana-propostas-api](https://github.com/gustavobordig/parana-propostas-api) |
| **Cartões** | Emite os cartões da proposta aprovada | [parana-cartoes-api](https://github.com/gustavobordig/parana-cartoes-api) |
| Front | Cadastro e acompanhamento do fluxo | este |

## O que a tela faz

- **Cadastro** com máscara de CPF e prévia do score conforme a renda digitada.
- **Preencher exemplo:** gera um CPF válido diferente a cada clique, para testar várias vezes.
- **Linha do tempo** das três etapas. Proposta e cartões são gerados por eventos, de forma assíncrona; a tela consulta as APIs a cada segundo até cada etapa ficar pronta.
- **Cartões emitidos** desenhados com número mascarado e limite.
- **Consulta** de um cliente existente pelo id.
- **Erros de validação** da API listados na tela, todos de uma vez.
- **Correlation ID:** cada fluxo gera um id enviado no header `X-Correlation-Id` e mostrado na tela; com ele, a mesma operação é encontrada nos logs dos três serviços.
- Tema claro e escuro conforme o sistema e layout adaptado ao celular.

## Como executar localmente

**Pré-requisito:** Node.js 20.19 ou mais recente, com as três APIs rodando (veja o README de cada uma).

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5174. Sem arquivo `.env`, as URLs apontam para as APIs locais (portas 5101, 5102 e 5103).

### Variáveis de ambiente

Copie `.env.example` para `.env` para apontar para outras APIs. O Vite embute os valores no **build**: ao alterá-los, gere o build de novo.

| Variável | Padrão |
|---|---|
| `VITE_CLIENTES_API_URL` | `http://localhost:5101` |
| `VITE_PROPOSTAS_API_URL` | `http://localhost:5102` |
| `VITE_CARTOES_API_URL` | `http://localhost:5103` |

As APIs só aceitam chamadas das origens configuradas no CORS delas (`Cors__Origens__0`).

## Estrutura

```
src/
├── api.ts          Cliente HTTP das três APIs, tratamento de ProblemDetails e polling
├── types.ts        Contratos das respostas
├── formatos.ts     Máscara de CPF, moeda, datas e prévia do score
├── App.tsx         Orquestra o fluxo cadastro → proposta → cartões
├── styles.css      Tema claro/escuro e layout responsivo
└── components/
    ├── CadastroForm.tsx
    ├── ConsultaCliente.tsx
    ├── LinhaDoTempo.tsx
    ├── CartaoVisual.tsx
    └── FaixasScore.tsx
```

## Build e deploy

```bash
npm run build
```

Publicado na **Vercel**, com as três URLs das APIs configuradas como variáveis de ambiente do projeto. O repositório também tem um `Dockerfile` com nginx, que lê a porta de `PORT`, para publicar em qualquer plataforma de containers.
