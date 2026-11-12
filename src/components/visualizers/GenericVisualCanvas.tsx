import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import {
  getVisualizationTypeLabel,
  type VisualEdge,
  type VisualNode,
  type VisualPass,
  type VisualizationType,
} from '../../schemas/tutorSchema';

interface GenericVisualCanvasProps {
  tipo: VisualizationType;
  passos: VisualPass[];
  titulo?: string;
}

interface PositionedNode extends VisualNode {
  px: number;
  py: number;
  isHighlighted: boolean;
}

const VIEW_W = 640;
const VIEW_H = 310;

function getStateColors(estado: VisualNode['estado'], isHighlighted: boolean) {
  if (estado === 'destaque') {
    return {
      fill: '#ecfdf5',
      stroke: '#059669',
      text: '#064e3b',
      sub: '#047857',
      badge: '✓',
    };
  }
  if (estado === 'ativo' || isHighlighted) {
    return {
      fill: '#e0f2fe',
      stroke: '#0284c7',
      text: '#131a3e',
      sub: '#0369a1',
      badge: '●',
    };
  }
  if (estado === 'erro') {
    return {
      fill: '#fef2f2',
      stroke: '#dc2626',
      text: '#7f1d1d',
      sub: '#b91c1c',
      badge: '×',
    };
  }
  if (estado === 'visitado') {
    return {
      fill: '#f1f5f9',
      stroke: '#64748b',
      text: '#334155',
      sub: '#64748b',
      badge: '○',
    };
  }
  return {
    fill: '#ffffff',
    stroke: '#cbd5e1',
    text: '#131a3e',
    sub: '#64748b',
    badge: '',
  };
}

function normCoord(val: number | undefined, maxPixels: number, fallbackPct: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return (fallbackPct / 100) * maxPixels;
  }
  const pct = val > 100 ? Math.min(92, Math.max(8, (val / maxPixels) * 100)) : Math.min(92, Math.max(8, val));
  return (pct / 100) * maxPixels;
}

function computeAutoPositions(
  tipo: VisualizationType,
  nos: VisualNode[],
  arestas: VisualEdge[],
  destaques: string[],
): PositionedNode[] {
  const safeNodes = nos.slice(0, 7);
  const n = safeNodes.length;
  if (n === 0) return [];

  const highlightSet = new Set(destaques);

  const hasValidExplicitCoords =
    (tipo === 'arvore' || tipo === 'grafo' || tipo === 'fluxo') &&
    safeNodes.every((node) => typeof node.x === 'number' && typeof node.y === 'number');

  if (hasValidExplicitCoords) {
    return safeNodes.map((node) => ({
      ...node,
      px: normCoord(node.x, VIEW_W, 50),
      py: normCoord(node.y, VIEW_H, 50),
      isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
    }));
  }

  if (tipo === 'arvore') {
    // BFS depth-based binary/n-ary tree auto layout
    const targets = new Set(arestas.map((e) => e.destino));
    const root = safeNodes.find((nd) => !targets.has(nd.id)) || safeNodes[0];
    const childrenMap = new Map<string, string[]>();
    arestas.forEach((e) => {
      const list = childrenMap.get(e.origem) || [];
      if (!list.includes(e.destino)) list.push(e.destino);
      childrenMap.set(e.origem, list);
    });

    const levelNodes = new Map<number, string[]>();
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: root.id, depth: 0 }];
    visited.add(root.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const arr = levelNodes.get(curr.depth) || [];
      arr.push(curr.id);
      levelNodes.set(curr.depth, arr);
      const children = childrenMap.get(curr.id) || [];
      children.forEach((cid) => {
        if (!visited.has(cid) && safeNodes.some((x) => x.id === cid)) {
          visited.add(cid);
          queue.push({ id: cid, depth: curr.depth + 1 });
        }
      });
    }

    // Any disconnected nodes placed at bottom level
    safeNodes.forEach((nd) => {
      if (!visited.has(nd.id)) {
        const d = Math.max(1, levelNodes.size);
        const arr = levelNodes.get(d) || [];
        arr.push(nd.id);
        levelNodes.set(d, arr);
      }
    });

    const totalLevels = Math.max(1, levelNodes.size);
    const coordMap = new Map<string, { px: number; py: number }>();
    levelNodes.forEach((ids, depth) => {
      const y = totalLevels === 1 ? VIEW_H / 2 : 52 + (depth / Math.max(1, totalLevels - 1)) * (VIEW_H - 104);
      ids.forEach((id, idx) => {
        const x = ((idx + 1) / (ids.length + 1)) * (VIEW_W - 80) + 40;
        coordMap.set(id, { px: x, py: y });
      });
    });

    return safeNodes.map((node, i) => {
      const pos = coordMap.get(node.id) || { px: ((i + 1) / (n + 1)) * VIEW_W, py: VIEW_H / 2 };
      return {
        ...node,
        px: pos.px,
        py: pos.py,
        isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
      };
    });
  }

  if (tipo === 'grafo' || tipo === 'generico') {
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const rx = n <= 2 ? 140 : 200;
    const ry = n <= 2 ? 40 : 102;
    return safeNodes.map((node, i) => {
      if (tipo === 'generico' && i === 0 && n > 2) {
        return {
          ...node,
          px: cx,
          py: cy,
          isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
        };
      }
      const count = tipo === 'generico' && n > 2 ? n - 1 : n;
      const idx = tipo === 'generico' && n > 2 ? i - 1 : i;
      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
      return {
        ...node,
        px: cx + Math.cos(angle) * rx,
        py: cy + Math.sin(angle) * ry,
        isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
      };
    });
  }

  if (tipo === 'pilha') {
    const startY = VIEW_H - 48;
    const stepY = Math.min(42, (VIEW_H - 80) / Math.max(1, n));
    return safeNodes.map((node, i) => ({
      ...node,
      px: VIEW_W / 2,
      py: startY - i * stepY,
      isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
    }));
  }

  if (tipo === 'tabela_hash') {
    const stepY = Math.min(58, (VIEW_H - 60) / Math.max(1, n));
    const startY = (VIEW_H - (n - 1) * stepY) / 2;
    return safeNodes.map((node, i) => ({
      ...node,
      px: 145,
      py: startY + i * stepY,
      isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
    }));
  }

  if (tipo === 'matriz') {
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    return safeNodes.map((node, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const px = ((c + 1) / (cols + 1)) * (VIEW_W - 120) + 60;
      const py = ((r + 1) / (rows + 1)) * (VIEW_H - 60) + 30;
      return {
        ...node,
        px,
        py,
        isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
      };
    });
  }

  // Linear horizontal layout for array, fila, lista_ligada, fluxo, linha_do_tempo
  const padX = n <= 3 ? 120 : 62;
  const usableW = VIEW_W - padX * 2;
  return safeNodes.map((node, i) => {
    const px = n === 1 ? VIEW_W / 2 : padX + (i / (n - 1)) * usableW;
    const py = tipo === 'fluxo' && n > 4 ? (i % 2 === 0 ? 105 : 210) : VIEW_H / 2;
    return {
      ...node,
      px,
      py,
      isHighlighted: highlightSet.has(node.id) || highlightSet.has(node.rotulo),
    };
  });
}

export function GenericVisualCanvas({ tipo, passos, titulo }: GenericVisualCanvasProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const safeSteps = Array.isArray(passos) ? passos : [];
  const safeIdx = Math.max(0, Math.min(safeSteps.length - 1, stepIndex));
  const currentPass = safeSteps[safeIdx];

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [tipo, safeSteps.length, titulo]);

  useEffect(() => {
    if (!isPlaying) return;
    if (safeIdx >= safeSteps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(safeSteps.length - 1, prev + 1));
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [isPlaying, safeIdx, safeSteps.length]);

  if (!currentPass) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-600">
        Nenhum passo visual disponível para renderização. Confira a explicação em texto abaixo.
      </div>
    );
  }

  const nodes = computeAutoPositions(
    tipo,
    currentPass.nos || [],
    currentPass.arestas || [],
    currentPass.destaques || [],
  );
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges = currentPass.arestas || [];
  const valores = currentPass.valores || [];

  const renderSvgContent = () => {
    if (nodes.length === 0) {
      return (
        <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" className="text-xs fill-slate-500">
          Etapa conceitual — acompanhe a descrição e os valores do passo.
        </text>
      );
    }

    // Special containers / spines for specific visual archetypes
    const renderBackdrop = () => {
      if (tipo === 'pilha') {
        return (
          <g>
            <path
              d={`M ${VIEW_W / 2 - 110} 36 L ${VIEW_W / 2 - 110} ${VIEW_H - 22} L ${VIEW_W / 2 + 110} ${VIEW_H - 22} L ${VIEW_W / 2 + 110} 36`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <text x={VIEW_W / 2} y={24} textAnchor="middle" className="text-[11px] font-mono fill-sky-700 font-semibold">
              ↓ Entrada / Saída pelo Topo (LIFO) ↓
            </text>
          </g>
        );
      }

      if (tipo === 'fila') {
        return (
          <g>
            <line x1={38} y1={VIEW_H / 2 - 46} x2={VIEW_W - 38} y2={VIEW_H / 2 - 46} stroke="#94a3b8" strokeWidth="2" />
            <line x1={38} y1={VIEW_H / 2 + 46} x2={VIEW_W - 38} y2={VIEW_H / 2 + 46} stroke="#94a3b8" strokeWidth="2" />
            <text x={44} y={VIEW_H / 2 - 56} className="text-[11px] font-mono fill-emerald-700 font-semibold">
              ← Sai pela Frente (FIFO)
            </text>
            <text x={VIEW_W - 44} y={VIEW_H / 2 - 56} textAnchor="end" className="text-[11px] font-mono fill-sky-700 font-semibold">
              Entra no Fim ←
            </text>
          </g>
        );
      }

      if (tipo === 'linha_do_tempo') {
        return (
          <line
            x1={48}
            y1={VIEW_H / 2}
            x2={VIEW_W - 48}
            y2={VIEW_H / 2}
            stroke="#cbd5e1"
            strokeWidth="3"
          />
        );
      }

      return null;
    };

    const renderEdges = () => {
      // For lista_ligada without explicit edges, auto-link sequential nodes
      const effectiveEdges: VisualEdge[] =
        tipo === 'lista_ligada' && edges.length === 0 && nodes.length > 1
          ? nodes.slice(0, -1).map((nd, idx) => ({
              origem: nd.id,
              destino: nodes[idx + 1].id,
              rotulo: 'next',
              ativa: nd.estado === 'ativo' || nd.isHighlighted,
              direcionada: true,
            }))
          : edges;

      return effectiveEdges.map((edge, idx) => {
        const s = nodeMap.get(edge.origem);
        const t = nodeMap.get(edge.destino);
        if (!s || !t) return null;

        const dx = t.px - s.px;
        const dy = t.py - s.py;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const pad = tipo === 'grafo' ? 30 : 44;
        const sx = dist > pad * 2 ? s.px + (dx / dist) * pad : s.px;
        const sy = dist > pad * 2 ? s.py + (dy / dist) * pad : s.py;
        const ex = dist > pad * 2 ? t.px - (dx / dist) * pad : t.px;
        const ey = dist > pad * 2 ? t.py - (dy / dist) * pad : t.py;

        const hasReverse = effectiveEdges.some(
          (other) => other.origem === edge.destino && other.destino === edge.origem,
        );
        const curve = hasReverse ? 20 : 0;
        const cx = (sx + ex) / 2 + (-dy / dist) * curve;
        const cy = (sy + ey) / 2 + (dx / dist) * curve;

        return (
          <g key={`${edge.origem}-${edge.destino}-${idx}`} className="transition-all duration-300">
            <path
              d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
              fill="none"
              stroke={edge.ativa ? '#0284c7' : '#cbd5e1'}
              strokeWidth={edge.ativa ? 2.6 : 1.6}
              strokeDasharray={edge.ativa ? undefined : '4 4'}
              markerEnd={
                edge.direcionada !== false
                  ? edge.ativa
                    ? 'url(#gen-arrow-active)'
                    : 'url(#gen-arrow-muted)'
                  : undefined
              }
            />
            {edge.rotulo && (
              <g transform={`translate(${cx}, ${cy - 7})`}>
                <rect
                  x={-Math.max(18, edge.rotulo.length * 3.4)}
                  y={-9}
                  width={Math.max(36, edge.rotulo.length * 6.8)}
                  height={14}
                  rx={4}
                  fill="#ffffff"
                  fillOpacity="0.92"
                />
                <text
                  textAnchor="middle"
                  y={1}
                  className={`text-[10px] font-mono ${
                    edge.ativa ? 'fill-sky-800 font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {edge.rotulo}
                </text>
              </g>
            )}
          </g>
        );
      });
    };

    const renderNodes = () => {
      if (tipo === 'tabela_hash') {
        return nodes.map((node) => {
          const st = getStateColors(node.estado, node.isHighlighted);
          return (
            <g key={node.id} transform={`translate(0, ${node.py})`} className="transition-all duration-300">
              <rect
                x={54}
                y={-20}
                width={90}
                height={40}
                rx={8}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={node.estado === 'ativo' || node.isHighlighted ? 2.2 : 1.5}
              />
              <text x={99} y={4} textAnchor="middle" fill={st.text} className="font-mono text-xs font-bold">
                {node.rotulo}
              </text>
              <line x1={144} y1={0} x2={212} y2={0} stroke={st.stroke} strokeWidth={2} markerEnd="url(#gen-arrow-active)" />
              <rect
                x={216}
                y={-20}
                width={350}
                height={40}
                rx={8}
                fill={node.subrotulo === 'vazio' ? '#f8fafc' : st.fill}
                stroke={st.stroke}
                strokeWidth={1.4}
              />
              <text x={232} y={4} fill={st.text} className="font-mono text-xs font-medium">
                {node.subrotulo || 'vazio'}
              </text>
            </g>
          );
        });
      }

      if (tipo === 'pilha') {
        return nodes.map((node, idx) => {
          const st = getStateColors(node.estado, node.isHighlighted);
          const isTop = idx === nodes.length - 1;
          return (
            <g key={node.id} transform={`translate(${node.px}, ${node.py})`} className="transition-all duration-300">
              <rect
                x={-92}
                y={-18}
                width={184}
                height={36}
                rx={8}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={isTop || node.isHighlighted ? 2.4 : 1.5}
              />
              <text x={-12} y={4} textAnchor="middle" fill={st.text} className="font-mono text-xs font-bold">
                {node.rotulo}
              </text>
              <text x={78} y={4} textAnchor="end" fill={st.sub} className="font-mono text-[10px]">
                {isTop ? 'TOPO ↑' : node.subrotulo}
              </text>
            </g>
          );
        });
      }

      if (tipo === 'array') {
        const numericVals = nodes.map((nd) => {
          const parsed = Number(nd.rotulo);
          return Number.isFinite(parsed) ? Math.abs(parsed) : 20;
        });
        const maxVal = Math.max(1, ...numericVals);
        const boxW = Math.min(76, Math.max(46, Math.floor((VIEW_W - 100) / Math.max(1, nodes.length)) - 12));

        return nodes.map((node, idx) => {
          const st = getStateColors(node.estado, node.isHighlighted);
          const num = Number(node.rotulo);
          const barH = Number.isFinite(num) ? Math.max(18, Math.round((Math.abs(num) / maxVal) * 78)) : 36;
          return (
            <g key={node.id} transform={`translate(${node.px}, 178)`} className="transition-all duration-300">
              {/* Proportional Bar */}
              <rect
                x={-12}
                y={-34 - barH}
                width={24}
                height={barH}
                rx={4}
                fill={st.stroke}
                fillOpacity={0.85}
              />
              {/* Cell Box */}
              <rect
                x={-boxW / 2}
                y={-24}
                width={boxW}
                height={46}
                rx={8}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={node.estado === 'ativo' || node.isHighlighted ? 2.4 : 1.5}
              />
              <text x={0} y={4} textAnchor="middle" fill={st.text} className="font-mono text-sm font-bold">
                {node.rotulo.slice(0, 8)}
              </text>
              <text x={0} y={38} textAnchor="middle" className="font-mono text-[10px] fill-slate-500">
                [{idx}]
              </text>
              {node.subrotulo && (
                <text x={0} y={54} textAnchor="middle" fill={st.sub} className="font-mono text-[10px] font-semibold">
                  {node.subrotulo.slice(0, 14)}
                </text>
              )}
            </g>
          );
        });
      }

      if (tipo === 'grafo') {
        return nodes.map((node) => {
          const st = getStateColors(node.estado, node.isHighlighted);
          return (
            <g key={node.id} transform={`translate(${node.px}, ${node.py})`} className="transition-all duration-300">
              <circle
                r={26}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={node.estado === 'ativo' || node.isHighlighted ? 2.8 : 1.8}
              />
              <text x={0} y={2} textAnchor="middle" fill={st.text} className="font-mono text-xs font-bold">
                {node.rotulo.slice(0, 10)}
              </text>
              {node.subrotulo && (
                <text x={0} y={40} textAnchor="middle" fill={st.sub} className="font-mono text-[10px] font-medium">
                  {node.subrotulo.slice(0, 16)}
                </text>
              )}
            </g>
          );
        });
      }

      // Default node cards for arvore, lista_ligada, fila, matriz, fluxo, linha_do_tempo, generico
      const cardW = nodes.length >= 6 ? 88 : 106;
      const cardH = 44;
      return nodes.map((node, idx) => {
        const st = getStateColors(node.estado, node.isHighlighted);
        const isLastLinked = tipo === 'lista_ligada' && idx === nodes.length - 1;
        return (
          <g key={node.id} transform={`translate(${node.px}, ${node.py})`} className="transition-all duration-300">
            <rect
              x={-cardW / 2}
              y={-cardH / 2}
              width={cardW}
              height={cardH}
              rx={9}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth={node.estado === 'ativo' || node.estado === 'destaque' || node.isHighlighted ? 2.4 : 1.5}
            />
            {tipo === 'lista_ligada' && (
              <line x1={cardW / 2 - 22} y1={-cardH / 2} x2={cardW / 2 - 22} y2={cardH / 2} stroke={st.stroke} strokeWidth={1.2} />
            )}
            <text
              x={tipo === 'lista_ligada' ? -10 : 0}
              y={node.subrotulo ? -3 : 4}
              textAnchor="middle"
              fill={st.text}
              className="font-mono text-xs font-bold"
            >
              {node.rotulo.slice(0, 14)}
            </text>
            {node.subrotulo && (
              <text
                x={tipo === 'lista_ligada' ? -10 : 0}
                y={13}
                textAnchor="middle"
                fill={st.sub}
                className="text-[9.5px] font-medium"
              >
                {node.subrotulo.slice(0, 16)}
              </text>
            )}
            {isLastLinked && (
              <text x={cardW / 2 + 18} y={4} className="font-mono text-[10px] fill-slate-500">
                NULL
              </text>
            )}
          </g>
        );
      });
    };

    return (
      <>
        {renderBackdrop()}
        {renderEdges()}
        {renderNodes()}
      </>
    );
  };

  return (
    <div
      data-testid="generic-visual-canvas"
      data-visual-type={tipo}
      data-step={safeIdx}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Top Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
          <span className="font-semibold text-slate-900">{getVisualizationTypeLabel(tipo)}</span>
          <span aria-hidden="true">·</span>
          <span>
            Passo {safeIdx + 1} de {safeSteps.length}
          </span>
        </div>

        {valores.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {valores.slice(0, 4).map((val, i) => (
              <span
                key={`${val}-${i}`}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-mono text-[11px] text-slate-800"
              >
                {val}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SVG Stage */}
      <div className="p-4 sm:p-5 visual-grid-bg">
        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center min-h-[260px]">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-full max-h-[300px]"
            role="img"
            aria-label={`Visualização interativa (${getVisualizationTypeLabel(tipo)}) — passo ${safeIdx + 1}`}
          >
            <defs>
              <marker id="gen-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
              </marker>
              <marker id="gen-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
              </marker>
            </defs>
            {renderSvgContent()}
          </svg>
        </div>
      </div>

      {/* Step Description + Playback Controls */}
      <div className="px-4 sm:px-5 py-4 border-t border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {currentPass.descricao}
          </p>
          {currentPass.destaques && currentPass.destaques.length > 0 && (
            <div className="text-[11px] font-mono text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 shrink-0">
              Em foco: {currentPass.destaques.join(', ')}
            </div>
          )}
        </div>

        {/* Step Scrubber & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {safeSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setStepIndex(idx);
                }}
                aria-label={`Ir para o passo ${idx + 1}`}
                className="p-1"
              >
                <span
                  className={`block h-2.5 rounded-full transition-all ${
                    idx === safeIdx
                      ? 'w-7 bg-sky-600'
                      : idx < safeIdx
                        ? 'w-2.5 bg-slate-400 hover:bg-slate-600'
                        : 'w-2.5 bg-slate-200 hover:bg-slate-400'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIndex(0);
              }}
              aria-label="Reiniciar visualização"
              className="min-h-[40px] min-w-[40px] p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (safeIdx >= safeSteps.length - 1) {
                  setStepIndex(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((prev) => !prev);
                }
              }}
              className="min-h-[40px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausar' : 'Play'}</span>
            </button>

            <button
              type="button"
              disabled={safeIdx === 0}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((i) => Math.max(0, i - 1));
              }}
              className="min-h-[40px] px-3 py-2 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={safeIdx >= safeSteps.length - 1}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((i) => Math.min(safeSteps.length - 1, i + 1));
              }}
              className="min-h-[40px] px-3.5 py-2 inline-flex items-center justify-center gap-1 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
