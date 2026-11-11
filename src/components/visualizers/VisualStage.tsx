import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type {
  ArrayPointersPayload,
  CallStackTreePayload,
  LogicGatesPayload,
  MemoryModelPayload,
  RelationalJoinPayload,
  SystemFlowPayload,
  VisualArchetype,
  VisualStep,
} from '../../types/visual';
import { clampStepIndex, getArchetypeLabel } from '../../utils/studyLogic';
import { ArrayPointersCanvas } from './ArrayPointersCanvas';
import { CallStackTreeCanvas } from './CallStackTreeCanvas';
import { LogicGatesCanvas } from './LogicGatesCanvas';
import { MemoryModelCanvas } from './MemoryModelCanvas';
import { RelationalJoinCanvas } from './RelationalJoinCanvas';
import { SystemFlowCanvas } from './SystemFlowCanvas';

interface VisualStageProps {
  archetype: VisualArchetype;
  steps: VisualStep[];
  currentStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onQuickParamChange?: (key: string, value: string | number) => void;
}

export function VisualStage({
  archetype,
  steps,
  currentStepIndex,
  onStepChange,
  focusMode = false,
  onToggleFocusMode,
  onQuickParamChange,
}: VisualStageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const safeIndex = clampStepIndex(currentStepIndex, steps.length);
  const activeStep = steps[safeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    if (safeIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      onStepChange(safeIndex + 1);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isPlaying, safeIndex, steps.length, onStepChange]);

  if (!activeStep) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
        Nenhuma etapa visual disponível para este assunto.
      </div>
    );
  }

  const renderCanvas = () => {
    switch (archetype) {
      case 'array_pointers':
        return <ArrayPointersCanvas payload={activeStep.payload as unknown as ArrayPointersPayload} />;
      case 'memory_model':
        return <MemoryModelCanvas payload={activeStep.payload as unknown as MemoryModelPayload} />;
      case 'call_stack_tree':
        return <CallStackTreeCanvas payload={activeStep.payload as unknown as CallStackTreePayload} />;
      case 'logic_gates':
        return (
          <LogicGatesCanvas
            payload={activeStep.payload as unknown as LogicGatesPayload}
            onQuickParamChange={onQuickParamChange}
          />
        );
      case 'relational_join':
        return (
          <RelationalJoinCanvas
            payload={activeStep.payload as unknown as RelationalJoinPayload}
            onQuickParamChange={onQuickParamChange}
          />
        );
      case 'system_flow':
      default:
        return <SystemFlowCanvas payload={activeStep.payload as unknown as SystemFlowPayload} />;
    }
  };

  return (
    <div
      data-testid="visual-stage"
      data-archetype={archetype}
      data-step={safeIndex}
      className="bg-white border border-slate-200 rounded-2xl flex flex-col justify-between overflow-hidden"
    >
      {/* Stage Top Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
          <span className="font-medium text-slate-900">{getArchetypeLabel(archetype)}</span>
          <span aria-hidden="true">·</span>
          <span>
            Etapa {safeIndex + 1} de {steps.length}
          </span>
        </div>

        {onToggleFocusMode && (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 sm:border-transparent hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{focusMode ? 'Sair do Foco' : 'Modo Foco'}</span>
          </button>
        )}
      </div>

      {/* Interactive Diagram Canvas */}
      <div className="p-4 sm:p-6 visual-grid-bg flex-1 flex flex-col justify-center">
        {renderCanvas()}
      </div>

      {/* Playback Controls & Direct Step Scrubber */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white space-y-3">
        {/* Scrubber row with step count indicator */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-500">
            Etapa <strong className="text-slate-900 font-semibold">{safeIndex + 1}</strong> de {steps.length}
          </div>
          <div
            className="flex items-center gap-1.5 overflow-x-auto py-1"
            role="group"
            aria-label="Selecionar etapa diretamente"
          >
            {steps.map((st, idx) => (
              <button
                key={st.step_index}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  onStepChange(idx);
                }}
                aria-label={`Ir para etapa ${idx + 1}: ${st.title}`}
                className="min-h-[28px] min-w-[20px] flex items-center justify-center p-1"
              >
                <span
                  className={`h-2.5 rounded-full transition-all block ${
                    idx === safeIndex
                      ? 'w-7 bg-sky-600'
                      : idx < safeIndex
                        ? 'w-2.5 bg-slate-400 hover:bg-slate-600'
                        : 'w-2.5 bg-slate-200 hover:bg-slate-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Primary step navigation buttons on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(safeIndex - 1);
            }}
            className="min-h-[44px] px-3 py-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            disabled={safeIndex >= steps.length - 1}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(safeIndex + 1);
            }}
            className="min-h-[44px] px-3 py-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <span>Próximo Passo</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Secondary controls row on mobile, full controls on sm+ desktop */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(0);
              }}
              aria-label="Reiniciar explicação visual"
              className="p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (safeIndex >= steps.length - 1) {
                  onStepChange(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((prev) => !prev);
                }
              }}
              className="min-h-[42px] px-3.5 py-2 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausar Reprodução' : 'Reproduzir Auto'}</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              disabled={safeIndex === 0}
              onClick={() => {
                setIsPlaying(false);
                onStepChange(safeIndex - 1);
              }}
              className="min-h-[42px] px-3 py-2 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={safeIndex >= steps.length - 1}
              onClick={() => {
                setIsPlaying(false);
                onStepChange(safeIndex + 1);
              }}
              className="min-h-[42px] px-3.5 py-2 inline-flex items-center justify-center gap-1 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
