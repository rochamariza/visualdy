import { BookmarkCheck, BookmarkPlus } from 'lucide-react';
import { useStudy, type AddStudyInput } from '../../context/StudyContext';
import { slugifyTopic } from '../../schemas/tutorSchema';

interface StudyToggleButtonProps {
  studyInput: AddStudyInput;
  variant?: 'default' | 'compact';
  className?: string;
}

export function StudyToggleButton({
  studyInput,
  variant = 'default',
  className = '',
}: StudyToggleButtonProps) {
  const { addStudy, removeStudy, isStudied } = useStudy();
  const stableId = slugifyTopic(studyInput.id || studyInput.title);
  const saved = isStudied(stableId);

  const handleClick = () => {
    if (saved) {
      removeStudy(stableId);
    } else {
      addStudy({
        ...studyInput,
        id: stableId,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-studied={saved ? 'true' : 'false'}
      aria-label={
        saved
          ? `Remover ${studyInput.title} dos meus estudos`
          : `Adicionar ${studyInput.title} aos meus estudos`
      }
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
        variant === 'compact' ? 'min-h-[38px] px-3 py-1.5' : 'min-h-[42px] px-3.5 py-2'
      } ${
        saved
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
      } ${className}`}
    >
      {saved ? (
        <>
          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>✓ Adicionado</span>
        </>
      ) : (
        <>
          <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Adicionar aos meus estudos</span>
        </>
      )}
    </button>
  );
}
