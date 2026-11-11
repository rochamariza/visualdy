import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrayPointersCanvas } from '../components/visualizers/ArrayPointersCanvas';
import { useStudy } from '../context/StudyContext';
import { visualdyApi } from '../services/api';
import type { ArrayPointersPayload, TopicDetail } from '../types/visual';

export function HomePage() {
  const navigate = useNavigate();
  const { categories, studyEntries, studyStats, nextStudySlug } = useStudy();

  const [heroDemo, setHeroDemo] = useState<TopicDetail | null>(null);
  const [heroStep, setHeroStep] = useState(0);
  const [quickConcept, setQuickConcept] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    visualdyApi
      .getTopicDetail('busca-binaria')
      .then((detail) => {
        if (active) setHeroDemo(detail);
      })
      .catch(() => {
        // Resilient quiet fallback handled in render
      });
    return () => {
      active = false;
    };
  }, []);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickConcept.trim();
    if (trimmed.length < 2) {
      setQuickError('Digite pelo menos 2 caracteres (ex.: Recursão, Docker, Deadlock).');
      return;
    }
    setQuickError(null);
    navigate(`/gerador?assunto=${encodeURIComponent(trimmed)}`);
  };

  const currentHeroStep = heroDemo?.steps[heroStep];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-16">
      {/* Section 1: Focused Split Hero with Live Interactive Mini-Stage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <p className="text-xs font-medium text-sky-700">
              Aprendizado visual · Direto ao ponto · Sem distrações
            </p>
            <h1
              style={{ textWrap: 'balance' }}
              className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 leading-[1.15]"
            >
              Enxergue como cada conceito de programação realmente funciona.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Em vez de parágrafos abstratos, acompanhe ponteiros, memória RAM, árvores, redes e consultas SQL ganhando forma passo a passo no seu ritmo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 w-full sm:w-auto">
              <Link
                to="/categorias"
                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>Explorar Categorias</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/assunto/${nextStudySlug}`}
                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span>Continuar Meus Estudos</span>
              </Link>
            </div>
          </div>

          {/* Direct Concept-to-Visual Quick Input */}
          <form
            onSubmit={handleQuickCreate}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
          >
            <label
              htmlFor="home-quick-concept"
              className="block text-xs font-semibold text-slate-800"
            >
              Quer visualizar um assunto específico agora?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="home-quick-concept"
                type="text"
                value={quickConcept}
                onChange={(e) => {
                  setQuickConcept(e.target.value);
                  if (quickError) setQuickError(null);
                }}
                placeholder="Ex.: Garbage Collector, Deadlock, Git Merge..."
                className="flex-1 min-h-[44px] rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
              />
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Visual</span>
              </button>
            </div>
            {quickError && (
              <p role="alert" className="text-xs text-red-600">
                {quickError}
              </p>
            )}
          </form>
        </div>

        {/* Right Hero Column: Live Interactive Binary Search Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
              <span className="font-semibold text-slate-900">Demonstração Interativa: Busca Binária</span>
              <span aria-hidden="true">·</span>
              <span>
                Passo {heroStep + 1} de {heroDemo ? heroDemo.steps.length : 3}
              </span>
            </div>
            <Link
              to="/assunto/busca-binaria"
              className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
            >
              Abrir simulador completo →
            </Link>
          </div>

          <div className="p-5 visual-grid-bg flex-1">
            {currentHeroStep ? (
              <ArrayPointersCanvas
                payload={currentHeroStep.payload as unknown as ArrayPointersPayload}
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
                Carregando visualização interativa...
              </div>
            )}
          </div>

          {currentHeroStep && heroDemo && (
            <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 max-w-md">
                <p className="text-xs font-semibold text-slate-900">
                  {currentHeroStep.title}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentHeroStep.explanation}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  disabled={heroStep === 0}
                  onClick={() => setHeroStep((s) => Math.max(0, s - 1))}
                  aria-label="Passo anterior da demonstração"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHeroStep((s) => (s + 1 < heroDemo.steps.length ? s + 1 : 0))
                  }
                  className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors whitespace-nowrap"
                >
                  <span>
                    {heroStep + 1 < heroDemo.steps.length ? 'Próximo Passo' : 'Reiniciar'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Study Queue Strip (Assuntos Escolhidos para Estudar) */}
      <section aria-labelledby="study-strip-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2
              id="study-strip-heading"
              className="font-display text-xl font-bold text-slate-900"
            >
              Seus Assuntos Escolhidos para Estudar
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
              {studyStats.completed} de {studyStats.total} concluídos · {studyStats.remainingMinutes} min restantes no roteiro atual
            </p>
          </div>
          <Link
            to="/estudos"
            className="text-sm font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
          >
            Gerenciar roteiro completo →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studyEntries.slice(0, 3).map((entry, idx) => (
            <Link
              key={entry.topic_slug}
              to={`/assunto/${entry.topic_slug}`}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400 transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>
                    0{idx + 1}. {entry.topic.category_name}
                  </span>
                  {entry.completed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluído
                    </span>
                  ) : (
                    <span>{entry.topic.read_minutes} min</span>
                  )}
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 mt-1.5">
                  {entry.topic.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {entry.topic.one_liner}
                </p>
              </div>
              <span className="text-xs font-medium text-sky-700">
                {entry.completed ? 'Revisar visualização →' : 'Iniciar estudo visual →'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 3: Core Computing & Programming Categories */}
      <section aria-labelledby="categories-heading" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2
              id="categories-heading"
              className="font-display text-xl sm:text-2xl font-bold text-slate-900"
            >
              Trilhas Visuais por Categoria
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Escolha um pilar da computação para explorar seus modelos mentais interativos.
            </p>
          </div>
          <Link
            to="/categorias"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap"
          >
            Ver todos os assuntos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/categorias/${cat.slug}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 transition-colors flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums mb-2">
                  <span>Trilha 0{cat.order}</span>
                  <span>
                    {cat.topic_count} {cat.topic_count === 1 ? 'assunto' : 'assuntos'}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  {cat.name}
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {cat.short_description}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between gap-2">
                <span className="truncate">Modelo: {cat.mental_model}</span>
                <ArrowRight className="w-4 h-4 text-slate-700 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
