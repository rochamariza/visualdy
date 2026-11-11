interface CodeSyncPanelProps {
  language: string;
  lines: string[];
  activeLine: number;
}

export function CodeSyncPanel({ language, lines, activeLine }: CodeSyncPanelProps) {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <span>Código sincronizado com o passo atual</span>
        <span>{language}</span>
      </div>
      <pre className="p-3.5 text-xs font-mono leading-relaxed overflow-x-auto">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isCurrent = lineNum === activeLine;
          return (
            <div
              key={lineNum}
              className={`px-2 py-0.5 rounded flex items-start gap-3 ${
                isCurrent
                  ? 'bg-sky-500/20 text-sky-100 font-medium'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-slate-500 select-none w-4 text-right tabular-nums shrink-0">
                {lineNum}
              </span>
              <code className="whitespace-pre">{line}</code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
