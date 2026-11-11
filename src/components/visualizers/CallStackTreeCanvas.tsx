import type { CallStackTreePayload } from '../../types/visual';

interface CallStackTreeCanvasProps {
  payload: CallStackTreePayload;
}

export function CallStackTreeCanvas({ payload }: CallStackTreeCanvasProps) {
  const nodes = payload?.nodes || [];
  const edges = payload?.edges || [];
  const stackFrames = payload?.stack_frames || [];
  const banner = payload?.banner || '';
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const getNormX = (val: number) => ((val > 100 ? val / 5 : val) / 100) * 500;
  const getNormY = (val: number) => ((val > 100 ? val / 2.8 : val) / 100) * 280;

  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-4">
      <div className="pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {banner}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-stretch my-auto">
        {/* SVG Hierarchy / Recursion Tree */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center min-h-[240px]">
          <svg
            viewBox="0 0 500 280"
            className="w-full h-full max-h-[260px]"
            role="img"
            aria-label="Diagrama em árvore de chamadas e nós"
          >
            <defs>
              <marker
                id="tree-arrow-active"
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
                id="tree-arrow-muted"
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

            {/* Edges */}
            {edges.map((edge) => {
              const s = nodeMap.get(edge.source);
              const t = nodeMap.get(edge.target);
              if (!s || !t) return null;
              const x1 = getNormX(s.x);
              const y1 = getNormY(s.y) + 18;
              const x2 = getNormX(t.x);
              const y2 = getNormY(t.y) - 20;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={edge.active ? '#0284c7' : '#cbd5e1'}
                    strokeWidth={edge.active ? 2.4 : 1.5}
                    markerEnd={edge.active ? 'url(#tree-arrow-active)' : 'url(#tree-arrow-muted)'}
                  />
                  {edge.label && (
                    <text
                      x={midX + 8}
                      y={midY}
                      className="text-[10px] fill-slate-500 font-mono"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const cx = getNormX(node.x);
              const cy = getNormY(node.y);

              let fill = '#ffffff';
              let stroke = '#cbd5e1';
              let textFill = '#0f172a';
              if (node.state === 'active') {
                fill = '#e0f2fe';
                stroke = '#0284c7';
              } else if (node.state === 'found') {
                fill = '#ecfdf5';
                stroke = '#059669';
                textFill = '#064e3b';
              } else if (node.state === 'visited' || node.state === 'returning') {
                fill = '#f8fafc';
                stroke = '#64748b';
              }

              return (
                <g key={node.id} transform={`translate(${cx}, ${cy})`}>
                  <rect
                    x={-48}
                    y={-19}
                    width={96}
                    height={38}
                    rx={8}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={node.state === 'active' || node.state === 'found' ? 2.2 : 1.4}
                  />
                  <text
                    x={0}
                    y={-2}
                    textAnchor="middle"
                    fill={textFill}
                    className="font-mono text-xs font-semibold"
                  >
                    {node.label}
                  </text>
                  <text
                    x={0}
                    y={12}
                    textAnchor="middle"
                    className="text-[9.5px] fill-slate-500"
                  >
                    {node.sublabel || ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Call Stack / Path Trace */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                Pilha de Execução / Rastro
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {stackFrames.length} {stackFrames.length === 1 ? 'quadro' : 'quadros'}
              </span>
            </div>
            <div className="flex flex-col-reverse gap-2">
              {stackFrames.map((frame, i) => (
                <div
                  key={`${frame.label}-${i}`}
                  className={`rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-2 ${
                    frame.active
                      ? 'bg-sky-50 border-sky-400 text-slate-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-mono font-semibold">{frame.label}</span>
                  <span className="text-[11px] text-slate-500 text-right">{frame.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200/80">
            Topo da pilha aparece no alto: novas chamadas empilham acima das anteriores.
          </p>
        </div>
      </div>
    </div>
  );
}
