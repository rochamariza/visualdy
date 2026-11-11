import type { SystemFlowPayload } from '../../types/visual';

interface SystemFlowCanvasProps {
  payload: SystemFlowPayload;
}

export function SystemFlowCanvas({ payload }: SystemFlowCanvasProps) {
  const nodeMap = new Map(payload.nodes.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-4">
      <div className="pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {payload.banner}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center my-auto">
        <svg
          viewBox="0 0 640 310"
          className="w-full h-full max-h-[290px]"
          role="img"
          aria-label="Diagrama de fluxo de sistema e estados"
        >
          <defs>
            <marker
              id="flow-arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
            </marker>
            <marker
              id="flow-arrow-idle"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* Directed Edges + Packet Callouts */}
          {payload.edges.map((edge, idx) => {
            const s = nodeMap.get(edge.source);
            const t = nodeMap.get(edge.target);
            if (!s || !t) return null;

            const x1 = (s.x / 100) * 640;
            const y1 = (s.y / 100) * 310;
            const x2 = (t.x / 100) * 640;
            const y2 = (t.y / 100) * 310;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const padStart = 58;
            const padEnd = 62;
            const sx = dist > padStart + padEnd ? x1 + (dx / dist) * padStart : x1;
            const sy = dist > padStart + padEnd ? y1 + (dy / dist) * padStart : y1;
            const ex = dist > padStart + padEnd ? x2 - (dx / dist) * padEnd : x2;
            const ey = dist > padStart + padEnd ? y2 - (dy / dist) * padEnd : y2;

            // Slight curve offset when bidirectional edges exist
            const hasReverse = payload.edges.some(
              (other) => other.source === edge.target && other.target === edge.source,
            );
            const curveOffset = hasReverse ? 18 : 0;
            const nx = (-dy / dist) * curveOffset;
            const ny = (dx / dist) * curveOffset;
            const cx = (sx + ex) / 2 + nx;
            const cy = (sy + ey) / 2 + ny;

            return (
              <g key={`${edge.source}-${edge.target}-${idx}`}>
                <path
                  d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                  fill="none"
                  stroke={edge.active ? '#0284c7' : '#cbd5e1'}
                  strokeWidth={edge.active ? 2.5 : 1.5}
                  strokeDasharray={edge.active ? undefined : '4 4'}
                  markerEnd={edge.active ? 'url(#flow-arrow-active)' : 'url(#flow-arrow-idle)'}
                />
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    edge.active ? 'fill-sky-800 font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {edge.packet ? `[${edge.packet}]` : edge.label}
                </text>
              </g>
            );
          })}

          {/* Component Nodes */}
          {payload.nodes.map((node) => {
            const x = (node.x / 100) * 640;
            const y = (node.y / 100) * 310;

            let bg = '#ffffff';
            let border = '#cbd5e1';
            let statusSymbol = '○ Espera';
            let statusFill = '#64748b';

            if (node.status === 'active') {
              bg = '#f0f9ff';
              border = '#0284c7';
              statusSymbol = '● Ativo';
              statusFill = '#0369a1';
            } else if (node.status === 'done') {
              bg = '#ecfdf5';
              border = '#059669';
              statusSymbol = '✓ Concluído';
              statusFill = '#047857';
            } else if (node.status === 'warning') {
              bg = '#fffbeb';
              border = '#d97706';
              statusSymbol = '▲ Condição';
              statusFill = '#b45309';
            }

            return (
              <g key={node.id} transform={`translate(${x}, ${y})`}>
                <rect
                  x={-68}
                  y={-32}
                  width={136}
                  height={64}
                  rx={10}
                  fill={bg}
                  stroke={border}
                  strokeWidth={node.status === 'active' ? 2.2 : 1.4}
                />
                <text
                  x={0}
                  y={-13}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-slate-900"
                >
                  {node.label}
                </text>
                <text
                  x={0}
                  y={2}
                  textAnchor="middle"
                  className="text-[9.5px] fill-slate-500"
                >
                  {node.role}
                </text>
                <text
                  x={0}
                  y={19}
                  textAnchor="middle"
                  fill={statusFill}
                  className="text-[10px] font-mono font-medium"
                >
                  {node.state_text || statusSymbol}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Estados dos blocos:</span>
        <span className="text-sky-700">● Ativo no passo atual</span>
        <span aria-hidden="true">·</span>
        <span className="text-emerald-700">✓ Etapa concluída</span>
        <span aria-hidden="true">·</span>
        <span className="text-slate-500">Linha tracejada = canal em espera</span>
      </div>
    </div>
  );
}
