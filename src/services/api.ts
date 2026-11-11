import type {
  CategorySummary,
  DifficultyLevel,
  StudyPlanEntry,
  StudyPlanResponse,
  TopicDetail,
  TopicSummary,
  VisualArchetype,
} from '../types/visual';
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

  getTopics(params?: { category?: string; q?: string }): Promise<TopicSummary[]> {
    const search = new URLSearchParams();
    if (params?.category) search.set('category', params.category);
    if (params?.q) search.set('q', params.q);
    const qs = search.toString();
    return requestJson<TopicSummary[]>(`/api/topics${qs ? `?${qs}` : ''}`);
  },

  getTopicDetail(slug: string): Promise<TopicDetail> {
    return requestJson<TopicDetail>(`/api/topics/${encodeURIComponent(slug)}`);
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
    try {
      return await requestJson<TopicDetail>('/api/visual-engine/generate', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      console.warn('[Visualdy Engine Fallback Ativo]', err);
      return generateClientVisualTopic(input);
    }
  },

  getStudyPlan(): Promise<StudyPlanResponse> {
    return requestJson<StudyPlanResponse>('/api/study-plan');
  },

  toggleStudyTopic(topicSlug: string): Promise<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }> {
    return requestJson<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }>(
      '/api/study-plan/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ topic_slug: topicSlug }),
      },
    );
  },

  updateStudyItem(
    topicSlug: string,
    patch: { completed?: boolean; last_step_viewed?: number; notes?: string },
  ): Promise<{ items: StudyPlanEntry[] }> {
    return requestJson<{ items: StudyPlanEntry[] }>(
      `/api/study-plan/${encodeURIComponent(topicSlug)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
  },

  reorderStudyPlan(orderedSlugs: string[]): Promise<{ items: StudyPlanEntry[] }> {
    return requestJson<{ items: StudyPlanEntry[] }>('/api/study-plan/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ordered_slugs: orderedSlugs }),
    });
  },
};
