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
  const norm = cleanTitle.toLowerCase();

  // Detect archetype if not specified
  let archetype: VisualArchetype = input.preferred_archetype || 'system_flow';
  if (!input.preferred_archetype) {
    if (norm.includes('memoria') || norm.includes('heap') || norm.includes('stack') || norm.includes('garbage') || norm.includes('ponteiro')) {
      archetype = 'memory_model';
    } else if (norm.includes('array') || norm.includes('vetor') || norm.includes('busca') || norm.includes('ordena') || norm.includes('ponteiro')) {
      archetype = 'array_pointers';
    } else if (norm.includes('arvore') || norm.includes('grafo') || norm.includes('recurs') || norm.includes('pilha') || norm.includes('fila')) {
      archetype = 'call_stack_tree';
    } else if (norm.includes('join') || norm.includes('sql') || norm.includes('tabela') || norm.includes('banco')) {
      archetype = 'relational_join';
    } else if (norm.includes('bit') || norm.includes('porta') || norm.includes('logica') || norm.includes('boole')) {
      archetype = 'logic_gates';
    } else {
      archetype = 'system_flow';
    }
  }

  const steps: VisualStep[] = [
    {
      step_index: 0,
      title: `1. Estado Inicial de ${cleanTitle}`,
      explanation: `Configuração do ambiente e inicialização dos componentes para a operação de '${cleanTitle}'. Entradas prontas para o processamento.`,
      takeaway: `Ponto de partida seguro com todas as variáveis e nós devidamente declarados.`,
      code_line: 1,
      payload: {
        nodes: [
          { id: 'n1', label: 'Entrada / Origem', role: 'Início', state_text: 'Pronto', x: 120, y: 160, status: 'active' },
          { id: 'n2', label: 'Buffer / Processador', role: 'Núcleo', state_text: 'Ocioso', x: 380, y: 160, status: 'idle' },
          { id: 'n3', label: 'Saída / Resultado', role: 'Destino', state_text: 'Pendente', x: 640, y: 160, status: 'idle' },
        ],
        edges: [
          { source: 'n1', target: 'n2', label: '1. despacha dados', active: true, packet: 'payload' },
          { source: 'n2', target: 'n3', label: '2. emite resultado', active: false, packet: null },
        ],
        banner: `Fase 1: Dados alimentados no fluxo de '${cleanTitle}'`,
      },
    },
    {
      step_index: 1,
      title: `2. Execução da Lógica Interna`,
      explanation: `O algoritmo processa a regra de negócio central de '${cleanTitle}'. Estados intermediários são recalculados dinamicamente.`,
      takeaway: `O núcleo da operação atinge a transformação esperada com complexidade previsível.`,
      code_line: 2,
      payload: {
        nodes: [
          { id: 'n1', label: 'Entrada / Origem', role: 'Início', state_text: 'Transmitido', x: 120, y: 160, status: 'done' },
          { id: 'n2', label: 'Buffer / Processador', role: 'Núcleo', state_text: 'Executando...', x: 380, y: 160, status: 'active' },
          { id: 'n3', label: 'Saída / Resultado', role: 'Destino', state_text: 'Preparando', x: 640, y: 160, status: 'idle' },
        ],
        edges: [
          { source: 'n1', target: 'n2', label: '1. concluído', active: false, packet: null },
          { source: 'n2', target: 'n3', label: '2. transferindo', active: true, packet: 'resultado' },
        ],
        banner: `Fase 2: Processamento ativo em '${cleanTitle}'`,
      },
    },
    {
      step_index: 2,
      title: `3. Convergência e Estado Final`,
      explanation: `A execução encerra com sucesso. Todos os recursos foram liberados e a saída final foi validada.`,
      takeaway: `Garantia de consistência sem vazamentos de memória ou bloqueios.`,
      code_line: 3,
      payload: {
        nodes: [
          { id: 'n1', label: 'Entrada / Origem', role: 'Início', state_text: 'Concluído', x: 120, y: 160, status: 'done' },
          { id: 'n2', label: 'Buffer / Processador', role: 'Núcleo', state_text: 'Liberado', x: 380, y: 160, status: 'done' },
          { id: 'n3', label: 'Saída / Resultado', role: 'Destino', state_text: 'Validado ✓', x: 640, y: 160, status: 'active' },
        ],
        edges: [
          { source: 'n1', target: 'n2', label: '1. ok', active: false, packet: null },
          { source: 'n2', target: 'n3', label: '2. entregue ✓', active: true, packet: 'concluído' },
        ],
        banner: `Fase 3: Fluxo de '${cleanTitle}' finalizado com êxito ✓`,
      },
    },
  ];

  return {
    slug,
    title: cleanTitle,
    category_slug: 'algoritmos',
    category_name: 'Algoritmos e Complexidade',
    difficulty,
    read_minutes: 3,
    one_liner: `Visualização interativa do funcionamento passo a passo de ${cleanTitle}.`,
    archetype,
    step_count: steps.length,
    complexity_tag: 'Visual Interativo',
    is_custom: true,
    core_idea: `Modelo visual detalhado para acompanhar cada mudança de estado em ${cleanTitle} sem caixas-pretas.`,
    real_world_analogy: `Entender ${cleanTitle} passo a passo é como ver as engrenagens de um relógio através de um mostrador transparente.`,
    when_to_use: [
      `Para fixar a intuição visual de ${cleanTitle} antes de escrever código`,
      `Para inspecionar como os estados internos e nós interagem na prática`,
    ],
    code_language: 'python',
    code_lines: [
      `def executar_${slug.replace(/-/g, '_')}():`,
      `    # Processamento de ${cleanTitle}`,
      `    resultado = processar_fluxo()`,
      `    return resultado`,
    ],
    parameters: [],
    active_params: {},
    steps,
  };
}
