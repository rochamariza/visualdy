import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Compass,
  Eye,
  Gauge,
  HelpCircle,
  Layers,
  Lightbulb,
} from 'lucide-react';
import {
  getVisualizationTypeLabel,
  slugifyTopic,
  type TutorResponse,
} from '../../schemas/tutorSchema';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { StudyToggleButton } from '../common/StudyToggleButton';
import { GenericVisualCanvas } from '../visualizers/GenericVisualCanvas';

interface TutorExplanationViewProps {
  data: TutorResponse;
  showFullLink?: boolean;
  onOpenFull?: () => void;
}

export function TutorExplanationView({
  data,
  showFullLink = false,
  onOpenFull,
}: TutorExplanationViewProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [visualResetKey, setVisualResetKey] = useState(0);

  const stableId = slugifyTopic(data.id || data.titulo);
  const hasSteps = Array.isArray(data.visualizacao?.passos) && data.visualizacao.passos.length > 0;

  const nivelClass =
    data.nivel === 'Avançado'
      ? 'bg-purple-50 text-purple-800 border-purple-200'
      : data.nivel === 'Intermediário'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return (
    <article
      data-testid="tutor-explanation-view"
      className="space-y-6"
    >
      {/* Header Card */}
      <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-md border font-medium ${nivelClass}`}>
                {data.nivel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                {getVisualizationTypeLabel(data.visualizacao.tipo)}
              </span>
              {data.plano?.pre_requisitos && data.plano.pre_requisitos.length > 0 && (
                <span className="text-slate-500">
                  Pré-requisitos: {data.plano.pre_requisitos.slice(0, 2).join(' · ')}
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {data.titulo}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {data.resumo}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0">
            <StudyToggleButton
              studyInput={{
                id: stableId,
                title: data.titulo,
                visualizationType: data.visualizacao.tipo,
                difficulty: data.nivel,
                description: data.resumo,
                generatedJson: data,
              }}
            />
            {showFullLink && onOpenFull && (
              <button
                type="button"
                onClick={onOpenFull}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Abrir em tela dedicada →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Generic Visualization wrapped in ErrorBoundary */}
      <section aria-label="Visualização interativa passo a passo">
        {hasSteps ? (
          <ErrorBoundary
            key={visualResetKey}
            fallbackTitle="Visualização temporariamente indisponível"
            fallbackMessage="Houve um erro ao desenhar o diagrama deste assunto, mas toda a explicação didática abaixo está preservada."
            onReset={() => setVisualResetKey((k) => k + 1)}
          >
            <GenericVisualCanvas
              tipo={data.visualizacao.tipo}
              passos={data.visualizacao.passos}
              titulo={data.titulo}
            />
          </ErrorBoundary>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3 text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Visualização não disponível neste tema</p>
              <p className="text-xs text-amber-900 mt-0.5">
                Não foi possível gerar passos visuais para este tópico, mas você pode acompanhar a explicação completa em texto abaixo.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Didactic Sections */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.secoes.map((sec, idx) => (
          <div
            key={`${sec.titulo}-${idx}`}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{sec.titulo}</span>
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{sec.texto}</p>
            </div>
            {sec.exemplo && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 whitespace-pre-wrap">
                {sec.exemplo}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Complexity + Common Mistakes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.complexidade && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>Análise de Complexidade / Desempenho</span>
            </h3>
            {typeof data.complexidade === 'string' ? (
              <p className="text-sm font-mono text-slate-800">{data.complexidade}</p>
            ) : (
              <div className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {data.complexidade.tempo && (
                  <p>
                    <strong className="text-slate-900">Tempo:</strong>{' '}
                    <span className="font-mono">{data.complexidade.tempo}</span>
                  </p>
                )}
                {data.complexidade.espaco && (
                  <p>
                    <strong className="text-slate-900">Espaço / Memória:</strong>{' '}
                    <span className="font-mono">{data.complexidade.espaco}</span>
                  </p>
                )}
                {data.complexidade.observacao && (
                  <p className="text-xs text-slate-600 pt-1">{data.complexidade.observacao}</p>
                )}
              </div>
            )}
          </div>
        )}

        {data.erros_comuns && data.erros_comuns.length > 0 && (
          <div
            className={`bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 ${
              !data.complexidade ? 'lg:col-span-2' : ''
            }`}
          >
            <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Erros Comuns a Evitar</span>
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc pl-4">
              {data.erros_comuns.map((err, i) => (
                <li key={i} className="leading-relaxed">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Practice Exercises */}
      {data.exercicios && data.exercicios.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Teste seu Entendimento</span>
          </h3>
          <div className="space-y-3">
            {data.exercicios.map((ex, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-2.5"
              >
                <p className="text-sm font-medium text-slate-900">
                  {idx + 1}. {ex.pergunta}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {ex.dica && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>{revealedHints[idx] ? 'Ocultar dica' : 'Ver dica'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{revealedAnswers[idx] ? 'Ocultar resposta' : 'Ver resposta'}</span>
                  </button>
                </div>

                {revealedHints[idx] && ex.dica && (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                    <strong>Dica:</strong> {ex.dica}
                  </p>
                )}

                {revealedAnswers[idx] && (
                  <p className="text-xs sm:text-sm text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                    <strong>Resposta esperada:</strong> {ex.resposta_esperada}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plan Outline & Search Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.plano?.roteiro && data.plano.roteiro.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="font-display text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Roteiro Didático Planejado (Etapa A)</span>
            </h3>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal pl-4">
              {data.plano.roteiro.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}

        {data.fontes_ou_termos_para_pesquisar && data.fontes_ou_termos_para_pesquisar.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="font-display text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-600" />
              <span>Termos Confiáveis para Aprofundar</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              {data.fontes_ou_termos_para_pesquisar.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
