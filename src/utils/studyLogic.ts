import type {
  DifficultyLevel,
  StudyPlanEntry,
  TopicSummary,
  VisualArchetype,
} from '../types/visual';

export function filterTopics(
  topics: TopicSummary[],
  options: {
    categorySlug?: string | null;
    difficulty?: DifficultyLevel | 'Todos';
    searchQuery?: string;
  },
): TopicSummary[] {
  const { categorySlug, difficulty = 'Todos', searchQuery = '' } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return topics.filter((topic) => {
    if (categorySlug && topic.category_slug !== categorySlug) {
      return false;
    }
    if (difficulty !== 'Todos' && topic.difficulty !== difficulty) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${topic.title} ${topic.one_liner} ${topic.category_name} ${topic.complexity_tag}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
}

export interface StudyStats {
  total: number;
  completed: number;
  pending: number;
  percentComplete: number;
  remainingMinutes: number;
}

export function computeStudyStats(entries: StudyPlanEntry[]): StudyStats {
  const total = entries.length;
  const completed = entries.filter((e) => e.completed).length;
  const pending = total - completed;
  const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100);
  const remainingMinutes = entries
    .filter((e) => !e.completed)
    .reduce((acc, item) => acc + (item.topic?.read_minutes || 3), 0);

  return {
    total,
    completed,
    pending,
    percentComplete,
    remainingMinutes,
  };
}

export function getNextStudyTopicSlug(
  entries: StudyPlanEntry[],
  fallbackSlug = 'busca-binaria',
): string {
  const sorted = [...entries].sort((a, b) => a.priority - b.priority);
  const firstPending = sorted.find((e) => !e.completed);
  if (firstPending) {
    return firstPending.topic_slug;
  }
  if (sorted.length > 0) {
    return sorted[0].topic_slug;
  }
  return fallbackSlug;
}

export function clampStepIndex(index: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.max(0, Math.min(totalSteps - 1, index));
}

export function validateConceptInput(raw: string): { valid: boolean; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Digite um conceito de computação ou programação para gerar a explicação visual.',
    };
  }
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Informe pelo menos 2 caracteres para identificar o assunto.',
    };
  }
  if (trimmed.length > 120) {
    return {
      valid: false,
      error: 'Use um título direto com até 120 caracteres.',
    };
  }
  return { valid: true, error: null };
}

export function getArchetypeLabel(archetype: VisualArchetype): string {
  const labels: Record<VisualArchetype, string> = {
    array_pointers: 'Vetor e Ponteiros',
    memory_model: 'Mapa de Memória',
    call_stack_tree: 'Árvore e Call Stack',
    system_flow: 'Fluxo de Sistema',
    logic_gates: 'Portas e Bits',
    relational_join: 'Conjuntos e Tabelas',
  };
  return labels[archetype] || 'Diagrama Interativo';
}

export function reorderSlugs(
  slugs: string[],
  index: number,
  direction: 'up' | 'down',
): string[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= slugs.length || targetIndex < 0 || targetIndex >= slugs.length) {
    return slugs;
  }
  const copy = [...slugs];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, moved);
  return copy;
}
