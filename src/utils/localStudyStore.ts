import type {
  StudyPlanEntry,
  StudyPlanResponse,
  TopicDetail,
  TopicSummary,
} from '../types/visual';

const CUSTOM_TOPICS_KEY = 'visualdy_custom_topics_v1';
const STUDY_PLAN_KEY = 'visualdy_study_plan_v1';

// Seed default initial study items so the user always has rich content on first visit
const DEFAULT_INITIAL_STUDY_SLUGS = [
  'variaveis-e-memoria',
  'busca-binaria',
  'pilha-e-fila',
];

export function getStoredCustomTopics(): Record<string, TopicDetail> {
  try {
    const raw = localStorage.getItem(CUSTOM_TOPICS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredCustomTopic(topic: TopicDetail): void {
  try {
    const current = getStoredCustomTopics();
    current[topic.slug] = topic;
    localStorage.setItem(CUSTOM_TOPICS_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar tópico personalizado:', err);
  }
}

export function getStoredStudyEntries(): StudyPlanEntry[] {
  try {
    const raw = localStorage.getItem(STUDY_PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredStudyEntries(entries: StudyPlanEntry[]): void {
  try {
    localStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar plano de estudos:', err);
  }
}

export function addTopicToStudyStore(topic: TopicSummary | TopicDetail): StudyPlanEntry[] {
  const current = getStoredStudyEntries();
  const existingIndex = current.findIndex((e) => e.topic_slug === topic.slug);

  const topicSummary: TopicSummary = {
    slug: topic.slug,
    title: topic.title,
    category_slug: topic.category_slug,
    category_name: topic.category_name,
    difficulty: topic.difficulty,
    read_minutes: topic.read_minutes,
    one_liner: topic.one_liner,
    archetype: topic.archetype,
    step_count: topic.step_count,
    complexity_tag: topic.complexity_tag,
    is_custom: topic.is_custom,
  };

  if (existingIndex >= 0) {
    // Already in study plan, ensure topic data is updated
    current[existingIndex].topic = topicSummary;
  } else {
    const maxPriority = current.reduce((max, e) => Math.max(max, e.priority || 0), 0);
    current.push({
      topic_slug: topic.slug,
      added_at: new Date().toISOString(),
      completed: false,
      last_step_viewed: 0,
      notes: '',
      priority: maxPriority + 1,
      topic: topicSummary,
    });
  }

  saveStoredStudyEntries(current);
  return current;
}

export function toggleTopicInStudyStore(
  slug: string,
  allKnownTopics: TopicSummary[],
): { selected: boolean; items: StudyPlanEntry[] } {
  const current = getStoredStudyEntries();
  const existingIndex = current.findIndex((e) => e.topic_slug === slug);

  if (existingIndex >= 0) {
    current.splice(existingIndex, 1);
    // Re-index priorities
    current.forEach((item, idx) => {
      item.priority = idx + 1;
    });
    saveStoredStudyEntries(current);
    return { selected: false, items: current };
  }

  // Find topic in known catalog or custom store
  const found =
    allKnownTopics.find((t) => t.slug === slug) ||
    getStoredCustomTopics()[slug];

  if (!found) {
    return { selected: false, items: current };
  }

  const updated = addTopicToStudyStore(found);
  return { selected: true, items: updated };
}

export function updateStudyItemInStore(
  slug: string,
  patch: { completed?: boolean; last_step_viewed?: number; notes?: string },
): StudyPlanEntry[] {
  const current = getStoredStudyEntries();
  const item = current.find((e) => e.topic_slug === slug);
  if (item) {
    if (typeof patch.completed === 'boolean') item.completed = patch.completed;
    if (typeof patch.last_step_viewed === 'number') item.last_step_viewed = patch.last_step_viewed;
    if (typeof patch.notes === 'string') item.notes = patch.notes;
    saveStoredStudyEntries(current);
  }
  return current;
}

export function reorderStudyStore(orderedSlugs: string[]): StudyPlanEntry[] {
  const current = getStoredStudyEntries();
  const map = new Map(current.map((e) => [e.topic_slug, e]));
  const reordered: StudyPlanEntry[] = [];

  orderedSlugs.forEach((slug, idx) => {
    const item = map.get(slug);
    if (item) {
      item.priority = idx + 1;
      reordered.push(item);
      map.delete(slug);
    }
  });

  // Append any unmentioned items at the end
  let nextPriority = reordered.length + 1;
  map.forEach((item) => {
    item.priority = nextPriority++;
    reordered.push(item);
  });

  saveStoredStudyEntries(reordered);
  return reordered;
}

export function buildStudyPlanResponse(entries: StudyPlanEntry[]): StudyPlanResponse {
  const completedCount = entries.filter((e) => e.completed).length;
  return {
    items: entries,
    total: entries.length,
    completed_count: completedCount,
  };
}
