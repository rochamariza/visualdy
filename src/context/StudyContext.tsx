import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { slugifyTopic } from '../schemas/tutorSchema';
import { visualdyApi } from '../services/api';
import type { CategorySummary, StudyPlanEntry, TopicSummary } from '../types/visual';
import {
  getSavedStudies,
  getStoredStudyEntries,
  removeSavedStudyById,
  syncSavedItemToStudyEntries,
  upsertSavedStudy,
  type SavedStudyItem,
} from '../utils/localStudyStore';
import { computeStudyStats, getNextStudyTopicSlug, type StudyStats } from '../utils/studyLogic';

export interface ToastMessage {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
}

export type AddStudyInput = Omit<SavedStudyItem, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

interface StudyContextValue {
  categories: CategorySummary[];
  topics: TopicSummary[];
  studyEntries: StudyPlanEntry[];
  savedStudies: SavedStudyItem[];
  studyStats: StudyStats;
  nextStudySlug: string;
  loadingCatalog: boolean;
  catalogError: string | null;
  toasts: ToastMessage[];
  showToast: (message: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  addStudy: (item: AddStudyInput) => void;
  removeStudy: (id: string) => void;
  isStudied: (id: string) => boolean;
  getSavedStudy: (id: string) => SavedStudyItem | undefined;
  isTopicSelected: (slug: string) => boolean;
  isTopicCompleted: (slug: string) => boolean;
  toggleTopicInStudy: (slug: string, fallbackMeta?: Partial<AddStudyInput>) => Promise<void>;
  markTopicCompleted: (slug: string, completed: boolean) => Promise<void>;
  saveStudyNote: (slug: string, notes: string) => Promise<void>;
  updateStepProgress: (slug: string, stepIndex: number) => Promise<void>;
  reorderStudyItems: (orderedSlugs: string[]) => Promise<void>;
  refreshCatalogAndStudy: () => Promise<void>;
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  // Load synchronously from localStorage on app startup so state persists immediately across reloads
  const [savedStudies, setSavedStudies] = useState<SavedStudyItem[]>(() => getSavedStudies());
  const [studyEntries, setStudyEntries] = useState<StudyPlanEntry[]>(() => {
    const initialSaved = getSavedStudies();
    initialSaved.forEach((item) => syncSavedItemToStudyEntries(item));
    return getStoredStudyEntries();
  });
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast],
  );

  const refreshCatalogAndStudy = useCallback(async () => {
    try {
      setCatalogError(null);
      const [catsResult, topicsResult, planResult] = await Promise.allSettled([
        visualdyApi.getCategories(),
        visualdyApi.getTopics(),
        visualdyApi.getStudyPlan(),
      ]);

      if (catsResult.status === 'fulfilled') setCategories(catsResult.value);
      if (topicsResult.status === 'fulfilled') setTopics(topicsResult.value);
      if (planResult.status === 'fulfilled') {
        setStudyEntries(planResult.value.items);
      } else {
        setStudyEntries(getStoredStudyEntries());
      }
      setSavedStudies(getSavedStudies());
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Falha ao carregar catálogo.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalogAndStudy();
  }, [refreshCatalogAndStudy]);

  const addStudy = useCallback(
    (input: AddStudyInput) => {
      const { items, added, item } = upsertSavedStudy(input);
      setSavedStudies(items);
      setStudyEntries(getStoredStudyEntries());
      showToast(
        added
          ? `✓ "${item.title}" adicionado aos Meus Estudos.`
          : `✓ "${item.title}" atualizado nos Meus Estudos.`,
        'success',
      );
    },
    [showToast],
  );

  const removeStudy = useCallback(
    (id: string) => {
      const stableId = slugifyTopic(id);
      const existing = savedStudies.find((s) => s.id === stableId || s.id === id);
      const { items, removed } = removeSavedStudyById(id);
      setSavedStudies(items);
      setStudyEntries(getStoredStudyEntries());
      if (removed) {
        showToast(
          `Removido "${existing?.title || id}" dos Meus Estudos.`,
          'info',
        );
      }
    },
    [savedStudies, showToast],
  );

  const isStudied = useCallback(
    (id: string) => {
      const stableId = slugifyTopic(id);
      return savedStudies.some((s) => s.id === stableId || s.id === id);
    },
    [savedStudies],
  );

  const getSavedStudy = useCallback(
    (id: string) => {
      const stableId = slugifyTopic(id);
      return savedStudies.find((s) => s.id === stableId || s.id === id);
    },
    [savedStudies],
  );

  const isTopicSelected = useCallback(
    (slug: string) => isStudied(slug),
    [isStudied],
  );

  const isTopicCompleted = useCallback(
    (slug: string) =>
      savedStudies.some((s) => s.id === slug && s.completed) ||
      studyEntries.some((entry) => entry.topic_slug === slug && entry.completed),
    [savedStudies, studyEntries],
  );

  const toggleTopicInStudy = useCallback(
    async (slug: string, fallbackMeta?: Partial<AddStudyInput>) => {
      if (isStudied(slug)) {
        removeStudy(slug);
        try {
          await visualdyApi.toggleStudyTopic(slug);
        } catch {
          // Local store already updated cleanly
        }
        return;
      }

      const knownTopic = topics.find((t) => t.slug === slug);
      addStudy({
        id: slug,
        title: fallbackMeta?.title || knownTopic?.title || slug.replace(/-/g, ' '),
        visualizationType:
          fallbackMeta?.visualizationType || knownTopic?.archetype || 'generico',
        difficulty: fallbackMeta?.difficulty || knownTopic?.difficulty || 'Iniciante',
        description: fallbackMeta?.description || knownTopic?.one_liner || '',
        generatedJson: fallbackMeta?.generatedJson ?? null,
      });

      try {
        await visualdyApi.toggleStudyTopic(slug);
      } catch {
        // Local store already updated cleanly
      }
    },
    [isStudied, removeStudy, addStudy, topics],
  );

  const markTopicCompleted = useCallback(async (slug: string, completed: boolean) => {
    const res = await visualdyApi.updateStudyItem(slug, { completed });
    setStudyEntries(res.items);
    setSavedStudies(getSavedStudies());
  }, []);

  const saveStudyNote = useCallback(
    async (slug: string, notes: string) => {
      const res = await visualdyApi.updateStudyItem(slug, { notes });
      setStudyEntries(res.items);
      setSavedStudies(getSavedStudies());
      showToast('Anotação salva com sucesso.', 'success');
    },
    [showToast],
  );

  const updateStepProgress = useCallback(
    async (slug: string, stepIndex: number) => {
      if (!isStudied(slug)) return;
      try {
        const res = await visualdyApi.updateStudyItem(slug, { last_step_viewed: stepIndex });
        setStudyEntries(res.items);
        setSavedStudies(getSavedStudies());
      } catch {
        // Non-blocking progress sync
      }
    },
    [isStudied],
  );

  const reorderStudyItems = useCallback(async (orderedSlugs: string[]) => {
    const res = await visualdyApi.reorderStudyPlan(orderedSlugs);
    setStudyEntries(res.items);
  }, []);

  const studyStats = useMemo(() => computeStudyStats(studyEntries), [studyEntries]);
  const nextStudySlug = useMemo(() => getNextStudyTopicSlug(studyEntries), [studyEntries]);

  const value = useMemo<StudyContextValue>(
    () => ({
      categories,
      topics,
      studyEntries,
      savedStudies,
      studyStats,
      nextStudySlug,
      loadingCatalog,
      catalogError,
      toasts,
      showToast,
      dismissToast,
      addStudy,
      removeStudy,
      isStudied,
      getSavedStudy,
      isTopicSelected,
      isTopicCompleted,
      toggleTopicInStudy,
      markTopicCompleted,
      saveStudyNote,
      updateStepProgress,
      reorderStudyItems,
      refreshCatalogAndStudy,
    }),
    [
      categories,
      topics,
      studyEntries,
      savedStudies,
      studyStats,
      nextStudySlug,
      loadingCatalog,
      catalogError,
      toasts,
      showToast,
      dismissToast,
      addStudy,
      removeStudy,
      isStudied,
      getSavedStudy,
      isTopicSelected,
      isTopicCompleted,
      toggleTopicInStudy,
      markTopicCompleted,
      saveStudyNote,
      updateStepProgress,
      reorderStudyItems,
      refreshCatalogAndStudy,
    ],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error('useStudy deve ser usado dentro de StudyProvider.');
  }
  return ctx;
}
