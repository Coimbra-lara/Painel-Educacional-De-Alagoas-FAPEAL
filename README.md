# Painel de Indicadores Educacionais de Alagoas

Dados educacionais reais vêm com inconsistências reais: redes que se sobrepõem, escolas contadas duas vezes, percentuais que não podem ser somados. Este projeto nasceu para enfrentar exatamente isso — uma aplicação full-stack que transforma 145.028 linhas de dados brutos dos 102 municípios de Alagoas (2007–2025) em um dashboard confiável, sem inflar números nem esconder as armadilhas do dado real.

No backend, uma API REST em Node.js, Express e TypeScript com Prisma ORM processa arquivos CSV via streaming — sem estourar memória mesmo em arquivos de 13MB —, persiste em PostgreSQL/SQLite otimizado com índices compostos, e responde agregações em menos de 1 segundo mesmo na base completa. No frontend, React, TypeScript e Tailwind CSS entregam filtros dinâmicos, gráficos interativos e um mapa coroplético de Alagoas, tudo pensado para lidar com escala desde o primeiro dia.

---

### 💡 Por que a Aplicação já Abre com o CSV Exigido Carregado?

Para garantir uma **experiência de avaliação imediata e sem fricção**, a aplicação **já vem configurada e inicializada out-of-the-box com a base de dados no banco SQLite (`backend/prisma/dev.db`)**.

Dessa forma, ao clonar o repositório e executar a aplicação, o usuário avaliador visualiza instantaneamente no navegador (`http://localhost:3000`) todos os indicadores, gráficos de série temporal, mapa interativo de Alagoas e tabelas paginadas pré-carregados. 

Ao mesmo tempo, o sistema preserva a funcionalidade completa de upload pelo modal da interface ("Importar Arquivo CSV"), permitindo enviar novos arquivos ou reimportar dados a qualquer momento com validação de registros duplicados e substituição transacional limpa.

---

## 📌 Sumário

1. [Como Rodar o Projeto do Zero](#1-como-rodar-o-projeto-do-zero)
   - [1.1 Pré-requisitos](#11-pré-requisitos-)
   - [1.2 Clonar o repositório](#12-clonar-o-repositório-)
   - [1.3 Rodar com Docker](#13-rodar-com-docker)
   - [1.4 Guia de comandos para rodar em Docker](#14-guia-de-comandos-para-rodar-em-docker)
   - [1.5 Rodar sem Docker](#15-rodar-sem-docker)
2. [Decisões de Tratamento dos Dados](#2-decisões-de-tratamento-dos-dados)
   - [2.1 Tratamento da Hierarquia em ensino_rede (4.1)](#21-tratamento-da-hierarquia-em-ensino_rede-41)
   - [2.2 Duplicidade em ensino_tipo na variável "Escolas" (4.2)](#22-duplicidade-em-ensino_tipo-na-variável-escolas-42)
   - [2.3 Média Ponderada vs. Média Simples de Percentuais (4.3)](#23-média-ponderada-vs-média-simples-de-percentuais-43)
   - [2.4 Cobertura Temporal Distinta entre Fontes (4.4)](#24-cobertura-temporal-distinta-entre-fontes-44)
   - [2.5 Comportamento de Reimportação do Mesmo Arquivo (4.5)](#25-comportamento-de-reimportação-do-mesmo-arquivo-45)
   - [2.6 Distinção entre Zero e Valor Ausente (4.6)](#26-distinção-entre-zero-e-valor-ausente-46)
   - [2.7 Processamento em Streaming e Indexação (4.7)](#27-processamento-em-streaming-e-indexação-47)
3. [Conferência dos Números](#3-conferência-dos-números)
4. [Esquematização da Arquitetura do Projeto](#4-esquematização-da-arquitetura-do-projeto)
5. [Funcionamento das APIs Utilizadas & Análise de Performance](#5-funcionamento-das-apis-utilizadas--análise-de-performance)
6. [Testes Realizados](#6-testes-realizados)
7. [O que ficou de fora (Funcionalidades Opcionais e Próximos Passos)](#7-o-que-ficou-de-fora-funcionalidades-opcionais-e-próximos-passos)

---

## 1. Como Rodar o Projeto do Zero

O projeto suporta duas formas principais de execução: **com Docker** (banco PostgreSQL) ou **sem Docker** (banco SQLite leve).

### 1.1 Pré-requisitos ✅
- **Node.js**: v18+ ou v20+ instalado
- **npm**: v9+ ou v10+ instalado
- **Docker e Docker Compose** *(opcional, necessário apenas se optar por rodar via Docker)*

### 1.2 Clonar o Repositório ✅

```bash
git clone https://github.com/seu-usuario/alagoas-edu.git
cd alagoas-edu
```

---

### 1.3 Rodar com Docker

Para rodar a camada de banco de dados com PostgreSQL em contêiner Docker:

```bash
docker-compose up -d
```

---

### 1.4 Guia de comandos para rodar em Docker

#### Passo 1: Instalar dependências no Backend e Frontend
```bash
cd backend && npm install
cd ../frontend && npm install
```

#### Passo 2: Configurar o arquivo de ambiente para usar PostgreSQL
Na pasta `backend`, crie ou edite o arquivo `.env`:

```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/alagoas_edu?schema=public"
```

> **Nota:** O script `prepare-prisma.js` é executado automaticamente ao iniciar e ajusta o provider do Prisma para PostgreSQL.

#### Passo 3: Iniciar a aplicação
Em **dois terminais separados**:

```bash
# Terminal 1 — Backend API (porta 3001)
cd backend
npm run dev

# Terminal 2 — Frontend Dashboard (porta 3000)
cd frontend
npm run dev
```

Acesse a interface no navegador em `http://localhost:3000`.

---

### 1.5 Rodar sem Docker

Para rodar de forma simples e rápida sem necessidade do Docker (utilizando SQLite out-of-the-box):

#### Passo 1: Instalar dependências
```bash
cd backend && npm install
cd ../frontend && npm install
```

#### Passo 2: Configurar o arquivo `.env` do Backend
Na pasta `backend`, certifique-se de que o `.env` contém:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
```

#### Passo 3: Iniciar a aplicação
Em **dois terminais separados**:

```bash
# Terminal 1 — Backend (porta 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 3000)
cd frontend
npm run dev
```

Navegue até `http://localhost:3000`.

---

## 2. Decisões de Tratamento dos Dados

Esta seção documenta as regras de negócio e rigor matemático adotados para mitigar inconsistências nos dados educacionais brutos:

### 2.1 Tratamento da Hierarquia em `ensino_rede` (4.1)
- **Problema**: A coluna `ensino_rede` possui os valores `Estadual`, `Municipal`, `Federal`, `Privada`, `Pública` (Estadual + Municipal + Federal) e `Total` (Pública + Privada). Somar todas as redes ingenuamente faz com que o mesmo aluno seja contado até 3 vezes (ex: em Maceió 2023, Ensino Fundamental, a soma ingênua das redes resulta em 284.567, enquanto a população real é de **109.026**).
- **Decisão**: Toda agregação de matrículas e ofertas por município utiliza rigorosamente o filtro `ensino_rede = 'Total'` como padrão na camada de banco de dados/API, garantindo que o valor exibido para Maceió 2023 seja exatamente **109.026**.

### 2.2 Duplicidade em `ensino_tipo` na variável "Escolas" (4.2)
- **Problema**: Uma escola que oferece Educação Infantil e Ensino Fundamental é contabilizada em ambas as etapas. A soma de escolas entre as etapas resulta no número de ofertas de ensino, e não na quantidade de prédios escolares físicos.
- **Decisão**: Todos os cards e gráficos referentes à contagem de escolas são explicitamente rotulados na interface como **"Ofertas de Ensino"**, informando claramente o usuário sobre a natureza da métrica.

### 2.3 Média Ponderada vs. Média Simples de Percentuais (4.3)
- **Problema**: Calcular a média simples entre taxas de aprovação/abandono de municípios com populações discrepantes (ex: Maceió com ~109 mil matrículas vs Piaçabuçu com ~2,4 mil) distorce a taxa real do Estado.
- **Decisão**: Adotamos a **Média Ponderada por Matrículas** `soma(taxa × matrículas) / soma(matrículas)` como padrão para agregação de taxas de aprovação e abandono. A interface sinaliza explicitamente a fórmula e o método de cálculo.

### 2.4 Cobertura Temporal Distinta entre Fontes (4.4)
- **Problema**: `censo_escolar` e `indicadores_rendimento` possuem dados anuais, enquanto `censo_demografico` contém apenas os anos censitários 2010 e 2022.
- **Decisão**: Filtros aplicados em anos sem Censo Demográfico (ex: 2019) exibem a mensagem **"Sem dado no período"** e omitem o ponto no gráfico (preservando o valor `null`), sem jamais preencher com `0` ou tratar ausência como taxa zero.

### 2.5 Comportamento de Reimportação do Mesmo Arquivo (4.5)
- **Decisão**: Ao enviar um novo arquivo CSV pelo modal de upload, a aplicação adota a estratégia de **substituição transacional limpa** do dataset anterior (`deleteMany` + batch inserts em stream), evitando a duplicação indevida de dados. Além disso, linhas duplicadas presentes no próprio arquivo são descartadas durante o parsing e informadas ao usuário.

### 2.6 Distinção entre Zero e Valor Ausente (4.6)
- **Decisão**: O parser preserva valores reais `valor = 0.0` (ex: município com 0 escolas federais) e trata o que não foi registrado como `null` no backend e na API JSON, evitando quedas artificiais nas séries temporais.

### 2.7 Processamento em Streaming e Indexação (4.7)
- **Decisão**: Optamos por processar o CSV bruto com parsing em lote (`csv-parse` stream) e calcular as agregações sob demanda utilizando o índice composto `(ano, variavel, ensino_rede, ensino_tipo)` no banco SQLite/PostgreSQL. Isso garante tempo de resposta inferior a 1 segundo para a base de 145 mil linhas.

---

## 3. Conferência dos Números

A aplicação foi validada rigorosamente contra os requisitos numéricos do desafio (testados contra a base de amostra oficial de 3.534 linhas e validados na base completa):

| Métrica / Requisito | Valor Esperado | Valor Obtido / Status |
|---|---|:---:|
| Total de linhas lidas (fora cabeçalho) | 3.534 linhas | **3.534** (100% OK) |
| Municípios distintos na amostra | 10 municípios | **10** (100% OK) |
| Anos distintos na amostra | [2010, 2019, 2021, 2022, 2023] | **[2010, 2019, 2021, 2022, 2023]** (100% OK) |
| Matrículas 2023, rede Total, 5 etapas, 10 municípios | 380.454 | **380.454** (100% OK) |
| Maceió 2023, Matrícula Ensino Fundamental Total | 109.026 | **109.026** (100% OK) |
| Taxa de Aprovação Ponderada (Ens. Fund. 2023, Total) | 96,16% | **96,16%** (100% OK) |
| Taxa de Analfabetismo em Maceió | 11,86% (2010) e 8,42% (2022) | **11,86% e 8,42%** (100% OK) |
| Taxa de Analfabetismo em Piaçabuçu | 31,77% (2010) e 22,83% (2022) | **31,77% e 22,83%** (100% OK) |

---

## 4. Esquematização da Arquitetura do Projeto

### Fluxo da Arquitetura

```
+-------------------------------------------------------------------+
|                        FRONTEND (React + Vite)                    |
|  - Filtros Dinâmicos (Município, Ano, Rede, Etapa, Variável)      |
|  - Dashboard (Cards Indicadores, Gráficos Recharts, Mapa Leaflet) |
|  - Modal de Upload CSV                                            |
+-----------------------------------+-------------------------------+
                                    | HTTP / JSON REST
                                    v
+-------------------------------------------------------------------+
|                       BACKEND (Express + TypeScript)              |
|  - Controllers / Routes (/api/indicadores, /api/mapa, etc.)       |
|  - Service CSV Stream Parser (csv-parse + zod validation)         |
|  - Repository Layer (Agregações otimizadas & Média Ponderada)     |
+-----------------------------------+-------------------------------+
                                    | Prisma ORM
                                    v
+-------------------------------------------------------------------+
|                   BANCO DE DADOS (SQLite / PostgreSQL)            |
|  - Tabela: medidas                                                |
|  - Índices Compostos:                                             |
|    * idx_medidas_principal (variavel, ano, ensino_rede, tipo)     |
|    * idx_medidas_municipio (co_mun, variavel, ano)                |
|    * idx_medidas_agregacao (ano, variavel, ensino_rede, tipo)     |
+-------------------------------------------------------------------+
```

### Modelo de Banco de Dados (`schema.prisma`)

```prisma
model Medida {
  id          Int    @id @default(autoincrement())
  co_mun      String
  no_mun      String
  ano         Int
  fonte       String
  variavel    String
  ensino_rede String
  ensino_tipo String
  valor       Float

  @@index([variavel, ano, ensino_rede, ensino_tipo], name: "idx_medidas_principal")
  @@index([variavel, ensino_rede], name: "idx_medidas_rede")
  @@index([co_mun, variavel, ano], name: "idx_medidas_municipio")
  @@index([ano, variavel, ensino_rede, ensino_tipo], name: "idx_medidas_agregacao")
  @@index([co_mun, ano], name: "idx_medidas_municipio_ano")
  @@index([variavel], name: "idx_medidas_variavel")
  @@map("medidas")
}
```

---

## 5. Funcionamento das APIs Utilizadas & Análise de Performance

### Principais Endpoints da API REST

- `GET /api/filtros`: Retorna os valores únicos disponíveis para preencher os seletores de filtros.
- `GET /api/indicadores`: Retorna os valores consolidados dos cards (Matrículas, Escolas, Taxa de Aprovação, Abandono, Analfabetismo).
- `GET /api/series`: Retorna a série temporal histórica para gráficos de linha.
- `GET /api/ranking`: Retorna o ranking de municípios (Top N).
- `GET /api/mapa`: Retorna os dados agregados por município para coloração do mapa coroplético.
- `GET /api/distribuicao`: Retorna a distribuição por rede ou etapa para gráficos de rosca/barras.
- `GET /api/dados`: Consulta paginada server-side para a tabela de dados brutos.
- `POST /api/upload`: Endpoint multipart para upload e importação de arquivo CSV via streaming.
- `GET /api/health`: Healthcheck da aplicação.

---

### Tabela de Análise de Performance dos Endpoints (Base Completa - 145.028 Registros)

Conforme exigido no desafio, os tempos de resposta foram medidos na **base completa de grande escala (145.028 registros)** em 10 execuções consecutivas por endpoint:

| Endpoint | Parâmetros Utilizados | Tempo Mínimo | Tempo Máximo | Tempo Médio | Requisito (< 1s) |
|---|---|:---:|:---:|:---:|:---:|
| `GET /api/filtros` | *Nenhum* (lista de seletores distintos) | 249,03 ms | 353,89 ms | **271,39 ms** | ✅ Atende |
| `GET /api/indicadores` | `anoInicio=2023&anoFim=2023` | 5,28 ms | 7,89 ms | **5,93 ms** | ✅ Atende |
| `GET /api/indicadores` | `municipio=2704302&anoInicio=2010&anoFim=2023&rede=Total&etapa=Ensino Fundamental` | 2,71 ms | 4,38 ms | **3,16 ms** | ✅ Atende |
| `GET /api/series` | `variavel=Matrícula&anoInicio=2007&anoFim=2025` | 94,26 ms | 108,98 ms | **98,05 ms** | ✅ Atende |
| `GET /api/series` | `variavel=Taxa de Aprovação&municipio=2704302&anoInicio=2010&anoFim=2023&rede=Total&etapa=Ensino Fundamental` | 83,19 ms | 101,74 ms | **88,03 ms** | ✅ Atende |
| `GET /api/ranking` | `variavel=Matrícula&anoInicio=2023&anoFim=2023&limite=10` | 18,76 ms | 28,21 ms | **21,83 ms** | ✅ Atende |
| `GET /api/mapa` | `variavel=Matrícula&anoInicio=2023&anoFim=2023` | 15,49 ms | 18,93 ms | **17,85 ms** | ✅ Atende |
| `GET /api/distribuicao` | `variavel=Matrícula&anoInicio=2023&anoFim=2023&visao=rede` | 2,08 ms | 4,55 ms | **2,77 ms** | ✅ Atende |
| `GET /api/distribuicao` | `variavel=Matrícula&anoInicio=2023&anoFim=2023&visao=etapa` | 2,55 ms | 3,78 ms | **2,95 ms** | ✅ Atende |
| `GET /api/dados` | `pagina=1&tamanho=10` | 10,08 ms | 18,92 ms | **11,28 ms** | ✅ Atende |
| `GET /api/dados` | `municipio=2704302&anoInicio=2010&anoFim=2023&rede=Total&etapa=Ensino Fundamental&pagina=1&tamanho=10` | 1,06 ms | 2,13 ms | **1,25 ms** | ✅ Atende |

> **Resultado:** Todos os endpoints responderam em **sub-segundos (máximo de 353,89 ms)**, cumprindo com folga o limite de 1 segundo exigido.

---

## 6. Testes Realizados

A aplicação conta com uma suíte de testes automatizados com **Vitest** e **Supertest** que cobrem as regras de negócio e validações essenciais:

Para rodar os testes:
```bash
cd backend
npm test
```

### Principais Cenários Testados:
1. **Validade de dados numéricos (Seção 10)**: Totais de linhas, municípios, anos, matrículas de Maceió e médias ponderadas de aprovação e analfabetismo.
2. **Rejeição de cabeçalhos inválidos**: Testes que confirmam a recusa imediata de arquivos CSV com colunas faltando ou alteradas.
3. **Tratamento de arquivos vazios**: Garante que o parser processe 0 linhas sem quebrar a API.
4. **Descarte de registros duplicados**: Valida que registros duplicados no próprio CSV sejam identificados, ignorados e notificados no relatório.
5. **Diferenciação entre Zero e Nulo**: Teste de integridade de `valor = 0.0` vs inexistência de dados (`null`).
6. **Validação de Intervalo de Anos**: Verificação de rejeição com erro HTTP 400 (`INVALID_YEAR_RANGE`) caso `anoInicio > anoFim`.

---

## 7. O que ficou de fora (Funcionalidades Opcionais e Próximos Passos)

Visando garantir o cumprimento impecável do núcleo obrigatório do desafio — com rigor matemático, performance de sub-segundo e mapa coroplético responsivo —, os seguintes pontos de escopo opcional não foram incluídos nesta entrega inicial:

1. **Escolas individuais no mapa (Seção 8.2)**: 
   - *Justificativa*: O arquivo CSV fornecido é agregado por município e não contém códigos de escola ou coordenadas geográficas de latitude/longitude. Exibir escolas individuais exigiria baixar, tratar e relacionar uma base externa separada (microdados do INEP), o que traria risco de tempo e validação. Optou-se por priorizar a entrega perfeita do **mapa coroplético municipal (Seção 8.1)**, indicado pelo desafio como o diferencial mais forte.
   - *Próximos passos*: Utilizar o projeto Base dos Dados (`basedosdados.org`), que já espelha os microdados do INEP em SQL, para importar as coordenadas de cada prédio escolar e plotá-los como marcadores sobre o mapa coroplético existente.

2. **Outros cruzamentos externos (Seção 8.3 — população, IDEB, IDHM, área territorial)**: 
   - *Justificativa*: Embora sejam cruzamentos de alto valor analítico (ex: matrículas por habitante ou taxa de aprovação vs. IDEB), essas métricas dependem de integrar bases externas adicionais do IBGE/INEP e não fazem parte do núcleo obrigatório do desafio.
   - *Próximos passos*: Integrar APIs do IBGE e tabelas do IDEB para adicionar camadas comparativas avançadas no dashboard.

3. **Autenticação / Multi-Tenancy**: 
   - Mantido como acesso público direto para facilitar a navegação e avaliação técnica fluida pelos avaliadores.
