# Visualdy 🧠✨

> **Plataforma interativa de aprendizado visual com Agente Tutor de IA (Gemini) e simuladores passo a passo para Computação, Programação e temas gerais.**

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-@google/genai-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)

---

## 📌 Visão Geral

O **Visualdy** foi criado para quem aprende melhor enxergando como os sistemas funcionam por dentro. Em vez de parágrafos abstratos, a plataforma combina dois motores complementares:

1. **Agente Tutor Visual (IA em 2 Etapas)**: Recebe qualquer tema digitado pelo usuário (ex.: *Grafos*, *Pilhas*, *Quicksort*, *Como funciona o DNS* ou assuntos fora da computação), planeja o nível e o melhor tipo de diagrama e gera explicações didáticas + visualização passo a passo em JSON estruturado e validado.
2. **Simuladores Clássicos com Parâmetros em Tempo Real**: Simulações interativas dedicadas (como *Árvore Binária de Busca* e *Busca Binária*) com alteração de valores em tempo real e código sincronizado.

---

## ✨ Funcionalidades Principais

- 🤖 **Agente Tutor Visual em 2 Etapas (`POST /api/tutor-agent`)**:
  - **Etapa A (Planejamento)**: Analisa o tema e define nível (`Iniciante`, `Intermediário`, `Avançado`), pré-requisitos, roteiro didático e o melhor tipo de visualização.
  - **Etapa B (Geração Estruturada)**: Gera o conteúdo final em JSON estrito (`responseMimeType: "application/json"` + `responseSchema`), com regras anti-alucinação (máximo de 7 elementos por passo, consistência passo $N \rightarrow N+1$, sem inventar links, autores ou estatísticas).
  - **Robustez e Validação**: Validação com **Zod** (`TutorPlanSchema` e `TutorResponseSchema`), até 2 retentativas automáticas em caso de JSON inválido, cache em memória e fallback estruturado caso a API esteja indisponível ou sem chave configurada.
- 🎨 **Motor de Visualização Genérico SVG (`GenericVisualCanvas`)**:
  - Renderiza 11 tipos visuais a partir do JSON do agente: `arvore`, `grafo`, `array`, `lista_ligada`, `pilha`, `fila`, `tabela_hash`, `matriz`, `fluxo`, `linha_do_tempo` e `generico`.
  - Controles passo a passo (**Anterior**, **Próximo**, **Play/Pause**, **Reiniciar**), destaque do nó/aresta ativo e painel de estado/variáveis.
  - Protegido por `ErrorBoundary`: caso o diagrama falhe, a explicação textual, exercícios e roteiro permanecem acessíveis com aviso amigável.
- 🎛️ **Simuladores Clássicos Interativos (`TopicStudioPage`)**:
  - Mantém os simuladores nativos (incluindo *Árvore Binária de Busca (BST)*, *Busca Binária*, *Memória RAM*, *Portas Lógicas* e *SQL JOINs*) com controles de parâmetros em tempo real, código sincronizado e barra de busca rápida para o Agente Tutor.
- 🏠 **Página Inicial Completa (`HomePage`)**:
  - Grade responsiva com 8 cards de exemplo (*Árvores Binárias*, *Grafos*, *Pilhas e Filas*, *Listas Ligadas*, *Tabelas Hash*, *Algoritmos de Ordenação*, *Recursão*, *Busca Binária*) + card **"Pergunte sobre qualquer tema"** que foca o campo de busca.
  - Busca inline com estados de carregamento, erro com *"Tentar novamente"* e botão de estudo direto no resultado.
- 📚 **Meus Estudos Global & Persistente (`StudyContext` + `localStudyStore`)**:
  - Funciona de forma unificada em todos os lugares: cards da Home, resultados da busca, tela do Agente Tutor (`/gerador`), categorias e Estúdio Completo (`/assunto/:slug`).
  - Persistido em `localStorage` (com `try/catch` e fallback em memória), prevenção de duplicatas por slug, toggle **"Adicionar aos meus estudos"** ↔ **"✓ Adicionado"**, toasts de confirmação e armazenamento do `generatedJson` completo para reabrir estudos salvos sem gastar nova chamada à API.

---

## 🧭 Categorias e Tópicos Clássicos

| Categoria | Tópicos em Destaque | Modelo Mental |
| :--- | :--- | :--- |
| **Fundamentos de Programação** | Variáveis & Memória, Fluxo Condicional, Ponteiros & Referências, Recursão | Gavetas endereçadas, desvios de rota e quadros de pilha |
| **Estruturas de Dados** | Pilha & Fila, Tabela Hash, Árvore Binária de Busca (BST), Grafo & BFS | Inserção, colisão, encadeamento e caminhamento |
| **Algoritmos e Complexidade** | Busca Binária, Algoritmos de Ordenação, Two Pointers | Espaço de busca reduzido e ponteiros convergentes |
| **Arquitetura e Hardware** | Portas Lógicas, Ciclo de Instrução da CPU | Sinal elétrico, barramentos, registradores e ALU |
| **Redes, Web e Concorrência** | Requisição Web (DNS, TCP, HTTP), Event Loop | Handshake, filas de tarefas e trânsito de pacotes |
| **Bancos de Dados** | Banco Relacional e SQL JOINs | Cruzamento cartesiano e filtragem de predicados |

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** com **TypeScript**
- **Vite 8** e **Tailwind CSS v4**
- **React Router DOM v7** (`BrowserRouter`)
- **Zod** (Validação de contratos e schemas no cliente e no servidor)
- **Motion** e **Lucide React**

### Backend, IA & Serverless
- **Node.js + Express** (`server.ts`): Servidor unificado com endpoints de IA (`/api/tutor-agent`, `/api/gemini`), proxy `/api/*` para o backend Python e entrega de dev/produção.
- **`@google/genai`**: SDK oficial do Gemini (executado exclusivamente no servidor/serverless via `GEMINI_API_KEY`).
- **Python 3.10+ com FastAPI & Uvicorn** (`backend/`): Catálogo nativo e simuladores parametrizados clássicos.
- **Netlify Functions** (`netlify/functions/`): Versão serverless pronta para deploy em produção.

---

## 📂 Estrutura de Diretórios

```bash
visualdy/
├── backend/                          # Backend Python (Catálogo e simuladores clássicos)
│   ├── catalog.py                    # Categorias e tópicos nativos (BST, Busca Binária, etc.)
│   ├── main.py                       # Aplicação FastAPI
│   ├── models.py                     # Modelos Pydantic
│   ├── server.py                     # Runner Uvicorn + fallback stdlib
│   └── visual_engine.py              # Simuladores clássicos
├── netlify/
│   └── functions/                    # Serverless Functions do Netlify
│       ├── tutor-agent.ts            # Agente Tutor Visual (Etapa A + Etapa B)
│       ├── gemini.ts                 # Endpoint auxiliar da Gemini API
│       └── visual-engine-generate.ts # Motor visual legado
├── src/
│   ├── components/
│   │   ├── cards/                    # TopicCard
│   │   ├── common/                   # ErrorBoundary, StudyToggleButton, ToastContainer
│   │   ├── layout/                   # TopBar, Footer
│   │   ├── study/                    # CodeSyncPanel
│   │   ├── tutor/                    # TutorExplanationView
│   │   └── visualizers/              # GenericVisualCanvas + renderizadores clássicos
│   ├── context/
│   │   └── StudyContext.tsx          # Estado global de estudos, cache JSON e toasts
│   ├── pages/
│   │   ├── HomePage.tsx              # Hero, busca inline, 8 cards exemplo e Meus estudos
│   │   ├── GeneratorPage.tsx         # Estúdio do Agente Tutor Visual (?assunto= / ?estudo=)
│   │   ├── TopicStudioPage.tsx       # Estúdio Completo clássico + busca rápida
│   │   ├── StudyPlanPage.tsx         # Roteiro e fila completa de estudos salvos
│   │   └── CategoriesPage.tsx        # Trilhas e catálogo por categoria
│   ├── schemas/
│   │   ├── tutorSchema.ts            # Schemas Zod e tipos do Agente Tutor
│   │   └── tutorSchema.test.ts       # Testes unitários do agente e schema
│   ├── server/
│   │   ├── tutorAgent.ts             # Pipeline em 2 etapas com @google/genai e retry Zod
│   │   └── deterministicTutor.ts     # Fallback estruturado determinístico
│   ├── services/
│   │   └── api.ts                    # Cliente HTTP (askTutorAgent, catálogo, fallback)
│   ├── types/
│   │   └── visual.ts                 # Tipos compartilhados dos simuladores clássicos
│   ├── utils/
│   │   ├── localStudyStore.ts        # Persistência localStorage + fallback em memória
│   │   ├── localStudyStore.test.ts   # Testes de persistência e deduplicação
│   │   ├── studyLogic.ts             # Utilitários de navegação e estatísticas
│   │   ├── studyLogic.test.ts        # Testes de lógica de estudo
│   │   └── visualEngineFallback.ts   # Fallback clássico offline
│   ├── App.tsx                       # Rotas principais, ErrorBoundary e ToastContainer
│   └── main.tsx                      # Ponto de entrada React
├── .env.example                      # Modelo de variáveis de ambiente (sem segredos)
├── netlify.toml                      # Configuração de build, funções e redirecionamentos
├── package.json                      # Scripts e dependências Node.js
├── server.ts                         # Servidor Express + proxy FastAPI + rotas Gemini
└── vite.config.ts                    # Configuração Vite + Tailwind CSS v4
```

---

## 🔐 Variáveis de Ambiente

A chave da API Gemini **nunca** é exposta no código do navegador (`VITE_*`). Ela é lida exclusivamente no servidor (`server.ts`) ou nas Netlify Functions:

```env
GEMINI_API_KEY="sua-chave-gemini"
FASTAPI_PORT="5050"
```

> Se `GEMINI_API_KEY` não estiver definida no ambiente local ou atingir limite temporário de cota, o servidor utiliza automaticamente o motor estruturado determinístico (`deterministicTutor.ts`) para evitar telas quebradas.

---

## 🚀 Como Executar Localmente e Testar

### Pré-requisitos
- **Node.js** v20+
- **Python** 3.10+ e `pip`

### 1. Instalar dependências

```bash
npm install
pip install -r requirements.txt
```

### 2. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **`http://localhost:3000`**. O servidor Node.js (`server.ts`) sobe o Vite, disponibiliza `POST /api/tutor-agent` e gerencia o backend Python em `http://127.0.0.1:5050`.

### 3. Executar testes, lint e build

```bash
# Testes unitários (schemas, agente determinístico, localStorage/fallback e lógica)
npx tsx --test src/utils/studyLogic.test.ts src/schemas/tutorSchema.test.ts src/utils/localStudyStore.test.ts

# Verificação de tipos TypeScript
npm run lint

# Build de produção
npm run build
```

---

## 📡 Principais Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/tutor-agent` | Executa o **Agente Tutor Visual** (Etapa A + Etapa B) e retorna JSON validado |
| `POST` | `/api/gemini` | Endpoint auxiliar de geração textual via `@google/genai` |
| `GET` | `/api/health` | Status de saúde do servidor Node.js e disponibilidade do backend Python |
| `GET` | `/api/categories` | Lista as categorias de computação do catálogo nativo |
| `GET` | `/api/topics` | Lista tópicos com suporte a filtro (`?category=...`) e busca (`?q=...`) |
| `GET` | `/api/topics/{slug}` | Detalhes e passos do simulador clássico (ex.: `arvore-binaria-busca`, `busca-binaria`) |
| `POST` | `/api/topics/{slug}/simulate` | Recalcula passos do simulador clássico com novos parâmetros |

---

## 🌐 Deploy no Netlify

O repositório está configurado via `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **Redirecionamentos configurados**:
  - `/api/tutor-agent` → `/.netlify/functions/tutor-agent`
  - `/api/gemini` → `/.netlify/functions/gemini`
  - `/api/visual-engine/generate` → `/.netlify/functions/visual-engine-generate`
  - `/*` → `/index.html` (SPA)

No painel do Netlify, basta configurar `GEMINI_API_KEY` em **Site configuration → Environment variables** (com escopo *Functions*).

---

## 📜 Scripts do `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor full-stack (`tsx server.ts`) com Vite e proxy Python |
| `npm run build` | Compila o frontend React + Vite para `dist/` |
| `npm run start` | Serve a aplicação compilada em produção (`node server.ts`) |
| `npm run lint` | Executa checagem estática de tipos (`tsc --noEmit`) |
| `npm run clean` | Remove artefatos de build (`dist`, `server.js`) |

---

## 📄 Licença

Distribuído sob a licença **Apache 2.0**. Consulte o arquivo de licença para mais informações.
