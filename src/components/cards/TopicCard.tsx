import { BookmarkCheck, BookmarkPlus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicSummary, VisualArchetype } from '../../types/visual';
import { getArchetypeLabel } from '../../utils/studyLogic';

interface TopicCardProps {
  topic: TopicSummary;
  isSelected: boolean;
  isCompleted?: boolean;
  onToggleStudy: (slug: string) => void;
}

function ArchetypeMiniDiagram({ archetype }: { archetype: VisualArchetype }) {
  switch (archetype) {
    case 'array_pointers':
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <rect x="6" y="8" width="18" height="16" rx="3" fill="#f1f5f9" stroke="#cbd5e1" />
          <rect x="28" y="8" width="18" height="16" rx="3" fill="#e0f2fe" stroke="#0284c7" />
          <rect x="50" y="8" width="18" height="16" rx="3" fill="#ecfdf5" stroke="#059669" />
          <rect x="72" y="8" width="18" height="16" rx="3" fill="#f1f5f9" stroke="#cbd5e1" />
          <path d="M59 33 L59 26" stroke="#059669" strokeWidth="2" />
        </svg>
      );
    case 'memory_model':
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <rect x="8" y="6" width="34" height="10" rx="2" fill="#e0f2fe" stroke="#0284c7" />
          <rect x="8" y="20" width="34" height="10" rx="2" fill="#f8fafc" stroke="#cbd5e1" />
          <path d="M44 11 C 58 11, 58 18, 72 18" fill="none" stroke="#0284c7" strokeWidth="1.8" />
          <rect x="74" y="10" width="38" height="16" rx="3" fill="#ecfdf5" stroke="#059669" />
        </svg>
      );
    case 'call_stack_tree':
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <circle cx="48" cy="9" r="5" fill="#e0f2fe" stroke="#0284c7" />
          <line x1="45" y1="13" x2="28" y2="25" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="51" y1="13" x2="68" y2="25" stroke="#0284c7" strokeWidth="1.8" />
          <circle cx="26" cy="27" r="5" fill="#f8fafc" stroke="#cbd5e1" />
          <circle cx="70" cy="27" r="5" fill="#ecfdf5" stroke="#059669" />
        </svg>
      );
    case 'logic_gates':
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <line x1="10" y1="12" x2="40" y2="12" stroke="#0284c7" strokeWidth="2" />
          <line x1="10" y1="24" x2="40" y2="24" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="40" y="7" width="34" height="22" rx="6" fill="#f8fafc" stroke="#334155" strokeWidth="1.6" />
          <line x1="74" y1="18" x2="106" y2="18" stroke="#059669" strokeWidth="2.2" />
        </svg>
      );
    case 'relational_join':
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <circle cx="46" cy="18" r="12" fill="#e0f2fe" fillOpacity="0.8" stroke="#0284c7" />
          <circle cx="66" cy="18" r="12" fill="#ecfdf5" fillOpacity="0.75" stroke="#059669" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 36" className="w-28 h-8" aria-hidden="true">
          <rect x="8" y="11" width="24" height="14" rx="3" fill="#e0f2fe" stroke="#0284c7" />
          <line x1="32" y1="18" x2="48" y2="18" stroke="#0284c7" strokeWidth="1.8" />
          <rect x="48" y="11" width="24" height="14" rx="3" fill="#f8fafc" stroke="#64748b" />
          <line x1="72" y1="18" x2="88" y2="18" stroke="#059669" strokeWidth="1.8" />
          <rect x="88" y="11" width="24" height="14" rx="3" fill="#ecfdf5" stroke="#059669" />
        </svg>
      );
  }
}

export function TopicCard({
  topic,
  isSelected,
  isCompleted = false,
  onToggleStudy,
}: TopicCardProps) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors">
      <div>
        {/* Unboxed quiet metadata line (Zero-Pill Discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
            <span>{topic.category_name}</span>
            <span aria-hidden="true">·</span>
            <span>{topic.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>{topic.step_count} etapas</span>
            {isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">✓ Concluído</span>
              </>
            )}
          </div>
          <ArchetypeMiniDiagram archetype={topic.archetype} />
        </div>

        <h3 className="font-display text-base font-semibold text-slate-900 leading-snug">
          <Link to={`/assunto/${topic.slug}`} className="hover:text-sky-700 transition-colors">
            {topic.title}
          </Link>
        </h3>

        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          {topic.one_liner}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-mono">
          {getArchetypeLabel(topic.archetype)} · {topic.complexity_tag}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onToggleStudy(topic.slug)}
            aria-label={
              isSelected
                ? `Remover ${topic.title} dos Meus Estudos`
                : `Adicionar ${topic.title} aos Meus Estudos`
            }
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
              isSelected
                ? 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSelected ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>Nos Estudos</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Estudar</span>
              </>
            )}
          </button>

          <Link
            to={`/assunto/${topic.slug}`}
            aria-label={`Abrir explicação visual de ${topic.title}`}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <span>Ver Visual</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}
