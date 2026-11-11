import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
        <p>
          <strong className="font-display text-slate-800 font-semibold">Visualdy</strong> — Computação e programação explicadas visualmente, sem distrações.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Início
          </Link>
          <Link to="/categorias" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Categorias
          </Link>
          <Link to="/estudos" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Meus Estudos
          </Link>
          <Link to="/gerador" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Criar Explicação Visual
          </Link>
        </div>
      </div>
    </footer>
  );
}
