import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { visualdyApi } from '../services/api';
import type { CategorySummary, StudyPlanEntry, TopicSummary } from '../types/visual';
import { computeStudyStats, getNextStudyTopicSlug, type StudyStats } from '../utils/studyLogic';

interface StudyContextValue {
  categories: CategorySummary[];
  topics: TopicSummary[];
  studyEntries: StudyPlanEntry[];
  studyStats: StudyStats;
  nextStudySlug: string;
  loadingCatalog: boolean;
  catalogError: string | null;
  isTopicSelected: (slug: string) => boolean;
  isTopicCompleted: (slug: string) => boolean;
  toggleTopicInStudy: (slug: string) => Promise<void>;
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
  const [studyEntries, setStudyEntries] = useState<StudyPlanEntry[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const refreshCatalogAndStudy = useCallback(async () => {
    try {
      setCatalogError(null);
      const [cats, allTopics, plan] = await Promise.all([
        visualdyApi.getCategories(),
        visualdyApi.getTopics(),
        visualdyApi.getStudyPlan(),
      ]);
      setCategories(cats);
      setTopics(allTopics);
      setStudyEntries(plan.items);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Falha ao carregar catálogo.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalogAndStudy();
  }, [refreshCatalogAndStudy]);

  const isTopicSelected = useCallback(
    (slug: string) => studyEntries.some((entry) => entry.topic_slug === slug),
    [studyEntries],
  );

  const isTopicCompleted = useCallback(
    (slug: string) => studyEntries.some((entry) => entry.topic_slug === slug && entry.completed),
    [studyEntries],
  );

  const toggleTopicInStudy = useCallback(async (slug: string) => {
    const res = await visualdyApi.toggleStudyTopic(slug);
    setStudyEntries(res.items);
  }, []);

  const markTopicCompleted = useCallback(async (slug: string, completed: boolean) => {
    const res = await visualdyApi.updateStudyItem(slug, { completed });
    setStudyEntries(res.items);
  }, []);

  const saveStudyNote = useCallback(async (slug: string, notes: string) => {
    const res = await visualdyApi.updateStudyItem(slug, { notes });
    setStudyEntries(res.items);
  }, []);

  const updateStepProgress = useCallback(async (slug: string, stepIndex: number) => {
    if (!studyEntries.some((e) => e.topic_slug === slug)) return;
    try {
      const res = await visualdyApi.updateStudyItem(slug, { last_step_viewed: stepIndex });
      setStudyEntries(res.items);
    } catch {
      // Non-blocking progress sync
    }
  }, [studyEntries]);

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
      studyStats,
      nextStudySlug,
      loadingCatalog,
      catalogError,
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
      studyStats,
      nextStudySlug,
      loadingCatalog,
      catalogError,
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
