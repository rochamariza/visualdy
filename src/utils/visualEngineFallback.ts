import type {
  DifficultyLevel,
  TopicDetail,
  VisualArchetype,
  VisualStep,
} from '../types/visual';

export function slugify(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'conceito-visual'
  );
}

export function generateClientVisualTopic(input: {
  concept: string;
  preferred_archetype?: VisualArchetype | null;
  difficulty?: DifficultyLevel;
}): TopicDetail {
  const cleanTitle = input.concept.trim();
  const slug = slugify(cleanTitle);
  const difficulty = input.difficulty || 'Iniciante';
  const norm = cleanTitle
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Detect archetype if not specified
  let archetype: VisualArchetype = input.preferred_archetype || 'system_flow';
  if (!input.preferred_archetype) {
    if (
      norm.includes('arvore') ||
      norm.includes('tree') ||
      norm.includes('grafo') ||
      norm.includes('recurs') ||
      norm.includes('bst') ||
      norm.includes('pilha') ||
      norm.includes('fila')
    ) {
      archetype = 'call_stack_tree';
    } else if (
      norm.includes('memoria') ||
      norm.includes('heap') ||
      norm.includes('garbage') ||
      norm.includes('ponteiro')
    ) {
      archetype = 'memory_model';
    } else if (
      norm.includes('array') ||
      norm.includes('vetor') ||
      norm.includes('busca') ||
      norm.includes('ordena')
    ) {
      archetype = 'array_pointers';
    } else if (norm.includes('join') || norm.includes('sql') || norm.includes('tabela')) {
      archetype = 'relational_join';
    } else if (norm.includes('bit') || norm.includes('porta') || norm.includes('logica')) {
      archetype = 'logic_gates';
    } else {
      archetype = 'system_flow';
    }
  }

  let steps: VisualStep[] = [];
  let codeLines: string[] = [];

  if (archetype === 'call_stack_tree') {
    // Especializado para Árvores Binárias / Recursão / Grafos
    codeLines = [
      `def buscar_no(raiz, valor):`,
      `    if not raiz:`,
      `        return None  # Não encontrado`,
      `    if raiz.val == valor:`,
      `        return raiz  # Encontrado!`,
      `    if valor < raiz.val:`,
      `        return buscar_no(raiz.esq, valor)  # Subárvore esquerda`,
      `    return buscar_no(raiz.dir, valor)      # Subárvore direita`,
    ];

    steps = [
      {
        step_index: 0,
        title: `1. Início na Raiz da Árvore`,
        explanation: `A busca ou travessia de '${cleanTitle}' começa pelo nó raiz (valor 50). Verificamos se o nó raiz corresponde ao elemento procurado.`,
        takeaway: `Toda operação em árvore binária tem início garantido na raiz (nível 0).`,
        code_line: 1,
        payload: {
          banner: `Iniciando análise em '${cleanTitle}' a partir da raiz 50`,
          nodes: [
            { id: 'n50', label: '50', sublabel: 'Raiz', x: 50, y: 15, state: 'active' },
            { id: 'n30', label: '30', sublabel: 'Esq (< 50)', x: 28, y: 46, state: 'default' },
            { id: 'n70', label: '70', sublabel: 'Dir (> 50)', x: 72, y: 46, state: 'default' },
            { id: 'n20', label: '20', sublabel: 'Folha', x: 16, y: 78, state: 'default' },
            { id: 'n40', label: '40', sublabel: 'Alvo', x: 40, y: 78, state: 'default' },
            { id: 'n60', label: '60', sublabel: 'Folha', x: 60, y: 78, state: 'default' },
            { id: 'n85', label: '85', sublabel: 'Folha', x: 84, y: 78, state: 'default' },
          ],
          edges: [
            { source: 'n50', target: 'n30', label: '< 50', active: true },
            { source: 'n50', target: 'n70', label: '> 50', active: false },
            { source: 'n30', target: 'n20', label: '< 30', active: false },
            { source: 'n30', target: 'n40', label: '> 30', active: false },
            { source: 'n70', target: 'n60', label: '< 70', active: false },
            { source: 'n70', target: 'n85', label: '> 70', active: false },
          ],
          stack_frames: [
            { label: 'buscar(50, alvo=40)', detail: 'Raiz ativa (40 < 50)', active: true },
          ],
        },
      },
      {
        step_index: 1,
        title: `2. Decisão e Descida para a Subárvore Esquerda`,
        explanation: `Como 40 é menor que 50, a propriedade da Árvore Binária de Busca descarta toda a subárvore direita. Descemos recursivamente para o nó 30.`,
        takeaway: `A cada decisão de ramo, metade da árvore é podada, conferindo complexidade O(log n).`,
        code_line: 7,
        payload: {
          banner: `40 < 50 → Descartando lado direito e analisando nó 30`,
          nodes: [
            { id: 'n50', label: '50', sublabel: 'Visitado', x: 50, y: 15, state: 'visited' },
            { id: 'n30', label: '30', sublabel: 'Ativo', x: 28, y: 46, state: 'active' },
            { id: 'n70', label: '70', sublabel: 'Podado', x: 72, y: 46, state: 'default' },
            { id: 'n20', label: '20', sublabel: 'Folha', x: 16, y: 78, state: 'default' },
            { id: 'n40', label: '40', sublabel: 'Alvo', x: 40, y: 78, state: 'default' },
            { id: 'n60', label: '60', sublabel: 'Podado', x: 60, y: 78, state: 'default' },
            { id: 'n85', label: '85', sublabel: 'Podado', x: 84, y: 78, state: 'default' },
          ],
          edges: [
            { source: 'n50', target: 'n30', label: '< 50', active: false },
            { source: 'n50', target: 'n70', label: '> 50', active: false },
            { source: 'n30', target: 'n20', label: '< 30', active: false },
            { source: 'n30', target: 'n40', label: '> 30', active: true },
            { source: 'n70', target: 'n60', label: '< 70', active: false },
            { source: 'n70', target: 'n85', label: '> 70', active: false },
          ],
          stack_frames: [
            { label: 'buscar(30, alvo=40)', detail: 'Novo quadro (40 > 30)', active: true },
            { label: 'buscar(50, alvo=40)', detail: 'Aguardando retorno', active: false },
          ],
        },
      },
      {
        step_index: 2,
        title: `3. Elemento Localizado com Sucesso`,
        explanation: `Como 40 é maior que 30, seguimos para a direita do nó 30. Encontramos o nó 40 exatamente! O resultado é retornado desempilhando as chamadas.`,
        takeaway: `O alvo foi encontrado com apenas 2 comparações graças à estrutura hierárquica.`,
        code_line: 5,
        payload: {
          banner: `Nó 40 encontrado! Retornando referência pela pilha de chamadas ✓`,
          nodes: [
            { id: 'n50', label: '50', sublabel: 'Visitado', x: 50, y: 15, state: 'visited' },
            { id: 'n30', label: '30', sublabel: 'Visitado', x: 28, y: 46, state: 'visited' },
            { id: 'n70', label: '70', sublabel: 'Podado', x: 72, y: 46, state: 'default' },
            { id: 'n20', label: '20', sublabel: 'Folha', x: 16, y: 78, state: 'default' },
            { id: 'n40', label: '40', sublabel: 'Encontrado ✓', x: 40, y: 78, state: 'found' },
            { id: 'n60', label: '60', sublabel: 'Podado', x: 60, y: 78, state: 'default' },
            { id: 'n85', label: '85', sublabel: 'Podado', x: 84, y: 78, state: 'default' },
          ],
          edges: [
            { source: 'n50', target: 'n30', label: '', active: false },
            { source: 'n50', target: 'n70', label: '', active: false },
            { source: 'n30', target: 'n20', label: '', active: false },
            { source: 'n30', target: 'n40', label: '✓ match', active: true },
            { source: 'n70', target: 'n60', label: '', active: false },
            { source: 'n70', target: 'n85', label: '', active: false },
          ],
          stack_frames: [
            { label: 'buscar(40, alvo=40)', detail: 'Retorna nó 40 ✓', active: true },
            { label: 'buscar(30, alvo=40)', detail: 'Desempilhando...', active: false },
            { label: 'buscar(50, alvo=40)', detail: 'Desempilhando...', active: false },
          ],
        },
      },
    ];
  } else if (archetype === 'memory_model') {
    codeLines = [
      `usuario = AlocarUsuario("Maria")`,
      `cache = AlocarCache(dados)`,
      `cache = None  # Desassocia referência`,
      `coletor.executar_limpeza()`,
    ];
    steps = [
      {
        step_index: 0,
        title: `1. Alocação em Memória`,
        explanation: `Variáveis criadas no escopo local (Stack) recebem ponteiros que apontam para os blocos reais alocados na Heap (0x800 e 0x840).`,
        takeaway: `Ponteiros ligam referências leves na Stack a estruturas de dados pesadas na Heap.`,
        code_line: 1,
        payload: {
          banner: `Objetos alocados na memória com referências ativas`,
          left_title: 'Pilha (Stack)',
          right_title: 'Memória Dinâmica (Heap)',
          left_slots: [
            { id: 's1', address: '0x100', label: 'usuario', value: 'ref → 0x800', state: 'active', ref_target: 'h1' },
            { id: 's2', address: '0x108', label: 'cache', value: 'ref → 0x840', state: 'active', ref_target: 'h2' },
          ],
          right_slots: [
            { id: 'h1', address: '0x800', label: 'Obj Usuario', value: "{nome: 'Maria'}", state: 'active' },
            { id: 'h2', address: '0x840', label: 'Obj Cache', value: '{items: 128}', state: 'default' },
          ],
        },
      },
      {
        step_index: 1,
        title: `2. Liberação de Referência`,
        explanation: `Ao atribuir None para 'cache', a referência é quebrada. O bloco 0x840 torna-se órfão (inatingível).`,
        takeaway: `Objetos sem referências ativas não podem ser acessados e viram lixo de memória.`,
        code_line: 3,
        payload: {
          banner: `0x840 perdeu sua referência ativa na Stack`,
          left_title: 'Pilha (Stack)',
          right_title: 'Memória Dinâmica (Heap)',
          left_slots: [
            { id: 's1', address: '0x100', label: 'usuario', value: 'ref → 0x800', state: 'active', ref_target: 'h1' },
            { id: 's2', address: '0x108', label: 'cache', value: 'null / None', state: 'mutated', ref_target: null },
          ],
          right_slots: [
            { id: 'h1', address: '0x800', label: 'Obj Usuario', value: "{nome: 'Maria'}", state: 'active' },
            { id: 'h2', address: '0x840', label: 'Órfão (Lixo)', value: '{items: 128}', state: 'collision' },
          ],
        },
      },
      {
        step_index: 2,
        title: `3. Coleta e Reivindicação`,
        explanation: `O coletor de memória varre os blocos inalcançáveis e devolve a memória livre do endereço 0x840 ao sistema operacional.`,
        takeaway: `Prevenção contínua contra vazamentos de memória (memory leaks).`,
        code_line: 4,
        payload: {
          banner: `Endereço 0x840 liberado com sucesso ✓`,
          left_title: 'Pilha (Stack)',
          right_title: 'Memória Dinâmica (Heap)',
          left_slots: [
            { id: 's1', address: '0x100', label: 'usuario', value: 'ref → 0x800', state: 'active', ref_target: 'h1' },
            { id: 's2', address: '0x108', label: 'cache', value: 'null / None', state: 'default', ref_target: null },
          ],
          right_slots: [
            { id: 'h1', address: '0x800', label: 'Obj Usuario', value: "{nome: 'Maria'}", state: 'active' },
            { id: 'h2', address: '0x840', label: 'LIVRE (0x840)', value: '[disponível]', state: 'mutated' },
          ],
        },
      },
    ];
  } else if (archetype === 'array_pointers') {
    codeLines = [
      `arr = [5, 12, 19, 28, 35, 42]`,
      `inicio, fim = 0, len(arr) - 1`,
      `while inicio <= fim:`,
      `    meio = (inicio + fim) // 2`,
      `    if arr[meio] == alvo: return meio`,
    ];
    steps = [
      {
        step_index: 0,
        title: `1. Vetor Indexado e Ponteiros`,
        explanation: `Os limites inicial (índice 0) e final (índice 5) demarcam o espaço de pesquisa contíguo em memória.`,
        takeaway: `Ponteiros de índice navegam sem copiar o vetor, preservando memória.`,
        code_line: 2,
        payload: {
          banner: `Espaço de busca delimitado entre os índices 0 e 5`,
          cells: [
            { index: 0, value: 5, state: 'active' },
            { index: 1, value: 12, state: 'default' },
            { index: 2, value: 19, state: 'default' },
            { index: 3, value: 28, state: 'default' },
            { index: 4, value: 35, state: 'default' },
            { index: 5, value: 42, state: 'active' },
          ],
          pointers: [
            { label: 'início', index: 0, tone: 'primary' },
            { label: 'fim', index: 5, tone: 'primary' },
          ],
          metrics: [
            { label: 'Tamanho', value: '6' },
            { label: 'Operação', value: 'Início' },
          ],
        },
      },
      {
        step_index: 1,
        title: `2. Avaliação do Ponto Médio`,
        explanation: `Calculamos o índice do meio: (0 + 5) // 2 = 2. Comparamos o valor no índice 2 (19) com o alvo desejado.`,
        takeaway: `Acesso instantâneo em O(1) pelo índice direto do vetor.`,
        code_line: 4,
        payload: {
          banner: `Comparando elemento central [índice 2] = 19`,
          cells: [
            { index: 0, value: 5, state: 'active' },
            { index: 1, value: 12, state: 'active' },
            { index: 2, value: 19, state: 'comparing' },
            { index: 3, value: 28, state: 'default' },
            { index: 4, value: 35, state: 'default' },
            { index: 5, value: 42, state: 'active' },
          ],
          pointers: [
            { label: 'início', index: 0, tone: 'primary' },
            { label: 'meio', index: 2, tone: 'amber' },
            { label: 'fim', index: 5, tone: 'primary' },
          ],
          metrics: [
            { label: 'Comparações', value: '1' },
            { label: 'Meio', value: '19' },
          ],
        },
      },
      {
        step_index: 2,
        title: `3. Convergência da Busca`,
        explanation: `Ajustando os ponteiros, o intervalo converge diretamente para o elemento alvo, confirmando sua posição.`,
        takeaway: `Convergência logarítmica com mínimo de operações de máquina.`,
        code_line: 5,
        payload: {
          banner: `Elemento encontrado e confirmado ✓`,
          cells: [
            { index: 0, value: 5, state: 'eliminated' },
            { index: 1, value: 12, state: 'eliminated' },
            { index: 2, value: 19, state: 'found' },
            { index: 3, value: 28, state: 'eliminated' },
            { index: 4, value: 35, state: 'eliminated' },
            { index: 5, value: 42, state: 'eliminated' },
          ],
          pointers: [
            { label: 'achado ✓', index: 2, tone: 'emerald' },
          ],
          metrics: [
            { label: 'Comparações', value: '2' },
            { label: 'Resultado', value: 'Índice 2' },
          ],
        },
      },
    ];
  } else {
    // system_flow padrão com coordenadas percentuais (18, 50, 82)
    codeLines = [
      `def executar_${slug.replace(/-/g, '_')}():`,
      `    dados = coletar_entrada()`,
      `    processar_estado(dados)`,
      `    return resultado_validado()`,
    ];
    steps = [
      {
        step_index: 0,
        title: `1. Entrada e Alocação de Recursos`,
        explanation: `Configuração inicial para '${cleanTitle}'. O nó de entrada despacha o pacote inicial para o núcleo de processamento.`,
        takeaway: `Inicialização limpa com canais e buffers estabelecidos.`,
        code_line: 2,
        payload: {
          banner: `Fase 1: Entrada ativada para '${cleanTitle}'`,
          nodes: [
            { id: 'n1', label: 'Origem / Input', role: 'Início', state_text: 'Ativo', x: 18, y: 50, status: 'active' },
            { id: 'n2', label: 'Processador / Core', role: 'Núcleo', state_text: 'Aguardando', x: 50, y: 50, status: 'idle' },
            { id: 'n3', label: 'Destino / Output', role: 'Saída', state_text: 'Pendente', x: 82, y: 50, status: 'idle' },
          ],
          edges: [
            { source: 'n1', target: 'n2', label: '1. despachar', active: true, packet: 'dados' },
            { source: 'n2', target: 'n3', label: '2. aguarda', active: false, packet: null },
          ],
        },
      },
      {
        step_index: 1,
        title: `2. Execução da Lógica Interna`,
        explanation: `O núcleo central executa as transformações de '${cleanTitle}'. O estado é processado mantendo a consistência dos dados.`,
        takeaway: `Processamento seguro sem condições de corrida ou corrupção de estado.`,
        code_line: 3,
        payload: {
          banner: `Fase 2: Processamento ativo em '${cleanTitle}'`,
          nodes: [
            { id: 'n1', label: 'Origem / Input', role: 'Início', state_text: 'Enviado', x: 18, y: 50, status: 'done' },
            { id: 'n2', label: 'Processador / Core', role: 'Núcleo', state_text: 'Processando...', x: 50, y: 50, status: 'active' },
            { id: 'n3', label: 'Destino / Output', role: 'Saída', state_text: 'Recebendo', x: 82, y: 50, status: 'idle' },
          ],
          edges: [
            { source: 'n1', target: 'n2', label: '1. concluído', active: false, packet: null },
            { source: 'n2', target: 'n3', label: '2. transmitindo', active: true, packet: 'resultado' },
          ],
        },
      },
      {
        step_index: 2,
        title: `3. Finalização e Resultado Emitido`,
        explanation: `O resultado foi validado e entregue à saída. Os recursos intermediários foram devidamente liberados.`,
        takeaway: `Ciclo concluído com sucesso e estabilidade de estado.`,
        code_line: 4,
        payload: {
          banner: `Fase 3: Fluxo de '${cleanTitle}' concluído com êxito ✓`,
          nodes: [
            { id: 'n1', label: 'Origem / Input', role: 'Início', state_text: 'Finalizado', x: 18, y: 50, status: 'done' },
            { id: 'n2', label: 'Processador / Core', role: 'Núcleo', state_text: 'Liberado', x: 50, y: 50, status: 'done' },
            { id: 'n3', label: 'Destino / Output', role: 'Saída', state_text: 'Validado ✓', x: 82, y: 50, status: 'active' },
          ],
          edges: [
            { source: 'n1', target: 'n2', label: 'ok', active: false, packet: null },
            { source: 'n2', target: 'n3', label: '✓ entregue', active: true, packet: 'concluído' },
          ],
        },
      },
    ];
  }

  return {
    slug,
    title: cleanTitle,
    category_slug: 'algoritmos',
    category_name: 'Algoritmos e Estruturas',
    difficulty,
    read_minutes: 3,
    one_liner: `Visualização passo a passo do funcionamento interno de ${cleanTitle}.`,
    archetype,
    step_count: steps.length,
    complexity_tag: 'Visual Interativo',
    is_custom: true,
    core_idea: `Modelo visual detalhado para acompanhar cada mudança de estado em ${cleanTitle} sem caixas-pretas.`,
    real_world_analogy: `Entender ${cleanTitle} passo a passo é como ver as engrenagens de um relógio através de um mostrador transparente.`,
    when_to_use: [
      `Para fixar a intuição visual de ${cleanTitle} antes de escrever código`,
      `Para inspecionar como os nós e estados interagem passo a passo`,
    ],
    code_language: 'python',
    code_lines: codeLines,
    parameters: [],
    active_params: {},
    steps,
  };
}
