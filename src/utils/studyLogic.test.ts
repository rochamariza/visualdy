import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampStepIndex,
  computeStudyStats,
  filterTopics,
  getNextStudyTopicSlug,
  reorderSlugs,
  validateConceptInput,
} from './studyLogic';
import type { StudyPlanEntry, TopicSummary } from '../types/visual';

const sampleTopics: TopicSummary[] = [
  {
    slug: 'busca-binaria',
    title: 'Busca Binária',
    category_slug: 'algoritmos',
    category_name: 'Algoritmos e Complexidade',
    difficulty: 'Iniciante',
    read_minutes: 3,
    one_liner: 'Divida o vetor ordenado ao meio.',
    archetype: 'array_pointers',
    step_count: 4,
    complexity_tag: 'Tempo O(log n)',
    is_custom: false,
  },
  {
    slug: 'event-loop-assincrono',
    title: 'Event Loop Assíncrono',
    category_slug: 'redes-e-sistemas',
    category_name: 'Redes, Web e Concorrência',
    difficulty: 'Avançado',
    read_minutes: 5,
    one_liner: 'Concorrência sem travar a thread principal.',
    archetype: 'system_flow',
    step_count: 3,
    complexity_tag: 'Não-bloqueante',
    is_custom: false,
  },
];

test('filterTopics filters by category, difficulty, and search query', () => {
  assert.equal(filterTopics(sampleTopics, { categorySlug: 'algoritmos' }).length, 1);
  assert.equal(filterTopics(sampleTopics, { difficulty: 'Avançado' }).length, 1);
  assert.equal(filterTopics(sampleTopics, { searchQuery: 'log n' })[0].slug, 'busca-binaria');
  assert.equal(filterTopics(sampleTopics, { searchQuery: 'inexistente' }).length, 0);
});

test('computeStudyStats calculates completion percentage and remaining minutes accurately', () => {
  const entries: StudyPlanEntry[] = [
    {
      topic_slug: 'busca-binaria',
      added_at: '2026-11-03T00:00:00Z',
      completed: true,
      last_step_viewed: 3,
      notes: '',
      priority: 1,
      topic: sampleTopics[0],
    },
    {
      topic_slug: 'event-loop-assincrono',
      added_at: '2026-11-03T00:00:00Z',
      completed: false,
      last_step_viewed: 1,
      notes: '',
      priority: 2,
      topic: sampleTopics[1],
    },
  ];
  const stats = computeStudyStats(entries);
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.percentComplete, 50);
  assert.equal(stats.remainingMinutes, 5);
  assert.equal(getNextStudyTopicSlug(entries), 'event-loop-assincrono');
});

test('validateConceptInput rejects empty input and accepts valid CS concepts', () => {
  assert.equal(validateConceptInput('   ').valid, false);
  assert.equal(validateConceptInput('a').valid, false);
  assert.equal(validateConceptInput('Árvore Rubro-Negra').valid, true);
});

test('clampStepIndex and reorderSlugs preserve safe array bounds', () => {
  assert.equal(clampStepIndex(-3, 5), 0);
  assert.equal(clampStepIndex(9, 5), 4);
  assert.deepEqual(reorderSlugs(['a', 'b', 'c'], 1, 'up'), ['b', 'a', 'c']);
  assert.deepEqual(reorderSlugs(['a', 'b', 'c'], 0, 'up'), ['a', 'b', 'c']);
});
