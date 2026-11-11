import type { RelationalJoinPayload } from '../../types/visual';

interface RelationalJoinCanvasProps {
  payload: RelationalJoinPayload;
  onQuickParamChange?: (key: string, value: string | number) => void;
}

const JOIN_MODES = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'] as const;

export function RelationalJoinCanvas({ payload, onQuickParamChange }: RelationalJoinCanvasProps) {
  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {payload.banner}
        </p>
        {onQuickParamChange && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {JOIN_MODES.map((jm) => (
              <button
                key={jm}
                type="button"
                onClick={() => onQuickParamChange('join_type', jm)}
                className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  payload.join_type === jm
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {jm.replace(' JOIN', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source Tables + SVG Key Links */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_64px_1fr] gap-2 items-start">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-700 pb-2 mb-2 border-b border-slate-100">
            {payload.left_table_name}
          </div>
          <div className="space-y-1.5">
            {payload.left_rows.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs ${
                  row.matched
                    ? 'bg-sky-50 border-sky-400 text-slate-900 font-medium'
                    : row.included
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>{row.label}</span>
                <span className="font-mono text-[11px]">{row.key}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center pt-9" aria-hidden="true">
          <svg width="64" height="118" className="overflow-visible">
            {payload.links.map((lnk, idx) => {
              const y1 = lnk.left_index * 38 + 16;
              const y2 = lnk.right_index * 38 + 16;
              return (
                <path
                  key={idx}
                  d={`M 0 ${y1} C 28 ${y1}, 36 ${y2}, 64 ${y2}`}
                  fill="none"
                  stroke={lnk.active ? '#0284c7' : '#cbd5e1'}
                  strokeWidth={2}
                />
              );
            })}
          </svg>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-700 pb-2 mb-2 border-b border-slate-100">
            {payload.right_table_name}
          </div>
          <div className="space-y-1.5">
            {payload.right_rows.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs ${
                  row.matched
                    ? 'bg-sky-50 border-sky-400 text-slate-900 font-medium'
                    : row.included
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span className="font-mono text-[11px]">{row.key}</span>
                <span>{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resulting Joined Table */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">
            Tabela Resultante ({payload.join_type})
          </span>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {payload.result_rows.length} {payload.result_rows.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
        {payload.result_rows.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Avance para o próximo passo para cruzar as chaves e montar o resultado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="py-1.5 px-2">Usuário</th>
                  <th className="py-1.5 px-2 font-mono">Chave</th>
                  <th className="py-1.5 px-2">Pedido</th>
                </tr>
              </thead>
              <tbody>
                {payload.result_rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-200/60 last:border-0">
                    <td className={`py-1.5 px-2 ${r.left_val.includes('NULL') ? 'font-mono text-amber-700' : 'text-slate-900 font-medium'}`}>
                      {r.left_val}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-slate-600">{r.key_val}</td>
                    <td className={`py-1.5 px-2 ${r.right_val.includes('NULL') ? 'font-mono text-amber-700' : 'text-slate-800'}`}>
                      {r.right_val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
