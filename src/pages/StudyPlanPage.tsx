import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookmarkPlus,
  CheckCircle2,
  Circle,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { reorderSlugs } from '../utils/studyLogic';

export function StudyPlanPage() {
  const {
    topics,
    studyEntries,
    studyStats,
    nextStudySlug,
    toggleTopicInStudy,
    markTopicCompleted,
    saveStudyNote,
    reorderStudyItems,
  } = useStudy();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingNoteSlug, setEditingNoteSlug] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  const orderedEntries = useMemo(
    () => [...studyEntries].sort((a, b) => a.priority - b.priority),
    [studyEntries],
  );

  const visibleEntries = useMemo(() => {
    if (statusFilter === 'pending') return orderedEntries.filter((e) => !e.completed);
    if (statusFilter === 'completed') return orderedEntries.filter((e) => e.completed);
    return orderedEntries;
  }, [orderedEntries, statusFilter]);

  const unselectedSuggestions = useMemo(() => {
    const selectedSet = new Set(studyEntries.map((e) => e.topic_slug));
    return topics.filter((t) => !selectedSet.has(t.slug)).slice(0, 6);
  }, [topics, studyEntries]);

  const handleMove = async (slug: string, direction: 'up' | 'down') => {
    const allSlugs = orderedEntries.map((e) => e.topic_slug);
    const currentIndex = allSlugs.indexOf(slug);
    const nextSlugs = reorderSlugs(allSlugs, currentIndex, direction);
    await reorderStudyItems(nextSlugs);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-12">
      {/* Header + Primary Study Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="text-xs text-slate-500">Roteiro Personalizado</div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Meus Estudos Escolhidos
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Organize a ordem dos assuntos que você escolheu dominar, registre sínteses rápidas e retome de onde parou sem perder o foco.
          </p>
        </div>

        {studyEntries.length > 0 && (
          <Link
            to={`/assunto/${nextStudySlug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Iniciar Próximo Assunto</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Tabular Progress Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Assuntos Escolhidos</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {studyStats.total}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Concluídos</div>
          <div className="font-display text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {studyStats.completed} ({studyStats.percentComplete}%)
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Pendentes na Fila</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {studyStats.pending}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Tempo Estimado Restante</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {studyStats.remainingMinutes} min
          </div>
        </div>
      </div>

      {/* LocalStorage Persistence Banner */}
      <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs"></span>
          <span>
            <strong>Armazenamento Local Ativo:</strong> Seus tópicos gerados, anotações e progresso estão salvos localmente no seu navegador. Você pode fechar a janela ou recarregar a página sem perder nada.
          </span>
        </div>
      </div>

      {/* Filter Tabs + Queue List */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Fila de Estudo ({visibleEntries.length})
          </h2>

          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto">
            {(
              [
                ['all', 'Todos'],
                ['pending', 'Pendentes'],
                ['completed', 'Concluídos'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center ${
                  statusFilter === key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              {studyEntries.length === 0
                ? 'Você ainda não selecionou assuntos para estudar. Escolha abaixo ou crie uma explicação visual sob medida.'
                : 'Nenhum assunto corresponde ao filtro selecionado.'}
            </p>
            <div className="flex justify-center gap-3">
              {studyEntries.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Mostrar Todos
                </button>
              ) : (
                <Link
                  to="/categorias"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
                >
                  Explorar Categorias
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry) => {
              const globalIndex = orderedEntries.findIndex(
                (x) => x.topic_slug === entry.topic_slug,
              );
              const isEditing = editingNoteSlug === entry.topic_slug;

              return (
                <div
                  key={entry.topic_slug}
                  className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => markTopicCompleted(entry.topic_slug, !entry.completed)}
                        aria-label={
                          entry.completed
                            ? `Desmarcar conclusão de ${entry.topic.title}`
                            : `Marcar ${entry.topic.title} como concluído`
                        }
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      >
                        {entry.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                          <span>#{globalIndex + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.topic.category_name}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.topic.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.topic.read_minutes} min</span>
                          {typeof entry.last_step_viewed === 'number' && entry.last_step_viewed > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-sky-700 font-medium">
                                Passo {entry.last_step_viewed + 1} de {entry.topic.step_count}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                          <Link
                            to={`/assunto/${entry.topic_slug}`}
                            className="hover:text-sky-700 transition-colors"
                          >
                            {entry.topic.title}
                          </Link>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          {entry.topic.one_liner}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 sm:border-0 sm:pt-0 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 sm:pl-4">
                      <div className="flex items-center gap-1.5">
                        {statusFilter === 'all' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={globalIndex === 0}
                              onClick={() => handleMove(entry.topic_slug, 'up')}
                              aria-label={`Subir prioridade de ${entry.topic.title}`}
                              className="min-h-[40px] min-w-[38px] flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={globalIndex === orderedEntries.length - 1}
                              onClick={() => handleMove(entry.topic_slug, 'down')}
                              aria-label={`Descer prioridade de ${entry.topic.title}`}
                              className="min-h-[40px] min-w-[38px] flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingNoteSlug(null);
                            } else {
                              setEditingNoteSlug(entry.topic_slug);
                              setNoteDraft(entry.notes || '');
                            }
                          }}
                          className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap transition-colors"
                        >
                          {entry.notes ? 'Editar Nota' : 'Anotar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTopicInStudy(entry.topic_slug)}
                          aria-label={`Remover ${entry.topic.title} dos estudos`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        to={`/assunto/${entry.topic_slug}`}
                        className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 whitespace-nowrap transition-colors"
                      >
                        <span>
                          {entry.completed
                            ? 'Revisar'
                            : typeof entry.last_step_viewed === 'number' && entry.last_step_viewed > 0
                            ? 'Continuar'
                            : 'Estudar'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Personal quick visual note */}
                  {isEditing ? (
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <label htmlFor={`note-${entry.topic_slug}`} className="sr-only">
                        Anotação pessoal para {entry.topic.title}
                      </label>
                      <input
                        id={`note-${entry.topic_slug}`}
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Escreva uma síntese curta para lembrar depois..."
                        className="flex-1 min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await saveStudyNote(entry.topic_slug, noteDraft);
                          setEditingNoteSlug(null);
                        }}
                        className="min-h-[42px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap flex items-center justify-center"
                      >
                        Salvar Nota
                      </button>
                    </div>
                  ) : entry.notes ? (
                    <p className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <strong className="text-slate-800">Sua síntese:</strong> {entry.notes}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Suggestions to Add More Topics */}
      {unselectedSuggestions.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Adicionar Mais Assuntos ao Roteiro
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clique para incluir novos temas de computação diretamente nos seus estudos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unselectedSuggestions.map((t) => (
              <div
                key={t.slug}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-slate-500">
                    {t.category_name} · {t.difficulty}
                  </div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 mt-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {t.one_liner}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Link
                    to={`/assunto/${t.slug}`}
                    className="py-2 px-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Ver prévia
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleTopicInStudy(t.slug)}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Incluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
