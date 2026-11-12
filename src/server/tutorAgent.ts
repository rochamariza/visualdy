import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  TutorPlanSchema,
  TutorResponseSchema,
  VISUALIZATION_TYPES,
  slugifyTopic,
  type TutorPlan,
  type TutorResponse,
} from '../schemas/tutorSchema';
import { generateDeterministicTutorResponse } from './deterministicTutor';

export const ANTI_HALLUCINATION_SYSTEM_INSTRUCTION = `Você é o Agente Tutor Visual, um professor especialista em didática clara, progressiva e visual para qualquer área do conhecimento (com destaque para ciência da computação, algoritmos, sistemas, ciências e temas gerais).

Regras obrigatórias anti-alucinação:
- Explique apenas o que você sabe com alta confiança. Se não tiver certeza, diga explicitamente que não tem certeza em vez de inventar.
- Nunca invente nomes de bibliotecas, funções, autores, datas, estatísticas ou links.
- Use exemplos pequenos e verificáveis (no máximo 7 elementos nas visualizações).
- Verifique mentalmente a consistência dos passos antes de responder (ex.: o resultado do passo N deve ser o ponto de partida do passo N+1).
- Responda em português do Brasil, em linguagem didática, do simples ao complexo.
- Retorne exclusivamente JSON válido aderindo exatamente ao schema solicitado.`;

const PLAN_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tema: { type: Type.STRING, description: 'Nome limpo do tema analisado.' },
    nivel: {
      type: Type.STRING,
      description: 'Deve ser exatamente: Iniciante, Intermediário ou Avançado.',
    },
    pre_requisitos: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista curta de 1 a 5 pré-requisitos essenciais.',
    },
    tipo_visualizacao: {
      type: Type.STRING,
      description: `Um dos tipos exatos: ${VISUALIZATION_TYPES.join(', ')}`,
    },
    roteiro: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Roteiro de 3 a 6 etapas didáticas do simples ao complexo.',
    },
    objetivo_visual: {
      type: Type.STRING,
      description: 'O que a animação/diagrama passo a passo vai provar visualmente com até 7 elementos.',
    },
  },
  required: ['tema', 'nivel', 'pre_requisitos', 'tipo_visualizacao', 'roteiro', 'objetivo_visual'],
};

const TUTOR_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING, description: 'Título claro do tema em português.' },
    resumo: { type: Type.STRING, description: 'Resumo direto em 2 a 3 frases sem jargões vazios.' },
    nivel: {
      type: Type.STRING,
      description: 'Deve ser exatamente: Iniciante, Intermediário ou Avançado.',
    },
    secoes: {
      type: Type.ARRAY,
      description: 'Seções didáticas do simples ao complexo.',
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: { type: Type.STRING },
          texto: { type: Type.STRING },
          exemplo: { type: Type.STRING },
        },
        required: ['titulo', 'texto'],
      },
    },
    visualizacao: {
      type: Type.OBJECT,
      properties: {
        tipo: {
          type: Type.STRING,
          description: `Exatamente um de: ${VISUALIZATION_TYPES.join(', ')}`,
        },
        passos: {
          type: Type.ARRAY,
          description: 'Entre 3 e 6 passos consistentes onde o passo N leva ao passo N+1.',
          items: {
            type: Type.OBJECT,
            properties: {
              descricao: { type: Type.STRING },
              nos: {
                type: Type.ARRAY,
                description: 'Máximo de 7 elementos neste passo.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    rotulo: { type: Type.STRING },
                    subrotulo: { type: Type.STRING },
                    estado: {
                      type: Type.STRING,
                      description: 'padrao, ativo, visitado, destaque ou erro',
                    },
                    x: { type: Type.NUMBER, description: 'Posição horizontal opcional de 10 a 90.' },
                    y: { type: Type.NUMBER, description: 'Posição vertical opcional de 15 a 85.' },
                  },
                  required: ['id', 'rotulo'],
                },
              },
              arestas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    origem: { type: Type.STRING },
                    destino: { type: Type.STRING },
                    rotulo: { type: Type.STRING },
                    ativa: { type: Type.BOOLEAN },
                    direcionada: { type: Type.BOOLEAN },
                  },
                  required: ['origem', 'destino'],
                },
              },
              destaques: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'IDs dos nós em destaque neste passo.',
              },
              valores: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Variáveis, métricas ou estado atual (ex.: "Topo: 40").',
              },
            },
            required: ['descricao', 'nos', 'arestas', 'destaques', 'valores'],
          },
        },
      },
      required: ['tipo', 'passos'],
    },
    complexidade: {
      type: Type.OBJECT,
      properties: {
        tempo: { type: Type.STRING },
        espaco: { type: Type.STRING },
        observacao: { type: Type.STRING },
      },
    },
    erros_comuns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    exercicios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pergunta: { type: Type.STRING },
          resposta_esperada: { type: Type.STRING },
          dica: { type: Type.STRING },
        },
        required: ['pergunta', 'resposta_esperada'],
      },
    },
    fontes_ou_termos_para_pesquisar: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Termos confiáveis para pesquisa sem inventar URLs ou autores.',
    },
  },
  required: [
    'titulo',
    'resumo',
    'nivel',
    'secoes',
    'visualizacao',
    'erros_comuns',
    'exercicios',
    'fontes_ou_termos_para_pesquisar',
  ],
};

function sanitizeJsonText(rawText: string | undefined): string {
  const cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```')) {
    return cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }
  return cleaned;
}

async function generatePlanWithRetry(
  ai: GoogleGenAI,
  topic: string,
  maxRetries = 2,
): Promise<TutorPlan> {
  let lastError = 'Erro desconhecido ao planejar.';
  let feedback = '';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const prompt =
      attempt === 0
        ? `Etapa A (Planejamento): Analise o tema "${topic}" e crie um plano didático e visual escolhendo o tipo de visualização mais adequado entre [${VISUALIZATION_TYPES.join(', ')}].`
        : `Etapa A (Planejamento - Correção): O JSON anterior falhou na validação (${feedback}). Corrija e retorne o plano completo e válido para o tema "${topic}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: ANTI_HALLUCINATION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: PLAN_GEMINI_SCHEMA,
        // Deterministic low-variance configuration for gemini-4-hydrogen (avoids deprecated sampling params)
        seed: 42,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    try {
      const parsed = JSON.parse(sanitizeJsonText(response.text));
      const validated = TutorPlanSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
      lastError = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      feedback = lastError;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JSON inválido na Etapa A.';
      feedback = lastError;
    }
  }

  throw new Error(`Falha na Etapa A (Planejamento) após ${maxRetries + 1} tentativas: ${lastError}`);
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  topic: string,
  plan: TutorPlan,
  maxRetries = 2,
): Promise<TutorResponse> {
  let lastError = 'Erro desconhecido na geração.';
  let feedback = '';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const basePrompt = `Etapa B (Geração Final): Siga exatamente este plano validado da Etapa A para ensinar "${topic}":
- Nível: ${plan.nivel}
- Pré-requisitos: ${plan.pre_requisitos.join(', ')}
- Tipo de visualização obrigatório: ${plan.tipo_visualizacao}
- Roteiro didático: ${plan.roteiro.map((r, i) => `${i + 1}) ${r}`).join(' ')}
- Objetivo visual: ${plan.objetivo_visual}

Garanta que:
1. Cada passo de visualizacao.passos tenha no máximo 7 elementos em nos[].
2. O estado do passo N evolua de forma lógica e consistente para o passo N+1.
3. Todas as arestas referenciem apenas IDs existentes em nos[].
4. Não invente links, autores, bibliotecas inexistentes ou estatísticas.`;

    const prompt =
      attempt === 0
        ? basePrompt
        : `${basePrompt}\n\nCORREÇÃO NECESSÁRIA (tentativa anterior inválida): ${feedback}. Corrija todos os campos e garanta JSON aderente ao schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: ANTI_HALLUCINATION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: TUTOR_GEMINI_SCHEMA,
        seed: 42,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    try {
      const parsed = JSON.parse(sanitizeJsonText(response.text));

      // Enforce <= 7 nodes per step safely before validation
      if (parsed?.visualizacao?.passos && Array.isArray(parsed.visualizacao.passos)) {
        parsed.visualizacao.passos = parsed.visualizacao.passos.map((passo: any) => ({
          ...passo,
          nos: Array.isArray(passo.nos) ? passo.nos.slice(0, 7) : [],
          arestas: Array.isArray(passo.arestas) ? passo.arestas : [],
          destaques: Array.isArray(passo.destaques) ? passo.destaques : [],
          valores: Array.isArray(passo.valores) ? passo.valores : [],
        }));
      }

      const validated = TutorResponseSchema.safeParse(parsed);
      if (validated.success) {
        return {
          ...validated.data,
          id: slugifyTopic(topic),
          plano: plan,
          origem: 'gemini-agent',
        };
      }
      lastError = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      feedback = lastError;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JSON inválido na Etapa B.';
      feedback = lastError;
    }
  }

  throw new Error(`Falha na Etapa B (Geração) após ${maxRetries + 1} tentativas: ${lastError}`);
}

const tutorResponseCache = new Map<string, TutorResponse>();

function isTransientQuotaOrServiceError(err: unknown): boolean {
  const status = Number((err as { status?: number })?.status || 0);
  const message = err instanceof Error ? err.message : String(err || '');
  return (
    status === 429 ||
    status === 503 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('UNAVAILABLE') ||
    message.includes('quota') ||
    message.includes('rate')
  );
}

export async function runTutorAgent(rawTopic: string): Promise<TutorResponse> {
  const topic = rawTopic.trim();
  if (topic.length < 2) {
    throw new Error('Informe um tema com pelo menos 2 caracteres.');
  }

  const cacheKey = slugifyTopic(topic);
  const cached = tutorResponseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const fallback = generateDeterministicTutorResponse(topic);
    tutorResponseCache.set(cacheKey, fallback);
    return fallback;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    // Etapa A: Planejamento
    const plan = await generatePlanWithRetry(ai, topic, 2);

    // Etapa B: Geração seguindo o plano
    const finalResult = await generateContentWithRetry(ai, topic, plan, 2);
    tutorResponseCache.set(cacheKey, finalResult);
    return finalResult;
  } catch (err) {
    if (isTransientQuotaOrServiceError(err)) {
      console.warn(
        `[Tutor Agent Fallback] Quota/disponibilidade Gemini atingida para "${topic}". Usando motor estruturado local.`,
      );
      const fallback = generateDeterministicTutorResponse(topic);
      tutorResponseCache.set(cacheKey, fallback);
      return fallback;
    }
    throw new Error(
      err instanceof Error
        ? err.message
        : 'Não foi possível gerar a explicação visual no momento.',
    );
  }
}
