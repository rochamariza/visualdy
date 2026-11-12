import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookmarkCheck,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { TutorExplanationView } from '../components/tutor/TutorExplanationView';
import { useStudy } from '../context/StudyContext';
import { slugifyTopic, type TutorResponse } from '../schemas/tutorSchema';
import { visualdyApi } from '../services/api';
import { validateConceptInput } from '../utils/studyLogic';

const PRESET_CONCEPTS = [
  'Grafos',
  'Pilhas',
  'Quicksort',
  'Como funciona o DNS',
  'Árvores Binárias',
  'Tabelas Hash',
];

export function GeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { getSavedStudy } = useStudy();

  const assuntoParam = searchParams.get('assunto') || '';
  const estudoParam = searchParams.get('estudo') || '';
  const preloadedState = (location.state as { preloadedResult?: TutorResponse } | null)
    ?.preloadedResult;

  const [concept, setConcept] = useState<string>(assuntoParam || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<TutorResponse | null>(preloadedState || null);
  const [loadedFromCache, setLoadedFromCache] = useState<boolean>(false);
  const [lastRequestedTopic, setLastRequestedTopic] = useState<string>(assuntoParam || '');

  const lastHandledKeyRef = useRef<string>('');

  const executeAgent = useCallback(async (targetConcept: string) => {
    const check = validateConceptInput(targetConcept);
    if (!check.valid) {
      setValidationError(check.error);
      return;
    }

    const clean = targetConcept.trim();
    setValidationError(null);
    setApiError(null);
    setLoadedFromCache(false);
    setGenerating(true);
    setLastRequestedTopic(clean);

    try {
      const response = await visualdyApi.askTutorAgent(clean);
      setResult(response);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'Falha ao consultar o Agente Tutor Visual. Tente novamente.',
      );
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    const routeKey = `${estudoParam}::${assuntoParam}`;
    if (lastHandledKeyRef.current === routeKey) return;

    if (preloadedState && assuntoParam) {
      lastHandledKeyRef.current = routeKey;
      setConcept(preloadedState.titulo);
      setResult(preloadedState);
      setLoadedFromCache(false);
      return;
    }

    if (estudoParam) {
      lastHandledKeyRef.current = routeKey;
      const saved = getSavedStudy(estudoParam);
      if (saved?.generatedJson) {
        setConcept(saved.title);
        setResult(saved.generatedJson);
        setLoadedFromCache(true);
        setApiError(null);
        return;
      }
      if (saved) {
        setConcept(saved.title);
        executeAgent(saved.title);
        return;
      }
      const fallbackTopic = estudoParam.replace(/-/g, ' ');
      setConcept(fallbackTopic);
      executeAgent(fallbackTopic);
      return;
    }

    if (assuntoParam && assuntoParam.trim().length >= 2) {
      lastHandledKeyRef.current = routeKey;
      setConcept(assuntoParam);
      executeAgent(assuntoParam);
    }
  }, [assuntoParam, estudoParam, preloadedState, getSavedStudy, executeAgent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateConceptInput(concept);
    if (!check.valid) {
      setValidationError(check.error);
      return;
    }
    const clean = concept.trim();
    lastHandledKeyRef.current = `::${clean}`;
    setSearchParams({ assunto: clean });
    executeAgent(clean);
  };

  const handlePresetClick = (preset: string) => {
    setConcept(preset);
    setValidationError(null);
    lastHandledKeyRef.current = `::${preset}`;
    setSearchParams({ assunto: preset });
    executeAgent(preset);
  };

  const classicStudioSlug = result
    ? slugifyTopic(result.titulo) === 'arvores-binarias' ||
      slugifyTopic(result.titulo).includes('arvore-binaria')
      ? 'arvore-binaria-busca'
      : slugifyTopic(result.titulo) === 'busca-binaria'
        ? 'busca-binaria'
        : null
    : null;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agente Tutor Visual · Arquitetura em 2 Etapas</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Estúdio do Agente Tutor Visual
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Pergunte sobre qualquer tema de computação ou conhecimento geral. O agente primeiro planeja o roteiro e escolhe o melhor tipo de diagrama (Etapa A), depois gera explicação estruturada e animação passo a passo (Etapa B).
        </p>
      </div>

      {/* Ask Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="concept-input"
            className="block text-xs font-semibold text-slate-800"
          >
            Qual tema você quer entender visualmente hoje?
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="concept-input"
              type="text"
              value={concept}
              onChange={(e) => {
                setConcept(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ex.: Grafos, Pilhas, Quicksort, Como funciona o DNS, Recursão..."
              className="flex-1 min-h-[46px] rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
            />
            <button
              type="submit"
              disabled={generating}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{generating ? 'Gerando...' : 'Gerar Explicação Visual'}</span>
            </button>
          </div>
        </div>

        {validationError && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {validationError}
          </p>
        )}

        {/* Preset Quick Triggers */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 mr-1">Sugestões rápidas:</span>
          {PRESET_CONCEPTS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={generating}
              onClick={() => handlePresetClick(preset)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Loading State */}
      {generating && (
        <section
          aria-live="polite"
          data-testid="agent-loading-state"
          className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 text-sky-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Agente Tutor Visual trabalhando em &ldquo;{lastRequestedTopic || concept}&rdquo;...
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Etapa A: Planejando nível, pré-requisitos e tipo de diagrama · Etapa B: Gerando explicação passo a passo e validando JSON estruturado.
            </p>
          </div>
        </section>
      )}

      {/* Error State with Retry */}
      {apiError && !generating && (
        <section
          role="alert"
          data-testid="agent-error-state"
          className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-display text-sm font-semibold text-red-950">
                Não foi possível concluir a geração
              </h2>
              <p className="text-xs sm:text-sm text-red-800">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => executeAgent(lastRequestedTopic || concept)}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-900 text-white text-xs font-medium hover:bg-red-800 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </section>
      )}

      {/* Result View */}
      {result && !generating && (
        <div className="space-y-4">
          {(loadedFromCache || classicStudioSlug) && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700">
              {loadedFromCache ? (
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Carregado diretamente dos seus estudos salvos (zero chamadas extras à API).
                  </span>
                </div>
              ) : (
                <span>Explicação gerada sob medida pelo Agente Tutor Visual.</span>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {loadedFromCache && (
                  <button
                    type="button"
                    onClick={() => executeAgent(result.titulo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gerar nova versão</span>
                  </button>
                )}
                {classicStudioSlug && (
                  <Link
                    to={`/assunto/${classicStudioSlug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
                  >
                    <span>Abrir Simulador Interativo Clássico</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <TutorExplanationView data={result} />
        </div>
      )}
    </div>
  );
}
