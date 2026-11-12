import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  BookMarked,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Hash,
  Layers,
  Link2,
  Loader2,
  Network,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StudyToggleButton } from '../components/common/StudyToggleButton';
import { TutorExplanationView } from '../components/tutor/TutorExplanationView';
import { ArrayPointersCanvas } from '../components/visualizers/ArrayPointersCanvas';
import { useStudy } from '../context/StudyContext';
import {
  getVisualizationTypeLabel,
  slugifyTopic,
  type TutorResponse,
  type VisualizationType,
} from '../schemas/tutorSchema';
import { visualdyApi } from '../services/api';
import type { ArrayPointersPayload, DifficultyLevel, TopicDetail } from '../types/visual';

interface ExampleTopicCard {
  id: string;
  title: string;
  description: string;
  level: DifficultyLevel;
  visualizationType: VisualizationType;
  icon: React.ComponentType<{ className?: string }>;
}

const EXAMPLE_TOPIC_CARDS: ExampleTopicCard[] = [
  {
    id: 'arvores-binarias',
    title: 'Árvores Binárias',
    description:
      'Entenda como nós, raízes e subárvores esquerda/direita organizam buscas e inserções hierárquicas.',
    level: 'Intermediário',
    visualizationType: 'arvore',
    icon: GitBranch,
  },
  {
    id: 'grafos',
    title: 'Grafos',
    description:
      'Visualize vértices, arestas e percursos em largura (BFS) ou profundidade (DFS) para modelar redes.',
    level: 'Intermediário',
    visualizationType: 'grafo',
    icon: Network,
  },
  {
    id: 'pilhas-e-filas',
    title: 'Pilhas e Filas',
    description:
      'Compare a ordem LIFO (último a entrar, primeiro a sair) com FIFO (primeiro a entrar, primeiro a sair).',
    level: 'Iniciante',
    visualizationType: 'pilha',
    icon: Layers,
  },
  {
    id: 'listas-ligadas',
    title: 'Listas Ligadas',
    description:
      'Acompanhe nós conectados por ponteiros na memória e veja como inserções evitam deslocar arrays.',
    level: 'Iniciante',
    visualizationType: 'lista_ligada',
    icon: Link2,
  },
  {
    id: 'tabelas-hash',
    title: 'Tabelas Hash',
    description:
      'Veja como funções de hash transformam chaves em índices diretos e como colisões são resolvidas.',
    level: 'Intermediário',
    visualizationType: 'tabela_hash',
    icon: Hash,
  },
  {
    id: 'algoritmos-de-ordenacao',
    title: 'Algoritmos de Ordenação',
    description:
      'Observe pivôs, partições e trocas passo a passo no Quicksort e na organização de vetores.',
    level: 'Intermediário',
    visualizationType: 'array',
    icon: ArrowUpDown,
  },
  {
    id: 'recursao',
    title: 'Recursão',
    description:
      'Desvende casos-base, chamadas empilhadas e o retorno de valores na pilha de execução.',
    level: 'Avançado',
    visualizationType: 'arvore',
    icon: Repeat,
  },
  {
    id: 'busca-binaria',
    title: 'Busca Binária',
    description:
      'Divida o espaço de busca ao meio a cada comparação usando ponteiros de início, meio e fim.',
    level: 'Iniciante',
    visualizationType: 'array',
    icon: Search,
  },
];

function getLevelBadgeStyle(level: string): string {
  if (level === 'Avançado') {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  if (level === 'Intermediário') {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

function formatSavedDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return 'Recente';
  }
}

export function HomePage() {
  const navigate = useNavigate();
  const { categories, topics, savedStudies, removeStudy, nextStudySlug } = useStudy();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultRef = useRef<HTMLElement>(null);

  const [heroDemo, setHeroDemo] = useState<TopicDetail | null>(null);
  const [heroStep, setHeroStep] = useState(0);

  const [quickConcept, setQuickConcept] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TutorResponse | null>(null);
  const [searchApiError, setSearchApiError] = useState<string | null>(null);
  const [lastSearchedTopic, setLastSearchedTopic] = useState<string>('');

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

  const focusSearchInput = () => {
    const el = searchInputRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => el.focus(), 200);
    }
  };

  const runSearchTopic = async (topicText: string) => {
    const trimmed = topicText.trim();
    if (trimmed.length < 2) {
      setQuickError('Digite pelo menos 2 caracteres (ex.: Grafos, Quicksort, DNS).');
      return;
    }

    setQuickError(null);
    setSearchApiError(null);
    setSearching(true);
    setLastSearchedTopic(trimmed);

    try {
      const response = await visualdyApi.askTutorAgent(trimmed);
      setSearchResult(response);
      window.setTimeout(() => {
        searchResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setSearchResult(null);
      setSearchApiError(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar a explicação agora. Tente novamente.',
      );
    } finally {
      setSearching(false);
    }
  };

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    runSearchTopic(quickConcept);
  };

  const handleStudyExampleNow = (topicTitle: string) => {
    navigate(`/gerador?assunto=${encodeURIComponent(topicTitle)}`);
  };

  const currentHeroStep = heroDemo?.steps[heroStep];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-16">
      {/* Section 1: Focused Split Hero with Live Interactive Mini-Stage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-800 border border-slate-200 w-fit">
              <img src="/owl-logo.png" alt="Coruja Wise Owl" className="w-4 h-4 object-contain" />
              <span>Agente Tutor Visual · Passo a passo · Sem alucinações</span>
            </div>
            <h1
              style={{ textWrap: 'balance' }}
              className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 leading-[1.15]"
            >
              Enxergue como cada conceito de programação realmente funciona.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Digite qualquer tema — de Árvores Binárias e Grafos até Como funciona o DNS — e o Agente Tutor Visual planeja e desenha uma explicação interativa passo a passo.
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
                <span>Estúdio Clássico</span>
              </Link>
            </div>
          </div>

          {/* Direct Concept-to-Visual Quick Input */}
          <form
            onSubmit={handleQuickCreate}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs"
          >
            <label
              htmlFor="home-quick-concept"
              className="block text-xs font-semibold text-slate-800"
            >
              Pergunte sobre qualquer tema ao Agente Tutor Visual
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={searchInputRef}
                id="home-quick-concept"
                type="text"
                value={quickConcept}
                onChange={(e) => {
                  setQuickConcept(e.target.value);
                  if (quickError) setQuickError(null);
                }}
                placeholder="Ex.: Grafos, Pilhas, Quicksort, Como funciona o DNS..."
                className="flex-1 min-h-[44px] rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
              />
              <button
                type="submit"
                disabled={searching}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{searching ? 'Gerando...' : 'Gerar Visual'}</span>
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

      {/* Inline Search Result from Agente Tutor Visual */}
      {(searching || searchApiError || searchResult) && (
        <section
          ref={searchResultRef}
          aria-labelledby="search-result-heading"
          data-testid="home-search-result"
          className="space-y-4 bg-slate-100/70 border border-slate-200 rounded-2xl p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-sky-700">
                Resultado do Agente Tutor Visual
              </span>
              <h2
                id="search-result-heading"
                className="font-display text-lg font-bold text-slate-900"
              >
                {searchResult ? searchResult.titulo : `Pesquisando: "${lastSearchedTopic}"`}
              </h2>
            </div>
            {!searching && (
              <button
                type="button"
                onClick={() => {
                  setSearchResult(null);
                  setSearchApiError(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar resultado</span>
              </button>
            )}
          </div>

          {searching && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  Agente Tutor planejando e gerando explicação...
                </p>
                <p className="text-xs text-slate-500">
                  Etapa A: definindo nível, pré-requisitos e melhor diagrama · Etapa B: validando passos visuais.
                </p>
              </div>
            </div>
          )}

          {searchApiError && !searching && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-900">
                  Não foi possível gerar a explicação
                </p>
                <p className="text-xs text-red-800">{searchApiError}</p>
              </div>
              <button
                type="button"
                onClick={() => runSearchTopic(lastSearchedTopic)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-900 text-white text-xs font-medium hover:bg-red-800 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}

          {searchResult && !searching && (
            <TutorExplanationView
              data={searchResult}
              showFullLink
              onOpenFull={() =>
                navigate(`/gerador?assunto=${encodeURIComponent(searchResult.titulo)}`, {
                  state: { preloadedResult: searchResult },
                })
              }
            />
          )}
        </section>
      )}

      {/* Section 2: Example Topics Grid + Ask Any Topic Card */}
      <section aria-labelledby="examples-heading" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2
              id="examples-heading"
              className="font-display text-xl sm:text-2xl font-bold text-slate-900"
            >
              Explore Temas em Destaque com o Agente Tutor
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Clique em <strong>Estudar agora</strong> para o Agente IA criar explicação e diagrama ao vivo, ou salve nos seus estudos.
            </p>
          </div>
          <Link
            to="/gerador"
            className="text-sm font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
          >
            Abrir Agente Tutor completo →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_TOPIC_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                data-testid={`example-card-${card.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-sky-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium ${getLevelBadgeStyle(card.level)}`}
                    >
                      {card.level}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleStudyExampleNow(card.title)}
                    className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                  >
                    <span>Estudar agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <StudyToggleButton
                    variant="compact"
                    className="w-full"
                    studyInput={{
                      id: slugifyTopic(card.title),
                      title: card.title,
                      visualizationType: card.visualizationType,
                      difficulty: card.level,
                      description: card.description,
                      generatedJson: null,
                    }}
                  />
                </div>
              </article>
            );
          })}

          {/* Ask About Any Topic Card */}
          <article
            data-testid="ask-any-topic-card"
            className="bg-[#131a3e] text-white border border-[#1e2959] rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-100 text-[11px] font-medium">
                  Tema livre
                </span>
              </div>

              <h3 className="font-display text-base font-semibold text-white">
                Pergunte sobre qualquer tema
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Quer entender Como funciona o DNS, Programação Dinâmica, HTTP/2 ou até Fotossíntese? Digite no campo de busca e o Agente cria o diagrama.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={focusSearchInput}
                className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold hover:bg-amber-300 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Digitar tema agora</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Section 3: Meus Estudos (Global + Persistent in localStorage) */}
      <section aria-labelledby="study-strip-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2
              id="study-strip-heading"
              className="font-display text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2"
            >
              <BookMarked className="w-5 h-5 text-sky-600" />
              <span>Meus estudos</span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
              {savedStudies.length > 0
                ? `${savedStudies.length} ${savedStudies.length === 1 ? 'tema salvo' : 'temas salvos'} no seu navegador (sem gastar nova chamada à API ao reabrir).`
                : 'Salve temas para revisar a qualquer momento, mesmo após recarregar a página.'}
            </p>
          </div>
          <Link
            to="/estudos"
            className="text-sm font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
          >
            Gerenciar roteiro completo →
          </Link>
        </div>

        {savedStudies.length === 0 ? (
          <div
            data-testid="my-studies-empty"
            className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700">
              <BookMarked className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Sua lista de estudos ainda está vazia
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Clique em &ldquo;Adicionar aos meus estudos&rdquo; em qualquer card acima ou gere uma explicação para salvar o diagrama completo aqui.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={focusSearchInput}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Perguntar um tema</span>
              </button>
              <a
                href="#examples-heading"
                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Ver exemplos acima</span>
              </a>
            </div>
          </div>
        ) : (
          <div
            data-testid="my-studies-list"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {savedStudies.map((item) => {
              const hasClassicStudio = topics.some((t) => t.slug === item.id);
              const targetUrl = item.generatedJson
                ? `/gerador?estudo=${encodeURIComponent(item.id)}`
                : hasClassicStudio
                  ? `/assunto/${encodeURIComponent(item.id)}`
                  : `/gerador?assunto=${encodeURIComponent(item.title)}`;

              return (
                <article
                  key={item.id}
                  data-testid={`saved-study-${item.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-sky-300 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {getVisualizationTypeLabel(item.visualizationType)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatSavedDate(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                    )}

                    {item.generatedJson && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Conteúdo completo salvo (abre instantaneamente)
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={targetUrl}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors"
                    >
                      <span>{item.generatedJson ? 'Reabrir estudo' : 'Estudar agora'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeStudy(item.id)}
                      aria-label={`Remover ${item.title} dos meus estudos`}
                      className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 4: Core Computing & Programming Categories */}
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
              Escolha um pilar da computação para explorar seus simuladores interativos clássicos.
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
