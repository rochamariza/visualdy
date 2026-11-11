import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CodeSyncPanel } from '../components/study/CodeSyncPanel';
import { VisualStage } from '../components/visualizers/VisualStage';
import { useStudy } from '../context/StudyContext';
import { visualdyApi } from '../services/api';
import type { DifficultyLevel, TopicDetail, VisualArchetype } from '../types/visual';
import { clampStepIndex, validateConceptInput } from '../utils/studyLogic';

const PRESET_CONCEPTS = [
  'Deadlock entre Processos',
  'Garbage Collector (Mark & Sweep)',
  'Containers Docker',
  'Git Branch e Merge',
  'Arquitetura API REST',
];

const ARCHETYPE_OPTIONS: Array<{ label: string; value: VisualArchetype | 'auto' }> = [
  { label: 'Automático (Detectar melhor diagrama)', value: 'auto' },
  { label: 'Fluxo de Sistema e Estados', value: 'system_flow' },
  { label: 'Mapa de Memória (Stack / Heap)', value: 'memory_model' },
  { label: 'Vetor Indexado e Ponteiros', value: 'array_pointers' },
  { label: 'Árvore e Pilha de Chamadas', value: 'call_stack_tree' },
  { label: 'Portas Lógicas e 8 Bits', value: 'logic_gates' },
  { label: 'Conjuntos e Tabelas SQL', value: 'relational_join' },
];

export function GeneratorPage() {
  const [searchParams] = useSearchParams();
  const { refreshCatalogAndStudy } = useStudy();

  const [concept, setConcept] = useState<string>(searchParams.get('assunto') || '');
  const [archetypeChoice, setArchetypeChoice] = useState<VisualArchetype | 'auto'>('auto');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Iniciante');
  const [addToStudy, setAddToStudy] = useState<boolean>(true);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedTopic, setGeneratedTopic] = useState<TopicDetail | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const executeGeneration = useCallback(
    async (
      targetConcept: string,
      chosenArchetype: VisualArchetype | 'auto',
      chosenDifficulty: DifficultyLevel,
      autoStudy: boolean,
    ) => {
      const check = validateConceptInput(targetConcept);
      if (!check.valid) {
        setValidationError(check.error);
        return;
      }

      try {
        setValidationError(null);
        setGenerating(true);
        const created = await visualdyApi.generateVisualExplanation({
          concept: targetConcept.trim(),
          preferred_archetype: chosenArchetype === 'auto' ? null : chosenArchetype,
          difficulty: chosenDifficulty,
          save_to_catalog: true,
          add_to_study_plan: autoStudy,
        });
        setGeneratedTopic(created);
        setStepIndex(0);
        await refreshCatalogAndStudy();
      } catch (err) {
        setValidationError(
          err instanceof Error ? err.message : 'Falha ao gerar explicação visual.',
        );
      } finally {
        setGenerating(false);
      }
    },
    [refreshCatalogAndStudy],
  );

  // Auto-run if navigated from Home with ?assunto=...
  useEffect(() => {
    const prefilled = searchParams.get('assunto');
    if (prefilled && prefilled.trim().length >= 2) {
      setConcept(prefilled);
      executeGeneration(prefilled, 'auto', 'Iniciante', true);
    }
  }, [searchParams, executeGeneration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeGeneration(concept, archetypeChoice, difficulty, addToStudy);
  };

  const currentStep = generatedTopic
    ? generatedTopic.steps[clampStepIndex(stepIndex, generatedTopic.steps.length)]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <div className="text-xs text-slate-500">Motor de Explicação Visual</div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Criar Explicação Visual para Qualquer Assunto
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Digite qualquer conceito de computação ou programação. O back-end Python sintetiza um diagrama interativo passo a passo e já o disponibiliza nos seus estudos.
        </p>
      </div>

      {/* Generator Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-1.5">
            <label
              htmlFor="concept-input"
              className="block text-xs font-semibold text-slate-800"
            >
              Assunto ou Conceito de Computação
            </label>
            <input
              id="concept-input"
              type="text"
              value={concept}
              onChange={(e) => {
                setConcept(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ex.: Deadlock entre Processos, Garbage Collector, Docker..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
            />
          </div>

          <div className="lg:col-span-4 space-y-1.5">
            <label
              htmlFor="archetype-select"
              className="block text-xs font-semibold text-slate-800"
            >
              Estrutura Visual
            </label>
            <select
              id="archetype-select"
              value={archetypeChoice}
              onChange={(e) =>
                setArchetypeChoice(e.target.value as VisualArchetype | 'auto')
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
            >
              {ARCHETYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="difficulty-select"
              className="block text-xs font-semibold text-slate-800"
            >
              Profundidade
            </label>
            <select
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
            >
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>
        </div>

        {validationError && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {validationError}
          </p>
        )}

        {/* Preset Quick Triggers + Submit Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 w-full sm:w-auto">Sugestões rápidas:</span>
            {PRESET_CONCEPTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setConcept(preset);
                  setValidationError(null);
                  executeGeneration(preset, archetypeChoice, difficulty, addToStudy);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap flex items-center justify-center"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 w-full md:w-auto shrink-0">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={addToStudy}
                onChange={(e) => setAddToStudy(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Incluir nos Meus Estudos</span>
            </label>

            <button
              type="submit"
              disabled={generating}
              className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Construindo Visual...' : 'Gerar Explicação Visual'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Generated Interactive Result */}
      {generatedTopic && (
        <section className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/70 border border-emerald-200 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Explicação visual criada para <strong>{generatedTopic.title}</strong> ({generatedTopic.step_count} etapas).
              </span>
            </div>
            <Link
              to={`/assunto/${generatedTopic.slug}`}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 whitespace-nowrap w-full sm:w-auto"
            >
              <span>Abrir no Estúdio Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-7 xl:col-span-8">
              <VisualStage
                archetype={generatedTopic.archetype}
                steps={generatedTopic.steps}
                currentStepIndex={stepIndex}
                onStepChange={setStepIndex}
              />
            </div>

            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              {currentStep && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-mono text-sky-700">
                    Passo {stepIndex + 1} de {generatedTopic.steps.length}
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {currentStep.title}
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentStep.explanation}
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                    <strong className="text-slate-900">Ponto-chave: </strong>
                    {currentStep.takeaway}
                  </div>
                </div>
              )}

              <CodeSyncPanel
                language={generatedTopic.code_language}
                lines={generatedTopic.code_lines}
                activeLine={currentStep ? currentStep.code_line : 1}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
