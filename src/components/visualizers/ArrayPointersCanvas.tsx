import type { ArrayPointersPayload } from '../../types/visual';

interface ArrayPointersCanvasProps {
  payload: ArrayPointersPayload;
}

const STATE_STYLES: Record<
  string,
  { box: string; bar: string; stateLabel: string }
> = {
  default: {
    box: 'bg-white border-slate-300 text-slate-800',
    bar: 'bg-slate-300',
    stateLabel: 'Neutro',
  },
  active: {
    box: 'bg-sky-50 border-sky-400 text-slate-900',
    bar: 'bg-sky-500',
    stateLabel: 'Ativo',
  },
  comparing: {
    box: 'bg-amber-50 border-amber-500 text-amber-950 font-semibold ring-2 ring-amber-200',
    bar: 'bg-amber-500',
    stateLabel: '▲ Comparando',
  },
  found: {
    box: 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold ring-2 ring-emerald-200',
    bar: 'bg-emerald-600',
    stateLabel: '✓ Encontrado',
  },
  sorted: {
    box: 'bg-emerald-50/70 border-emerald-500 text-emerald-900 font-medium',
    bar: 'bg-emerald-500',
    stateLabel: '✓ Ordenado',
  },
  eliminated: {
    box: 'bg-slate-100 border-slate-200 text-slate-400 opacity-55',
    bar: 'bg-slate-200',
    stateLabel: '× Descartado',
  },
};

export function ArrayPointersCanvas({ payload }: ArrayPointersCanvasProps) {
  const numericValues = payload.cells.map((c) => {
    const n = Number(c.value);
    return Number.isFinite(n) ? Math.abs(n) : 10;
  });
  const maxVal = Math.max(1, ...numericValues);

  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-6">
      {/* Top operation readout + live metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {payload.banner}
        </p>
        {payload.metrics && payload.metrics.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
            {payload.metrics.map((m, idx) => (
              <span key={m.label} className="flex items-center gap-1.5">
                {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <span>{m.label}:</span>
                <strong className="font-mono text-slate-900">{m.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Central proportional bars + indexed cells */}
      <div className="flex items-end justify-center gap-2 sm:gap-3.5 py-4 px-2 overflow-x-auto">
        {payload.cells.map((cell) => {
          const style = STATE_STYLES[cell.state] || STATE_STYLES.default;
          const numVal = Number(cell.value);
          const heightPx = Number.isFinite(numVal)
            ? Math.max(18, Math.round((Math.abs(numVal) / maxVal) * 96))
            : 40;
          const cellPointers = payload.pointers.filter((p) => p.index === cell.index);

          return (
            <div
              key={cell.index}
              className="flex flex-col items-center min-w-[54px] sm:min-w-[68px] transition-transform duration-150"
            >
              {/* Proportional magnitude bar */}
              <div className="h-28 flex items-end justify-center w-full mb-2">
                <div
                  style={{ height: `${heightPx}px` }}
                  className={`w-6 sm:w-8 rounded-t transition-opacity duration-150 ${style.bar}`}
                  aria-hidden="true"
                />
              </div>

              {/* Cell value box */}
              <div
                className={`w-full h-12 sm:h-14 rounded-lg border flex flex-col items-center justify-center font-mono text-sm sm:text-base tabular-nums transition-opacity duration-150 ${style.box}`}
              >
                <span>{cell.value}</span>
              </div>

              {/* Array index */}
              <span className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                [{cell.index}]
              </span>

              {/* State label (dual-coded accessibility) */}
              <span className="mt-0.5 text-[10px] text-slate-500 whitespace-nowrap">
                {style.stateLabel}
              </span>

              {/* Active Pointers pointing upward to this index */}
              <div className="min-h-[42px] mt-1.5 flex flex-col items-center gap-1">
                {cellPointers.map((ptr) => {
                  const toneText =
                    ptr.tone === 'emerald'
                      ? 'text-emerald-700 font-semibold'
                      : ptr.tone === 'amber'
                        ? 'text-amber-700 font-semibold'
                        : 'text-sky-700 font-semibold';
                  return (
                    <div
                      key={ptr.label}
                      className={`flex flex-col items-center leading-none font-mono text-xs ${toneText}`}
                    >
                      <span aria-hidden="true" className="text-sm">↑</span>
                      <span className="mt-0.5 whitespace-nowrap">{ptr.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiet legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Legenda de estados:</span>
        <span className="text-sky-700">Ativo no intervalo</span>
        <span aria-hidden="true">·</span>
        <span className="text-amber-700">▲ Em comparação</span>
        <span aria-hidden="true">·</span>
        <span className="text-emerald-700">✓ Confirmado / Ordenado</span>
        <span aria-hidden="true">·</span>
        <span className="text-slate-400">× Descartado</span>
      </div>
    </div>
  );
}
