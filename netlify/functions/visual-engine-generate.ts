import { GoogleGenAI } from '@google/genai';

function slugify(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'conceito-visual'
  );
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const concept = String(body?.concept || '').trim();

    if (concept.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'Informe pelo menos 2 caracteres para o conceito.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const cleanTitle = concept;
    const slug = slugify(cleanTitle);
    const difficulty = body?.difficulty || 'Iniciante';
    const norm = cleanTitle
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Archetype detection
    let archetype = body?.preferred_archetype || 'system_flow';
    if (!body?.preferred_archetype) {
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

    let coreIdea = `Visualização passo a passo do fluxo e transformações internas de ${cleanTitle}.`;
    let analogy = `Observar ${cleanTitle} em etapas é como enxergar as engrenagens de um relógio mecânico.`;

    // Optional Gemini enrichment if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Resuma o conceito '${cleanTitle}' de computação em uma ideia central (1 frase curta) e uma analogia do mundo real (1 frase curta).`,
          config: {
            systemInstruction:
              'Você é um especialista em didática de computação. Retorne texto claro e objetivo.',
          },
        });
        const text = res.text?.trim();
        if (text) {
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          if (lines[0]) coreIdea = lines[0].replace(/^[-*•\d.]\s*/, '').trim();
          if (lines[1]) analogy = lines[1].replace(/^[-*•\d.]\s*/, '').trim();
        }
      } catch (geminiErr) {
        console.warn('[Gemini enrichment skipped]', geminiErr);
      }
    }

    let steps = [];
    let codeLines = [];

    if (archetype === 'call_stack_tree') {
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
          explanation: `A busca ou travessia de '${cleanTitle}' começa pelo nó raiz (valor 50). Verificamos se o nó corresponde ao elemento procurado.`,
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
          explanation: `Como 40 é menor que 50, a propriedade da Árvore Binária descarta o lado direito. Descemos recursivamente para o nó 30.`,
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
          explanation: `Como 40 é maior que 30, seguimos para a direita do nó 30. Encontramos o nó 40 exatamente! O resultado é retornado.`,
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
    } else {
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

    const topicDetail = {
      slug,
      title: cleanTitle,
      category_slug: 'algoritmos',
      category_name: 'Algoritmos e Estruturas',
      difficulty,
      read_minutes: 3,
      one_liner: coreIdea,
      archetype,
      step_count: steps.length,
      complexity_tag: 'Visual Interativo',
      is_custom: true,
      core_idea: coreIdea,
      real_world_analogy: analogy,
      when_to_use: [
        `Para entender na prática o funcionamento de ${cleanTitle}`,
        `Para inspecionar como os nós e estados interagem passo a passo`,
      ],
      code_language: 'python',
      code_lines: codeLines,
      parameters: [],
      active_params: {},
      steps,
    };

    return new Response(JSON.stringify(topicDetail), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[Visual Engine Function Error]', err);
    return new Response(
      JSON.stringify({ detail: err?.message || 'Falha ao processar explicação visual.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
