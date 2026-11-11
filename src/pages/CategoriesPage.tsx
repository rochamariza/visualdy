import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TopicCard } from '../components/cards/TopicCard';
import { useStudy } from '../context/StudyContext';
import type { DifficultyLevel } from '../types/visual';
import { filterTopics } from '../utils/studyLogic';

const DIFFICULTIES: Array<DifficultyLevel | 'Todos'> = [
  'Todos',
  'Iniciante',
  'Intermediário',
  'Avançado',
];

export function CategoriesPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const {
    categories,
    topics,
    loadingCatalog,
    isTopicSelected,
    isTopicCompleted,
    toggleTopicInStudy,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'Todos'>('Todos');

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) || null,
    [categories, categorySlug],
  );

  const filteredTopics = useMemo(
    () =>
      filterTopics(topics, {
        categorySlug: categorySlug || null,
        difficulty,
        searchQuery,
      }),
    [topics, categorySlug, difficulty, searchQuery],
  );

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">
          <span>Catálogo Visual</span>
          {activeCategory && (
            <>
              <span aria-hidden="true"> / </span>
              <span className="text-slate-800 font-medium">{activeCategory.name}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          {activeCategory ? activeCategory.name : 'Todas as Categorias de Computação'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {activeCategory
            ? `${activeCategory.short_description} Modelo visual dominante: ${activeCategory.mental_model}.`
            : 'Navegue pelos pilares fundamentais ou selecione assuntos específicos para adicionar ao seu roteiro de estudos.'}
        </p>
      </div>

      {/* Interactive Category Route Tabs */}
      <div
        role="tablist"
        aria-label="Filtrar por categoria"
        className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-xl overflow-x-auto scroll-smooth"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!categorySlug}
          onClick={() => navigate('/categorias')}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center ${
            !categorySlug
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todas ({topics.length})
        </button>
        {categories.map((cat) => {
          const isCurrent = categorySlug === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => navigate(`/categorias/${cat.slug}`)}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums inline-flex items-center justify-center ${
                isCurrent
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.name} ({cat.topic_count})
            </button>
          );
        })}
      </div>

      {/* Search & Difficulty Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="catalog-search" className="sr-only">
            Buscar assunto por nome ou conceito
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="catalog-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar assunto (ex.: ponteiros, árvore, HTTP, JOIN)..."
            className="w-full min-h-[42px] pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500">Nível:</span>
          <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`min-h-[38px] px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center ${
                  difficulty === level
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      {loadingCatalog ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Carregando assuntos visuais...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
          <p className="text-sm text-slate-600">
            Nenhum assunto encontrado no catálogo atual para os filtros selecionados.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDifficulty('Todos');
                navigate('/categorias');
              }}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 w-full sm:w-auto flex items-center justify-center"
            >
              Limpar Filtros
            </button>
            <Link
              to={`/gerador${searchQuery.trim() ? `?assunto=${encodeURIComponent(searchQuery.trim())}` : ''}`}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Criar Explicação Visual para este Tema</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              isSelected={isTopicSelected(topic.slug)}
              isCompleted={isTopicCompleted(topic.slug)}
              onToggleStudy={toggleTopicInStudy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
