# Painel de Indicadores Educacionais de Alagoas

Aplicação web full-stack de alta performance construída para processar, validar, armazenar e visualizar dados educacionais dos 102 municípios de Alagoas no período de 2007 a 2025. A solução é composta por uma API REST em Node.js, Express e TypeScript com Prisma ORM e banco SQLite/PostgreSQL otimizado, além de uma interface web interativa em React, TypeScript e Tailwind CSS com gráficos dinâmicos e mapa coroplético de Alagoas.

Projetada para suportar desde a base de amostra (3.534 linhas) até a base completa de grande escala (145.028 linhas, 13MB), a aplicação realiza o parsing transacional de arquivos CSV via streaming de memória sem estourar o limite da máquina e executa agregação direta via banco de dados em menos de 1 segundo.

---

## 🚀 Como Rodar o Projeto do Zero

### Pré-requisitos
- **Node.js**: v18+ ou v20+ instalado
- **npm**: v9+ ou v10+ instalado

### 1. Clonar o Repositório e Instalar Dependências

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/alagoas-edu.git
cd alagoas-edu

# Instalar dependências do Backend
cd backend
npm install

# Instalar dependências do Frontend
cd ../frontend
npm install
```

### 2. Configurar Variáveis de Ambiente
O repositório já inclui os arquivos `.env.example`. Na pasta `backend`, crie um arquivo `.env`:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
```

### 3. Inicializar o Banco de Dados e Rodar os Testes

```bash
# No diretório backend:
npx prisma generate
npx prisma db push

# Executar a suíte de testes automatizados (Seção 10)
npm test
```

### 4. Executar em Modo de Desenvolvimento

Em dois terminais separados (ou via scripts de dev):

```bash
# Terminal 1 - Backend (rodando na porta 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (rodando na porta 3000)
cd frontend
npm run dev
```

Abra o navegador em `http://localhost:3000`.

---

## 📊 Decisões sobre Tratamento dos Dados (Seção 3)

Esta seção documenta o rigor matemático e arquitetural adotado para mitigar as armadilhas dos dados educacionais do Censo Escolar, Rendimento e Censo Demográfico:

### 1. Tratamento da Hierarquia em `ensino_rede` (3.1)
- **Problema**: A coluna `ensino_rede` possui os valores `Estadual`, `Municipal`, `Federal`, `Privada`, `Pública` (Estadual + Municipal + Federal) e `Total` (Pública + Privada). Somar todas as redes ingênuamente faz com que o mesmo aluno seja contado até 3 vezes (ex: em Maceió 2023, Ensino Fundamental, a soma ingênua das redes dá 284.567, enquanto a população real é de **109.026**).
- **Decisão**: Toda agregação de matrículas e ofertas por município utiliza rigorosamente o filtro `ensino_rede = 'Total'` como padrão na camada de banco de dados/API, garantindo que o valor exibido para Maceió 2023 seja exatamente **109.026**.

### 2. Duplicidade em `ensino_tipo` na variável "Escolas" (3.2)
- **Problema**: Uma escola que oferece Educação Infantil e Ensino Fundamental é contabilizada em ambas as etapas. A soma de escolas entre as etapas resulta no número de ofertas de ensino, e não na quantidade de prédios escolares.
- **Decisão**: Todos os cards e gráficos referentes à contagem de escolas são explicitamente rotulados na interface como **"Ofertas de Ensino"**, informando claramente o usuário sobre a natureza da métrica.

### 3. Média Ponderada vs. Média Simples de Percentuais (3.3)
- **Problema**: Calcular a média simples entre taxas de aprovação/abandonos de municípios com populações discrepantes (ex: Maceió com ~109 mil matrículas vs Piaçabuçu com ~2,4 mil) distorce a taxa real do Estado.
- **Decisão**: Adotamos a **Média Ponderada por Matrículas** `soma(taxa × matrículas) / soma(matrículas)` como padrão para agregação de taxas de aprovação e abandono. A interface sinaliza explicitamente a fórmula e o método de cálculo.

### 4. Cobertura Temporal Distinta entre Fontes (3.4)
- **Problema**: `censo_escolar` e `indicadores_rendimento` possuem dados anuais, enquanto `censo_demografico` contém apenas os anos censitários 2010 e 2022.
- **Decisão**: Filtros aplicados em anos sem Censo Demográfico (ex: 2019) exibem a mensagem **"Sem dado no período"** e omitem o ponto no gráfico (preservando o valor `null`), sem jamais preencher com `0` ou tratar ausência como taxa zero.

### 5. Comportamento de Reimportação do Mesmo Arquivo
- **Decisão**: Ao enviar um novo arquivo CSV pelo modal de upload, a aplicação adota a estratégia de **substituição transacional limpa** do dataset anterior (`deleteMany` + batch inserts em stream), evitando a duplicação indevida de dados.

### 6. Distinção entre Zero e Valor Ausente (3.6)
- **Decisão**: O parser preserva valores reais `valor = 0.0` (ex: município com 0 escolas federais) e trata o que não foi registrado como `null` no backend e na API JSON, evitando quedas artificiais nas séries temporais.

### 7. Processamento em Streaming e Indexação
- **Decisão**: Optamos por subir o CSV bruto com parsing em lote (`csv-parse` stream) e calcular as agregações sob demanda utilizando o índice composto `(ano, variavel, ensino_rede, ensino_tipo)` no banco SQLite/Postgres. Isso garante tempo de resposta inferior a 1 segundo para bases de 145 mil linhas.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Leaflet / GeoJSON.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Zod, `csv-parse`, Swagger UI (`/api-docs`).
- **Banco de Dados**: SQLite (out-of-the-box para dev) / PostgreSQL (via Docker Compose).
- **Testes**: Vitest + Supertest.

---

## 🧪 Suíte de Testes Automatizados (Seção 10)

Para verificar o cumprimento exato dos requisitos numéricos, execute:

```bash
cd backend
npm test
```

O teste valida contra a base de amostra (3.534 linhas):
- Total de linhas lidas: **3.534**
- Municípios distintos: **10**
- Anos distintos: **2010, 2019, 2021, 2022, 2023**
- Matrículas 2023 (Total, 5 etapas, 10 muns): **380.454**
- Maceió 2023, Matrícula Ensino Fundamental Total: **109.026**
- Taxa de Aprovação Ponderada (Ens. Fund. 2023 Total): **96,16%**
- Taxa de Analfabetismo em Maceió: **11,86% (2010) → 8,42% (2022)**
- Taxa de Analfabetismo em Piaçabuçu: **31,77% (2010) → 22,83% (2022)**

---

## 🐳 Docker Compose (PostgreSQL)

Caso deseje rodar a aplicação com PostgreSQL em contêiner Docker:

```bash
docker-compose up -d
```

---

## ☁️ Guia de Implantação em Nuvem (Deploy)

A aplicação foi estruturada para ser hospedada gratuitamente e em produção nas seguintes plataformas:

### 1. Banco de Dados (Supabase / PostgreSQL)
1. Crie um projeto no [Supabase](https://supabase.com/).
2. Copie a string de conexão em **Project Settings > Database > Connection String (URI)** (Use `Transaction Pooler` na porta 6543 ou porta 5432).
3. Defina a variável de ambiente:
   ```env
   DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres"
   ```

### 2. Backend API (Render)
1. Crie um novo **Web Service** no [Render](https://render.com/) apontando para o seu repositório no GitHub.
2. O arquivo `render.yaml` na raiz do projeto configura a build e inicialização automaticamente:
   - **Build Command**: `cd backend && npm install && npx prisma db push && npm run build`
   - **Start Command**: `cd backend && npm run start`
3. Configure a variável de ambiente `DATABASE_URL` no painel do Render com a URL do seu Supabase.

### 3. Frontend Dashboard (Vercel)
1. Importe o repositório no [Vercel](https://vercel.com/).
2. Selecione a pasta raiz do projeto e defina a pasta **Root Directory** como `frontend`.
3. O arquivo `frontend/vercel.json` cuidará do roteamento SPA e do proxy automático das requisições `/api/*` para o seu backend no Render.

---

## 📋 O que ficou de fora (Funcionalidades Opcionais)

Para focar no rigor matemático, na performance de processamento em streaming e na excelência visual exigidos no núcleo do desafio técnico, as seguintes funcionalidades de escopo estendido não foram implementadas:
1. **Autenticação e Controle de Acesso (Multi-Tenancy)**: O dashboard é de acesso público direto para facilitar a navegação e avaliação técnica dos avaliadores.
2. **Exportação Personalizada em PDF/Excel**: A exploração de dados é feita de forma interativa via Tabela Paginada server-side e gráficos interativos no navegador.
3. **Filtros por Agrupamentos Regionais / Microrregiões**: O agrupamento e a filtragem são focados na divisão municipal e territorial oficial do IBGE para o Estado de Alagoas.


