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
  reorderStudyStore,
  saveStoredCustomTopic,
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
    // Check local custom topics first
    const customMap = getStoredCustomTopics();
    if (customMap[slug]) {
      return customMap[slug];
    }

    try {
      return await requestJson<TopicDetail>(`/api/topics/${encodeURIComponent(slug)}`);
    } catch (err) {
      // If server failed, check if we can generate on the fly
      console.warn('[Topic Detail Fallback]', err);
      const generated = generateClientVisualTopic({ concept: slug.replace(/-/g, ' ') });
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

    // Register in study plan
    if (input.add_to_study_plan !== false) {
      addTopicToStudyStore(topic);
    }

    return topic;
  },

  async getStudyPlan(): Promise<StudyPlanResponse> {
    try {
      const serverRes = await requestJson<StudyPlanResponse>('/api/study-plan');
      // Merge server entries with local store entries
      const localEntries = getStoredStudyEntries();
      const map = new Map<string, StudyPlanEntry>();

      serverRes.items.forEach((item) => map.set(item.topic_slug, item));
      localEntries.forEach((item) => {
        if (!map.has(item.topic_slug)) {
          map.set(item.topic_slug, item);
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => a.priority - b.priority);
      return buildStudyPlanResponse(merged);
    } catch (err) {
      console.warn('[Study Plan Local Fallback]', err);
      const localEntries = getStoredStudyEntries();
      return buildStudyPlanResponse(localEntries);
    }
  },

  async toggleStudyTopic(
    topicSlug: string,
  ): Promise<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }> {
    try {
      const serverRes = await requestJson<{ selected: boolean; topic_slug: string; items: StudyPlanEntry[] }>(
        '/api/study-plan/toggle',
        {
          method: 'POST',
          body: JSON.stringify({ topic_slug: topicSlug }),
        },
      );
      // Sync local store
      if (serverRes.items) {
        serverRes.items.forEach((entry) => addTopicToStudyStore(entry.topic));
      }
      return serverRes;
    } catch (err) {
      console.warn('[Toggle Study Local Fallback]', err);
      const topics = await this.getTopics();
      const localRes = toggleTopicInStudyStore(topicSlug, topics);
      return {
        selected: localRes.selected,
        topic_slug: topicSlug,
        items: localRes.items,
      };
    }
  },

  async updateStudyItem(
    topicSlug: string,
    patch: { completed?: boolean; last_step_viewed?: number; notes?: string },
  ): Promise<{ items: StudyPlanEntry[] }> {
    try {
      return await requestJson<{ items: StudyPlanEntry[] }>(
        `/api/study-plan/${encodeURIComponent(topicSlug)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        },
      );
    } catch (err) {
      console.warn('[Update Study Item Local Fallback]', err);
      const updated = updateStudyItemInStore(topicSlug, patch);
      return { items: updated };
    }
  },

  async reorderStudyPlan(orderedSlugs: string[]): Promise<{ items: StudyPlanEntry[] }> {
    try {
      return await requestJson<{ items: StudyPlanEntry[] }>('/api/study-plan/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ordered_slugs: orderedSlugs }),
      });
    } catch (err) {
      console.warn('[Reorder Study Local Fallback]', err);
      const reordered = reorderStudyStore(orderedSlugs);
      return { items: reordered };
    }
  },
};
