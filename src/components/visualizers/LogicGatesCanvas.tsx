import type { LogicGatesPayload } from '../../types/visual';

interface LogicGatesCanvasProps {
  payload: LogicGatesPayload;
  onQuickParamChange?: (key: string, value: string | number) => void;
}

const BIT_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

export function LogicGatesCanvas({ payload, onQuickParamChange }: LogicGatesCanvasProps) {
  const toggleBitInput = (key: 'input_a' | 'input_b', current: number) => {
    if (!onQuickParamChange) return;
    onQuickParamChange(key, current === 1 ? '0' : '1');
  };

  const flipByteBit = (bitIdx: number) => {
    if (!onQuickParamChange) return;
    const weight = BIT_WEIGHTS[bitIdx];
    const currentBit = payload.bits[bitIdx] || 0;
    const nextDec = currentBit === 1 ? payload.decimal_value - weight : payload.decimal_value + weight;
    onQuickParamChange('decimal_value', Math.max(0, Math.min(255, nextDec)));
  };

  return (
    <div className="flex flex-col justify-between h-full min-h-[300px] gap-5">
      <div className="pb-3 border-b border-slate-200/80">
        <p className="font-mono text-xs sm:text-sm font-medium text-slate-800">
          {payload.banner}
        </p>
      </div>

      {/* Top Row: Interactive Gate Circuit + Live Truth Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-center">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Clickable Input Switches */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => toggleBitInput('input_a', payload.input_a)}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-colors whitespace-nowrap flex items-center justify-center ${
                  payload.input_a === 1
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Entrada A = {payload.input_a}
              </button>
              <button
                type="button"
                onClick={() => toggleBitInput('input_b', payload.input_b)}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-colors whitespace-nowrap flex items-center justify-center ${
                  payload.input_b === 1
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Entrada B = {payload.input_b}
              </button>
            </div>

            {/* Circuit Wire + Gate Box */}
            <svg
              viewBox="0 0 220 110"
              className="w-full max-w-[210px] h-24"
              aria-label={`Porta lógica ${payload.gate}`}
            >
              <line
                x1={4}
                y1={30}
                x2={74}
                y2={30}
                stroke={payload.input_a === 1 ? '#0284c7' : '#cbd5e1'}
                strokeWidth={3}
              />
              <line
                x1={4}
                y1={80}
                x2={74}
                y2={80}
                stroke={payload.input_b === 1 ? '#0284c7' : '#cbd5e1'}
                strokeWidth={3}
              />
              <rect
                x={74}
                y={18}
                width={74}
                height={74}
                rx={14}
                fill="#f8fafc"
                stroke="#0f172a"
                strokeWidth={2}
              />
              <text
                x={111}
                y={59}
                textAnchor="middle"
                className="font-mono text-sm font-bold fill-slate-900"
              >
                {payload.gate}
              </text>
              <line
                x1={148}
                y1={55}
                x2={214}
                y2={55}
                stroke={payload.output === 1 ? '#059669' : '#94a3b8'}
                strokeWidth={3.5}
              />
            </svg>

            {/* Output Indicator */}
            <div
              className={`px-3.5 py-3 rounded-lg border font-mono text-xs font-semibold text-center whitespace-nowrap ${
                payload.output === 1
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <div className="text-[10px] font-sans font-normal text-slate-500">Saída</div>
              <div className="text-base tabular-nums">{payload.output}</div>
              <div className="text-[10px]">{payload.output === 1 ? 'Ligado ✓' : 'Desligado'}</div>
            </div>
          </div>
        </div>

        {/* Truth Table */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Tabela-Verdade ({payload.gate})
          </div>
          <table className="w-full text-xs font-mono tabular-nums text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="py-1 px-2">A</th>
                <th className="py-1 px-2">B</th>
                <th className="py-1 px-2">Saída</th>
              </tr>
            </thead>
            <tbody>
              {payload.truth_table.map((row) => (
                <tr
                  key={`${row.a}-${row.b}`}
                  className={
                    row.active
                      ? 'bg-sky-100/80 text-sky-950 font-semibold'
                      : 'text-slate-600'
                  }
                >
                  <td className="py-1 px-2">{row.a}</td>
                  <td className="py-1 px-2">{row.b}</td>
                  <td className="py-1 px-2">
                    {row.out} {row.active ? '← atual' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Interactive 8-bit Byte Decomposer */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-semibold text-slate-700">
            Conversor de 1 Byte (clique em qualquer bit para ligar/desligar)
          </span>
          <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
            Decimal = {payload.decimal_value}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
          {payload.bits.map((bit, idx) => (
            <button
              key={BIT_WEIGHTS[idx]}
              type="button"
              onClick={() => flipByteBit(idx)}
              aria-label={`Bit peso ${BIT_WEIGHTS[idx]} valor atual ${bit}`}
              className={`rounded-lg border py-2 px-1 flex flex-col items-center transition-colors ${
                bit === 1
                  ? 'bg-sky-50 border-sky-500 text-sky-950'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono text-sm font-bold tabular-nums">{bit}</span>
              <span className="font-mono text-[10px] text-slate-500 tabular-nums mt-0.5">
                {BIT_WEIGHTS[idx]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
