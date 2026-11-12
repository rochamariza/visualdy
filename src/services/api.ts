import {
  TutorResponseSchema,
  type TutorResponse,
} from '../schemas/tutorSchema';
import { generateDeterministicTutorResponse } from '../server/deterministicTutor';
import type {
  CategorySummary,
  DifficultyLevel,
  StudyPlanEntry,
  StudyPlanResponse,
  TopicDetail,
  TopicSummary,
  VisualArchetype,
} from '../types/visual';
import {
  addTopicToStudyStore,
  buildStudyPlanResponse,
  getStoredCustomTopics,
  getStoredStudyEntries,
  mergeServerAndLocalEntries,
  reorderStudyStore,
  saveStoredCustomTopic,
  saveStoredStepProgress,
  saveStoredStudyEntries,
  toggleTopicInStudyStore,
  updateStudyItemInStore,
} from '../utils/localStudyStore';
import { generateClientVisualTopic } from '../utils/visualEngineFallback';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const targetUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const response = await fetch(targetUrl, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Erro na requisição (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody?.detail) {
        message = typeof errBody.detail === 'string' ? errBody.detail : JSON.stringify(errBody.detail);
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const visualdyApi = {
  getCategories(): Promise<CategorySummary[]> {
    return requestJson<CategorySummary[]>('/api/categories');
  },

  getCategoryDetail(slug: string): Promise<{ category: CategorySummary; topics: TopicSummary[] }> {
    return requestJson<{ category: CategorySummary; topics: TopicSummary[] }>(
      `/api/categories/${encodeURIComponent(slug)}`,
    );
  },

  async getTopics(params?: { category?: string; q?: string }): Promise<TopicSummary[]> {
    let serverTopics: TopicSummary[] = [];
    try {
      const search = new URLSearchParams();
      if (params?.category) search.set('category', params.category);
      if (params?.q) search.set('q', params.q);
      const qs = search.toString();
      serverTopics = await requestJson<TopicSummary[]>(`/api/topics${qs ? `?${qs}` : ''}`);
    } catch (err) {
      console.warn('[Topics Network Fallback]', err);
    }

    // Merge custom topics saved in localStorage
    const customMap = getStoredCustomTopics();
    const customList = Object.values(customMap).map((t) => ({
      slug: t.slug,
      title: t.title,
      category_slug: t.category_slug,
      category_name: t.category_name,
      difficulty: t.difficulty,
      read_minutes: t.read_minutes,
      one_liner: t.one_liner,
      archetype: t.archetype,
      step_count: t.step_count,
      complexity_tag: t.complexity_tag,
      is_custom: true,
    }));

    const combined = [...serverTopics];
    customList.forEach((c) => {
      if (!combined.some((t) => t.slug === c.slug)) {
        if (!params?.category || params.category === c.category_slug) {
          if (!params?.q || c.title.toLowerCase().includes(params.q.toLowerCase())) {
            combined.push(c);
          }
        }
      }
    });

    return combined;
  },

  async getTopicDetail(slug: string): Promise<TopicDetail> {
    const resolvedSlug =
      slug === 'arvores-binarias' || slug === 'arvore-binaria'
        ? 'arvore-binaria-busca'
        : slug;

    // Check local custom topics first
    const customMap = getStoredCustomTopics();
    if (customMap[resolvedSlug]) {
      return customMap[resolvedSlug];
    }

    try {
      return await requestJson<TopicDetail>(`/api/topics/${encodeURIComponent(resolvedSlug)}`);
    } catch (err) {
      // If server failed, check if we can generate on the fly
      console.warn('[Topic Detail Fallback]', err);
      const generated = generateClientVisualTopic({ concept: resolvedSlug.replace(/-/g, ' ') });
      saveStoredCustomTopic(generated);
      return generated;
    }
  },

  simulateTopic(slug: string, params: Record<string, string | number>): Promise<TopicDetail> {
    return requestJson<TopicDetail>(`/api/topics/${encodeURIComponent(slug)}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ params }),
    });
  },

  async generateVisualExplanation(input: {
    concept: string;
    preferred_archetype?: VisualArchetype | null;
    difficulty?: DifficultyLevel;
    save_to_catalog?: boolean;
    add_to_study_plan?: boolean;
  }): Promise<TopicDetail> {
    let topic: TopicDetail;
    try {
      topic = await requestJson<TopicDetail>('/api/visual-engine/generate', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      console.warn('[Visualdy Engine Fallback Ativo]', err);
      topic = generateClientVisualTopic(input);
    }

    // Persist in local storage
    if (input.save_to_catalog !== false) {
      saveStoredCustomTopic(topic);
    }

    // Register in study plan and record initial step progress
    if (input.add_to_study_plan !== false) {
      addTopicToStudyStore(topic);
      saveStoredStepProgress(topic.slug, 0);
    }

    return topic;
  },

  async askTutorAgent(topicInput: string): Promise<TutorResponse> {
    const cleanTopic = topicInput.trim();
    if (cleanTopic.length < 2) {
      throw new Error('Informe um tema com pelo menos 2 caracteres.');
    }

    const targetUrl = `${API_BASE}/api/tutor-agent`;
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ topic: cleanTopic }),
      });
    } catch (networkErr) {
      console.warn('[Tutor Agent Offline Fallback]', networkErr);
      return generateDeterministicTutorResponse(cleanTopic);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Static hosting without serverless functions returned HTML
      console.warn('[Tutor Agent Static Fallback] Resposta não-JSON do servidor.');
      return generateDeterministicTutorResponse(cleanTopic);
    }

    const data = await response.json();
    if (!response.ok) {
      const msg =
        typeof data?.detail === 'string'
          ? data.detail
          : typeof data?.error === 'string'
            ? data.error
            : `Erro ao consultar o Agente Tutor Visual (${response.status})`;
      throw new Error(msg);
    }

    const parsed = TutorResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        'A resposta recebida do Agente Tutor veio em formato incompleto. Tente novamente.',
      );
    }
    return parsed.data;
  },

  async getStudyPlan(): Promise<StudyPlanResponse> {
    const localEntries = getStoredStudyEntries();
    try {
      const serverRes = await requestJson<StudyPlanResponse>('/api/study-plan');
      const merged = mergeServerAndLocalEntries(serverRes.items || [], localEntries);
      return buildStudyPlanResponse(merged);
    } catch (err) {
      console.warn('[Study Plan Local Fallback]', err);
      return buildStudyPlanResponse(localEntries);
    }
  },

  async toggleStudyTopic(
    topicSlug: string,
  ): Promise<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }> {
    // 1. Immediately toggle in localStorage
    const allTopics = await this.getTopics();
    const localRes = toggleTopicInStudyStore(topicSlug, allTopics);

    // 2. Best-effort server sync
    try {
      const serverRes = await requestJson<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }>(
        '/api/study-plan/toggle',
        {
          method: 'POST',
          body: JSON.stringify({ topic_slug: topicSlug }),
        },
      );
      if (serverRes.items) {
        mergeServerAndLocalEntries(serverRes.items, localRes.items);
      }
    } catch (err) {
      console.warn('[Toggle Study Local Fallback]', err);
    }

    return {
      selected: localRes.selected,
      topic_slug: topicSlug,
      items: localRes.items,
    };
  },

  async updateStudyItem(
    topicSlug: string,
    patch: { completed?: boolean; last_step_viewed?: number; notes?: string },
  ): Promise<{ items: StudyPlanEntry[] }> {
    // 1. Always update local storage first so user never loses progress
    const updated = updateStudyItemInStore(topicSlug, patch);
    if (typeof patch.last_step_viewed === 'number') {
      saveStoredStepProgress(topicSlug, patch.last_step_viewed);
    }

    // 2. Best-effort server sync
    try {
      await requestJson<{ items: StudyPlanEntry[] }>(
        `/api/study-plan/${encodeURIComponent(topicSlug)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        },
      );
    } catch (err) {
      console.warn('[Update Study Item Server Sync Skip]', err);
    }

    return { items: updated };
  },

  async reorderStudyPlan(orderedSlugs: string[]): Promise<{ items: StudyPlanEntry[] }> {
    // 1. Always reorder local storage first
    const reordered = reorderStudyStore(orderedSlugs);

    // 2. Best-effort server sync
    try {
      await requestJson<{ items: StudyPlanEntry[] }>('/api/study-plan/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ordered_slugs: orderedSlugs }),
      });
    } catch (err) {
      console.warn('[Reorder Study Server Sync Skip]', err);
    }

    return { items: reordered };
  },
};
