import { Link, NavLink } from 'react-router-dom';
import { useStudy } from '../../context/StudyContext';

export function TopBar() {
  const { nextStudySlug, studyStats } = useStudy();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
      isActive
        ? 'text-slate-900 border-sky-600 font-semibold'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
    }`;

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-5 sm:px-8 py-4">
        {/* Zone 1: Owl Logo + Wordmark */}
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <img
            src="/owl-logo.png"
            alt="Logo Coruja Wise Owl"
            className="w-8 h-8 rounded-lg object-contain shrink-0"
          />
          <span>Visualdy</span>
        </Link>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          <NavLink to="/" end className={navLinkClass}>
            Início
          </NavLink>
          <NavLink to="/categorias" className={navLinkClass}>
            Categorias
          </NavLink>
          <NavLink to="/estudos" className={navLinkClass}>
            Meus Estudos ({studyStats.total})
          </NavLink>
          <NavLink to="/gerador" className={navLinkClass}>
            Criar Visual
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <Link
            to={`/assunto/${nextStudySlug}`}
            className="min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center"
          >
            Continuar Estudo
          </Link>
        </div>
      </div>

      {/* Mobile accessible navigation bar (non-sticky, single line) */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden flex items-center justify-between gap-1 px-3 py-1.5 border-t border-slate-100 text-xs font-medium overflow-x-auto"
      >
        <NavLink to="/" end className={({ isActive }) => `min-h-[40px] px-2.5 py-2 flex items-center justify-center ${navLinkClass({ isActive })}`}>
          Início
        </NavLink>
        <NavLink to="/categorias" className={({ isActive }) => `min-h-[40px] px-2.5 py-2 flex items-center justify-center ${navLinkClass({ isActive })}`}>
          Categorias
        </NavLink>
        <NavLink to="/estudos" className={({ isActive }) => `min-h-[40px] px-2.5 py-2 flex items-center justify-center ${navLinkClass({ isActive })}`}>
          Meus Estudos ({studyStats.total})
        </NavLink>
        <NavLink to="/gerador" className={({ isActive }) => `min-h-[40px] px-2.5 py-2 flex items-center justify-center ${navLinkClass({ isActive })}`}>
          Criar Visual
        </NavLink>
      </nav>
    </header>
  );
}
