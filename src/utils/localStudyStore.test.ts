import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { generateDeterministicTutorResponse } from '../server/deterministicTutor';
import {
  getSavedStudies,
  removeSavedStudyById,
  saveSavedStudies,
  upsertSavedStudy,
} from './localStudyStore';

describe('Global Saved Studies Store & Fallback', () => {
  beforeEach(() => {
    saveSavedStudies([]);
  });

  it('adiciona estudo com slug estável, evita duplicata e preserva generatedJson', () => {
    const generated = generateDeterministicTutorResponse('Grafos');

    const first = upsertSavedStudy({
      title: 'Grafos',
      visualizationType: 'grafo',
      difficulty: 'Intermediário',
      description: generated.resumo,
      generatedJson: null,
    });
    assert.equal(first.added, true);
    assert.equal(first.items.length, 1);
    assert.equal(first.item.id, 'grafos');

    // Upserting same topic with full generatedJson updates without duplicating
    const second = upsertSavedStudy({
      id: 'grafos',
      title: 'Grafos',
      visualizationType: 'grafo',
      difficulty: 'Intermediário',
      description: generated.resumo,
      generatedJson: generated,
    });
    assert.equal(second.added, false);
    assert.equal(second.items.length, 1);
    assert.ok(second.items[0].generatedJson);
    assert.equal(second.items[0].generatedJson?.titulo, generated.titulo);
  });

  it('remove estudo salvo pelo id e persiste no fallback em memória (sem localStorage no Node)', () => {
    upsertSavedStudy({
      title: 'Pilhas e Filas',
      visualizationType: 'pilha',
      difficulty: 'Iniciante',
      description: 'LIFO e FIFO',
      generatedJson: null,
    });
    assert.equal(getSavedStudies().length, 1);

    const res = removeSavedStudyById('Pilhas e Filas');
    assert.equal(res.removed, true);
    assert.equal(getSavedStudies().length, 0);
  });
});
