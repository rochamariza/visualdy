import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TutorPlanSchema,
  TutorResponseSchema,
  VISUALIZATION_TYPES,
  slugifyTopic,
} from './tutorSchema';
import {
  buildDeterministicPlan,
  generateDeterministicTutorResponse,
} from '../server/deterministicTutor';

describe('Tutor Schema & Two-Stage Deterministic Agent', () => {
  it('slugifyTopic gera IDs estáveis e sem acentos', () => {
    assert.equal(slugifyTopic('Árvores Binárias'), 'arvores-binarias');
    assert.equal(slugifyTopic('  Como funciona o DNS? '), 'como-funciona-o-dns');
    assert.equal(slugifyTopic('Pilhas e Filas'), 'pilhas-e-filas');
  });

  const requiredTopics = [
    { input: 'Grafos', expectedType: 'grafo' },
    { input: 'Pilhas', expectedType: 'pilha' },
    { input: 'Quicksort', expectedType: 'array' },
    { input: 'Como funciona o DNS', expectedType: 'fluxo' },
    { input: 'Árvores Binárias', expectedType: 'arvore' },
    { input: 'Recursão', expectedType: 'arvore' },
  ] as const;

  for (const { input, expectedType } of requiredTopics) {
    it(`gera plano e resposta JSON válidos para "${input}" (<= 7 nós por passo)`, () => {
      const plan = buildDeterministicPlan(input);
      const planParsed = TutorPlanSchema.safeParse(plan);
      assert.equal(planParsed.success, true, `Plano inválido para ${input}`);
      assert.equal(plan.tipo_visualizacao, expectedType);

      const response = generateDeterministicTutorResponse(input, plan);
      const parsed = TutorResponseSchema.safeParse(response);
      assert.equal(parsed.success, true, `Resposta inválida para ${input}`);
      assert.ok(VISUALIZATION_TYPES.includes(response.visualizacao.tipo));
      assert.ok(response.secoes.length >= 2);
      assert.ok(response.visualizacao.passos.length >= 3);

      for (const passo of response.visualizacao.passos) {
        assert.ok(
          passo.nos.length <= 7,
          `Passo em ${input} excedeu 7 nós (${passo.nos.length})`,
        );
        assert.ok(passo.descricao.length >= 4);
      }
    });
  }
});
