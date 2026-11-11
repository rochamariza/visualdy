# Visualdy 🧠✨

> **Plataforma interativa de aprendizado visual para conceitos fundamentais e avançados de Computação e Programação.**

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)

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

## 📄 Licença

Distribuído sob a licença **Apache 2.0**. Consulte o arquivo de licença para mais informações.
