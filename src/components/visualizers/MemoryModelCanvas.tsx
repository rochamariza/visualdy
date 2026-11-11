import type { MemoryModelPayload } from '../../types/visual';

interface MemoryModelCanvasProps {
  payload: MemoryModelPayload;
}

function getSlotClasses(state: string): { card: string; indicator: string } {
  switch (state) {
    case 'active':
      return {
        card: 'bg-sky-50 border-sky-400 text-slate-900',
        indicator: '● Lido / Ativo',
      };
    case 'mutated':
      return {
        card: 'bg-emerald-50 border-emerald-500 text-emerald-950',
        indicator: '✓ Atualizado',
      };
    case 'collision':
      return {
        card: 'bg-amber-50 border-amber-500 text-amber-950',
        indicator: '▲ Colisão / Órfão',
      };
    default:
      return {
        card: 'bg-white border-slate-200 text-slate-800',
        indicator: 'Estável',
      };
  }
}

export function MemoryModelCanvas({ payload }: MemoryModelCanvasProps) {
  // Compute SVG arrow links between left_slots (with ref_target) and right_slots
  const rightIndexMap = new Map<string, number>();
  payload.right_slots.forEach((slot, idx) => {
    rightIndexMap.set(slot.id, idx);
  });

  const connections = payload.left_slots
    .map((slot, leftIdx) => {
      if (!slot.ref_target || !rightIndexMap.has(slot.ref_target)) return null;
      return {
        id: `${slot.id}-${slot.ref_target}`,
        leftIdx,
        rightIdx: rightIndexMap.get(slot.ref_target)!,
        state: slot.state,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const rowHeight = 76;
  const maxRows = Math.max(payload.left_slots.length, payload.right_slots.length, 1);
  const svgHeight = maxRows * rowHeight + 16;

  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-5">
      <div className="pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {payload.banner}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_72px_1fr] items-start gap-3 my-auto">
        {/* Left Memory Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-600 pb-1 border-b border-slate-200">
            {payload.left_title}
          </h4>
          {payload.left_slots.map((slot) => {
            const st = getSlotClasses(slot.state);
            return (
              <div
                key={slot.id}
                className={`rounded-lg border p-3 transition-opacity duration-150 ${st.card}`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{slot.address}</span>
                  <span>{st.indicator}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{slot.label}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {slot.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Reference Arrows (Desktop SVG) */}
        <div className="hidden md:flex items-center justify-center pt-7" aria-hidden="true">
          {connections.length > 0 ? (
            <svg width="72" height={svgHeight} className="overflow-visible">
              <defs>
                <marker
                  id="mem-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
                </marker>
              </defs>
              {connections.map((conn) => {
                const y1 = conn.leftIdx * rowHeight + 34;
                const y2 = conn.rightIdx * rowHeight + 34;
                return (
                  <path
                    key={conn.id}
                    d={`M 2 ${y1} C 36 ${y1}, 36 ${y2}, 68 ${y2}`}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    markerEnd="url(#mem-arrow)"
                  />
                );
              })}
            </svg>
          ) : (
            <div className="h-24 w-px bg-slate-200" />
          )}
        </div>

        {/* Right Memory Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-600 pb-1 border-b border-slate-200">
            {payload.right_title}
          </h4>
          {payload.right_slots.map((slot) => {
            const st = getSlotClasses(slot.state);
            return (
              <div
                key={slot.id}
                className={`rounded-lg border p-3 transition-opacity duration-150 ${st.card}`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{slot.address}</span>
                  <span>{st.indicator}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{slot.label}</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {slot.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
        Endereços hexadecimais simulam posições contíguas na RAM; setas indicam referências diretas.
      </div>
    </div>
  );
}
