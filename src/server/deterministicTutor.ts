import type { z } from 'zod';
import {
  TutorResponseSchema,
  slugifyTopic,
  type TutorPlan,
  type TutorResponse,
  type VisualizationType,
} from '../schemas/tutorSchema';

function normalizeTopic(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildDeterministicPlan(topic: string): TutorPlan {
  const norm = normalizeTopic(topic);

  let tipo_visualizacao: VisualizationType = 'fluxo';
  let nivel: TutorPlan['nivel'] = 'Iniciante';
  let pre_requisitos: string[] = ['Lógica básica', 'Noção de variáveis e sequências'];

  if (norm.includes('arvore') || norm.includes('bst') || norm.includes('tree')) {
    tipo_visualizacao = 'arvore';
    nivel = 'Intermediário';
    pre_requisitos = ['Recursão básica', 'Ponteiros ou referências entre objetos'];
  } else if (norm.includes('grafo') || norm.includes('bfs') || norm.includes('dfs') || norm.includes('dijkstra')) {
    tipo_visualizacao = 'grafo';
    nivel = 'Intermediário';
    pre_requisitos = ['Listas ou conjuntos', 'Conceito de vértices e conexões'];
  } else if (norm.includes('pilha') && !norm.includes('fila')) {
    tipo_visualizacao = 'pilha';
    nivel = 'Iniciante';
    pre_requisitos = ['Arrays ou listas dinâmicas', 'Operações de inserção e remoção'];
  } else if (norm.includes('fila') && !norm.includes('pilha')) {
    tipo_visualizacao = 'fila';
    nivel = 'Iniciante';
    pre_requisitos = ['Arrays ou ponteiros de início/fim'];
  } else if (norm.includes('pilha') && norm.includes('fila')) {
    tipo_visualizacao = 'pilha';
    nivel = 'Iniciante';
    pre_requisitos = ['Sequências lineares', 'Ordem de entrada e saída'];
  } else if (norm.includes('lista ligada') || norm.includes('lista encadeada') || norm.includes('linked list')) {
    tipo_visualizacao = 'lista_ligada';
    nivel = 'Intermediário';
    pre_requisitos = ['Variáveis e endereços de memória', 'Ponteiros/referências'];
  } else if (norm.includes('hash') || norm.includes('dicionario') || norm.includes('mapa')) {
    tipo_visualizacao = 'tabela_hash';
    nivel = 'Intermediário';
    pre_requisitos = ['Arrays indexados', 'Operação resto da divisão (módulo)'];
  } else if (
    norm.includes('quicksort') ||
    norm.includes('ordenacao') ||
    norm.includes('mergesort') ||
    norm.includes('bubblesort') ||
    norm.includes('busca binaria') ||
    norm.includes('array') ||
    norm.includes('vetor')
  ) {
    tipo_visualizacao = 'array';
    nivel = norm.includes('quicksort') || norm.includes('mergesort') ? 'Intermediário' : 'Iniciante';
    pre_requisitos = ['Índices de vetores', 'Comparação entre elementos'];
  } else if (norm.includes('recurs')) {
    tipo_visualizacao = 'arvore';
    nivel = 'Intermediário';
    pre_requisitos = ['Funções e retorno de valores', 'Condições de parada (if/else)'];
  } else if (norm.includes('programacao dinamica') || norm.includes('matriz') || norm.includes('tabela dp')) {
    tipo_visualizacao = 'matriz';
    nivel = 'Avançado';
    pre_requisitos = ['Recursão', 'Subproblemas sobrepostos e arrays 2D'];
  } else if (norm.includes('historia') || norm.includes('evolucao') || norm.includes('linha do tempo')) {
    tipo_visualizacao = 'linha_do_tempo';
    nivel = 'Iniciante';
    pre_requisitos = ['Nenhum pré-requisito técnico obrigatório'];
  } else if (
    norm.includes('dns') ||
    norm.includes('http') ||
    norm.includes('rede') ||
    norm.includes('api') ||
    norm.includes('como funciona')
  ) {
    tipo_visualizacao = 'fluxo';
    nivel = 'Iniciante';
    pre_requisitos = ['Noção básica de cliente e servidor na internet'];
  } else {
    tipo_visualizacao = 'generico';
    nivel = 'Iniciante';
    pre_requisitos = ['Curiosidade sobre o tema e conceitos introdutórios'];
  }

  return {
    tema: topic,
    nivel,
    pre_requisitos,
    tipo_visualizacao,
    roteiro: [
      'Definir o conceito central e para que serve na prática.',
      'Demonstrar um exemplo pequeno e rastreável passo a passo.',
      'Analisar desempenho, cuidados e erros comuns.',
    ],
    objetivo_visual: `Mostrar a evolução do estado de ${topic} usando no máximo 7 elementos claros.`,
  };
}

export function generateDeterministicTutorResponse(rawTopic: string, plan?: TutorPlan): TutorResponse {
  const topic = rawTopic.trim();
  const norm = normalizeTopic(topic);
  const activePlan = plan || buildDeterministicPlan(topic);
  const id = slugifyTopic(topic);

  let payload: z.input<typeof TutorResponseSchema>;

  if (norm.includes('grafo') || norm.includes('bfs') || norm.includes('dfs')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Um grafo modela conexões entre entidades chamadas vértices (ou nós) ligadas por arestas. Ele é essencial para representar redes sociais, rotas em mapas, dependências e conexões de internet.',
      nivel: 'Intermediário',
      secoes: [
        {
          titulo: '1. O que compõe um Grafo',
          texto:
            'Todo grafo G = (V, E) é formado por um conjunto de vértices V (os pontos) e um conjunto de arestas E (as ligações entre dois vértices). As arestas podem ter direção (grafo direcionado) e pesos (como distância ou custo).',
          exemplo: 'Vértices: {A, B, C, D, E}. Arestas: A—B, A—C, B—D, C—E.',
        },
        {
          titulo: '2. Como percorrer um Grafo (Busca em Largura - BFS)',
          texto:
            'Na busca em largura, partimos de um vértice inicial e visitamos todos os seus vizinhos imediatos antes de avançar para o próximo nível de distância, evitando repetir vértices já marcados como visitados.',
          exemplo: 'Partindo de A: visitamos B e C (nível 1) antes de D e E (nível 2).',
        },
      ],
      visualizacao: {
        tipo: 'grafo',
        passos: [
          {
            descricao: 'Passo 1: Começamos no vértice A, marcado como ativo. Nenhum outro vértice foi visitado.',
            nos: [
              { id: 'A', rotulo: 'A', subrotulo: 'Início', estado: 'ativo', x: 20, y: 50 },
              { id: 'B', rotulo: 'B', subrotulo: 'Nível 1', estado: 'padrao', x: 48, y: 22 },
              { id: 'C', rotulo: 'C', subrotulo: 'Nível 1', estado: 'padrao', x: 48, y: 78 },
              { id: 'D', rotulo: 'D', subrotulo: 'Nível 2', estado: 'padrao', x: 80, y: 22 },
              { id: 'E', rotulo: 'E', subrotulo: 'Nível 2', estado: 'padrao', x: 80, y: 78 },
            ],
            arestas: [
              { origem: 'A', destino: 'B', rotulo: '2', ativa: true, direcionada: false },
              { origem: 'A', destino: 'C', rotulo: '1', ativa: true, direcionada: false },
              { origem: 'B', destino: 'D', rotulo: '3', ativa: false, direcionada: false },
              { origem: 'C', destino: 'E', rotulo: '4', ativa: false, direcionada: false },
              { origem: 'B', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
            ],
            destaques: ['A'],
            valores: ['Visitados: [A]', 'Fila: [A]'],
          },
          {
            descricao: 'Passo 2: A partir de A, descobrimos seus vizinhos diretos B e C e os colocamos na fila.',
            nos: [
              { id: 'A', rotulo: 'A', subrotulo: 'Visitado', estado: 'visitado', x: 20, y: 50 },
              { id: 'B', rotulo: 'B', subrotulo: 'Ativo', estado: 'ativo', x: 48, y: 22 },
              { id: 'C', rotulo: 'C', subrotulo: 'Na fila', estado: 'destaque', x: 48, y: 78 },
              { id: 'D', rotulo: 'D', subrotulo: 'Nível 2', estado: 'padrao', x: 80, y: 22 },
              { id: 'E', rotulo: 'E', subrotulo: 'Nível 2', estado: 'padrao', x: 80, y: 78 },
            ],
            arestas: [
              { origem: 'A', destino: 'B', rotulo: '2', ativa: true, direcionada: false },
              { origem: 'A', destino: 'C', rotulo: '1', ativa: true, direcionada: false },
              { origem: 'B', destino: 'D', rotulo: '3', ativa: true, direcionada: false },
              { origem: 'C', destino: 'E', rotulo: '4', ativa: false, direcionada: false },
              { origem: 'B', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
            ],
            destaques: ['B', 'C'],
            valores: ['Visitados: [A, B, C]', 'Fila: [B, C]'],
          },
          {
            descricao: 'Passo 3: B explora seu vizinho não visitado D; C já está marcado e não é reprocessado.',
            nos: [
              { id: 'A', rotulo: 'A', subrotulo: 'Visitado', estado: 'visitado', x: 20, y: 50 },
              { id: 'B', rotulo: 'B', subrotulo: 'Visitado', estado: 'visitado', x: 48, y: 22 },
              { id: 'C', rotulo: 'C', subrotulo: 'Ativo', estado: 'ativo', x: 48, y: 78 },
              { id: 'D', rotulo: 'D', subrotulo: 'Descoberto', estado: 'destaque', x: 80, y: 22 },
              { id: 'E', rotulo: 'E', subrotulo: 'Próximo', estado: 'padrao', x: 80, y: 78 },
            ],
            arestas: [
              { origem: 'A', destino: 'B', rotulo: '2', ativa: false, direcionada: false },
              { origem: 'A', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
              { origem: 'B', destino: 'D', rotulo: '3', ativa: true, direcionada: false },
              { origem: 'C', destino: 'E', rotulo: '4', ativa: true, direcionada: false },
              { origem: 'B', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
            ],
            destaques: ['C', 'D'],
            valores: ['Visitados: [A, B, C, D]', 'Fila: [C, D]'],
          },
          {
            descricao: 'Passo 4: C visita E e todos os 5 vértices conectados foram alcançados em ordem de distância.',
            nos: [
              { id: 'A', rotulo: 'A', subrotulo: 'Visitado', estado: 'visitado', x: 20, y: 50 },
              { id: 'B', rotulo: 'B', subrotulo: 'Visitado', estado: 'visitado', x: 48, y: 22 },
              { id: 'C', rotulo: 'C', subrotulo: 'Visitado', estado: 'visitado', x: 48, y: 78 },
              { id: 'D', rotulo: 'D', subrotulo: 'Visitado', estado: 'visitado', x: 80, y: 22 },
              { id: 'E', rotulo: 'E', subrotulo: 'Alcançado', estado: 'destaque', x: 80, y: 78 },
            ],
            arestas: [
              { origem: 'A', destino: 'B', rotulo: '2', ativa: false, direcionada: false },
              { origem: 'A', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
              { origem: 'B', destino: 'D', rotulo: '3', ativa: false, direcionada: false },
              { origem: 'C', destino: 'E', rotulo: '4', ativa: true, direcionada: false },
              { origem: 'B', destino: 'C', rotulo: '1', ativa: false, direcionada: false },
            ],
            destaques: ['E'],
            valores: ['Visitados: [A, B, C, D, E]', 'Fila: vazia'],
          },
        ],
      },
      complexidade: {
        tempo: 'O(V + E)',
        espaco: 'O(V)',
        observacao: 'V é o número de vértices e E é o número de arestas percorridas.',
      },
      erros_comuns: [
        'Esquecer de registrar vértices já visitados, causando loops infinitos quando há ciclos no grafo.',
        'Confundir grafo não direcionado (mão dupla) com grafo direcionado (mão única).',
      ],
      exercicios: [
        {
          pergunta: 'Em um grafo com ciclo A—B—C—A, o que acontece na busca se não marcarmos vértices visitados?',
          resposta_esperada: 'O algoritmo entra em loop infinito alternando entre A, B e C.',
          dica: 'Pense em andar em círculo sem deixar marcas no chão.',
        },
      ],
      fontes_ou_termos_para_pesquisar: [
        'Teoria dos Grafos lista de adjacência',
        'Busca em Largura (BFS) vs Busca em Profundidade (DFS)',
        'Algoritmo de Dijkstra caminho mínimo',
      ],
    };
  } else if (norm.includes('pilha') && !norm.includes('fila')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Uma Pilha (Stack) é uma estrutura linear que segue a regra LIFO (Last In, First Out): o último elemento inserido é sempre o primeiro a ser removido.',
      nivel: 'Iniciante',
      secoes: [
        {
          titulo: '1. Princípio LIFO (Último a Entrar, Primeiro a Sair)',
          texto:
            'Imagine uma pilha de pratos: você coloca um prato novo no topo (operação push) e, quando precisa pegar um prato, retira exatamente o que está no topo (operação pop).',
          exemplo: 'push(10) -> push(20) -> push(30) -> pop() remove 30.',
        },
        {
          titulo: '2. Onde Pilhas são usadas na prática',
          texto:
            'Controlar chamadas de funções na memória (Call Stack), funcionalidade Desfazer (Ctrl+Z) em editores e validação de parênteses balanceados em compiladores.',
        },
      ],
      visualizacao: {
        tipo: 'pilha',
        passos: [
          {
            descricao: 'Passo 1: Inserimos o elemento 10 na pilha vazia com push(10). Ele passa a ser o topo.',
            nos: [{ id: 'p1', rotulo: '10', subrotulo: 'Base / Topo', estado: 'ativo' }],
            arestas: [],
            destaques: ['p1'],
            valores: ['Operação: push(10)', 'Tamanho: 1', 'Topo: 10'],
          },
          {
            descricao: 'Passo 2: Chamamos push(25). O valor 25 é empilhado acima de 10 e assume o topo.',
            nos: [
              { id: 'p1', rotulo: '10', subrotulo: 'Base', estado: 'padrao' },
              { id: 'p2', rotulo: '25', subrotulo: 'Novo Topo', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['p2'],
            valores: ['Operação: push(25)', 'Tamanho: 2', 'Topo: 25'],
          },
          {
            descricao: 'Passo 3: Chamamos push(40). Agora temos 3 elementos e o topo é 40.',
            nos: [
              { id: 'p1', rotulo: '10', subrotulo: 'Base', estado: 'padrao' },
              { id: 'p2', rotulo: '25', subrotulo: 'Meio', estado: 'padrao' },
              { id: 'p3', rotulo: '40', subrotulo: 'Topo', estado: 'destaque' },
            ],
            arestas: [],
            destaques: ['p3'],
            valores: ['Operação: push(40)', 'Tamanho: 3', 'Topo: 40'],
          },
          {
            descricao: 'Passo 4: Executamos pop(). O elemento do topo (40) sai e 25 volta a ser o topo.',
            nos: [
              { id: 'p1', rotulo: '10', subrotulo: 'Base', estado: 'padrao' },
              { id: 'p2', rotulo: '25', subrotulo: 'Topo atual', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['p2'],
            valores: ['Operação: pop() -> 40', 'Tamanho: 2', 'Topo: 25'],
          },
        ],
      },
      complexidade: {
        tempo: 'O(1) para push e pop',
        espaco: 'O(n)',
        observacao: 'Inserir ou remover do topo não exige percorrer os outros elementos.',
      },
      erros_comuns: [
        'Tentar executar pop() em uma pilha vazia (Stack Underflow).',
        'Confundir Pilha (LIFO) com Fila (FIFO).',
      ],
      exercicios: [
        {
          pergunta: 'Se você fizer push(5), push(8), pop(), push(3), qual elemento está no topo agora?',
          resposta_esperada: 'O elemento 3 (pois o 8 foi removido no pop).',
          dica: 'Acompanhe apenas quem está por cima após cada operação.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Estrutura de dados Pilha LIFO', 'Call Stack em compiladores'],
    };
  } else if (norm.includes('fila') && !norm.includes('pilha')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Uma Fila (Queue) é uma estrutura linear que segue a regra FIFO (First In, First Out): o primeiro elemento a entrar é sempre o primeiro a ser atendido e removido.',
      nivel: 'Iniciante',
      secoes: [
        {
          titulo: '1. Princípio FIFO (Primeiro a Entrar, Primeiro a Sair)',
          texto:
            'Assim como uma fila de banco, novos elementos entram no final (enqueue) e são atendidos pela frente (dequeue).',
          exemplo: 'enqueue("Ana") -> enqueue("Bia") -> dequeue() atende "Ana".',
        },
      ],
      visualizacao: {
        tipo: 'fila',
        passos: [
          {
            descricao: 'Passo 1: "Ana" entra na fila vazia (enqueue). Ela é simultaneamente a frente e o fim.',
            nos: [{ id: 'f1', rotulo: 'Ana', subrotulo: 'Frente', estado: 'ativo' }],
            arestas: [],
            destaques: ['f1'],
            valores: ['Operação: enqueue(Ana)', 'Frente: Ana'],
          },
          {
            descricao: 'Passo 2: "Bia" e "Caio" entram no final da fila, aguardando a vez atrás de "Ana".',
            nos: [
              { id: 'f1', rotulo: 'Ana', subrotulo: 'Frente', estado: 'destaque' },
              { id: 'f2', rotulo: 'Bia', subrotulo: '2º', estado: 'padrao' },
              { id: 'f3', rotulo: 'Caio', subrotulo: 'Fim', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['f1', 'f3'],
            valores: ['Operação: enqueue(Bia, Caio)', 'Tamanho: 3'],
          },
          {
            descricao: 'Passo 3: dequeue() atende "Ana". Agora "Bia" passa a ser a frente da fila.',
            nos: [
              { id: 'f2', rotulo: 'Bia', subrotulo: 'Nova Frente', estado: 'ativo' },
              { id: 'f3', rotulo: 'Caio', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [],
            destaques: ['f2'],
            valores: ['Operação: dequeue() -> Ana', 'Tamanho: 2', 'Frente: Bia'],
          },
        ],
      },
      complexidade: {
        tempo: 'O(1) para enqueue e dequeue',
        espaco: 'O(n)',
        observacao: 'Usando ponteiros de frente e fim ou fila circular.',
      },
      erros_comuns: ['Remover elementos no índice 0 de um array comum sem mover ponteiro (custa O(n)).'],
      exercicios: [
        {
          pergunta: 'Na fila [10, 20, 30] com frente em 10, qual valor sai no próximo dequeue()?',
          resposta_esperada: '10, pois foi o primeiro a entrar.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Estrutura de Dados Fila FIFO', 'Fila Circular'],
    };
  } else if (norm.includes('pilha') && norm.includes('fila')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Pilhas (LIFO) e Filas (FIFO) são estruturas lineares que restringem onde inserções e remoções acontecem para garantir ordem previsível.',
      nivel: 'Iniciante',
      secoes: [
        {
          titulo: '1. Diferença central: Topo vs. Frente',
          texto:
            'Na Pilha (LIFO), você insere e remove do mesmo extremo (o topo). Na Fila (FIFO), você insere no final e remove da frente.',
          exemplo: 'Entrada [A, B, C]: Pilha remove C primeiro; Fila remove A primeiro.',
        },
      ],
      visualizacao: {
        tipo: 'pilha',
        passos: [
          {
            descricao: 'Passo 1: Inserimos os itens A e B em sequência na estrutura.',
            nos: [
              { id: 's1', rotulo: 'A', subrotulo: '1º inserido', estado: 'padrao' },
              { id: 's2', rotulo: 'B', subrotulo: '2º inserido (Topo)', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['s2'],
            valores: ['Modo: Pilha (LIFO)', 'Próximo a sair: B'],
          },
          {
            descricao: 'Passo 2: Inserimos C. Na Pilha, C fica no topo e será o primeiro a sair.',
            nos: [
              { id: 's1', rotulo: 'A', subrotulo: 'Base', estado: 'padrao' },
              { id: 's2', rotulo: 'B', subrotulo: 'Meio', estado: 'padrao' },
              { id: 's3', rotulo: 'C', subrotulo: 'Topo (sai 1º)', estado: 'destaque' },
            ],
            arestas: [],
            destaques: ['s3'],
            valores: ['Entrada: A, B, C', 'Pop remove: C'],
          },
          {
            descricao: 'Passo 3: Ao remover o topo (C), B volta ao topo da pilha.',
            nos: [
              { id: 's1', rotulo: 'A', subrotulo: 'Base', estado: 'padrao' },
              { id: 's2', rotulo: 'B', subrotulo: 'Topo atual', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['s2'],
            valores: ['Removido: C', 'Restante: [A, B]'],
          },
        ],
      },
      complexidade: {
        tempo: 'O(1)',
        espaco: 'O(n)',
      },
      erros_comuns: ['Escolher Pilha quando a ordem justa de chegada (FIFO) é necessária.'],
      exercicios: [
        {
          pergunta: 'Para implementar uma fila de impressão de documentos, você usaria Pilha ou Fila?',
          resposta_esperada: 'Fila (FIFO), para imprimir os documentos na ordem em que foram enviados.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Comparação Pilha LIFO e Fila FIFO'],
    };
  } else if (norm.includes('lista ligada') || norm.includes('lista encadeada')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Uma Lista Ligada armazena elementos em nós separados na memória, onde cada nó guarda seu valor e um ponteiro para o próximo nó.',
      nivel: 'Intermediário',
      secoes: [
        {
          titulo: '1. Como os nós se conectam',
          texto:
            'Diferente de um array contínuo, os nós de uma lista ligada podem estar em endereços espalhados. O encadeamento é mantido pelo campo "próximo" (next), terminando em NULL.',
          exemplo: '[10 | •] -> [20 | •] -> [30 | NULL]',
        },
        {
          titulo: '2. Inserção sem deslocar todo o vetor',
          texto:
            'Para inserir um nó no meio ou início, basta redirecionar dois ponteiros, sem precisar copiar os elementos seguintes como ocorre em arrays.',
        },
      ],
      visualizacao: {
        tipo: 'lista_ligada',
        passos: [
          {
            descricao: 'Passo 1: Lista inicial com 3 nós encadeados. HEAD aponta para o primeiro nó (10).',
            nos: [
              { id: 'n1', rotulo: '10', subrotulo: 'HEAD', estado: 'ativo' },
              { id: 'n2', rotulo: '20', subrotulo: 'Nó 2', estado: 'padrao' },
              { id: 'n3', rotulo: '30', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'n1', destino: 'n2', rotulo: 'next', ativa: true },
              { origem: 'n2', destino: 'n3', rotulo: 'next', ativa: false },
            ],
            destaques: ['n1'],
            valores: ['HEAD: 10', 'Tamanho: 3'],
          },
          {
            descricao: 'Passo 2: Queremos inserir o nó 15 entre 10 e 20. Primeiro fazemos 15.next apontar para 20.',
            nos: [
              { id: 'n1', rotulo: '10', subrotulo: 'HEAD', estado: 'visitado' },
              { id: 'n15', rotulo: '15', subrotulo: 'Novo', estado: 'destaque' },
              { id: 'n2', rotulo: '20', subrotulo: 'Alvo', estado: 'ativo' },
              { id: 'n3', rotulo: '30', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'n1', destino: 'n2', rotulo: 'antigo', ativa: false },
              { origem: 'n15', destino: 'n2', rotulo: '15.next', ativa: true },
              { origem: 'n2', destino: 'n3', rotulo: 'next', ativa: false },
            ],
            destaques: ['n15', 'n2'],
            valores: ['Novo nó: 15', '15.next = 20'],
          },
          {
            descricao: 'Passo 3: Atualizamos 10.next para apontar para 15. A lista agora está ligada na ordem 10 → 15 → 20 → 30.',
            nos: [
              { id: 'n1', rotulo: '10', subrotulo: 'HEAD', estado: 'visitado' },
              { id: 'n15', rotulo: '15', subrotulo: 'Inserido', estado: 'destaque' },
              { id: 'n2', rotulo: '20', subrotulo: 'Nó 3', estado: 'padrao' },
              { id: 'n3', rotulo: '30', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'n1', destino: 'n15', rotulo: '10.next', ativa: true },
              { origem: 'n15', destino: 'n2', rotulo: 'next', ativa: true },
              { origem: 'n2', destino: 'n3', rotulo: 'next', ativa: false },
            ],
            destaques: ['n15'],
            valores: ['HEAD: 10', 'Tamanho: 4'],
          },
        ],
      },
      complexidade: {
        tempo: 'Busca O(n) | Inserção no início O(1)',
        espaco: 'O(n)',
      },
      erros_comuns: [
        'Atualizar 10.next antes de salvar a referência para 20, perdendo o restante da lista na memória.',
      ],
      exercicios: [
        {
          pergunta: 'Por que acessar o 5º elemento de uma lista ligada é mais lento que em um array?',
          resposta_esperada: 'Porque na lista ligada não há acesso direto por índice; é preciso percorrer nó por nó desde HEAD.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Lista simplesmente ligada', 'Lista duplamente ligada ponteiros'],
    };
  } else if (norm.includes('hash')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'Uma Tabela Hash (Hash Table) mapeia chaves para índices de um array usando uma função hash, permitindo buscas e inserções em tempo médio constante O(1).',
      nivel: 'Intermediário',
      secoes: [
        {
          titulo: '1. Função Hash e Baldes (Buckets)',
          texto:
            'A função hash transforma uma chave (como um nome ou ID) em um número inteiro dentro do tamanho da tabela (ex.: hash(chave) % tamanho).',
          exemplo: 'Se tamanho = 5 e chave = 12, então 12 % 5 = índice 2.',
        },
        {
          titulo: '2. Tratando Colisões',
          texto:
            'Quando duas chaves diferentes caem no mesmo índice, ocorre uma colisão. Uma técnica comum é o encadeamento (chaining), guardando uma lista ligada naquele balde.',
        },
      ],
      visualizacao: {
        tipo: 'tabela_hash',
        passos: [
          {
            descricao: 'Passo 1: Inserimos a chave "Ana" (hash = 1). O índice 1 recebe o par ("Ana": 95).',
            nos: [
              { id: 'b0', rotulo: '[0]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b1', rotulo: '[1]', subrotulo: 'Ana → 95', estado: 'ativo' },
              { id: 'b2', rotulo: '[2]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b3', rotulo: '[3]', subrotulo: 'vazio', estado: 'padrao' },
            ],
            arestas: [],
            destaques: ['b1'],
            valores: ['hash("Ana") % 4 = 1'],
          },
          {
            descricao: 'Passo 2: Inserimos "Leo" (hash = 3). Vai direto para o balde [3] sem colisões.',
            nos: [
              { id: 'b0', rotulo: '[0]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b1', rotulo: '[1]', subrotulo: 'Ana → 95', estado: 'visitado' },
              { id: 'b2', rotulo: '[2]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b3', rotulo: '[3]', subrotulo: 'Leo → 88', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['b3'],
            valores: ['hash("Leo") % 4 = 3'],
          },
          {
            descricao: 'Passo 3: Inserimos "Bia" (hash = 1). Colisão no balde [1]! Encadeamos "Bia" ao lado de "Ana".',
            nos: [
              { id: 'b0', rotulo: '[0]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b1', rotulo: '[1]', subrotulo: 'Ana → 95  ➜  Bia → 92', estado: 'destaque' },
              { id: 'b2', rotulo: '[2]', subrotulo: 'vazio', estado: 'padrao' },
              { id: 'b3', rotulo: '[3]', subrotulo: 'Leo → 88', estado: 'visitado' },
            ],
            arestas: [],
            destaques: ['b1'],
            valores: ['Colisão em [1]', 'Resolvida via encadeamento'],
          },
        ],
      },
      complexidade: {
        tempo: 'Médio O(1) | Pior caso O(n)',
        espaco: 'O(n)',
      },
      erros_comuns: ['Usar uma função hash que concentra todas as chaves no mesmo índice, degradando a busca para O(n).'],
      exercicios: [
        {
          pergunta: 'Em uma tabela de tamanho 5 usando h(k) = k % 5, em qual índice cai a chave 17?',
          resposta_esperada: 'Índice 2, pois 17 dividido por 5 deixa resto 2.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Tabela Hash tratamento de colisões', 'Fator de carga e rehashing'],
    };
  } else if (norm.includes('quicksort') || norm.includes('ordenacao')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'O Quicksort (e algoritmos de ordenação eficientes) organiza uma sequência escolhendo um elemento pivô e particionando os valores menores à esquerda e os maiores à direita.',
      nivel: 'Intermediário',
      secoes: [
        {
          titulo: '1. Divisão e Conquista com Pivô',
          texto:
            'No Quicksort, selecionamos um pivô (ex.: o último elemento). Todos os números menores que o pivô vão para o lado esquerdo e os maiores vão para o lado direito.',
          exemplo: 'Array [30, 10, 50, 20, 40] com pivô 40 -> menores [30, 10, 20], pivô [40], maiores [50].',
        },
        {
          titulo: '2. Posição Definitiva do Pivô',
          texto:
            'Após o particionamento, o pivô já ocupa sua posição final exata na lista ordenada. O processo se repete recursivamente nas duas metades.',
        },
      ],
      visualizacao: {
        tipo: 'array',
        passos: [
          {
            descricao: 'Passo 1: Array inicial [30, 10, 50, 20, 40]. Escolhemos 40 (índice 4) como pivô.',
            nos: [
              { id: '0', rotulo: '30', subrotulo: '[0]', estado: 'padrao' },
              { id: '1', rotulo: '10', subrotulo: '[1]', estado: 'padrao' },
              { id: '2', rotulo: '50', subrotulo: '[2]', estado: 'padrao' },
              { id: '3', rotulo: '20', subrotulo: '[3]', estado: 'padrao' },
              { id: '4', rotulo: '40', subrotulo: 'Pivô', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['4'],
            valores: ['Pivô: 40', 'Comparações: 0'],
          },
          {
            descricao: 'Passo 2: Comparamos cada item com 40. 30, 10 e 20 são menores que 40; 50 é maior. Trocamos 50 e 20.',
            nos: [
              { id: '0', rotulo: '30', subrotulo: '< 40', estado: 'visitado' },
              { id: '1', rotulo: '10', subrotulo: '< 40', estado: 'visitado' },
              { id: '2', rotulo: '20', subrotulo: 'Trocado', estado: 'ativo' },
              { id: '3', rotulo: '50', subrotulo: '> 40', estado: 'erro' },
              { id: '4', rotulo: '40', subrotulo: 'Pivô', estado: 'ativo' },
            ],
            arestas: [],
            destaques: ['2', '3'],
            valores: ['Troca índices [2] ↔ [3]', 'Menores à esquerda'],
          },
          {
            descricao: 'Passo 3: Colocamos o pivô 40 entre os menores e maiores (índice 3). 40 está na posição final!',
            nos: [
              { id: '0', rotulo: '30', subrotulo: 'Esq', estado: 'padrao' },
              { id: '1', rotulo: '10', subrotulo: 'Esq', estado: 'padrao' },
              { id: '2', rotulo: '20', subrotulo: 'Esq', estado: 'padrao' },
              { id: '3', rotulo: '40', subrotulo: 'Fixo ✓', estado: 'destaque' },
              { id: '4', rotulo: '50', subrotulo: 'Dir ✓', estado: 'destaque' },
            ],
            arestas: [],
            destaques: ['3'],
            valores: ['Pivô 40 fixado em [3]', 'Subvetor esq: [30, 10, 20]'],
          },
          {
            descricao: 'Passo 4: Ordenando o subvetor esquerdo [30, 10, 20], todos os elementos ficam ordenados!',
            nos: [
              { id: '0', rotulo: '10', subrotulo: 'Ordenado', estado: 'destaque' },
              { id: '1', rotulo: '20', subrotulo: 'Ordenado', estado: 'destaque' },
              { id: '2', rotulo: '30', subrotulo: 'Ordenado', estado: 'destaque' },
              { id: '3', rotulo: '40', subrotulo: 'Ordenado', estado: 'destaque' },
              { id: '4', rotulo: '50', subrotulo: 'Ordenado', estado: 'destaque' },
            ],
            arestas: [],
            destaques: ['0', '1', '2', '3', '4'],
            valores: ['Resultado: [10, 20, 30, 40, 50]', 'Concluído ✓'],
          },
        ],
      },
      complexidade: {
        tempo: 'Médio O(n log n) | Pior caso O(n²)',
        espaco: 'O(log n)',
      },
      erros_comuns: ['Escolher sempre o primeiro ou último elemento em listas já ordenadas sem aleatorização (causa pior caso O(n²)).'],
      exercicios: [
        {
          pergunta: 'Após uma partição completa do Quicksort, o que garantimos sobre o pivô?',
          resposta_esperada: 'Que ele já está em sua posição definitiva e nunca mais precisará ser movido.',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Quicksort partição de Lomuto e Hoare', 'Mergesort vs Quicksort'],
    };
  } else if (norm.includes('busca binaria')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'A Busca Binária localiza um elemento em uma lista já ordenada dividindo o intervalo de busca ao meio a cada comparação.',
      nivel: 'Iniciante',
      secoes: [
        {
          titulo: '1. Pré-requisito obrigatório: Lista Ordenada',
          texto:
            'Só podemos descartar metade da lista de uma vez se os valores estiverem em ordem crescente (ou decrescente).',
        },
        {
          titulo: '2. Descarte pela metade a cada passo',
          texto:
            'Comparamos o elemento do meio com o alvo. Se o alvo for maior, ajustamos início = meio + 1; se for menor, ajustamos fim = meio - 1.',
          exemplo: 'Em 1.000 itens ordenados, bastam no máximo 10 comparações (log₂ 1000 ≈ 10).',
        },
      ],
      visualizacao: {
        tipo: 'array',
        passos: [
          {
            descricao: 'Passo 1: Buscamos o valor 28 em [5, 12, 19, 28, 35, 42]. O meio inicial é o índice [2] (valor 19).',
            nos: [
              { id: '0', rotulo: '5', subrotulo: 'Início', estado: 'padrao' },
              { id: '1', rotulo: '12', subrotulo: '', estado: 'padrao' },
              { id: '2', rotulo: '19', subrotulo: 'Meio', estado: 'ativo' },
              { id: '3', rotulo: '28', subrotulo: '', estado: 'padrao' },
              { id: '4', rotulo: '35', subrotulo: '', estado: 'padrao' },
              { id: '5', rotulo: '42', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [],
            destaques: ['2'],
            valores: ['Alvo: 28', 'Meio: 19 (28 > 19)'],
          },
          {
            descricao: 'Passo 2: Como 28 > 19, descartamos a metade esquerda [0..2]. Novo intervalo é [3..5]. Meio = [4] (35).',
            nos: [
              { id: '0', rotulo: '5', subrotulo: 'Descartado', estado: 'erro' },
              { id: '1', rotulo: '12', subrotulo: 'Descartado', estado: 'erro' },
              { id: '2', rotulo: '19', subrotulo: 'Descartado', estado: 'erro' },
              { id: '3', rotulo: '28', subrotulo: 'Início', estado: 'padrao' },
              { id: '4', rotulo: '35', subrotulo: 'Meio', estado: 'ativo' },
              { id: '5', rotulo: '42', subrotulo: 'Fim', estado: 'padrao' },
            ],
            arestas: [],
            destaques: ['4'],
            valores: ['Alvo: 28', 'Meio: 35 (28 < 35)'],
          },
          {
            descricao: 'Passo 3: Como 28 < 35, descartamos a direita. Sobra apenas o índice [3], que é exatamente 28!',
            nos: [
              { id: '0', rotulo: '5', subrotulo: 'Descartado', estado: 'erro' },
              { id: '1', rotulo: '12', subrotulo: 'Descartado', estado: 'erro' },
              { id: '2', rotulo: '19', subrotulo: 'Descartado', estado: 'erro' },
              { id: '3', rotulo: '28', subrotulo: 'Encontrado ✓', estado: 'destaque' },
              { id: '4', rotulo: '35', subrotulo: 'Descartado', estado: 'erro' },
              { id: '5', rotulo: '42', subrotulo: 'Descartado', estado: 'erro' },
            ],
            arestas: [],
            destaques: ['3'],
            valores: ['Alvo 28 encontrado no índice 3', 'Comparações: 3'],
          },
        ],
      },
      complexidade: {
        tempo: 'O(log n)',
        espaco: 'O(1) iterativa',
      },
      erros_comuns: ['Aplicar Busca Binária em um vetor não ordenado.', 'Erro de off-by-one ao atualizar início = meio + 1.'],
      exercicios: [
        {
          pergunta: 'Quantas comparações no máximo a Busca Binária faz em 1.024 itens ordenados?',
          resposta_esperada: 'Cerca de 10 comparações (pois 2¹⁰ = 1024).',
        },
      ],
      fontes_ou_termos_para_pesquisar: ['Busca Binária invariante de laço'],
    };
  } else if (norm.includes('dns')) {
    payload = {
      id,
      titulo: topic,
      resumo:
        'O DNS (Domain Name System) funciona como a agenda telefônica da internet: ele traduz nomes legíveis por humanos (como exemplo.com) em endereços IP numéricos usados pelos computadores.',
      nivel: 'Iniciante',
      secoes: [
        {
          titulo: '1. Por que precisamos do DNS',
          texto:
            'Navegadores e roteadores se comunicam usando endereços IP (como 93.184.216.34), mas humanos memorizam nomes com mais facilidade. O DNS faz essa tradução automaticamente em milissegundos.',
        },
        {
          titulo: '2. O caminho da resolução hierárquica',
          texto:
            'Quando o endereço não está no cache do seu computador, a consulta passa por um Resolvedor Recursivo, que consulta o Servidor Raiz (.), o Servidor de TLD (.com/.br) e finalmente o Servidor Autoritativo do domínio.',
        },
      ],
      visualizacao: {
        tipo: 'fluxo',
        passos: [
          {
            descricao: 'Passo 1: Você digita o domínio no navegador. Ele verifica o cache local e envia a pergunta ao Resolvedor DNS.',
            nos: [
              { id: 'cli', rotulo: 'Navegador', subrotulo: 'Pede exemplo.com', estado: 'ativo' },
              { id: 'res', rotulo: 'Resolvedor DNS', subrotulo: 'Cache vazio', estado: 'padrao' },
              { id: 'root', rotulo: 'Raiz / TLD', subrotulo: 'Indica .com', estado: 'padrao' },
              { id: 'auth', rotulo: 'Autoritativo', subrotulo: 'Tem o IP real', estado: 'padrao' },
            ],
            arestas: [{ origem: 'cli', destino: 'res', rotulo: '1. Onde fica?', ativa: true }],
            destaques: ['cli', 'res'],
            valores: ['Domínio: exemplo.com', 'Cache: miss'],
          },
          {
            descricao: 'Passo 2: O Resolvedor pergunta aos servidores Raiz e TLD (.com), que indicam qual é o Servidor Autoritativo.',
            nos: [
              { id: 'cli', rotulo: 'Navegador', subrotulo: 'Aguardando', estado: 'visitado' },
              { id: 'res', rotulo: 'Resolvedor DNS', subrotulo: 'Consultando', estado: 'ativo' },
              { id: 'root', rotulo: 'Raiz / TLD', subrotulo: 'Aponta NS', estado: 'destaque' },
              { id: 'auth', rotulo: 'Autoritativo', subrotulo: 'Pronto', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'cli', destino: 'res', rotulo: 'Aguarda', ativa: false },
              { origem: 'res', destino: 'root', rotulo: '2. Qual NS?', ativa: true },
            ],
            destaques: ['res', 'root'],
            valores: ['TLD: .com', 'Resposta: endereço do servidor autoritativo'],
          },
          {
            descricao: 'Passo 3: O Resolvedor consulta o Servidor Autoritativo, recebe o IP oficial e devolve ao navegador (salvando em cache).',
            nos: [
              { id: 'cli', rotulo: 'Navegador', subrotulo: 'Conecta ao IP ✓', estado: 'destaque' },
              { id: 'res', rotulo: 'Resolvedor DNS', subrotulo: 'Salva TTL cache', estado: 'visitado' },
              { id: 'root', rotulo: 'Raiz / TLD', subrotulo: 'Consultado', estado: 'visitado' },
              { id: 'auth', rotulo: 'Autoritativo', subrotulo: 'Retorna IP', estado: 'ativo' },
            ],
            arestas: [
              { origem: 'res', destino: 'auth', rotulo: '3. IP exato?', ativa: true },
              { origem: 'res', destino: 'cli', rotulo: '4. IP retornado', ativa: true },
            ],
            destaques: ['cli', 'auth'],
            valores: ['Registro tipo A', 'Cache ativado (TTL)'],
          },
        ],
      },
      erros_comuns: [
        'Achar que o servidor DNS hospeda o site inteiro (ele apenas informa o endereço IP onde o servidor do site está).',
        'Esquecer que alterações de DNS demoram para propagar por causa do tempo de cache (TTL).',
      ],
      exercicios: [
        {
          pergunta: 'O que acontece quando você acessa o mesmo site pela segunda vez minutos depois?',
          resposta_esperada: 'O navegador ou resolvedor usa o IP guardado em cache (enquanto o TTL não expirar), evitando consultar toda a hierarquia novamente.',
        },
      ],
      fontes_ou_termos_para_pesquisar: [
        'Registros DNS tipo A, AAAA e CNAME',
        'Resolvedor DNS recursivo vs autoritativo',
        'O que é TTL no DNS',
      ],
    };
  } else if (norm.includes('arvore') || norm.includes('recurs')) {
    const isRecursion = norm.includes('recurs') && !norm.includes('arvore');
    payload = {
      id,
      titulo: topic,
      resumo: isRecursion
        ? 'Recursão é uma técnica onde uma função chama a si mesma para resolver versões menores do mesmo problema até atingir um caso base que encerra as chamadas.'
        : 'Uma Árvore Binária organiza dados em uma hierarquia onde cada nó possui no máximo dois filhos (esquerdo e direito), permitindo buscas rápidas quando ordenada.',
      nivel: 'Intermediário',
      secoes: [
        {
          titulo: isRecursion ? '1. Caso Base e Passo Recursivo' : '1. Estrutura Raiz e Subárvores',
          texto: isRecursion
            ? 'Toda função recursiva precisa de duas partes: o caso base (quando parar) e a chamada recursiva (como diminuir o problema em direção ao caso base).'
            : 'Em uma Árvore Binária de Busca (BST), valores menores que o nó atual ficam à esquerda e valores maiores ficam à direita.',
        },
        {
          titulo: isRecursion ? '2. Pilha de Chamadas (Call Stack)' : '2. Poda de Caminhos na Busca',
          texto: isRecursion
            ? 'Cada chamada pendente fica empilhada na memória aguardando o retorno da chamada filha até atingir o caso base e desempilhar os resultados.'
            : 'Ao comparar o alvo com o nó atual, você descarta toda uma subárvore de uma vez, evitando percorrer todos os elementos em árvores balanceadas.',
          exemplo: isRecursion
            ? 'fatorial(3) -> espera 3 × fatorial(2) -> espera 2 × fatorial(1) -> retorna 1 -> 2 -> 6.'
            : 'Busca pelo 40 a partir da raiz 50: como 40 < 50, toda a subárvore direita (70, 60, 85) é descartada.',
        },
      ],
      visualizacao: {
        tipo: 'arvore',
        passos: [
          {
            descricao: isRecursion
              ? 'Passo 1: Chamamos fatorial(3). Como 3 > 1, ela precisa esperar o resultado de fatorial(2).'
              : 'Passo 1: Começamos pela raiz (50). Queremos encontrar o valor 40.',
            nos: isRecursion
              ? [
                  { id: 'f3', rotulo: 'fat(3)', subrotulo: '3 × fat(2)', estado: 'ativo', x: 50, y: 18 },
                  { id: 'f2', rotulo: 'fat(2)', subrotulo: 'Aguardando', estado: 'padrao', x: 50, y: 50 },
                  { id: 'f1', rotulo: 'fat(1)', subrotulo: 'Caso base', estado: 'padrao', x: 50, y: 82 },
                ]
              : [
                  { id: '50', rotulo: '50', subrotulo: 'Raiz', estado: 'ativo', x: 50, y: 16 },
                  { id: '30', rotulo: '30', subrotulo: '< 50', estado: 'padrao', x: 28, y: 48 },
                  { id: '70', rotulo: '70', subrotulo: '> 50', estado: 'padrao', x: 72, y: 48 },
                  { id: '20', rotulo: '20', subrotulo: 'Folha', estado: 'padrao', x: 16, y: 80 },
                  { id: '40', rotulo: '40', subrotulo: 'Alvo', estado: 'padrao', x: 40, y: 80 },
                  { id: '60', rotulo: '60', subrotulo: 'Folha', estado: 'padrao', x: 60, y: 80 },
                  { id: '85', rotulo: '85', subrotulo: 'Folha', estado: 'padrao', x: 84, y: 80 },
                ],
            arestas: isRecursion
              ? [
                  { origem: 'f3', destino: 'f2', rotulo: 'chama', ativa: true },
                  { origem: 'f2', destino: 'f1', rotulo: 'chama', ativa: false },
                ]
              : [
                  { origem: '50', destino: '30', rotulo: '40 < 50', ativa: true },
                  { origem: '50', destino: '70', rotulo: '> 50', ativa: false },
                  { origem: '30', destino: '20', rotulo: '', ativa: false },
                  { origem: '30', destino: '40', rotulo: '', ativa: false },
                  { origem: '70', destino: '60', rotulo: '', ativa: false },
                  { origem: '70', destino: '85', rotulo: '', ativa: false },
                ],
            destaques: [isRecursion ? 'f3' : '50'],
            valores: isRecursion ? ['Pilha: [fat(3)]'] : ['Alvo: 40', 'Nó atual: 50'],
          },
          {
            descricao: isRecursion
              ? 'Passo 2: fat(2) chama fat(1), atingindo o caso base que retorna 1.'
              : 'Passo 2: Como 40 < 50, descemos para a subárvore esquerda e visitamos o nó 30.',
            nos: isRecursion
              ? [
                  { id: 'f3', rotulo: 'fat(3)', subrotulo: 'Esperando', estado: 'visitado', x: 50, y: 18 },
                  { id: 'f2', rotulo: 'fat(2)', subrotulo: '2 × fat(1)', estado: 'visitado', x: 50, y: 50 },
                  { id: 'f1', rotulo: 'fat(1)', subrotulo: 'Retorna 1 ✓', estado: 'destaque', x: 50, y: 82 },
                ]
              : [
                  { id: '50', rotulo: '50', subrotulo: 'Visitado', estado: 'visitado', x: 50, y: 16 },
                  { id: '30', rotulo: '30', subrotulo: 'Ativo', estado: 'ativo', x: 28, y: 48 },
                  { id: '70', rotulo: '70', subrotulo: 'Podado', estado: 'padrao', x: 72, y: 48 },
                  { id: '20', rotulo: '20', subrotulo: 'Folha', estado: 'padrao', x: 16, y: 80 },
                  { id: '40', rotulo: '40', subrotulo: 'Alvo', estado: 'padrao', x: 40, y: 80 },
                  { id: '60', rotulo: '60', subrotulo: 'Podado', estado: 'padrao', x: 60, y: 80 },
                  { id: '85', rotulo: '85', subrotulo: 'Podado', estado: 'padrao', x: 84, y: 80 },
                ],
            arestas: isRecursion
              ? [
                  { origem: 'f3', destino: 'f2', rotulo: 'espera', ativa: false },
                  { origem: 'f2', destino: 'f1', rotulo: 'caso base', ativa: true },
                ]
              : [
                  { origem: '50', destino: '30', rotulo: '', ativa: false },
                  { origem: '50', destino: '70', rotulo: '', ativa: false },
                  { origem: '30', destino: '20', rotulo: '', ativa: false },
                  { origem: '30', destino: '40', rotulo: '40 > 30', ativa: true },
                  { origem: '70', destino: '60', rotulo: '', ativa: false },
                  { origem: '70', destino: '85', rotulo: '', ativa: false },
                ],
            destaques: [isRecursion ? 'f1' : '30'],
            valores: isRecursion ? ['Retorno base: 1'] : ['Alvo: 40', 'Comparando com 30'],
          },
          {
            descricao: isRecursion
              ? 'Passo 3: Os retornos sobem desempilhando: fat(2)=2 e finalmente fat(3)=6.'
              : 'Passo 3: Como 40 > 30, seguimos para a direita de 30 e encontramos 40!',
            nos: isRecursion
              ? [
                  { id: 'f3', rotulo: 'fat(3) = 6', subrotulo: 'Resultado ✓', estado: 'destaque', x: 50, y: 18 },
                  { id: 'f2', rotulo: 'fat(2) = 2', subrotulo: 'Retornou 2', estado: 'visitado', x: 50, y: 50 },
                  { id: 'f1', rotulo: 'fat(1) = 1', subrotulo: 'Base 1', estado: 'visitado', x: 50, y: 82 },
                ]
              : [
                  { id: '50', rotulo: '50', subrotulo: 'Visitado', estado: 'visitado', x: 50, y: 16 },
                  { id: '30', rotulo: '30', subrotulo: 'Visitado', estado: 'visitado', x: 28, y: 48 },
                  { id: '70', rotulo: '70', subrotulo: 'Podado', estado: 'padrao', x: 72, y: 48 },
                  { id: '20', rotulo: '20', subrotulo: 'Folha', estado: 'padrao', x: 16, y: 80 },
                  { id: '40', rotulo: '40', subrotulo: 'Encontrado ✓', estado: 'destaque', x: 40, y: 80 },
                  { id: '60', rotulo: '60', subrotulo: 'Podado', estado: 'padrao', x: 60, y: 80 },
                  { id: '85', rotulo: '85', subrotulo: 'Podado', estado: 'padrao', x: 84, y: 80 },
                ],
            arestas: isRecursion
              ? [
                  { origem: 'f1', destino: 'f2', rotulo: 'retorna 1', ativa: true },
                  { origem: 'f2', destino: 'f3', rotulo: 'retorna 2', ativa: true },
                ]
              : [
                  { origem: '50', destino: '30', rotulo: '', ativa: false },
                  { origem: '50', destino: '70', rotulo: '', ativa: false },
                  { origem: '30', destino: '20', rotulo: '', ativa: false },
                  { origem: '30', destino: '40', rotulo: '✓', ativa: true },
                  { origem: '70', destino: '60', rotulo: '', ativa: false },
                  { origem: '70', destino: '85', rotulo: '', ativa: false },
                ],
            destaques: [isRecursion ? 'f3' : '40'],
            valores: isRecursion ? ['Resultado final: 6'] : ['Nó 40 encontrado ✓'],
          },
        ],
      },
      complexidade: {
        tempo: isRecursion ? 'Depende da árvore de chamadas (O(n) no fatorial)' : 'Médio O(log n)',
        espaco: 'O(h) na pilha de chamadas',
      },
      erros_comuns: [
        isRecursion
          ? 'Esquecer o caso base, gerando Stack Overflow (estouro da pilha).'
          : 'Deixar a árvore desbalanceada, transformando-a em uma linha O(n).',
      ],
      exercicios: [
        {
          pergunta: isRecursion
            ? 'O que acontece se uma função recursiva nunca atingir o caso base?'
            : 'Em uma BST, onde fica o menor valor da árvore?',
          resposta_esperada: isRecursion
            ? 'As chamadas continuam empilhando até estourar a memória da pilha (Stack Overflow).'
            : 'No nó mais à esquerda possível.',
        },
      ],
      fontes_ou_termos_para_pesquisar: [
        isRecursion ? 'Caso base e Call Stack recursão' : 'Árvore Binária de Busca balanceamento AVL',
      ],
    };
  } else {
    // Fallback honesto e estruturado para qualquer outro tema quando não há API key conectada
    payload = {
      id,
      titulo: topic,
      resumo: `Estrutura conceitual e etapas fundamentais para compreender "${topic}" de forma visual e progressiva. Observação: esta síntese usa o modo local determinístico; conecte a chave da API Gemini no servidor para respostas generativas completas em qualquer área do conhecimento.`,
      nivel: activePlan.nivel,
      secoes: [
        {
          titulo: `1. Visão Geral de ${topic}`,
          texto: `Para compreender ${topic} sem decorar definições soltas, dividimos o assunto em três partes: entrada/contexto (o que inicia o processo), mecanismo central (como os elementos se relacionam ou transformam) e resultado observável.`,
          exemplo: `Entrada → Processamento principal de ${topic} → Saída / Efeito prático.`,
        },
        {
          titulo: '2. Progressão do Simples ao Complexo',
          texto:
            'Não inventamos detalhes específicos que exigem consulta especializada quando o motor de IA não está conectado. Recomendamos revisar os pré-requisitos listados e explorar os termos de pesquisa abaixo para aprofundar com fontes verificadas.',
        },
      ],
      visualizacao: {
        tipo: activePlan.tipo_visualizacao,
        passos: [
          {
            descricao: `Passo 1: Identificação dos elementos iniciais e pré-requisitos para "${topic}".`,
            nos: [
              { id: 'e1', rotulo: 'Entrada', subrotulo: 'Contexto inicial', estado: 'ativo' },
              { id: 'e2', rotulo: 'Núcleo', subrotulo: topic.slice(0, 18), estado: 'padrao' },
              { id: 'e3', rotulo: 'Regras', subrotulo: 'Restrições', estado: 'padrao' },
              { id: 'e4', rotulo: 'Resultado', subrotulo: 'Saída final', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'e1', destino: 'e2', rotulo: 'alimenta', ativa: true },
              { origem: 'e2', destino: 'e3', rotulo: 'verifica', ativa: false },
              { origem: 'e3', destino: 'e4', rotulo: 'produz', ativa: false },
            ],
            destaques: ['e1'],
            valores: [`Tema: ${topic}`, 'Etapa: 1 de 3'],
          },
          {
            descricao: `Passo 2: Transformação no núcleo de "${topic}" aplicando as regras essenciais do modelo.`,
            nos: [
              { id: 'e1', rotulo: 'Entrada', subrotulo: 'Recebida', estado: 'visitado' },
              { id: 'e2', rotulo: 'Núcleo', subrotulo: 'Em execução', estado: 'ativo' },
              { id: 'e3', rotulo: 'Regras', subrotulo: 'Validadas', estado: 'destaque' },
              { id: 'e4', rotulo: 'Resultado', subrotulo: 'Em preparo', estado: 'padrao' },
            ],
            arestas: [
              { origem: 'e1', destino: 'e2', rotulo: 'ok', ativa: false },
              { origem: 'e2', destino: 'e3', rotulo: 'aplica', ativa: true },
              { origem: 'e3', destino: 'e4', rotulo: 'gera', ativa: false },
            ],
            destaques: ['e2', 'e3'],
            valores: ['Estado: Processando regras', 'Etapa: 2 de 3'],
          },
          {
            descricao: `Passo 3: Consolidação do resultado final e verificação de consistência em "${topic}".`,
            nos: [
              { id: 'e1', rotulo: 'Entrada', subrotulo: 'Concluída', estado: 'visitado' },
              { id: 'e2', rotulo: 'Núcleo', subrotulo: 'Concluído', estado: 'visitado' },
              { id: 'e3', rotulo: 'Regras', subrotulo: 'Atendidas', estado: 'visitado' },
              { id: 'e4', rotulo: 'Resultado', subrotulo: 'Consolidado ✓', estado: 'destaque' },
            ],
            arestas: [
              { origem: 'e1', destino: 'e2', rotulo: '', ativa: false },
              { origem: 'e2', destino: 'e3', rotulo: '', ativa: false },
              { origem: 'e3', destino: 'e4', rotulo: 'finaliza', ativa: true },
            ],
            destaques: ['e4'],
            valores: ['Estado: Concluído ✓', 'Etapa: 3 de 3'],
          },
        ],
      },
      erros_comuns: [
        'Tentar memorizar detalhes avançados antes de dominar o fluxo de entrada, núcleo e saída.',
      ],
      exercicios: [
        {
          pergunta: `Explique com suas palavras qual é a entrada principal e o resultado esperado ao estudar "${topic}".`,
          resposta_esperada: 'Identifique o estado inicial antes do processo e a mudança concreta após sua execução.',
          dica: 'Observe as setas entre Entrada, Núcleo e Resultado no diagrama.',
        },
      ],
      fontes_ou_termos_para_pesquisar: [
        `${topic} fundamentos e exemplos`,
        `${topic} guia introdutório`,
      ],
    };
  }

  payload.plano = activePlan;
  payload.origem = 'deterministic-fallback';

  return TutorResponseSchema.parse(payload);
}
