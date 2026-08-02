# Painel de Indicadores Educacionais de Alagoas

[![CI Pipeline](https://github.com/Coimbra-lara/Painel-Educacional-De-Alagoas-FAPEAL/actions/workflows/ci.yml/badge.svg)](https://github.com/Coimbra-lara/Painel-Educacional-De-Alagoas-FAPEAL/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![React](https://img.shields.io/badge/React-v18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-v5+-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-v5+-indigo.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3+-38bdf8.svg)

Dados educacionais reais vêm com inconsistências reais: redes que se sobrepõem, escolas contadas duas vezes, percentuais que não podem ser somados. Este projeto nasceu para enfrentar exatamente isso — uma aplicação full-stack que transforma linhas de dados brutos dos 102 municípios de Alagoas (2007–2025) em um dashboard confiável, sem inflar números nem esconder as armadilhas do dado real.

No backend, uma API REST em Node.js, Express e TypeScript com Prisma ORM processa arquivos CSV via streaming — sem estourar memória mesmo em arquivos de 13MB —, persiste em PostgreSQL/SQLite otimizado com índices compostos, e responde agregações em menos de 1 segundo mesmo na base completa. No frontend, React, TypeScript e Tailwind CSS entregam filtros dinâmicos, gráficos interativos e um mapa coroplético de Alagoas, tudo pensado para lidar com escala desde o primeiro dia.

---

> [!NOTE]
> ### 💡 Inicialização no Localhost
> Ao abrir a aplicação no navegador (`http://localhost:3000`), o painel inicia pronto para receber os dados do usuário. Para visualizar o dashboard interativo, utilize o botão **"Importar CSV para começar"** ou **"Upload CSV"** no cabeçalho. É possível utilizar a amostra oficial incluída no repositório em `data/sample_alagoas_3534.csv` ou qualquer outro arquivo CSV válido de indicadores educacionais.

---

## 📌 Sumário

1. [Como Rodar o Projeto do Zero](#1-como-rodar-o-projeto-do-zero)
   - [1.1 Pré-requisitos](#11-pré-requisitos)
   - [1.2 Clonar o Repositório](#12-clonar-o-repositório)
   - [1.3 Opção A: Rodar SEM Docker (Local / Node.js + SQLite)](#13-opção-a-rodar-sem-docker-local--nodejs--sqlite)
   - [1.4 Opção B: Rodar COM Docker (PostgreSQL)](#14-opção-b-rodar-com-docker-postgresql)
   - [1.5 Importar o Arquivo CSV no Painel](#15-importar-o-arquivo-csv-no-painel)
2. [Decisões de Tratamento dos Dados](#2-decisões-de-tratamento-dos-dados)
   - [2.1 Tratamento da Hierarquia em ensino_rede](#21-tratamento-da-hierarquia-em-ensino_rede)
   - [2.2 Duplicidade em ensino_tipo na variável Escolas](#22-duplicidade-em-ensino_tipo-na-variável-escolas)
   - [2.3 Média Ponderada vs. Média Simples de Percentuais](#23-média-ponderada-vs-média-simples-de-percentuais)
   - [2.4 Cobertura Temporal Distinta entre Fontes](#24-cobertura-temporal-distinta-entre-fontes)
   - [2.5 Comportamento de Reimportação sem Recarregar Página](#25-comportamento-de-reimportação-sem-recarregar-página)
   - [2.6 Distinção entre Zero e Valor Ausente](#26-distinção-entre-zero-e-valor-ausente)
   - [2.7 Processamento em Streaming e Indexação](#27-processamento-em-streaming-e-indexação)
3. [Conferência dos Números](#3-conferência-dos-números)
4. [Esquematização da Arquitetura do Projeto](#4-esquematização-da-arquitetura-do-projeto)
5. [Funcionamento das APIs Utilizadas & Análise de Performance](#5-funcionamento-das-apis-utilizadas--análise-de-performance)
6. [Testes Realizados](#6-testes-realizados)
7. [O que ficou de fora (Funcionalidades Opcionais e Próximos Passos)](#7-o-que-ficou-de-fora-funcionalidades-opcionais-e-próximos-passos)

---

## 1. Como Rodar o Projeto do Zero

O projeto é configurado como um **npm workspace (monorepo)** e suporta duas formas simples de execução: **SEM Docker** (SQLite rápido local) ou **COM Docker** (PostgreSQL em container).

### 1.1 Pré-requisitos
- **Node.js**: v18+ ou v20+ instalado
- **npm**: v9+ ou v10+ instalado
- **Git** instalado
- **Docker & Docker Compose** *(opcional, necessário apenas se optar por rodar com PostgreSQL)*

### 1.2 Clonar o Repositório

```bash
git clone https://github.com/Coimbra-lara/Painel-Educacional-De-Alagoas-FAPEAL.git
cd Painel-Educacional-De-Alagoas-FAPEAL
```

Instale as dependências de todos os workspaces executando o comando na raiz:

```bash
npm run install:all
```
*(ou simplesmente `npm install` na raiz do projeto)*.

---

### 1.3 Opção A: Rodar SEM Docker (Local / Node.js + SQLite — Recomendado)

1. **Configurar as variáveis de ambiente (`.env`):**
   Na pasta `backend`, crie ou edite o arquivo `.env`:
   ```env
   PORT=3001
   DATABASE_URL="file:./dev.db"
   ```

2. **Iniciar o Backend e Frontend:**
   Abra **dois terminais separados**:

   - **Terminal 1 (Backend API — Porta 3001):**
     ```bash
     cd backend
     npm run dev
     ```

   - **Terminal 2 (Frontend Dashboard — Porta 3000):**
     ```bash
     cd frontend
     npm run dev
     ```

---

### 1.4 Opção B: Rodar COM Docker (PostgreSQL)

1. **Subir o container PostgreSQL:**
   Na raiz do projeto:
   ```bash
   docker-compose up -d
   ```
   > Subirá o PostgreSQL rodando na porta `5432`.

2. **Configurar as variáveis de ambiente (`.env`):**
   Na pasta `backend`, crie ou edite o arquivo `.env`:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/alagoas_edu?schema=public"
   ```

3. **Iniciar o Backend e Frontend:**
   Abra **dois terminais separados**:

   - **Terminal 1 (Backend):**
     ```bash
     cd backend
     npm run dev
     ```

   - **Terminal 2 (Frontend):**
     ```bash
     cd frontend
     npm run dev
     ```

---

### 1.5 Importar o Arquivo CSV no Painel

1. Acesse no navegador: **`http://localhost:3000`**.
2. Clique no botão **"Importar CSV para começar"** ou **"Upload CSV"** no cabeçalho.
3. No modal de upload, escolha o arquivo CSV. Utilize a amostra incluída no repositório em:
   ```text
   data/sample_alagoas_3534.csv
   ```
   *(ou selecione a base completa de 145 mil linhas em CSV)*.
4. Clique em **"Iniciar Importação"**.
5. O painel alimentará automaticamente os cards de KPI, gráficos de séries temporais, ranking de municípios, quebra por rede/etapa, mapa de Alagoas e tabela paginada.
6. É possível importar um novo arquivo CSV a qualquer momento **sem recarregar a página (sem F5)**.

---

## 2. Decisões de Tratamento dos Dados

Esta seção documenta as regras de negócio e rigor matemático adotados para tratar as inconsistências dos dados educacionais brutos:

### 2.1 Tratamento da Hierarquia em `ensino_rede`
- **Problema**: A coluna `ensino_rede` possui os valores `Estadual`, `Municipal`, `Federal`, `Privada`, `Pública` (Estadual + Municipal + Federal) e `Total` (Pública + Privada). Somar todas as redes ingenuamente faz com que o mesmo aluno seja contado até 3 vezes (ex: em Maceió 2023, Ensino Fundamental, a soma ingênua das redes resulta em 284.567, enquanto a população real de alunos é **109.026**).
- **Decisão**: Toda agregação de matrículas por município utiliza o filtro `ensino_rede = 'Total'` como padrão na camada de repositório, garantindo que o valor exibido para Maceió 2023 seja rigorosamente **109.026**.

### 2.2 Duplicidade em `ensino_tipo` na variável "Escolas"
- **Problema**: Uma escola física que atende Educação Infantil e Ensino Fundamental é contabilizada em ambas as etapas. A soma de escolas entre as etapas resulta no número de ofertas de ensino.
- **Decisão**: Todos os cards e gráficos referentes à contagem de escolas são rotulados na interface como **"Ofertas de Ensino"**, informando claramente o usuário sobre a natureza da métrica.

### 2.3 Média Ponderada vs. Média Simples de Percentuais
- **Problema**: Calcular a média simples entre taxas de aprovação/abandono de municípios com populações discrepantes (ex: Maceió com ~109 mil matrículas vs Piaçabuçu com ~2,4 mil) distorce a taxa real do Estado.
- **Decisão**: Adotamos a **Média Ponderada por Matrículas** `SUM(taxa × matrículas) / SUM(matrículas)` como padrão para agregação de taxas educacionais (`Taxa de Aprovação`, `Taxa de Abandono`, `Taxa de Reprovação`) e **Média Ponderada por População Total** `SUM(taxa × pessoas_total) / SUM(pessoas_total)` para taxas do Censo Demográfico (`Taxa de Analfabetismo`, `Taxa de Alfabetização`).

### 2.4 Cobertura Temporal Distinta entre Fontes
- **Problema**: `censo_escolar` e `indicadores_rendimento` possuem dados anuais, enquanto `censo_demografico` contém apenas os anos censitários (2010 e 2022).
- **Decisão**: Filtros em anos sem Censo Demográfico preservam o valor `null` ("Sem dados no recorte"), sem jamais preencher com `0` ou tratar ausência como taxa zero.

### 2.5 Comportamento de Reimportação sem Recarregar Página
- **Decisão**: Ao enviar um novo arquivo CSV pelo modal de upload, a aplicação adota a estratégia de substituição transacional limpa do dataset anterior (`deleteMany` + batch inserts em stream), redefinição automática dos filtros e sincronismo de estado do React, permitindo reimportar múltiplos arquivos em sequência sem necessidade de dar F5.

### 2.6 Distinção entre Zero e Valor Ausente
- **Decisão**: O parser preserva valores reais `valor = 0.0` (ex: município com 0 escolas federais) e trata o que não foi registrado como `null` no backend e na API JSON.

### 2.7 Processamento em Streaming e Indexação
- **Decisão**: O CSV bruto é lido via streaming (`csv-parse`), validado via `zod` e inserido em lotes de 3.000 registros com Prisma. A API executa agregações sob demanda otimizadas por índices compostos `(ano, variavel, ensino_rede, ensino_tipo)` e `(co_mun, ano)`.

---

## 3. Conferência dos Números

A aplicação foi validada contra os requisitos numéricos num teste com a base de amostra oficial de 3.534 linhas e na base completa:

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

```text
+-------------------------------------------------------------------+
|                        FRONTEND (React + Vite)                    |
|  - Filtros Globais (Município, Ano, Rede, Etapa, Variável)        |
|  - Dashboard (KPIs, Gráficos Recharts, Mapa Coroplético IBGE)     |
|  - Modal de Upload CSV em Streaming com Suporte a Reimportação    |
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

### Modelo do Banco de Dados (`schema.prisma`)

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

### Principais Endpoints REST

- `GET /api/filtros`: Lista de seletores dinâmicos disponíveis no banco.
- `GET /api/indicadores`: Métricas consolidadas dos KPI Cards.
- `GET /api/series`: Série temporal histórica para o gráfico de linhas.
- `GET /api/ranking`: Ranking de municípios (Top N).
- `GET /api/mapa`: Agregação de dados por município para coloração do mapa coroplético.
- `GET /api/distribuicao`: Distribuição por rede ou etapa.
- `GET /api/dados`: Tabela paginada server-side.
- `POST /api/upload`: Upload de CSV via streaming transacional.
- `GET /api/health`: Healthcheck da aplicação.

---

### Análise de Performance (Amostra contendo 145.028 Registros)

Tempos de resposta medidos em 10 execuções consecutivas por endpoint:

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

> **Resultado:** Todos os endpoints responderam em **sub-segundos (máximo de 353,89 ms)**.

---

## 6. Testes Realizados

A aplicação conta com uma suíte de testes automatizados com **Vitest** e **Supertest** que cobrem as regras de negócio e validações essenciais.

Para rodar os testes no backend:

```bash
cd backend
npm test
```

### Cenários Testados:
1. **Validade de dados numéricos (Seção 10)**: Totais de linhas, municípios, anos, matrículas de Maceió e médias ponderadas de aprovação e analfabetismo.
2. **Rejeição de cabeçalhos inválidos**: Confirmação da recusa de arquivos CSV com colunas incorretas.
3. **Tratamento de arquivos vazios**: Leitura de 0 linhas sem erro.
4. **Descarte de registros duplicados**: Identificação e relato de linhas duplicadas.
5. **Diferenciação entre Zero e Nulo**: Integridade de `valor = 0.0` vs ausência de dados (`null`).
6. **Validação de Intervalo de Anos**: HTTP 400 (`INVALID_YEAR_RANGE`) caso `anoInicio > anoFim`.

---

## 7. O que ficou de fora (Funcionalidades Opcionais e Próximos Passos)

1. **Escolas individuais no mapa (Seção 8.2)**:
   - *Justificativa*: O arquivo CSV fornecido é agregado por município e não contém coordenadas de latitude/longitude por prédio escolar. Priorizou-se o **mapa coroplético municipal por código IBGE de 7 dígitos**, que atende plenamente ao desafio.
   - *Próximos passos*: Cruzamento com os microdados do INEP via Base dos Dados para plotar coordenadas de escolas individuais.

2. **Outros cruzamentos externos (Seção 8.3 — população, IDEB, IDHM)**:
   - *Justificativa*: Métricas externas não fazem parte do escopo obrigatório e exigem integração com dados do IDEB/IBGE.
   - *Próximos passos*: Integração com API de Dados Abertos do IBGE/INEP para camadas analíticas comparativas.
