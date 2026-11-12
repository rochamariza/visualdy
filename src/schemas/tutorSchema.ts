import { z } from 'zod';

export const VISUALIZATION_TYPES = [
  'arvore',
  'grafo',
  'array',
  'lista_ligada',
  'pilha',
  'fila',
  'tabela_hash',
  'matriz',
  'fluxo',
  'linha_do_tempo',
  'generico',
] as const;

export type VisualizationType = (typeof VISUALIZATION_TYPES)[number];

export const VisualizationTypeSchema = z.enum(VISUALIZATION_TYPES);

export const TutorDifficultySchema = z.enum(['Iniciante', 'Intermediário', 'Avançado']);
export type TutorDifficulty = z.infer<typeof TutorDifficultySchema>;

// Etapa A: Plano pedagógico e visual gerado antes do conteúdo final
export const TutorPlanSchema = z.object({
  tema: z.string().min(1),
  nivel: TutorDifficultySchema,
  pre_requisitos: z.array(z.string().min(1)).min(1).max(6),
  tipo_visualizacao: VisualizationTypeSchema,
  roteiro: z.array(z.string().min(1)).min(2).max(7),
  objetivo_visual: z.string().min(1),
});

export type TutorPlan = z.infer<typeof TutorPlanSchema>;

export const VisualNodeSchema = z.object({
  id: z.string().min(1),
  rotulo: z.string().min(1),
  subrotulo: z.string().optional().default(''),
  estado: z
    .enum(['padrao', 'ativo', 'visitado', 'destaque', 'erro'])
    .optional()
    .default('padrao'),
  x: z.number().optional(),
  y: z.number().optional(),
});

export type VisualNode = z.infer<typeof VisualNodeSchema>;

export const VisualEdgeSchema = z.object({
  origem: z.string().min(1),
  destino: z.string().min(1),
  rotulo: z.string().optional().default(''),
  ativa: z.boolean().optional().default(false),
  direcionada: z.boolean().optional().default(true),
});

export type VisualEdge = z.infer<typeof VisualEdgeSchema>;

export const VisualPassSchema = z.object({
  descricao: z.string().min(1),
  nos: z.array(VisualNodeSchema).max(12).default([]),
  arestas: z.array(VisualEdgeSchema).default([]),
  destaques: z.array(z.string()).default([]),
  valores: z
    .array(
      z.union([
        z.string(),
        z.object({
          chave: z.string().optional(),
          rotulo: z.string().optional(),
          valor: z.union([z.string(), z.number(), z.boolean()]),
        }),
      ]),
    )
    .default([])
    .transform((items) =>
      items.map((item) => {
        if (typeof item === 'string') return item;
        const label = item.chave || item.rotulo;
        return label ? `${label}: ${String(item.valor)}` : String(item.valor);
      }),
    ),
});

export type VisualPass = z.infer<typeof VisualPassSchema>;

export const TutorSectionSchema = z.object({
  titulo: z.string().min(1),
  texto: z.string().min(1),
  exemplo: z.string().optional(),
});

export type TutorSection = z.infer<typeof TutorSectionSchema>;

export const TutorExerciseSchema = z.object({
  pergunta: z.string().min(1),
  resposta_esperada: z.string().min(1),
  dica: z.string().optional(),
});

export type TutorExercise = z.infer<typeof TutorExerciseSchema>;

export const TutorComplexitySchema = z
  .union([
    z.string(),
    z.object({
      tempo: z.string().optional(),
      espaco: z.string().optional(),
      observacao: z.string().optional(),
    }),
  ])
  .optional();

// Etapa B: Saída final estruturada do Agente Tutor Visual
export const TutorResponseSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(2),
  resumo: z.string().min(10),
  nivel: TutorDifficultySchema,
  secoes: z.array(TutorSectionSchema).min(1),
  visualizacao: z.object({
    tipo: VisualizationTypeSchema,
    passos: z.array(VisualPassSchema).min(1),
  }),
  complexidade: TutorComplexitySchema,
  erros_comuns: z.array(z.string().min(1)).default([]),
  exercicios: z.array(TutorExerciseSchema).default([]),
  fontes_ou_termos_para_pesquisar: z.array(z.string().min(1)).default([]),
  plano: TutorPlanSchema.optional(),
  origem: z.enum(['gemini-agent', 'deterministic-fallback']).optional(),
});

export type TutorResponse = z.infer<typeof TutorResponseSchema>;

export function slugifyTopic(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tema-visual'
  );
}

export function getVisualizationTypeLabel(tipo: string): string {
  const map: Record<string, string> = {
    arvore: 'Árvore Hierárquica',
    grafo: 'Grafo & Conexões',
    array: 'Vetor / Array',
    lista_ligada: 'Lista Ligada',
    pilha: 'Pilha (LIFO)',
    fila: 'Fila (FIFO)',
    tabela_hash: 'Tabela Hash',
    matriz: 'Matriz 2D',
    fluxo: 'Fluxo de Processo',
    linha_do_tempo: 'Linha do Tempo',
    generico: 'Mapa Conceitual',
  };
  return map[tipo] || 'Diagrama Interativo';
}
