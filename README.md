# Visualdy 🧠✨

> **Plataforma interativa de aprendizado visual para conceitos fundamentais e avançados de Computação e Programação.**

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 📌 Visão Geral

O **Visualdy** foi criado para quem aprende melhor observando sistemas em funcionamento. Em vez de blocos massivos de texto estático ou caixas-pretas conceituais, o Visualdy decompõe cada tópico em **simulações interativas, passo a passo e com parâmetros em tempo real**.

O usuário pode alterar valores de entrada (tamanho de arrays, chaves de busca, alvos de ponteiro, tabelas de join), acompanhar o estado interno da memória e entender a mecânica por trás do código.

---

## ✨ Funcionalidades Principais

- 🎬 **Simulador Passo a Passo**: Controle total de reprodução (*Play*, *Pause*, *Passo Anterior*, *Próximo Passo*, *Velocidade Ajustável* e *Reiniciar*).
- 🎛️ **Parâmetros em Tempo Real**: Altere os dados de entrada e veja a simulação, nós, ponteiros e estados se recalculando instantaneamente.
- 🎨 **7 Arquétipos Visuais Especializados**:
  - **Memory Grid / RAM**: Visualização de endereços hexadecimais, valores e apontadores de memória.
  - **Tree & Graph**: Árvores binárias de busca (BST) e busca em grafos (BFS/DFS) com nós ativos e visitados.
  - **Pointer Graph / Two Pointers**: Cursores móveis, subarrays e referências encadeadas.
  - **Stack & Queue**: Pilhas LIFO, filas FIFO e buffers circulares com ponteiros `head`/`tail`.
  - **State Machine & Control Flow**: Ciclo de CPU (Fetch-Decode-Execute), Event Loop de JavaScript e desvios condicionais.
  - **Logic Gates**: Portas lógicas (AND, OR, XOR, NOT) com sinais de entrada e saída em tempo real.
  - **Relational Tables**: Visualização tabular de `INNER JOIN`, `LEFT JOIN` e combinações relacionais.
- ⚡ **Motor Visual Dinâmico (`Visual Engine`)**: Crie explicações visuais imediatas para qualquer novo conceito digitado pelo usuário via API FastAPI.
- 📚 **Plano de Estudos Integrado**: Salve tópicos, marque status de conclusão, registre anotações e reordene sua trilha de aprendizagem com persistência automática.
- 🎯 **Design com Foco em Não Dispersar Atenção**: Interface escura e elegante, tipografia limpa, hierarquia clara e responsividade impecável em smartphones, tablets e desktops.

---

## 🧭 Categorias e Tópicos Nativos

| Categoria | Tópicos em Destaque | Modelo Mental |
| :--- | :--- | :--- |
| **Fundamentos de Programação** | Variáveis & Memória, Fluxo Condicional, Ponteiros & Referências, Recursão | Gavetas endereçadas, desvios de rota e quadros de pilha |
| **Estruturas de Dados** | Pilha & Fila, Tabela Hash, Árvore Binária de Busca (BST), Grafo & BFS | Inserção, colisão, encadeamento e caminhamento |
| **Algoritmos e Complexidade** | Busca Binária, Algoritmos de Ordenação, Two Pointers | Espaço de busca reduzido e ponteiros convergentes |
| **Arquitetura e Hardware** | Portas Lógicas, Ciclo de Instrução da CPU | Sinal elétrico, barramentos, registradores e ALU |
| **Sistemas e Concorrência** | Event Loop (Call Stack, Task Queue, Microtasks) | Despacho síncrono vs assíncrono em fila |
| **Redes e Web** | Ciclo de Vida HTTP (DNS, TCP, TLS, Request, Response) | Handshake e trânsito de pacotes na rede |
| **Banco de Dados** | Junções SQL (INNER, LEFT e CROSS JOIN) | Cruzamento cartesiano e filtragem de predicados |

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** com **TypeScript**
- **Vite 8** (Build rápido e HMR otimizado)
- **Tailwind CSS v4** (Design moderno, sem inchaço de classes)
- **React Router DOM v7** (Roteamento declarativo SPA)
- **Motion (Framer Motion)** (Animações de transição de nós e ponteiros)
- **Lucide React** (Iconografia semiótica de alta clareza)

### Backend
- **Python 3.10+** com **FastAPI**
- **Uvicorn** (Servidor ASGI assíncrono de alta performance)
- **Fallback HTTP Nativo** (Garante disponibilidade mesmo em ambientes com dependências mínimas)
- **Node.js + Express** (`server.ts`): Orquestrador do ambiente com proxy transparente `/api/*` e entrega estática de produção.

---

## 📂 Estrutura de Diretórios

```bash
visualdy/
├── backend/                       # Backend em Python
│   ├── catalog.py                 # Catálogo fixo de categorias e tópicos nativos
│   ├── main.py                    # Aplicação FastAPI com rotas e CORS
│   ├── models.py                  # Schemas Pydantic para validação estrita
│   ├── server.py                  # Runner inteligente (Uvicorn + fallback stdlib)
│   └── visual_engine.py           # Algoritmos de simulação e geração de tópicos
├── src/                           # Frontend React + TypeScript
│   ├── components/                # Componentes modulares
│   │   ├── layout/                # Header, Footer, Sidebar e Navegação
│   │   ├── visual/                # Renderizadores dos arquétipos visuais
│   │   └── controls/              # Controles de passo, parâmetros e player
│   ├── context/                   # Contextos globais (Tema, Plano de Estudos)
│   ├── pages/                     # Páginas (Home, Categories, Topic, StudyPlan)
│   ├── services/                  # Cliente HTTP de integração com a API (`api.ts`)
│   ├── types/                     # Interfaces e tipos TypeScript compartilhados
│   ├── utils/                     # Formatadores e testes de lógica visual
│   ├── App.tsx                    # Rotas principais da aplicação
│   ├── main.tsx                   # Ponto de entrada do React
│   └── index.css                  # Folha global de estilos com Tailwind CSS v4
├── Dockerfile.render              # Container Docker multi-stage para o Render
├── render.yaml                    # Blueprint de deploy em 1 clique no Render
├── vercel.json                    # Regras de reescrita SPA para deploy na Vercel
├── requirements.txt               # Dependências Python (FastAPI, Uvicorn, Pydantic)
├── package.json                   # Dependências e scripts Node.js
├── server.ts                      # Servidor Full-Stack Node.js (Proxy + SPA Handler)
├── tsconfig.json                  # Configurações do compilador TypeScript
└── vite.config.ts                 # Configuração do Vite e plugins
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** (v20 ou superior)
- **Python** (v3.10 ou superior) e `pip`

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/visualdy.git
cd visualdy
```

### 2. Instalar Dependências

**Dependências Node.js:**
```bash
npm install
```

**Dependências Python:**
```bash
pip install -r requirements.txt
```

### 3. Rodar a Aplicação

O projeto conta com um script de desenvolvimento unificado que gerencia tanto o Frontend (Vite) quanto o Backend Python (FastAPI):

```bash
npm run dev
```

Acesse no navegador:
👉 **`http://localhost:3000`**

*(A API Python estará rodando simultaneamente em `http://127.0.0.1:5050`, com proxy reverso transparente em `/api/*`)*.

---

## 📡 Endpoints da API

Todas as rotas retornam JSON formatado e tipado:

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status de saúde do serviço e disponibilidade do Python |
| `GET` | `/api/categories` | Lista todas as categorias de computação disponíveis |
| `GET` | `/api/categories/{slug}` | Detalhes de uma categoria e lista de tópicos vinculados |
| `GET` | `/api/topics` | Lista tópicos com suporte a busca (`?q=...`) e filtro (`?category=...`) |
| `GET` | `/api/topics/{slug}` | Detalhes completos do tópico com passos e controles de simulação |
| `POST` | `/api/topics/{slug}/simulate` | Recalcula a simulação com novos parâmetros do usuário |
| `POST` | `/api/visual-engine/generate` | Cria uma nova explicação visual dinâmica para qualquer conceito |
| `GET` | `/api/study-plan` | Retorna os tópicos salvos no plano de estudos do usuário |
| `POST` | `/api/study-plan/toggle` | Adiciona ou remove um tópico da trilha de estudos |
| `PATCH` | `/api/study-plan/{slug}` | Atualiza status (`completed`), anotações ou último passo visualizado |
| `PUT` | `/api/study-plan/reorder` | Reordena a sequência de tópicos da trilha |

---

## 🌐 Guia de Deploy

### Opção A: Render (Full-Stack Unificado via Docker)

O repositório já inclui o arquivo `Dockerfile.render` e o manifesto `render.yaml` prontos para deploy:

1. Acesse o [Render Dashboard](https://dashboard.render.com/) e clique em **New +** > **Web Service**.
2. Conecte o repositório do Visualdy.
3. Selecione o ambiente **Docker**.
4. Defina o campo **Dockerfile Path** como: `Dockerfile.render`.
5. Escolha o plano **Free** e clique em **Create Web Service**.
O Render compilará o frontend e inicializará o FastAPI servindo a API e a SPA unificadas em uma única porta com HTTPS gratuito.

---

### Opção B: Vercel (Frontend) + Render (Backend)

Caso prefira a CDN global da Vercel para o frontend:

1. **Backend no Render**:
   - Crie um Web Service com runtime **Python 3**.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Copie a URL pública gerada (ex: `https://visualdy-api.onrender.com`).

2. **Frontend na Vercel**:
   - Conecte o repositório na [Vercel](https://vercel.com/).
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Em **Environment Variables**, adicione:
     - `VITE_API_URL` = `https://visualdy-api.onrender.com`
   - Clique em **Deploy**. *(O arquivo `vercel.json` já configurado garante que as rotas SPA funcionem sem erro 404)*.

---

## 📜 Scripts do `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Node.js com proxy e o backend Python em modo de desenvolvimento |
| `npm run build` | Compila os assets do React e Tailwind CSS para a pasta `/dist` |
| `npm run start` | Inicia o servidor Node.js em modo de produção servindo os arquivos do `/dist` |
| `npm run lint` | Executa a verificação estática de tipos do TypeScript (`tsc --noEmit`) |
| `npm run clean` | Remove pastas de build (`dist`) e arquivos temporários |

---

## 🤝 Contribuições

Contribuições são sempre bem-vindas! Para colaborar:

1. Faça um Fork do projeto (`git checkout -b feature/novo-topico-visual`).
2. Adicione sua simulação ou melhoria de componente.
3. Garanta que o linter passe sem erros: `npm run lint`.
4. Faça commit das mudanças: `git commit -m 'feat: adiciona simulação de grafo de Dijkstra'`.
5. Envie um Pull Request detalhado.

---

## 📄 Licença

Distribuído sob a licença **Apache 2.0**. Consulte o arquivo de licença para mais informações.
