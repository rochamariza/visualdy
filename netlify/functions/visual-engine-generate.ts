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
    const norm = cleanTitle.toLowerCase();

    // Archetype detection
    let archetype = body?.preferred_archetype || 'system_flow';
    if (!body?.preferred_archetype) {
      if (
        norm.includes('memoria') ||
        norm.includes('heap') ||
        norm.includes('stack') ||
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
      } else if (
        norm.includes('arvore') ||
        norm.includes('grafo') ||
        norm.includes('recurs') ||
        norm.includes('pilha') ||
        norm.includes('fila')
      ) {
        archetype = 'call_stack_tree';
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
          contents: `Resuma o conceito '${cleanTitle}' de computação em uma ideia central (1 frase) e uma analogia do mundo real (1 frase curta).`,
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

    const steps = [
      {
        step_index: 0,
        title: `1. Inicialização de ${cleanTitle}`,
        explanation: `Ambiente e entradas configurados para ${cleanTitle}. Dados preparados para início da operação.`,
        takeaway: `Ponto de partida com recursos alocados e referências prontas.`,
        code_line: 1,
        payload: {
          nodes: [
            { id: 'n1', label: 'Entrada / Origem', role: 'Início', state_text: 'Pronto', x: 120, y: 160, status: 'active' },
            { id: 'n2', label: 'Buffer / Processador', role: 'Núcleo', state_text: 'Ocioso', x: 380, y: 160, status: 'idle' },
            { id: 'n3', label: 'Saída / Resultado', role: 'Destino', state_text: 'Pendente', x: 640, y: 160, status: 'idle' },
          ],
          edges: [
            { source: 'n1', target: 'n2', label: '1. despacha dados', active: true, packet: 'payload' },
            { source: 'n2', target: 'n3', label: '2. aguarda', active: false, packet: null },
          ],
          banner: `Fase 1: Dados alimentados no fluxo de '${cleanTitle}'`,
        },
      },
      {
        step_index: 1,
        title: `2. Processamento Interno e Estado Ativo`,
        explanation: `A regra principal de '${cleanTitle}' entra em ação. Estados intermediários são validados e transformados.`,
        takeaway: `O algoritmo garante integridade durante a transição de estado.`,
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
        title: `3. Convergência e Saída Final`,
        explanation: `Execução de '${cleanTitle}' finalizada com sucesso. Recursos liberados e resultado emitido.`,
        takeaway: `Finalização consistente e sem vazamentos de recursos.`,
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

    const topicDetail = {
      slug,
      title: cleanTitle,
      category_slug: 'algoritmos',
      category_name: 'Algoritmos e Complexidade',
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
        `Para inspecionar como os estados internos e dados se comportam passo a passo`,
      ],
      code_language: 'python',
      code_lines: [
        `def executar_${slug.replace(/-/g, '_')}():`,
        `    # Execução de ${cleanTitle}`,
        `    resultado = processar_fluxo()`,
        `    return resultado`,
      ],
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
