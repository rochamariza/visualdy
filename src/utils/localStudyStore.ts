import type { TutorResponse } from '../schemas/tutorSchema';
import { slugifyTopic } from '../schemas/tutorSchema';
import type {
  DifficultyLevel,
  StudyPlanEntry,
  StudyPlanResponse,
  TopicDetail,
  TopicSummary,
  VisualArchetype,
} from '../types/visual';

const CUSTOM_TOPICS_KEY = 'visualdy_custom_topics_v1';
const STUDY_PLAN_KEY = 'visualdy_study_plan_v1';
const STEP_PROGRESS_KEY = 'visualdy_step_progress_v1';
const SAVED_STUDIES_KEY = 'visualdy_saved_studies_v2';

// In-memory fallback when localStorage is unavailable or throws quota/security errors
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // fallback to memoryStore
  }
  return memoryStore.get(key) ?? null;
}

function safeSetItem(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('[Storage Warning] Usando fallback em memória:', err);
  }
}

export interface SavedStudyItem {
  id: string;
  title: string;
  visualizationType: string;
  createdAt: string;
  difficulty?: DifficultyLevel | string;
  description?: string;
  completed?: boolean;
  notes?: string;
  lastStepViewed?: number;
  generatedJson?: TutorResponse | null;
}

export function mapVisualizationTypeToArchetype(tipo: string): VisualArchetype {
  switch (tipo) {
    case 'arvore':
    case 'grafo':
      return 'call_stack_tree';
    case 'array':
    case 'matriz':
      return 'array_pointers';
    case 'pilha':
    case 'fila':
    case 'tabela_hash':
    case 'lista_ligada':
      return 'memory_model';
    default:
      return 'system_flow';
  }
}

export function getSavedStudies(): SavedStudyItem[] {
  try {
    const raw = safeGetItem(SAVED_STUDIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedStudies(items: SavedStudyItem[]): void {
  try {
    safeSetItem(SAVED_STUDIES_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar estudos:', err);
  }
}

export function upsertSavedStudy(
  input: Omit<SavedStudyItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): { items: SavedStudyItem[]; added: boolean; item: SavedStudyItem } {
  const id = slugifyTopic(input.id || input.title);
  const current = getSavedStudies();
  const existingIndex = current.findIndex((s) => s.id === id);

  const normalizedItem: SavedStudyItem = {
    id,
    title: input.title,
    visualizationType: input.visualizationType || 'generico',
    createdAt:
      existingIndex >= 0
        ? current[existingIndex].createdAt
        : input.createdAt || new Date().toISOString(),
    difficulty: input.difficulty || (existingIndex >= 0 ? current[existingIndex].difficulty : 'Iniciante'),
    description: input.description || (existingIndex >= 0 ? current[existingIndex].description : ''),
    completed: input.completed ?? (existingIndex >= 0 ? current[existingIndex].completed : false),
    notes: input.notes ?? (existingIndex >= 0 ? current[existingIndex].notes : ''),
    lastStepViewed:
      input.lastStepViewed ?? (existingIndex >= 0 ? current[existingIndex].lastStepViewed : 0),
    generatedJson:
      input.generatedJson !== undefined
        ? input.generatedJson
        : existingIndex >= 0
          ? current[existingIndex].generatedJson
          : null,
  };

  let added = false;
  if (existingIndex >= 0) {
    current[existingIndex] = normalizedItem;
  } else {
    current.unshift(normalizedItem);
    added = true;
  }

  saveSavedStudies(current);
  // Also keep legacy studyEntries synchronized
  syncSavedItemToStudyEntries(normalizedItem);

  return { items: current, added, item: normalizedItem };
}

export function removeSavedStudyById(id: string): { items: SavedStudyItem[]; removed: boolean } {
  const stableId = slugifyTopic(id);
  const current = getSavedStudies();
  const filtered = current.filter((s) => s.id !== stableId && s.id !== id);
  const removed = filtered.length !== current.length;
  saveSavedStudies(filtered);

  // Also remove from legacy studyEntries
  const entries = getStoredStudyEntries().filter(
    (e) => e.topic_slug !== stableId && e.topic_slug !== id,
  );
  entries.forEach((entry, idx) => {
    entry.priority = idx + 1;
  });
  saveStoredStudyEntries(entries);

  return { items: filtered, removed };
}

export function syncSavedItemToStudyEntries(item: SavedStudyItem): void {
  const summary: TopicSummary = {
    slug: item.id,
    title: item.title,
    category_slug: 'agente-tutor',
    category_name: item.generatedJson ? 'Agente Tutor Visual' : 'Catálogo Visual',
    difficulty: (item.difficulty as DifficultyLevel) || 'Iniciante',
    read_minutes: 4,
    one_liner:
      item.description ||
      item.generatedJson?.resumo ||
      `Estudo visual sobre ${item.title}.`,
    archetype: mapVisualizationTypeToArchetype(item.visualizationType),
    step_count: item.generatedJson?.visualizacao?.passos?.length || 3,
    complexity_tag:
      typeof item.generatedJson?.complexidade === 'object'
        ? item.generatedJson.complexidade?.tempo || item.visualizationType
        : item.visualizationType,
    is_custom: Boolean(item.generatedJson),
  };

  const entries = getStoredStudyEntries();
  const idx = entries.findIndex((e) => e.topic_slug === item.id);
  if (idx >= 0) {
    entries[idx].topic = summary;
    if (typeof item.completed === 'boolean') entries[idx].completed = item.completed;
    if (typeof item.notes === 'string') entries[idx].notes = item.notes;
    if (typeof item.lastStepViewed === 'number') entries[idx].last_step_viewed = item.lastStepViewed;
  } else {
    const maxPriority = entries.reduce((max, e) => Math.max(max, e.priority || 0), 0);
    entries.push({
      topic_slug: item.id,
      added_at: item.createdAt,
      completed: Boolean(item.completed),
      last_step_viewed: item.lastStepViewed || 0,
      notes: item.notes || '',
      priority: maxPriority + 1,
      topic: summary,
    });
  }
  saveStoredStudyEntries(entries);
}

export function getStoredStepProgress(slug: string): number {
  try {
    const raw = safeGetItem(STEP_PROGRESS_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw);
    return typeof map[slug] === 'number' ? map[slug] : 0;
  } catch {
    return 0;
  }
}

export function saveStoredStepProgress(slug: string, stepIndex: number): void {
  try {
    const raw = safeGetItem(STEP_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[slug] = stepIndex;
    safeSetItem(STEP_PROGRESS_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar progresso do passo:', err);
  }
}

export function getStoredCustomTopics(): Record<string, TopicDetail> {
  try {
    const raw = safeGetItem(CUSTOM_TOPICS_KEY);
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
    safeSetItem(CUSTOM_TOPICS_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar tópico personalizado:', err);
  }
}

export function getStoredStudyEntries(): StudyPlanEntry[] {
  try {
    const raw = safeGetItem(STUDY_PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredStudyEntries(entries: StudyPlanEntry[]): void {
  try {
    safeSetItem(STUDY_PLAN_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[Storage Error] Não foi possível salvar plano de estudos:', err);
  }
}

export function mergeServerAndLocalEntries(
  serverEntries: StudyPlanEntry[],
  localEntries: StudyPlanEntry[],
): StudyPlanEntry[] {
  if (localEntries.length === 0 && serverEntries.length > 0) {
    saveStoredStudyEntries(serverEntries);
    return serverEntries;
  }

  const result: StudyPlanEntry[] = [];
  const processedSlugs = new Set<string>();

  localEntries.forEach((loc) => {
    const srv = serverEntries.find((s) => s.topic_slug === loc.topic_slug);
    result.push({
      ...loc,
      topic: srv?.topic || loc.topic,
      completed: loc.completed ?? (srv?.completed || false),
      last_step_viewed: loc.last_step_viewed ?? (srv?.last_step_viewed || 0),
      notes: loc.notes !== undefined && loc.notes !== '' ? loc.notes : (srv?.notes || ''),
    });
    processedSlugs.add(loc.topic_slug);
  });

  // Only add initial server seeds if user hasn't explicitly initialized local saved studies yet
  const savedStudies = getSavedStudies();
  if (savedStudies.length === 0 && localEntries.length === 0) {
    let nextPriority = result.length + 1;
    serverEntries.forEach((srv) => {
      if (!processedSlugs.has(srv.topic_slug)) {
        result.push({
          ...srv,
          priority: nextPriority++,
        });
        processedSlugs.add(srv.topic_slug);
      }
    });
  }

  saveStoredStudyEntries(result);
  return result;
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
    current.forEach((item, idx) => {
      item.priority = idx + 1;
    });
    saveStoredStudyEntries(current);
    return { selected: false, items: current };
  }

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

  // Also update savedStudies
  const saved = getSavedStudies();
  const savedItem = saved.find((s) => s.id === slug);
  if (savedItem) {
    if (typeof patch.completed === 'boolean') savedItem.completed = patch.completed;
    if (typeof patch.last_step_viewed === 'number') {
      savedItem.lastStepViewed = patch.last_step_viewed;
    }
    if (typeof patch.notes === 'string') savedItem.notes = patch.notes;
    saveSavedStudies(saved);
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
