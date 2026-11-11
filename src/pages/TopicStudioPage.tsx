import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { CodeSyncPanel } from '../components/study/CodeSyncPanel';
import { VisualStage } from '../components/visualizers/VisualStage';
import { useStudy } from '../context/StudyContext';
import { visualdyApi } from '../services/api';
import type { TopicDetail } from '../types/visual';
import { clampStepIndex } from '../utils/studyLogic';

export function TopicStudioPage() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const {
    studyEntries,
    isTopicSelected,
    isTopicCompleted,
    toggleTopicInStudy,
    markTopicCompleted,
    updateStepProgress,
  } = useStudy();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [paramDraft, setParamDraft] = useState<Record<string, string | number>>({});
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (!topicSlug) return;
    let active = true;
    setLoading(true);
    setError(null);
    setStepIndex(0);

    visualdyApi
      .getTopicDetail(topicSlug)
      .then((detail) => {
        if (!active) return;
        setTopic(detail);
        setParamDraft(detail.active_params || {});
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Assunto não encontrado.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [topicSlug]);

  // Keyboard left/right navigation when not typing in an input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!topic) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        setStepIndex((prev) => clampStepIndex(prev + 1, topic.steps.length));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((prev) => clampStepIndex(prev - 1, topic.steps.length));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [topic]);

  const handleStepChange = useCallback(
    (nextIdx: number) => {
      if (!topic) return;
      const clamped = clampStepIndex(nextIdx, topic.steps.length);
      setStepIndex(clamped);
      updateStepProgress(topic.slug, clamped);
    },
    [topic, updateStepProgress],
  );

  const runSimulation = useCallback(
    async (nextParams: Record<string, string | number>) => {
      if (!topic) return;
      try {
        setSimulating(true);
        const updated = await visualdyApi.simulateTopic(topic.slug, nextParams);
        setTopic(updated);
        setParamDraft(updated.active_params);
        setStepIndex((prev) => clampStepIndex(prev, updated.steps.length));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao simular parâmetros.');
      } finally {
        setSimulating(false);
      }
    },
    [topic],
  );

  const handleQuickParamChange = useCallback(
    (key: string, value: string | number) => {
      const merged = { ...paramDraft, [key]: value };
      setParamDraft(merged);
      runSimulation(merged);
    },
    [paramDraft, runSimulation],
  );

  const handleParamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStepIndex(0);
    runSimulation(paramDraft);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
          Preparando diagrama interativo...
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-slate-900">
            Assunto não encontrado
          </h1>
          <p className="text-sm text-slate-600">
            {error || 'Não foi possível localizar esta explicação visual.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/categorias"
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
            >
              Voltar às Categorias
            </Link>
            <Link
              to="/gerador"
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Criar Explicação Visual
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const safeStep = clampStepIndex(stepIndex, topic.steps.length);
  const currentStep = topic.steps[safeStep];
  const selectedInStudy = isTopicSelected(topic.slug);
  const completedInStudy = isTopicCompleted(topic.slug);

  // Next study item suggestion
  const nextQueueEntry = studyEntries.find(
    (e) => e.topic_slug !== topic.slug && !e.completed,
  );

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Breadcrumb + Study Actions */}
      {!focusMode && (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1.5">
            <nav aria-label="Trilha de localização" className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <Link to="/categorias" className="hover:text-slate-900">
                Categorias
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                to={`/categorias/${topic.category_slug}`}
                className="hover:text-slate-900"
              >
                {topic.category_name}
              </Link>
              <span aria-hidden="true">·</span>
              <span>{topic.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{topic.complexity_tag}</span>
            </nav>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {topic.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
              {topic.one_liner}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => toggleTopicInStudy(topic.slug)}
              className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                selectedInStudy
                  ? 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {selectedInStudy ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Nos Meus Estudos</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 shrink-0" />
                  <span>Adicionar aos Estudos</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => markTopicCompleted(topic.slug, !completedInStudy)}
              className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                completedInStudy
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{completedInStudy ? 'Concluído ✓' : 'Marcar como Concluído'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Two-Zone Sandbox Layout (65% Stage / 35% Direct Explanation & Controls) */}
      <div
        className={
          focusMode
            ? 'max-w-5xl mx-auto space-y-5'
            : 'grid grid-cols-1 lg:grid-cols-12 gap-7 items-start'
        }
      >
        {/* Left Zone: Interactive Visual Stage + Core Mental Model */}
        <div className={focusMode ? 'space-y-5' : 'lg:col-span-7 xl:col-span-8 space-y-6'}>
          <VisualStage
            archetype={topic.archetype}
            steps={topic.steps}
            currentStepIndex={safeStep}
            onStepChange={handleStepChange}
            focusMode={focusMode}
            onToggleFocusMode={() => setFocusMode((f) => !f)}
            onQuickParamChange={handleQuickParamChange}
          />

          {focusMode && currentStep && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-sky-700">
                Passo {safeStep + 1} de {topic.steps.length}
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {currentStep.title}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {currentStep.explanation}
              </p>
              <p className="text-xs font-medium text-slate-600 pt-1">
                Síntese: {currentStep.takeaway}
              </p>
            </div>
          )}

          {!focusMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Essência em Uma Ideia
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {topic.core_idea}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Analogia Visual do Mundo Real
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {topic.real_world_analogy}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Zone: Step Explanation, Live FastAPI Parameter Controls & Synced Code */}
        {!focusMode && (
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Direct Step Explanation Card */}
            {currentStep && (
              <section
                aria-live="polite"
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="text-xs font-mono text-sky-700 tabular-nums">
                  Explicação do Passo {safeStep + 1}/{topic.steps.length}
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
                  {currentStep.title}
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentStep.explanation}
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                  <strong className="text-slate-900 font-semibold">Ponto-chave: </strong>
                  {currentStep.takeaway}
                </div>
              </section>
            )}

            {/* Interactive FastAPI Parameter Controls */}
            {topic.parameters.length > 0 && (
              <form
                onSubmit={handleParamSubmit}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                    <span>Testar com Outros Valores</span>
                  </h3>
                  {simulating && (
                    <span className="text-xs text-sky-700 font-mono">Atualizando...</span>
                  )}
                </div>

                {topic.parameters.map((ctrl) => {
                  const inputId = `param-${ctrl.key}`;
                  const val = paramDraft[ctrl.key] ?? ctrl.default_value;

                  return (
                    <div key={ctrl.key} className="space-y-1">
                      <label
                        htmlFor={inputId}
                        className="block text-xs font-medium text-slate-700"
                      >
                        {ctrl.label}
                      </label>
                      {ctrl.control_type === 'select' && ctrl.options ? (
                        <select
                          id={inputId}
                          value={String(val)}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            handleQuickParamChange(ctrl.key, nextVal);
                          }}
                          className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
                        >
                          {ctrl.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : ctrl.control_type === 'number' ? (
                        <input
                          id={inputId}
                          type="number"
                          min={ctrl.min_val ?? undefined}
                          max={ctrl.max_val ?? undefined}
                          value={val}
                          onChange={(e) =>
                            setParamDraft((prev) => ({
                              ...prev,
                              [ctrl.key]: e.target.value === '' ? '' : Number(e.target.value),
                            }))
                          }
                          className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm sm:text-xs font-mono text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
                        />
                      ) : (
                        <input
                          id={inputId}
                          type="text"
                          value={String(val)}
                          onChange={(e) =>
                            setParamDraft((prev) => ({ ...prev, [ctrl.key]: e.target.value }))
                          }
                          className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm sm:text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
                        />
                      )}
                      {ctrl.helper && (
                        <p className="text-[11px] text-slate-500">{ctrl.helper}</p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  Recalcular Visualização
                </button>
              </form>
            )}

            {/* Synchronized Code View */}
            <CodeSyncPanel
              language={topic.code_language}
              lines={topic.code_lines}
              activeLine={currentStep ? currentStep.code_line : 1}
            />

            {/* Next in Study Queue */}
            {nextQueueEntry && (
              <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500">Próximo nos Seus Estudos</div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {nextQueueEntry.topic.title}
                  </div>
                </div>
                <Link
                  to={`/assunto/${nextQueueEntry.topic_slug}`}
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
