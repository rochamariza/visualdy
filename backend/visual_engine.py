import re
import unicodedata
from typing import Any
from backend.models import (
    DifficultyLevel,
    ParameterControl,
    ParameterOption,
    TopicDetail,
    VisualArchetype,
    VisualStep,
)


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.lower()).strip("-")
    return cleaned or "conceito-visual"


def _parse_int_list(raw: Any, fallback: list[int], max_len: int = 8) -> list[int]:
    if isinstance(raw, list):
        nums = []
        for x in raw:
            try:
                nums.append(int(x))
            except (ValueError, TypeError):
                continue
        return nums[:max_len] if len(nums) >= 2 else fallback
    if isinstance(raw, str):
        parts = re.findall(r"-?\d+", raw)
        nums = [max(-99, min(999, int(p))) for p in parts[:max_len]]
        return nums if len(nums) >= 2 else fallback
    return fallback


def _safe_int(raw: Any, fallback: int, min_v: int, max_v: int) -> int:
    try:
        val = int(raw)
        return max(min_v, min(max_v, val))
    except (ValueError, TypeError):
        return fallback


# ============================================================================
# 1. ALGORITMOS E VETORES (array_pointers)
# ============================================================================

def simulate_binary_search(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    default_arr = [4, 9, 14, 19, 25, 31, 42]
    arr = sorted(_parse_int_list(params.get("array", "4, 9, 14, 19, 25, 31, 42"), default_arr, max_len=8))
    target = _safe_int(params.get("target", 25), 25, -99, 999)
    active_params = {"array": ", ".join(str(x) for x in arr), "target": target}

    steps: list[VisualStep] = []
    low = 0
    high = len(arr) - 1
    comparisons = 0

    # Step 0: Initial sorted state
    steps.append(
        VisualStep(
            step_index=0,
            title="Vetor Ordenado Inicial",
            explanation=f"A busca binária exige dados ordenados. Definimos os limites início = 0 e fim = {high} para procurar o valor {target}.",
            takeaway=f"Espaço inicial de busca: {len(arr)} elementos.",
            code_line=2,
            payload={
                "cells": [{"index": i, "value": v, "state": "active"} for i, v in enumerate(arr)],
                "pointers": [
                    {"label": "início", "index": low, "tone": "primary"},
                    {"label": "fim", "index": high, "tone": "primary"},
                ],
                "banner": f"Procurando alvo = {target} no intervalo [{low}..{high}]",
                "metrics": [
                    {"label": "Comparações", "value": "0"},
                    {"label": "Itens ativos", "value": str(len(arr))},
                ],
            },
        )
    )

    found_idx = -1
    step_idx = 1
    while low <= high and step_idx <= 7:
        mid = (low + high) // 2
        comparisons += 1
        mid_val = arr[mid]

        cells = []
        for i, v in enumerate(arr):
            if i < low or i > high:
                cells.append({"index": i, "value": v, "state": "eliminated"})
            elif i == mid:
                cells.append({"index": i, "value": v, "state": "comparing"})
            else:
                cells.append({"index": i, "value": v, "state": "active"})

        if mid_val == target:
            found_idx = mid
            cells[mid]["state"] = "found"
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Alvo Encontrado no Índice {mid}",
                    explanation=f"Calculamos meio = ({low} + {high}) // 2 = {mid}. O valor vetor[{mid}] é {mid_val}, exatamente igual ao alvo {target}.",
                    takeaway=f"Concluído em {comparisons} {'comparação' if comparisons == 1 else 'comparações'} (em vez de varrer tudo).",
                    code_line=5,
                    payload={
                        "cells": cells,
                        "pointers": [{"label": "meio", "index": mid, "tone": "emerald"}],
                        "banner": f"vetor[{mid}] == {target} → Encontrado!",
                        "metrics": [
                            {"label": "Comparações", "value": str(comparisons)},
                            {"label": "Índice", "value": str(mid)},
                        ],
                    },
                )
            )
            break
        elif mid_val < target:
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Meio ({mid_val}) é Menor que {target}",
                    explanation=f"No índice meio = {mid}, o valor {mid_val} é menor que {target}. Como o vetor está ordenado, todos os itens à esquerda também são menores.",
                    takeaway=f"Descartamos os índices {low} até {mid}; novo início = {mid + 1}.",
                    code_line=7,
                    payload={
                        "cells": cells,
                        "pointers": [
                            {"label": "início", "index": low, "tone": "primary"},
                            {"label": "meio", "index": mid, "tone": "amber"},
                            {"label": "fim", "index": high, "tone": "primary"},
                        ],
                        "banner": f"{mid_val} < {target} → Descarta metade esquerda",
                        "metrics": [
                            {"label": "Comparações", "value": str(comparisons)},
                            {"label": "Restantes", "value": str(max(0, high - mid))},
                        ],
                    },
                )
            )
            low = mid + 1
        else:
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Meio ({mid_val}) é Maior que {target}",
                    explanation=f"No índice meio = {mid}, o valor {mid_val} é maior que {target}. Logo, todos os itens à direita também são maiores.",
                    takeaway=f"Descartamos os índices {mid} até {high}; novo fim = {mid - 1}.",
                    code_line=9,
                    payload={
                        "cells": cells,
                        "pointers": [
                            {"label": "início", "index": low, "tone": "primary"},
                            {"label": "meio", "index": mid, "tone": "amber"},
                            {"label": "fim", "index": high, "tone": "primary"},
                        ],
                        "banner": f"{mid_val} > {target} → Descarta metade direita",
                        "metrics": [
                            {"label": "Comparações", "value": str(comparisons)},
                            {"label": "Restantes", "value": str(max(0, mid - low))},
                        ],
                    },
                )
            )
            high = mid - 1
        step_idx += 1

    if found_idx == -1:
        steps.append(
            VisualStep(
                step_index=len(steps),
                title="Elemento Ausente no Vetor",
                explanation=f"Os ponteiros se cruzaram (início = {low} > fim = {high}). Não resta nenhum subintervalo válido para procurar {target}.",
                takeaway=f"Ausência comprovada após apenas {comparisons} comparações.",
                code_line=10,
                payload={
                    "cells": [{"index": i, "value": v, "state": "eliminated"} for i, v in enumerate(arr)],
                    "pointers": [],
                    "banner": f"Alvo {target} não existe no vetor → retorna -1",
                    "metrics": [
                        {"label": "Comparações", "value": str(comparisons)},
                        {"label": "Resultado", "value": "-1"},
                    ],
                },
            )
        )

    return active_params, steps


def simulate_sorting(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    default_arr = [28, 12, 35, 9, 19]
    arr = _parse_int_list(params.get("array", "28, 12, 35, 9, 19"), default_arr, max_len=6)
    work = list(arr)
    active_params = {"array": ", ".join(str(x) for x in arr)}
    n = len(work)
    steps: list[VisualStep] = []
    swaps = 0

    steps.append(
        VisualStep(
            step_index=0,
            title="Vetor Desordenado",
            explanation="Comparamos pares vizinhos da esquerda para a direita. Sempre que o item da esquerda for maior, trocamos os dois de lugar.",
            takeaway="A cada passagem completa, o maior valor 'flutua' até sua posição final à direita.",
            code_line=1,
            payload={
                "cells": [{"index": k, "value": v, "state": "active"} for k, v in enumerate(work)],
                "pointers": [{"label": "j", "index": 0, "tone": "primary"}],
                "banner": "Estado inicial antes das trocas",
                "metrics": [{"label": "Trocas", "value": "0"}, {"label": "Itens", "value": str(n)}],
            },
        )
    )

    step_idx = 1
    for i in range(n - 1):
        swapped_in_pass = False
        for j in range(n - 1 - i):
            if work[j] > work[j + 1]:
                a, b = work[j], work[j + 1]
                work[j], work[j + 1] = b, a
                swaps += 1
                swapped_in_pass = True
                if len(steps) < 7:
                    cells = []
                    for k, v in enumerate(work):
                        if k >= n - i:
                            cells.append({"index": k, "value": v, "state": "sorted"})
                        elif k in (j, j + 1):
                            cells.append({"index": k, "value": v, "state": "comparing"})
                        else:
                            cells.append({"index": k, "value": v, "state": "active"})
                    steps.append(
                        VisualStep(
                            step_index=step_idx,
                            title=f"Troca: {a} e {b}",
                            explanation=f"Como {a} > {b}, invertemos as posições {j} e {j + 1} para empurrar o valor maior para a direita.",
                            takeaway=f"Troca #{swaps} realizada; ordem parcial avança.",
                            code_line=4,
                            payload={
                                "cells": cells,
                                "pointers": [
                                    {"label": "j", "index": j, "tone": "amber"},
                                    {"label": "j+1", "index": j + 1, "tone": "amber"},
                                ],
                                "banner": f"{a} > {b} → Trocados nos índices {j} e {j + 1}",
                                "metrics": [
                                    {"label": "Trocas", "value": str(swaps)},
                                    {"label": "Passagem", "value": f"{i + 1}/{n - 1}"},
                                ],
                            },
                        )
                    )
                    step_idx += 1
        if not swapped_in_pass:
            break

    steps.append(
        VisualStep(
            step_index=len(steps),
            title="Vetor Totalmente Ordenado",
            explanation="Nenhuma inversão restante existe entre vizinhos. Todos os elementos estão em ordem crescente garantida.",
            takeaway=f"Ordenação concluída com {swaps} trocas no total.",
            code_line=6,
            payload={
                "cells": [{"index": k, "value": v, "state": "sorted"} for k, v in enumerate(work)],
                "pointers": [],
                "banner": "Vetor ordenado em ordem crescente ✓",
                "metrics": [{"label": "Trocas totais", "value": str(swaps)}, {"label": "Status", "value": "Ordenado"}],
            },
        )
    )
    return active_params, steps


def simulate_two_pointers(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    default_arr = [2, 5, 8, 11, 14, 19]
    arr = sorted(_parse_int_list(params.get("array", "2, 5, 8, 11, 14, 19"), default_arr, max_len=7))
    target = _safe_int(params.get("target", 19), 19, -99, 999)
    active_params = {"array": ", ".join(str(x) for x in arr), "target": target}

    left, right = 0, len(arr) - 1
    steps: list[VisualStep] = []
    step_idx = 0
    matched = False

    while left < right and step_idx < 7:
        current_sum = arr[left] + arr[right]
        cells = []
        for i, v in enumerate(arr):
            if i in (left, right):
                cells.append({"index": i, "value": v, "state": "found" if current_sum == target else "comparing"})
            elif i < left or i > right:
                cells.append({"index": i, "value": v, "state": "eliminated"})
            else:
                cells.append({"index": i, "value": v, "state": "active"})

        if current_sum == target:
            matched = True
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Par Encontrado: {arr[left]} + {arr[right]} = {target}",
                    explanation=f"Os ponteiros esq={left} ({arr[left]}) e dir={right} ({arr[right]}) somam exatamente {target}.",
                    takeaway="Solução O(n) sem precisar testar todos os pares O(n²).",
                    code_line=4,
                    payload={
                        "cells": cells,
                        "pointers": [
                            {"label": "esq", "index": left, "tone": "emerald"},
                            {"label": "dir", "index": right, "tone": "emerald"},
                        ],
                        "banner": f"{arr[left]} + {arr[right]} == {target} → Par ideal!",
                        "metrics": [{"label": "Soma atual", "value": str(current_sum)}, {"label": "Custo", "value": "O(n)"}],
                    },
                )
            )
            break
        elif current_sum < target:
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Soma {current_sum} é Menor que {target}",
                    explanation=f"{arr[left]} + {arr[right]} = {current_sum}. Para aumentar a soma num vetor ordenado, avançamos o ponteiro da esquerda.",
                    takeaway=f"esq avança de {left} para {left + 1}.",
                    code_line=6,
                    payload={
                        "cells": cells,
                        "pointers": [
                            {"label": "esq", "index": left, "tone": "amber"},
                            {"label": "dir", "index": right, "tone": "primary"},
                        ],
                        "banner": f"{current_sum} < {target} → Avança ponteiro esq (+1)",
                        "metrics": [{"label": "Soma atual", "value": str(current_sum)}, {"label": "Alvo", "value": str(target)}],
                    },
                )
            )
            left += 1
        else:
            steps.append(
                VisualStep(
                    step_index=step_idx,
                    title=f"Soma {current_sum} é Maior que {target}",
                    explanation=f"{arr[left]} + {arr[right]} = {current_sum}. Para diminuir a soma, recuamos o ponteiro da direita.",
                    takeaway=f"dir recua de {right} para {right - 1}.",
                    code_line=8,
                    payload={
                        "cells": cells,
                        "pointers": [
                            {"label": "esq", "index": left, "tone": "primary"},
                            {"label": "dir", "index": right, "tone": "amber"},
                        ],
                        "banner": f"{current_sum} > {target} → Recua ponteiro dir (-1)",
                        "metrics": [{"label": "Soma atual", "value": str(current_sum)}, {"label": "Alvo", "value": str(target)}],
                    },
                )
            )
            right -= 1
        step_idx += 1

    if not matched:
        steps.append(
            VisualStep(
                step_index=len(steps),
                title="Ponteiros se Encontraram",
                explanation="Os ponteiros esq e dir se cruzaram sem formar a soma desejada. Nenhum par soma esse alvo.",
                takeaway="Todo o vetor foi verificado em uma única varredura linear.",
                code_line=9,
                payload={
                    "cells": [{"index": i, "value": v, "state": "eliminated"} for i, v in enumerate(arr)],
                    "pointers": [],
                    "banner": f"Nenhum par soma {target}",
                    "metrics": [{"label": "Resultado", "value": "Sem par"}, {"label": "Passos", "value": str(step_idx)}],
                },
            )
        )

    return active_params, steps


# ============================================================================
# 2. MEMÓRIA, PILHA, FILA E HASH (memory_model)
# ============================================================================

def simulate_variables_memory(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    initial_score = _safe_int(params.get("initial_score", 10), 10, 0, 999)
    bonus = _safe_int(params.get("bonus", 25), 25, 1, 500)
    active_params = {"initial_score": initial_score, "bonus": bonus}
    total = initial_score + bonus

    steps = [
        VisualStep(
            step_index=0,
            title="Alocando Espaço na Memória RAM",
            explanation=f"Criar 'pontos = {initial_score}' reserva um endereço físico (0x100) na Stack e grava ali o valor {initial_score}.",
            takeaway="Variável não é o valor: é uma etiqueta humana para um endereço de memória.",
            code_line=1,
            payload={
                "layout_mode": "stack_heap",
                "left_title": "Stack (Variáveis Locais)",
                "right_title": "Tipos Primitivos na RAM",
                "left_slots": [
                    {"id": "s1", "address": "0x100", "label": "pontos (int)", "value": str(initial_score), "state": "active", "ref_target": "r1"}
                ],
                "right_slots": [
                    {"id": "r1", "address": "4 bytes", "label": "Binário armazenado", "value": format(initial_score, "08b"), "state": "active"}
                ],
                "banner": f"Endereço 0x100 ← {initial_score}",
            },
        ),
        VisualStep(
            step_index=1,
            title="Declarando Segunda Variável",
            explanation=f"A instrução 'bonus = {bonus}' ocupa o próximo endereço livre contíguo (0x104) sem tocar em 'pontos'.",
            takeaway="Cada variável primitiva possui sua própria gaveta isolada na memória.",
            code_line=2,
            payload={
                "layout_mode": "stack_heap",
                "left_title": "Stack (Variáveis Locais)",
                "right_title": "Tipos Primitivos na RAM",
                "left_slots": [
                    {"id": "s1", "address": "0x100", "label": "pontos (int)", "value": str(initial_score), "state": "default", "ref_target": None},
                    {"id": "s2", "address": "0x104", "label": "bonus (int)", "value": str(bonus), "state": "active", "ref_target": "r2"},
                ],
                "right_slots": [
                    {"id": "r1", "address": "0x100", "label": "pontos", "value": format(initial_score, "08b"), "state": "default"},
                    {"id": "r2", "address": "0x104", "label": "bonus", "value": format(bonus, "08b"), "state": "active"},
                ],
                "banner": f"Endereço 0x104 ← {bonus}",
            },
        ),
        VisualStep(
            step_index=2,
            title="Leitura, Soma e Reatribuição",
            explanation=f"A CPU lê 0x100 ({initial_score}) e 0x104 ({bonus}), calcula {total} e sobrescreve o conteúdo do endereço 0x100.",
            takeaway=f"O endereço 0x100 permanece o mesmo; apenas o valor interno mudou para {total}.",
            code_line=3,
            payload={
                "layout_mode": "stack_heap",
                "left_title": "Stack (Variáveis Locais)",
                "right_title": "Tipos Primitivos na RAM",
                "left_slots": [
                    {"id": "s1", "address": "0x100", "label": "pontos (int)", "value": str(total), "state": "mutated", "ref_target": "r1"},
                    {"id": "s2", "address": "0x104", "label": "bonus (int)", "value": str(bonus), "state": "default", "ref_target": None},
                ],
                "right_slots": [
                    {"id": "r1", "address": "0x100", "label": "Novo binário", "value": format(min(255, total), "08b"), "state": "mutated"},
                    {"id": "r2", "address": "0x104", "label": "bonus intacto", "value": format(min(255, bonus), "08b"), "state": "default"},
                ],
                "banner": f"pontos = {initial_score} + {bonus} → 0x100 agora guarda {total}",
            },
        ),
    ]
    return active_params, steps


def simulate_pointers_references(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    mode = str(params.get("mode", "reference"))
    if mode not in ("reference", "copy"):
        mode = "reference"
    active_params = {"mode": mode}

    if mode == "reference":
        steps = [
            VisualStep(
                step_index=0,
                title="Objeto Alocado na Heap",
                explanation="Listas e objetos dinâmicos ficam na Heap (0x9A0). A variável 'lista_a' na Stack guarda apenas o endereço 0x9A0.",
                takeaway="A variável guarda uma seta (referência), não a lista inteira.",
                code_line=1,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a", "value": "ref → 0x9A0", "state": "active", "ref_target": "h1"}
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Objeto Lista", "value": "[10, 20]", "state": "active"}
                    ],
                    "banner": "lista_a aponta para o objeto 0x9A0 na Heap",
                },
            ),
            VisualStep(
                step_index=1,
                title="Cópia de Referência (Apelido)",
                explanation="Ao fazer 'lista_b = lista_a', copiamos apenas o endereço 0x9A0. Ambas as variáveis apontam para o MESMO objeto.",
                takeaway="Nenhum novo objeto foi criado na Heap.",
                code_line=2,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a", "value": "ref → 0x9A0", "state": "default", "ref_target": "h1"},
                        {"id": "b", "address": "0x208", "label": "lista_b", "value": "ref → 0x9A0", "state": "active", "ref_target": "h1"},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Objeto Compartilhado", "value": "[10, 20]", "state": "active"}
                    ],
                    "banner": "lista_a e lista_b apontam para 0x9A0",
                },
            ),
            VisualStep(
                step_index=2,
                title="Mutação Visível em Ambas",
                explanation="Quando 'lista_b.append(99)' altera o objeto em 0x9A0, ler 'lista_a' também enxerga [10, 20, 99]!",
                takeaway="Efeito colateral clássico: duas referências para o mesmo endereço.",
                code_line=3,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a", "value": "ref → 0x9A0", "state": "mutated", "ref_target": "h1"},
                        {"id": "b", "address": "0x208", "label": "lista_b", "value": "ref → 0x9A0", "state": "mutated", "ref_target": "h1"},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Objeto Mutado", "value": "[10, 20, 99]", "state": "mutated"}
                    ],
                    "banner": "Mutação em 0x9A0 reflete tanto em lista_b quanto em lista_a",
                },
            ),
        ]
    else:
        steps = [
            VisualStep(
                step_index=0,
                title="Objeto Original na Heap",
                explanation="Criamos 'lista_a' apontando para o endereço 0x9A0 com os valores [10, 20].",
                takeaway="Estado base antes da clonagem.",
                code_line=1,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a", "value": "ref → 0x9A0", "state": "active", "ref_target": "h1"}
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Objeto Original", "value": "[10, 20]", "state": "active"}
                    ],
                    "banner": "lista_a → 0x9A0",
                },
            ),
            VisualStep(
                step_index=1,
                title="Clonagem Independente (.copy())",
                explanation="Usando 'lista_b = lista_a.copy()', alocamos um NOVO bloco na Heap (0x9E0) com cópia dos elementos.",
                takeaway="Agora existem dois endereços distintos na Heap: 0x9A0 e 0x9E0.",
                code_line=2,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a", "value": "ref → 0x9A0", "state": "default", "ref_target": "h1"},
                        {"id": "b", "address": "0x208", "label": "lista_b", "value": "ref → 0x9E0", "state": "active", "ref_target": "h2"},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Original", "value": "[10, 20]", "state": "default"},
                        {"id": "h2", "address": "0x9E0", "label": "Clone Independente", "value": "[10, 20]", "state": "active"},
                    ],
                    "banner": "lista_a → 0x9A0  |  lista_b → 0x9E0",
                },
            ),
            VisualStep(
                step_index=2,
                title="Mutação Isolada e Segura",
                explanation="'lista_b.append(99)' modifica apenas 0x9E0. O objeto original em 0x9A0 ('lista_a') permanece intacto com [10, 20].",
                takeaway="Cópias explícitas evitam efeitos colaterais indesejados.",
                code_line=3,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Stack (Referências)",
                    "right_title": "Heap (Objetos Dinâmicos)",
                    "left_slots": [
                        {"id": "a", "address": "0x200", "label": "lista_a (intacta)", "value": "ref → 0x9A0", "state": "default", "ref_target": "h1"},
                        {"id": "b", "address": "0x208", "label": "lista_b (alterada)", "value": "ref → 0x9E0", "state": "mutated", "ref_target": "h2"},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x9A0", "label": "Original Intacto", "value": "[10, 20]", "state": "default"},
                        {"id": "h2", "address": "0x9E0", "label": "Clone Alterado", "value": "[10, 20, 99]", "state": "mutated"},
                    ],
                    "banner": "0x9A0 segue [10, 20] enquanto 0x9E0 vira [10, 20, 99]",
                },
            ),
        ]
    return active_params, steps


def simulate_stack_queue(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    new_item = str(params.get("new_item", "Tarefa D"))[:18] or "Tarefa D"
    active_params = {"new_item": new_item}

    steps = [
        VisualStep(
            step_index=0,
            title="Três Itens Inseridos na Ordem A → B → C",
            explanation="Inserimos A, depois B, depois C tanto na Pilha (Stack) quanto na Fila (Queue).",
            takeaway="A diferença entre Pilha e Fila aparece na hora de REMOVER, não apenas ao inserir.",
            code_line=2,
            payload={
                "layout_mode": "lifo_fifo",
                "left_title": "Pilha — LIFO (Último a Entrar, Primeiro a Sair)",
                "right_title": "Fila — FIFO (Primeiro a Entrar, Primeiro a Sair)",
                "left_slots": [
                    {"id": "p3", "address": "Topo", "label": "3º inserido", "value": "Tarefa C", "state": "active", "ref_target": None},
                    {"id": "p2", "address": "Meio", "label": "2º inserido", "value": "Tarefa B", "state": "default", "ref_target": None},
                    {"id": "p1", "address": "Base", "label": "1º inserido", "value": "Tarefa A", "state": "default", "ref_target": None},
                ],
                "right_slots": [
                    {"id": "f1", "address": "Frente", "label": "1º na fila", "value": "Tarefa A", "state": "active"},
                    {"id": "f2", "address": "2º", "label": "Aguardando", "value": "Tarefa B", "state": "default"},
                    {"id": "f3", "address": "Fim", "label": "Recém-chegado", "value": "Tarefa C", "state": "default"},
                ],
                "banner": "Ordem de chegada idêntica: A, B, C",
            },
        ),
        VisualStep(
            step_index=1,
            title=f"Inserindo '{new_item}' (push / enqueue)",
            explanation=f"Na Pilha, '{new_item}' entra no Topo. Na Fila, '{new_item}' entra no Fim da fila.",
            takeaway="Ambas as inserções custam tempo constante O(1).",
            code_line=4,
            payload={
                "layout_mode": "lifo_fifo",
                "left_title": "Pilha — LIFO (push no Topo)",
                "right_title": "Fila — FIFO (enqueue no Fim)",
                "left_slots": [
                    {"id": "p4", "address": "Topo", "label": "Novo Topo", "value": new_item, "state": "mutated", "ref_target": None},
                    {"id": "p3", "address": "#3", "label": "Anterior", "value": "Tarefa C", "state": "default", "ref_target": None},
                    {"id": "p2", "address": "#2", "label": "Anterior", "value": "Tarefa B", "state": "default", "ref_target": None},
                    {"id": "p1", "address": "Base", "label": "Base", "value": "Tarefa A", "state": "default", "ref_target": None},
                ],
                "right_slots": [
                    {"id": "f1", "address": "Frente", "label": "Próximo a sair", "value": "Tarefa A", "state": "default"},
                    {"id": "f2", "address": "#2", "label": "Aguardando", "value": "Tarefa B", "state": "default"},
                    {"id": "f3", "address": "#3", "label": "Aguardando", "value": "Tarefa C", "state": "default"},
                    {"id": "f4", "address": "Fim", "label": "Entrou no fim", "value": new_item, "state": "mutated"},
                ],
                "banner": f"'{new_item}' adicionado às duas estruturas",
            },
        ),
        VisualStep(
            step_index=2,
            title="Operação de Remoção (pop vs dequeue)",
            explanation=f"A Pilha remove do Topo ('{new_item}', o mais recente). Já a Fila atende quem esperava há mais tempo ('Tarefa A').",
            takeaway=f"Pilha retorna '{new_item}' (Ctrl+Z / Histórico); Fila retorna 'Tarefa A' (Impressora / Atendimento).",
            code_line=6,
            payload={
                "layout_mode": "lifo_fifo",
                "left_title": f"Pilha: pop() removeu '{new_item}'",
                "right_title": "Fila: dequeue() atendeu 'Tarefa A'",
                "left_slots": [
                    {"id": "p3", "address": "Topo", "label": "Novo Topo", "value": "Tarefa C", "state": "active", "ref_target": None},
                    {"id": "p2", "address": "#2", "label": "Aguardando", "value": "Tarefa B", "state": "default", "ref_target": None},
                    {"id": "p1", "address": "Base", "label": "Base", "value": "Tarefa A", "state": "default", "ref_target": None},
                ],
                "right_slots": [
                    {"id": "f2", "address": "Frente", "label": "Nova Frente", "value": "Tarefa B", "state": "active"},
                    {"id": "f3", "address": "#2", "label": "Aguardando", "value": "Tarefa C", "state": "default"},
                    {"id": "f4", "address": "Fim", "label": "Aguardando", "value": new_item, "state": "default"},
                ],
                "banner": f"Saída LIFO: {new_item}  |  Saída FIFO: Tarefa A",
            },
        ),
    ]
    return active_params, steps


def simulate_hash_table(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    key_input = str(params.get("key", "bia"))[:16].strip() or "bia"
    active_params = {"key": key_input}
    bucket_count = 4
    ascii_sum = sum(ord(c) for c in key_input)
    bucket_idx = ascii_sum % bucket_count

    existing = {0: ["ana: 91"], 1: [], 2: ["leo: 84"], 3: ["rui: 77"]}
    collision = len(existing[bucket_idx]) > 0

    steps = [
        VisualStep(
            step_index=0,
            title="Chave de Texto Entra na Função Hash",
            explanation=f"Queremos guardar a chave '{key_input}' com acesso instantâneo. Somamos os códigos dos caracteres: soma = {ascii_sum}.",
            takeaway="A função hash converte qualquer chave textual em um número inteiro determinístico.",
            code_line=2,
            payload={
                "layout_mode": "hash_buckets",
                "left_title": "Cálculo da Função Hash",
                "right_title": "Vetor de Buckets (4 posições)",
                "left_slots": [
                    {"id": "k1", "address": "Entrada", "label": f"chave = '{key_input}'", "value": f"ASCII = {ascii_sum}", "state": "active", "ref_target": None}
                ],
                "right_slots": [
                    {"id": f"b{i}", "address": f"[{i}]", "label": f"Bucket {i}", "value": ", ".join(existing[i]) or "vazio", "state": "default"}
                    for i in range(bucket_count)
                ],
                "banner": f"hash('{key_input}') → soma ASCII = {ascii_sum}",
            },
        ),
        VisualStep(
            step_index=1,
            title=f"Operador Módulo Escolhe o Bucket [{bucket_idx}]",
            explanation=f"Aplicamos {ascii_sum} % {bucket_count} = {bucket_idx}. Isso garante que o índice caia sempre dentro do vetor [0..3].",
            takeaway="Não precisamos procurar em todos os itens: pulamos direto para o índice calculado O(1).",
            code_line=3,
            payload={
                "layout_mode": "hash_buckets",
                "left_title": "Índice Calculado",
                "right_title": "Vetor de Buckets (4 posições)",
                "left_slots": [
                    {"id": "k1", "address": "Módulo", "label": f"{ascii_sum} % 4", "value": f"Índice {bucket_idx}", "state": "active", "ref_target": f"b{bucket_idx}"}
                ],
                "right_slots": [
                    {
                        "id": f"b{i}",
                        "address": f"[{i}]",
                        "label": f"Bucket {i}",
                        "value": ", ".join(existing[i]) or "vazio",
                        "state": "active" if i == bucket_idx else "default",
                    }
                    for i in range(bucket_count)
                ],
                "banner": f"Destino direto: Bucket [{bucket_idx}]",
            },
        ),
        VisualStep(
            step_index=2,
            title="Encadeamento Resolve Colisão" if collision else "Inserção Direta sem Colisão",
            explanation=(
                f"O Bucket [{bucket_idx}] já continha {existing[bucket_idx][0]}. Adicionamos '{key_input}: 95' em uma pequena lista encadeada nesse mesmo bucket."
                if collision
                else f"O Bucket [{bucket_idx}] estava livre! Gravamos '{key_input}: 95' diretamente na posição [{bucket_idx}]."
            ),
            takeaway=(
                "Colisões são normais: o encadeamento guarda múltiplos pares no mesmo índice."
                if collision
                else "Acesso direto em O(1) sem nenhuma colisão."
            ),
            code_line=5,
            payload={
                "layout_mode": "hash_buckets",
                "left_title": "Chave Armazenada",
                "right_title": "Vetor de Buckets Atualizado",
                "left_slots": [
                    {"id": "k1", "address": "Salvo", "label": f"tabela['{key_input}']", "value": "95", "state": "mutated", "ref_target": f"b{bucket_idx}"}
                ],
                "right_slots": [
                    {
                        "id": f"b{i}",
                        "address": f"[{i}]",
                        "label": f"Bucket {i}",
                        "value": (
                            ", ".join(existing[i] + [f"{key_input}: 95"])
                            if i == bucket_idx
                            else (", ".join(existing[i]) or "vazio")
                        ),
                        "state": ("collision" if collision else "mutated") if i == bucket_idx else "default",
                    }
                    for i in range(bucket_count)
                ],
                "banner": (
                    f"Colisão tratada no Bucket [{bucket_idx}] via lista encadeada"
                    if collision
                    else f"Gravado diretamente no Bucket [{bucket_idx}]"
                ),
            },
        ),
    ]
    return active_params, steps


# ============================================================================
# 3. RECURSÃO E ÁRVORES (call_stack_tree)
# ============================================================================

def simulate_recursion(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    n = _safe_int(params.get("n", 4), 4, 2, 5)
    active_params = {"n": n}

    nodes_base = []
    edges_base = []
    for k in range(n, 0, -1):
        idx = n - k
        y_pos = 16 + idx * (68 / max(1, n - 1))
        x_pos = 32 + idx * 10
        nodes_base.append({"id": f"f{k}", "label": f"fat({k})", "sublabel": "caso base = 1" if k == 1 else f"{k} * fat({k-1})", "x": x_pos, "y": y_pos})
        if k > 1:
            edges_base.append({"source": f"f{k}", "target": f"f{k-1}", "label": "chama"})

    steps: list[VisualStep] = []
    # Phase 1: Descent to base case
    for depth in range(1, n + 1):
        current_k = n - depth + 1
        nodes = []
        for idx, nb in enumerate(nodes_base):
            k_val = n - idx
            state = "default"
            if k_val == current_k:
                state = "found" if current_k == 1 else "active"
            elif k_val > current_k:
                state = "visited"
            nodes.append({**nb, "state": state})

        edges = [
            {**eb, "active": int(eb["source"][1:]) >= current_k and int(eb["target"][1:]) >= current_k}
            for eb in edges_base
        ]
        stack_frames = [
            {
                "label": f"fat({k_val})",
                "detail": "retorna 1" if (k_val == 1 and current_k == 1) else f"aguarda fat({k_val - 1})",
                "active": k_val == current_k,
            }
            for k_val in range(n, current_k - 1, -1)
        ]

        steps.append(
            VisualStep(
                step_index=len(steps),
                title="Caso Base Atingido: fat(1) = 1" if current_k == 1 else f"Empilhando Chamada fat({current_k})",
                explanation=(
                    "Chegamos em n == 1! Sem o caso base, a função chamaria a si mesma até estourar a memória (Stack Overflow)."
                    if current_k == 1
                    else f"Para resolver fat({current_k}), pausamos esta execução na Call Stack e chamamos fat({current_k - 1})."
                ),
                takeaway=(
                    f"Pilha atingiu altura máxima de {n} frames; agora começa o retorno."
                    if current_k == 1
                    else f"Frame fat({current_k}) pausado na pilha aguardando resultado."
                ),
                code_line=2 if current_k == 1 else 4,
                payload={
                    "nodes": nodes,
                    "edges": edges,
                    "stack_frames": stack_frames,
                    "banner": "Caso base fat(1) → retorna 1" if current_k == 1 else f"Empilha fat({current_k}) → chama fat({current_k - 1})",
                },
            )
        )

    # Phase 2: Unwinding final result
    fact = 1
    for k in range(1, n + 1):
        fact *= k
    final_nodes = [
        {**nb, "sublabel": f"retornou {1 if (n - idx) == 1 else ''}".strip(), "state": "returning"}
        for idx, nb in enumerate(nodes_base)
    ]
    running = 1
    for idx in range(len(final_nodes) - 1, -1, -1):
        k_val = n - idx
        running *= k_val
        final_nodes[idx]["sublabel"] = f"= {running}"
    final_nodes[0]["state"] = "found"

    steps.append(
        VisualStep(
            step_index=len(steps),
            title=f"Desempilhando Retornos: Resultado = {fact}",
            explanation=f"Cada chamada recebe o retorno da filha, multiplica pelo seu n e sai da Call Stack até entregar fat({n}) = {fact}.",
            takeaway="Recursão tem sempre 2 fases: ida (empilha problemas menores) e volta (combina soluções).",
            code_line=4,
            payload={
                "nodes": final_nodes,
                "edges": [{**eb, "active": True, "label": "retorna"} for eb in edges_base],
                "stack_frames": [{"label": f"fat({n})", "detail": f"concluído = {fact}", "active": True}],
                "banner": f"Pilha esvaziada com sucesso → fat({n}) = {fact}",
            },
        )
    )
    return active_params, steps


def simulate_bst(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    target = _safe_int(params.get("target", 27), 27, 1, 99)
    active_params = {"target": target}

    # Fixed balanced BST so coordinates are crisp and readable
    tree = {
        20: {"id": "n20", "val": 20, "x": 50, "y": 16, "left": 10, "right": 30},
        10: {"id": "n10", "val": 10, "x": 26, "y": 46, "left": 5, "right": 15},
        30: {"id": "n30", "val": 30, "x": 74, "y": 46, "left": 27, "right": 38},
        5: {"id": "n5", "val": 5, "x": 14, "y": 78, "left": None, "right": None},
        15: {"id": "n15", "val": 15, "x": 38, "y": 78, "left": None, "right": None},
        27: {"id": "n27", "val": 27, "x": 62, "y": 78, "left": None, "right": None},
        38: {"id": "n38", "val": 38, "x": 86, "y": 78, "left": None, "right": None},
    }

    edges_all = [
        {"source": "n20", "target": "n10", "label": "< 20"},
        {"source": "n20", "target": "n30", "label": "> 20"},
        {"source": "n10", "target": "n5", "label": "< 10"},
        {"source": "n10", "target": "n15", "label": "> 10"},
        {"source": "n30", "target": "n27", "label": "< 30"},
        {"source": "n30", "target": "n38", "label": "> 30"},
    ]

    visited: list[int] = []
    curr: int | None = 20
    steps: list[VisualStep] = []

    while curr is not None:
        visited.append(curr)
        is_match = curr == target
        nodes_payload = []
        for val, info in tree.items():
            st = "default"
            if val == curr:
                st = "found" if is_match else "active"
            elif val in visited:
                st = "visited"
            nodes_payload.append(
                {
                    "id": info["id"],
                    "label": str(val),
                    "sublabel": "Raiz" if val == 20 else ("Encontrado" if (val == curr and is_match) else "Nó"),
                    "x": info["x"],
                    "y": info["y"],
                    "state": st,
                }
            )

        edges_payload = []
        for e in edges_all:
            s_val = int(e["source"][1:])
            t_val = int(e["target"][1:])
            edges_payload.append({**e, "active": s_val in visited and t_val in visited})

        trace_frames = [
            {"label": f"Nó {v}", "detail": "Igual ao alvo!" if v == target else ("Ir p/ esquerda" if target < v else "Ir p/ direita"), "active": v == curr}
            for v in visited
        ]

        if is_match:
            steps.append(
                VisualStep(
                    step_index=len(steps),
                    title=f"Valor {target} Localizado na Árvore!",
                    explanation=f"Chegamos ao nó {curr}, que coincide com {target}. Percorremos apenas {len(visited)} nós de 7 totais.",
                    takeaway="Em uma BST equilibrada, cada passo descarta metade da subárvore restante: O(log n).",
                    code_line=3,
                    payload={
                        "nodes": nodes_payload,
                        "edges": edges_payload,
                        "stack_frames": trace_frames,
                        "banner": f"Encontrado no nó {curr} após {len(visited)} passos!",
                    },
                )
            )
            break

        direction = "esquerda" if target < curr else "direita"
        next_node = tree[curr]["left"] if target < curr else tree[curr]["right"]
        steps.append(
            VisualStep(
                step_index=len(steps),
                title=f"No Nó {curr}: {target} é {'Menor' if target < curr else 'Maior'}",
                explanation=f"Regra da BST: menores ficam à esquerda, maiores à direita. Como {target} {'<' if target < curr else '>'} {curr}, descemos para a {direction}.",
                takeaway=f"Toda a subárvore oposta é ignorada instantaneamente.",
                code_line=5 if target < curr else 7,
                payload={
                    "nodes": nodes_payload,
                    "edges": edges_payload,
                    "stack_frames": trace_frames,
                    "banner": f"{target} {'<' if target < curr else '>'} {curr} → Desce para a {direction}",
                },
            )
        )
        curr = next_node

    if visited[-1] != target:
        steps.append(
            VisualStep(
                step_index=len(steps),
                title=f"Ponto de Inserção para {target}",
                explanation=f"O ponteiro chegou em None abaixo do nó {visited[-1]}. O valor {target} não existe ainda, mas este exato ponto seria seu lugar de inserção!",
                takeaway=f"Busca encerrada em apenas {len(visited)} comparações (altura da árvore).",
                code_line=8,
                payload={
                    "nodes": steps[-1].payload["nodes"],
                    "edges": steps[-1].payload["edges"],
                    "stack_frames": steps[-1].payload["stack_frames"] + [{"label": "None (Folha)", "detail": f"Inserir {target} aqui", "active": True}],
                    "banner": f"{target} não encontrado — seria filho de {visited[-1]}",
                },
            )
        )

    return active_params, steps


# ============================================================================
# 4. PORTAS LÓGICAS E BINÁRIO (logic_gates)
# ============================================================================

def simulate_logic_gates(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    gate = str(params.get("gate", "AND")).upper()
    if gate not in ("AND", "OR", "XOR", "NAND"):
        gate = "AND"
    in_a = 1 if str(params.get("input_a", "1")) == "1" else 0
    in_b = 1 if str(params.get("input_b", "1")) == "1" else 0
    dec = _safe_int(params.get("decimal_value", 42), 42, 0, 255)

    def eval_gate(g: str, a: int, b: int) -> int:
        if g == "AND":
            return a & b
        if g == "OR":
            return a | b
        if g == "XOR":
            return a ^ b
        return 0 if (a & b) == 1 else 1  # NAND

    out = eval_gate(gate, in_a, in_b)
    bits = [(dec >> shift) & 1 for shift in range(7, -1, -1)]
    truth = [
        {"a": a, "b": b, "out": eval_gate(gate, a, b), "active": (a == in_a and b == in_b)}
        for a in (0, 1)
        for b in (0, 1)
    ]

    rule_desc = {
        "AND": "só emite 1 quando AMBAS as entradas são 1",
        "OR": "emite 1 quando PELO MENOS UMA entrada é 1",
        "XOR": "emite 1 apenas quando as entradas são DIFERENTES",
        "NAND": "inverte o AND: só emite 0 quando ambas são 1",
    }[gate]

    active_params = {"gate": gate, "input_a": str(in_a), "input_b": str(in_b), "decimal_value": dec}

    steps = [
        VisualStep(
            step_index=0,
            title=f"Sinais Elétricos de Entrada: A={in_a}, B={in_b}",
            explanation=f"No hardware, 0 representa baixa tensão e 1 representa alta tensão. Alimentamos a porta {gate} com A={in_a} e B={in_b}.",
            takeaway="Toda decisão de um computador nasce de milhões de chaves ligadas (1) ou desligadas (0).",
            code_line=1,
            payload={
                "gate": gate,
                "input_a": in_a,
                "input_b": in_b,
                "output": out,
                "decimal_value": dec,
                "bits": bits,
                "truth_table": truth,
                "banner": f"Entradas aplicadas: A = {in_a}, B = {in_b}",
            },
        ),
        VisualStep(
            step_index=1,
            title=f"Porta {gate} Processa a Saída = {out}",
            explanation=f"A porta {gate} {rule_desc}. Logo, {in_a} {gate} {in_b} produz saída = {out}.",
            takeaway=f"Linha destacada na Tabela-Verdade: ({in_a}, {in_b}) → {out}.",
            code_line=3,
            payload={
                "gate": gate,
                "input_a": in_a,
                "input_b": in_b,
                "output": out,
                "decimal_value": dec,
                "bits": bits,
                "truth_table": truth,
                "banner": f"Resultado lógico: {in_a} {gate} {in_b} = {out}",
            },
        ),
        VisualStep(
            step_index=2,
            title=f"Representação de {dec} em 8 Bits (1 Byte)",
            explanation=f"Combinando 8 fios binários com pesos de potências de 2 (128 até 1), representamos o número decimal {dec} como {''.join(str(b) for b in bits)}.",
            takeaway="1 Byte = 8 bits → representa valores de 0 até 255.",
            code_line=5,
            payload={
                "gate": gate,
                "input_a": in_a,
                "input_b": in_b,
                "output": out,
                "decimal_value": dec,
                "bits": bits,
                "truth_table": truth,
                "banner": f"Decimal {dec} = Binário {''.join(str(b) for b in bits)}",
            },
        ),
    ]
    return active_params, steps


# ============================================================================
# 5. FLUXOS DE SISTEMA, CPU, REDES E CONCORRÊNCIA (system_flow)
# ============================================================================

def simulate_control_flow(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    limit = _safe_int(params.get("limit", 3), 3, 1, 4)
    active_params = {"limit": limit}

    steps: list[VisualStep] = [
        VisualStep(
            step_index=0,
            title="Inicialização antes do Laço",
            explanation="Definimos contador = 0 uma única vez antes de entrar no ciclo de repetição.",
            takeaway="Sem inicialização clara, a condição do laço não tem ponto de partida.",
            code_line=1,
            payload={
                "nodes": [
                    {"id": "init", "label": "Início", "role": "Inicialização", "state_text": "i = 0", "x": 18, "y": 50, "status": "active"},
                    {"id": "cond", "label": f"i < {limit} ?", "role": "Condição (if/while)", "state_text": "aguardando", "x": 45, "y": 50, "status": "idle"},
                    {"id": "body", "label": "Bloco do Laço", "role": "Corpo + i += 1", "state_text": "0 execuções", "x": 72, "y": 28, "status": "idle"},
                    {"id": "exit", "label": "Saída", "role": "Próxima linha", "state_text": "aguardando", "x": 78, "y": 74, "status": "idle"},
                ],
                "edges": [
                    {"source": "init", "target": "cond", "label": "entra", "active": True, "packet": "i=0"},
                    {"source": "cond", "target": "body", "label": "Verdadeiro", "active": False, "packet": None},
                    {"source": "body", "target": "cond", "label": "repete", "active": False, "packet": None},
                    {"source": "cond", "target": "exit", "label": "Falso", "active": False, "packet": None},
                ],
                "banner": f"Meta: repetir enquanto i < {limit}",
            },
        )
    ]

    for i in range(limit):
        steps.append(
            VisualStep(
                step_index=len(steps),
                title=f"Iteração {i + 1}: Condição ({i} < {limit}) é Verdadeira",
                explanation=f"O teste {i} < {limit} retorna True. O fluxo desvia para o corpo do laço, executa a ação e incrementa i para {i + 1}.",
                takeaway=f"Ao final do bloco, o fluxo volta para reavaliar a condição com i = {i + 1}.",
                code_line=3,
                payload={
                    "nodes": [
                        {"id": "init", "label": "Início", "role": "Inicialização", "state_text": "concluído", "x": 18, "y": 50, "status": "done"},
                        {"id": "cond", "label": f"{i} < {limit} → True", "role": "Condição", "state_text": "Verdadeiro", "x": 45, "y": 50, "status": "active"},
                        {"id": "body", "label": "Bloco do Laço", "role": "Executa ação", "state_text": f"i vira {i + 1}", "x": 72, "y": 28, "status": "active"},
                        {"id": "exit", "label": "Saída", "role": "Próxima linha", "state_text": "aguardando", "x": 78, "y": 74, "status": "idle"},
                    ],
                    "edges": [
                        {"source": "init", "target": "cond", "label": "entra", "active": False, "packet": None},
                        {"source": "cond", "target": "body", "label": "True", "active": True, "packet": f"exec #{i+1}"},
                        {"source": "body", "target": "cond", "label": f"i={i+1}", "active": True, "packet": f"i={i+1}"},
                        {"source": "cond", "target": "exit", "label": "Falso", "active": False, "packet": None},
                    ],
                    "banner": f"Ciclo #{i + 1} executado → i incrementado para {i + 1}",
                },
            )
        )

    steps.append(
        VisualStep(
            step_index=len(steps),
            title=f"Encerramento: Condição ({limit} < {limit}) é Falsa",
            explanation=f"Agora i vale {limit}. Como {limit} < {limit} é False, o laço termina imediatamente e segue para o resto do programa.",
            takeaway=f"Total exato de {limit} {'repetição' if limit == 1 else 'repetições'} sem entrar em loop infinito.",
            code_line=5,
            payload={
                "nodes": [
                    {"id": "init", "label": "Início", "role": "Inicialização", "state_text": "concluído", "x": 18, "y": 50, "status": "done"},
                    {"id": "cond", "label": f"{limit} < {limit} → False", "role": "Condição", "state_text": "Falso", "x": 45, "y": 50, "status": "warning"},
                    {"id": "body", "label": "Bloco do Laço", "role": "Finalizado", "state_text": f"{limit}x executado", "x": 72, "y": 28, "status": "done"},
                    {"id": "exit", "label": "Saída do Laço", "role": "Fluxo segue", "state_text": f"i final = {limit}", "x": 78, "y": 74, "status": "active"},
                ],
                "edges": [
                    {"source": "init", "target": "cond", "label": "entra", "active": False, "packet": None},
                    {"source": "cond", "target": "body", "label": "True", "active": False, "packet": None},
                    {"source": "body", "target": "cond", "label": "repete", "active": False, "packet": None},
                    {"source": "cond", "target": "exit", "label": "False → sai", "active": True, "packet": "fim"},
                ],
                "banner": f"Condição falsa atingida → laço encerrado com i = {limit}",
            },
        )
    )
    return active_params, steps


def simulate_cpu_cycle(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    op = str(params.get("operation", "ADD"))
    if op not in ("ADD", "SUB", "MUL"):
        op = "ADD"
    a, b = 12, 5
    result = a + b if op == "ADD" else (a - b if op == "SUB" else a * b)
    symbol = "+" if op == "ADD" else ("-" if op == "SUB" else "×")
    active_params = {"operation": op}

    steps = [
        VisualStep(
            step_index=0,
            title="1. Busca (Fetch): Lendo Instrução na RAM",
            explanation=f"O Contador de Programa (PC = 0x01) aponta para a memória RAM e busca a instrução '{op} R1, R2' pelo barramento.",
            takeaway="A CPU nunca adivinha o que fazer: ela busca uma instrução por vez na RAM.",
            code_line=1,
            payload={
                "nodes": [
                    {"id": "ram", "label": "Memória RAM", "role": "Endereço 0x01", "state_text": f"{op} R1, R2", "x": 20, "y": 32, "status": "active"},
                    {"id": "cu", "label": "Unidade de Controle", "role": "PC = 0x01", "state_text": "Buscando...", "x": 54, "y": 32, "status": "active"},
                    {"id": "alu", "label": "ULA (ALU)", "role": "Cálculo Lógico/Aritmético", "state_text": "Em espera", "x": 82, "y": 52, "status": "idle"},
                    {"id": "reg", "label": "Registradores", "role": "Memória Ultrarrápida", "state_text": f"R1={a}, R2={b}", "x": 48, "y": 74, "status": "idle"},
                ],
                "edges": [
                    {"source": "ram", "target": "cu", "label": "Barramento de Dados", "active": True, "packet": f"{op} R1,R2"},
                    {"source": "cu", "target": "alu", "label": "Sinal de Controle", "active": False, "packet": None},
                    {"source": "reg", "target": "alu", "label": "Operandos", "active": False, "packet": None},
                    {"source": "alu", "target": "reg", "label": "Write-back", "active": False, "packet": None},
                ],
                "banner": f"FETCH: Instrução '{op} R1, R2' copiada da RAM para a CPU",
            },
        ),
        VisualStep(
            step_index=1,
            title="2. Decodificação (Decode): Preparando Operandos",
            explanation=f"A Unidade de Controle traduz o código da operação '{op}' e ordena que os registradores R1 ({a}) e R2 ({b}) enviem seus valores para a ULA.",
            takeaway="Registradores entregam dados em frações de nanossegundo, muito mais rápido que a RAM.",
            code_line=2,
            payload={
                "nodes": [
                    {"id": "ram", "label": "Memória RAM", "role": "Endereço 0x01", "state_text": "Lida", "x": 20, "y": 32, "status": "done"},
                    {"id": "cu", "label": "Unidade de Controle", "role": "PC → 0x02", "state_text": f"Opcode = {op}", "x": 54, "y": 32, "status": "active"},
                    {"id": "alu", "label": "ULA (ALU)", "role": " Circuito selecionado", "state_text": f"Pronta p/ {symbol}", "x": 82, "y": 52, "status": "active"},
                    {"id": "reg", "label": "Registradores", "role": "Enviando R1 e R2", "state_text": f"R1={a}, R2={b}", "x": 48, "y": 74, "status": "active"},
                ],
                "edges": [
                    {"source": "ram", "target": "cu", "label": "Barramento", "active": False, "packet": None},
                    {"source": "cu", "target": "alu", "label": f"Modo {op}", "active": True, "packet": op},
                    {"source": "reg", "target": "alu", "label": "Operandos", "active": True, "packet": f"{a}, {b}"},
                    {"source": "alu", "target": "reg", "label": "Write-back", "active": False, "packet": None},
                ],
                "banner": f"DECODE: Operação '{op}' identificada com entradas {a} e {b}",
            },
        ),
        VisualStep(
            step_index=2,
            title=f"3. Execução (Execute): {a} {symbol} {b} = {result}",
            explanation=f"A ULA executa {a} {symbol} {b} = {result} em portas lógicas de silício e grava o resultado de volta no registrador R1.",
            takeaway="Bilhões desses ciclos Fetch-Decode-Execute ocorrem por segundo (GHz).",
            code_line=3,
            payload={
                "nodes": [
                    {"id": "ram", "label": "Memória RAM", "role": "Aguardando", "state_text": "Próx: 0x02", "x": 20, "y": 32, "status": "done"},
                    {"id": "cu", "label": "Unidade de Controle", "role": "Ciclo completo", "state_text": "PC = 0x02", "x": 54, "y": 32, "status": "done"},
                    {"id": "alu", "label": "ULA (ALU)", "role": "Cálculo concluído", "state_text": f"Saída = {result}", "x": 82, "y": 52, "status": "done"},
                    {"id": "reg", "label": "Registradores", "role": "Atualizado", "state_text": f"R1={result}, R2={b}", "x": 48, "y": 74, "status": "active"},
                ],
                "edges": [
                    {"source": "ram", "target": "cu", "label": "Barramento", "active": False, "packet": None},
                    {"source": "cu", "target": "alu", "label": "Controle", "active": False, "packet": None},
                    {"source": "reg", "target": "alu", "label": "Operandos", "active": False, "packet": None},
                    {"source": "alu", "target": "reg", "label": "Grava R1", "active": True, "packet": f"R1={result}"},
                ],
                "banner": f"EXECUTE: Registrador R1 atualizado para {result}",
            },
        ),
    ]
    return active_params, steps


def simulate_http_flow(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    cache_mode = str(params.get("cache", "miss"))
    if cache_mode not in ("hit", "miss"):
        cache_mode = "miss"
    active_params = {"cache": cache_mode}

    steps = [
        VisualStep(
            step_index=0,
            title="1. Resolução DNS: Nome vira IP",
            explanation="O navegador não sabe onde fica 'visualdy.dev'. Ele consulta o servidor DNS, que devolve o endereço IP 104.21.8.9.",
            takeaway="DNS funciona como a lista telefônica da internet: traduz domínios em IPs.",
            code_line=1,
            payload={
                "nodes": [
                    {"id": "client", "label": "Navegador", "role": "Cliente Web", "state_text": " Onde é visualdy.dev?", "x": 18, "y": 50, "status": "active"},
                    {"id": "dns", "label": "Servidor DNS", "role": "Tradutor de Domínio", "state_text": "104.21.8.9", "x": 48, "y": 22, "status": "active"},
                    {"id": "cdn", "label": "Cache / CDN", "role": "Borda Regional", "state_text": "Pronto", "x": 52, "y": 68, "status": "idle"},
                    {"id": "server", "label": "Servidor API", "role": "Origem FastAPI", "state_text": "Porta 443", "x": 84, "y": 50, "status": "idle"},
                ],
                "edges": [
                    {"source": "client", "target": "dns", "label": "Consulta DNS", "active": True, "packet": "IP: 104.21.8.9"},
                    {"source": "client", "target": "cdn", "label": "GET /cursos", "active": False, "packet": None},
                    {"source": "cdn", "target": "server", "label": " Proxy Origem", "active": False, "packet": None},
                ],
                "banner": "DNS resolveu visualdy.dev → 104.21.8.9",
            },
        ),
        VisualStep(
            step_index=1,
            title="2. Conexão TCP + Requisição HTTP GET",
            explanation="Após o aperto de mão TCP (SYN → SYN-ACK → ACK), o navegador envia 'GET /assuntos HTTP/1.1' até a borda/CDN.",
            takeaway="TCP garante entrega ordenada; HTTP define o verbo (GET, POST) e cabeçalhos.",
            code_line=2,
            payload={
                "nodes": [
                    {"id": "client", "label": "Navegador", "role": "TCP Conectado", "state_text": "GET /assuntos", "x": 18, "y": 50, "status": "active"},
                    {"id": "dns", "label": "Servidor DNS", "role": "Concluído", "state_text": "Em cache local", "x": 48, "y": 22, "status": "done"},
                    {"id": "cdn", "label": "Cache / CDN", "role": "Verificando chave", "state_text": "Cache HIT!" if cache_mode == "hit" else "Cache MISS", "x": 52, "y": 68, "status": "active"},
                    {"id": "server", "label": "Servidor API", "role": "Origem", "state_text": "Aguardando", "x": 84, "y": 50, "status": "idle"},
                ],
                "edges": [
                    {"source": "client", "target": "dns", "label": "DNS", "active": False, "packet": None},
                    {"source": "client", "target": "cdn", "label": "HTTP GET", "active": True, "packet": "GET /assuntos"},
                    {"source": "cdn", "target": "server", "label": "Origem", "active": False, "packet": None},
                ],
                "banner": "Pacote HTTP GET chegou na camada de Cache/CDN",
            },
        ),
    ]

    if cache_mode == "hit":
        steps.append(
            VisualStep(
                step_index=2,
                title="3. Resposta Imediata pelo Cache (200 OK)",
                explanation="Como os dados já estavam salvos na CDN próxima ao usuário (Cache HIT), a resposta JSON volta em 12ms sem acionar o servidor de origem.",
                takeaway="Cache bem configurado reduz latência e protege o banco de dados.",
                code_line=4,
                payload={
                    "nodes": [
                        {"id": "client", "label": "Navegador", "role": "Renderizando JSON", "state_text": "200 OK (12ms)", "x": 18, "y": 50, "status": "done"},
                        {"id": "dns", "label": "Servidor DNS", "role": "Concluído", "state_text": "104.21.8.9", "x": 48, "y": 22, "status": "done"},
                        {"id": "cdn", "label": "Cache / CDN", "role": "Respondeu direto", "state_text": "HIT → 200 OK", "x": 52, "y": 68, "status": "active"},
                        {"id": "server", "label": "Servidor API", "role": "Poupado", "state_text": "0 carga", "x": 84, "y": 50, "status": "idle"},
                    ],
                    "edges": [
                        {"source": "client", "target": "dns", "label": "DNS", "active": False, "packet": None},
                        {"source": "cdn", "target": "client", "label": "HTTP 200 JSON", "active": True, "packet": "200 OK"},
                        {"source": "cdn", "target": "server", "label": "Não acionado", "active": False, "packet": None},
                    ],
                    "banner": "Cache HIT → Resposta entregue em 12ms sem ir à origem",
                },
            )
        )
    else:
        steps.append(
            VisualStep(
                step_index=2,
                title="3. Processamento na Origem e Resposta 200 OK",
                explanation="Com Cache MISS, a requisição segue até o servidor FastAPI de origem, que monta o JSON, salva cópia no cache e devolve 200 OK ao navegador.",
                takeaway="Na próxima visita, a CDN já terá essa resposta pronta na borda.",
                code_line=5,
                payload={
                    "nodes": [
                        {"id": "client", "label": "Navegador", "role": "Renderizando tela", "state_text": "200 OK (95ms)", "x": 18, "y": 50, "status": "done"},
                        {"id": "dns", "label": "Servidor DNS", "role": "Concluído", "state_text": "104.21.8.9", "x": 48, "y": 22, "status": "done"},
                        {"id": "cdn", "label": "Cache / CDN", "role": "Gravou cópia", "state_text": "Atualizado", "x": 52, "y": 68, "status": "done"},
                        {"id": "server", "label": "Servidor API", "role": "Executou rota", "state_text": "Gerou JSON", "x": 84, "y": 50, "status": "active"},
                    ],
                    "edges": [
                        {"source": "cdn", "target": "server", "label": "Busca na origem", "active": True, "packet": "GET"},
                        {"source": "server", "target": "client", "label": "200 OK + JSON", "active": True, "packet": "JSON"},
                    ],
                    "banner": "Cache MISS → Servidor processou e retornou HTTP 200 OK",
                },
            )
        )

    return active_params, steps


def simulate_event_loop(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    task_type = str(params.get("task_type", "fetch"))
    if task_type not in ("fetch", "timer"):
        task_type = "fetch"
    active_params = {"task_type": task_type}
    label_io = "fetch('/api')" if task_type == "fetch" else "setTimeout(100ms)"

    steps = [
        VisualStep(
            step_index=0,
            title="1. Tarefa Assíncrona Delegada sem Travar a Thread",
            explanation=f"A Call Stack encontra {label_io}. Em vez de congelar a tela esperando, ela delega a espera para as APIs do Sistema/Runtime.",
            takeaway="Assíncrono permite continuar atendendo cliques enquanto I/O ocorre em paralelo.",
            code_line=2,
            payload={
                "nodes": [
                    {"id": "stack", "label": "Call Stack", "role": "Thread Principal", "state_text": f"Delega {label_io}", "x": 20, "y": 34, "status": "active"},
                    {"id": "webapi", "label": "Runtime / I/O APIs", "role": "Trabalho Externo", "state_text": "Aguardando resposta...", "x": 76, "y": 34, "status": "active"},
                    {"id": "queue", "label": "Fila de Callbacks", "role": " Prontos p/ rodar", "state_text": "Vazia", "x": 76, "y": 74, "status": "idle"},
                    {"id": "loop", "label": "Event Loop", "role": "Vigia da Pilha", "state_text": "Monitorando", "x": 20, "y": 74, "status": "idle"},
                ],
                "edges": [
                    {"source": "stack", "target": "webapi", "label": "Inicia I/O", "active": True, "packet": label_io},
                    {"source": "webapi", "target": "queue", "label": "Ao concluir", "active": False, "packet": None},
                    {"source": "queue", "target": "loop", "label": "Verifica fila", "active": False, "packet": None},
                    {"source": "loop", "target": "stack", "label": "Empilha callback", "active": False, "packet": None},
                ],
                "banner": f"{label_io} delegado → Thread principal segue livre!",
            },
        ),
        VisualStep(
            step_index=1,
            title="2. Código Síncrono Roda e I/O Termina na Fila",
            explanation="Enquanto o código síncrono restante termina na Call Stack, a operação externa conclui e deposita seu callback na Fila.",
            takeaway="Callbacks nunca atropelam código que já está rodando na Call Stack.",
            code_line=4,
            payload={
                "nodes": [
                    {"id": "stack", "label": "Call Stack", "role": "Thread Principal", "state_text": "Ficou vazia!", "x": 20, "y": 34, "status": "done"},
                    {"id": "webapi", "label": "Runtime / I/O APIs", "role": "Concluído", "state_text": "Resposta pronta", "x": 76, "y": 34, "status": "done"},
                    {"id": "queue", "label": "Fila de Callbacks", "role": "1 item aguardando", "state_text": "aoReceberDados()", "x": 76, "y": 74, "status": "active"},
                    {"id": "loop", "label": "Event Loop", "role": "Checando Stack", "state_text": "Stack livre?", "x": 20, "y": 74, "status": "active"},
                ],
                "edges": [
                    {"source": "stack", "target": "webapi", "label": "Inicia I/O", "active": False, "packet": None},
                    {"source": "webapi", "target": "queue", "label": "Enfileira", "active": True, "packet": "callback"},
                    {"source": "queue", "target": "loop", "label": "Pronto", "active": True, "packet": None},
                    {"source": "loop", "target": "stack", "label": "Empilha", "active": False, "packet": None},
                ],
                "banner": "I/O concluído → Callback aguarda na fila até a Stack esvaziar",
            },
        ),
        VisualStep(
            step_index=2,
            title="3. Event Loop Move o Callback para a Call Stack",
            explanation="Assim que percebe a Call Stack totalmente vazia, o Event Loop transfere 'aoReceberDados()' da Fila para execução imediata.",
            takeaway="Regra de ouro do Event Loop: só empilha da fila quando a Call Stack está vazia.",
            code_line=3,
            payload={
                "nodes": [
                    {"id": "stack", "label": "Call Stack", "role": "Executando Callback", "state_text": "aoReceberDados()", "x": 20, "y": 34, "status": "active"},
                    {"id": "webapi", "label": "Runtime / I/O APIs", "role": "Ocioso", "state_text": "Livre", "x": 76, "y": 34, "status": "idle"},
                    {"id": "queue", "label": "Fila de Callbacks", "role": "Consumida", "state_text": "Vazia", "x": 76, "y": 74, "status": "done"},
                    {"id": "loop", "label": "Event Loop", "role": "Despachou!", "state_text": "Ciclo completo", "x": 20, "y": 74, "status": "active"},
                ],
                "edges": [
                    {"source": "queue", "target": "loop", "label": "Retira da fila", "active": True, "packet": "fn()"},
                    {"source": "loop", "target": "stack", "label": "Executa agora", "active": True, "packet": "aoReceberDados()"},
                ],
                "banner": "Event Loop moveu o callback para a Call Stack → Dados exibidos!",
            },
        ),
    ]
    return active_params, steps


def simulate_bfs_graph(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    goal = str(params.get("goal", "E")).upper()
    if goal not in ("C", "D", "E"):
        goal = "E"
    active_params = {"goal": goal}

    coords = {
        "A": (16, 50),
        "B": (44, 24),
        "C": (44, 76),
        "D": (76, 24),
        "E": (76, 76),
    }
    adj = {"A": ["B", "C"], "B": ["D"], "C": ["E"], "D": ["E"], "E": []}
    all_edges = [
        {"source": "A", "target": "B", "label": "1 salto"},
        {"source": "A", "target": "C", "label": "1 salto"},
        {"source": "B", "target": "D", "label": "1 salto"},
        {"source": "C", "target": "E", "label": "1 salto"},
        {"source": "D", "target": "E", "label": "1 salto"},
    ]

    from collections import deque
    queue = deque([("A", ["A"])])
    visited = {"A"}
    steps: list[VisualStep] = []

    while queue:
        curr, path = queue.popleft()
        is_goal = curr == goal
        for nxt in adj[curr]:
            if nxt not in visited and not is_goal:
                visited.add(nxt)
                queue.append((nxt, path + [nxt]))

        nodes_payload = []
        for nid, (nx, ny) in coords.items():
            st = "idle"
            role = "Não visitado"
            if nid == curr:
                st = "done" if is_goal else "active"
                role = "Destino atingido!" if is_goal else "Explorando agora"
            elif nid in path:
                st = "done"
                role = "No caminho mínimo"
            elif nid in visited:
                st = "active"
                role = "Na fila BFS"
            nodes_payload.append(
                {
                    "id": nid,
                    "label": f"Nó {nid}",
                    "role": role,
                    "state_text": f"Distância: {len(path)-1}" if nid == curr else ("Fila" if nid in visited else "-"),
                    "x": nx,
                    "y": ny,
                    "status": st,
                }
            )

        edges_payload = []
        path_pairs = {(path[i], path[i + 1]) for i in range(len(path) - 1)}
        for e in all_edges:
            in_p = (e["source"], e["target"]) in path_pairs
            is_frontier = e["source"] == curr and not is_goal
            edges_payload.append(
                {
                    **e,
                    "active": in_p or is_frontier,
                    "packet": "rota" if in_p else ("fila" if is_frontier else None),
                }
            )

        steps.append(
            VisualStep(
                step_index=len(steps),
                title=f"Destino {goal} Encontrado por Camadas!" if is_goal else f"Visitando Nó {curr} (Camada {len(path)-1})",
                explanation=(
                    f"A Busca em Largura (BFS) encontrou o menor caminho {' → '.join(path)} com {len(path)-1} {'aresta' if len(path)-1 == 1 else 'arestas'}."
                    if is_goal
                    else f"A partir de {curr}, enfileiramos seus vizinhos diretos antes de aprofundar. Fila atual: {[q[0] for q in queue] or ['vazia']}."
                ),
                takeaway=(
                    f"Caminho mínimo garantido em grafos sem peso: {' → '.join(path)}."
                    if is_goal
                    else "A BFS usa uma Fila (FIFO) para explorar o grafo em ondas concêntricas."
                ),
                code_line=4 if is_goal else 6,
                payload={
                    "nodes": nodes_payload,
                    "edges": edges_payload,
                    "banner": f"Menor rota encontrada: {' → '.join(path)}" if is_goal else f"Explorando {curr} | Fila: {[q[0] for q in queue]}",
                },
            )
        )
        if is_goal:
            break

    return active_params, steps


# ============================================================================
# 6. BANCO DE DADOS RELACIONAL E SQL JOIN (relational_join)
# ============================================================================

def simulate_sql_join(params: dict[str, Any]) -> tuple[dict[str, Any], list[VisualStep]]:
    join_type = str(params.get("join_type", "INNER JOIN")).upper()
    if join_type not in ("INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"):
        join_type = "INNER JOIN"
    active_params = {"join_type": join_type}

    users = [
        {"id": 0, "key": "id=1", "uid": 1, "label": "1 · Ana"},
        {"id": 1, "key": "id=2", "uid": 2, "label": "2 · Bruno"},
        {"id": 2, "key": "id=3", "uid": 3, "label": "3 · Carla"},
    ]
    orders = [
        {"id": 0, "key": "user_id=1", "uid": 1, "label": "Pedido #101 (R$ 80)"},
        {"id": 1, "key": "user_id=2", "uid": 2, "label": "Pedido #102 (R$ 150)"},
        {"id": 2, "key": "user_id=9", "uid": 9, "label": "Pedido #103 (Órfão)"},
    ]

    include_unmatched_left = join_type in ("LEFT JOIN", "FULL JOIN")
    include_unmatched_right = join_type in ("RIGHT JOIN", "FULL JOIN")

    result_rows = [
        {"left_val": "Ana", "key_val": "id = 1", "right_val": "Pedido #101 (R$ 80)", "has_null": False},
        {"left_val": "Bruno", "key_val": "id = 2", "right_val": "Pedido #102 (R$ 150)", "has_null": False},
    ]
    if include_unmatched_left:
        result_rows.append({"left_val": "Carla", "key_val": "id = 3", "right_val": "NULL (sem pedido)", "has_null": True})
    if include_unmatched_right:
        result_rows.append({"left_val": "NULL (sem usuário)", "key_val": "user_id = 9", "right_val": "Pedido #103 (Órfão)", "has_null": True})

    rule_map = {
        "INNER JOIN": "Mantém APENAS linhas que possuem par correspondente nas duas tabelas.",
        "LEFT JOIN": "Mantém TODOS os registros da esquerda (Usuários), preenchendo com NULL quando não há pedido.",
        "RIGHT JOIN": "Mantém TODOS os registros da direita (Pedidos), preenchendo com NULL quando não há usuário.",
        "FULL JOIN": "Une os dois lados completos: pares casados + linhas sem par de ambos os lados com NULL.",
    }

    steps = [
        VisualStep(
            step_index=0,
            title="1. Duas Tabelas Separadas por Chave Estrangeira",
            explanation="Temos 'Usuarios' à esquerda e 'Pedidos' à direita. Note que Carla (id=3) não fez pedido e o Pedido #103 aponta para user_id=9 inexistente.",
            takeaway="Tabelas normalizadas evitam duplicar dados, usando IDs para conectar registros.",
            code_line=1,
            payload={
                "join_type": join_type,
                "left_table_name": "Tabela Esquerda: Usuarios",
                "right_table_name": "Tabela Direita: Pedidos",
                "left_rows": [{**u, "matched": False, "included": True} for u in users],
                "right_rows": [{**o, "matched": False, "included": True} for o in orders],
                "links": [],
                "result_rows": [],
                "banner": "Analisando chaves Usuarios.id = Pedidos.user_id",
            },
        ),
        VisualStep(
            step_index=1,
            title="2. Cruzamento das Chaves Iguais (ON u.id = p.user_id)",
            explanation="O banco compara as chaves: id=1 conecta Ana ao Pedido #101 e id=2 conecta Bruno ao Pedido #102.",
            takeaway="Dois pares exatos encontrados entre as duas tabelas.",
            code_line=3,
            payload={
                "join_type": join_type,
                "left_table_name": "Tabela Esquerda: Usuarios",
                "right_table_name": "Tabela Direita: Pedidos",
                "left_rows": [
                    {**users[0], "matched": True, "included": True},
                    {**users[1], "matched": True, "included": True},
                    {**users[2], "matched": False, "included": False},
                ],
                "right_rows": [
                    {**orders[0], "matched": True, "included": True},
                    {**orders[1], "matched": True, "included": True},
                    {**orders[2], "matched": False, "included": False},
                ],
                "links": [
                    {"left_index": 0, "right_index": 0, "active": True},
                    {"left_index": 1, "right_index": 1, "active": True},
                ],
                "result_rows": result_rows[:2],
                "banner": "2 correspondências exatas encontradas (id=1 e id=2)",
            },
        ),
        VisualStep(
            step_index=2,
            title=f"3. Resultado Final do {join_type} ({len(result_rows)} linhas)",
            explanation=rule_map[join_type],
            takeaway=f"{join_type} produziu {len(result_rows)} linhas na tabela resultante.",
            code_line=2,
            payload={
                "join_type": join_type,
                "left_table_name": "Tabela Esquerda: Usuarios",
                "right_table_name": "Tabela Direita: Pedidos",
                "left_rows": [
                    {**users[0], "matched": True, "included": True},
                    {**users[1], "matched": True, "included": True},
                    {**users[2], "matched": False, "included": include_unmatched_left},
                ],
                "right_rows": [
                    {**orders[0], "matched": True, "included": True},
                    {**orders[1], "matched": True, "included": True},
                    {**orders[2], "matched": False, "included": include_unmatched_right},
                ],
                "links": [
                    {"left_index": 0, "right_index": 0, "active": True},
                    {"left_index": 1, "right_index": 1, "active": True},
                ],
                "result_rows": result_rows,
                "banner": f"{join_type} concluído → {len(result_rows)} registros retornados",
            },
        ),
    ]
    return active_params, steps


# ============================================================================
# 7. MECANISMO UNIVERSAL DE CRIAÇÃO DE EXPLICAÇÃO VISUAL (Qualquer Assunto)
# ============================================================================

CONCEPT_TEMPLATES: list[dict[str, Any]] = [
    {
        "keywords": ["deadlock", "impasse", "concorrencia", "mutex", "lock", "semaforo", "thread"],
        "category_slug": "redes-e-sistemas",
        "category_name": "Redes, Web e Concorrência",
        "archetype": "system_flow",
        "complexity": "Concorrência",
        "analogy": "Dois motoristas parados num cruzamento estreito onde cada um espera o outro recuar primeiro.",
        "core_idea": "Um impasse ocorre quando dois ou mais processos seguram um recurso exclusivo e aguardam circularmente pelo recurso do outro.",
        "code": [
            "# Processo A segura Recurso 1 e pede Recurso 2",
            "lock(recurso_1)",
            "aguarda(recurso_2)  # bloqueado por B!",
            "# Solução: adquirir locks sempre na mesma ordem global",
        ],
        "stages": [
            ("Alocação Inicial Segura", "Processo A obtém o Lock do Recurso 1; Processo B obtém o Lock do Recurso 2.", "Cada recurso exclusivo aceita apenas 1 dono por vez."),
            ("Espera Cruzada", "Processo A pede o Recurso 2 (ocupado por B), enquanto B pede o Recurso 1 (ocupado por A).", "Forma-se um ciclo fechado de dependência (Espera Circular)."),
            ("Prevenção por Ordem Global", "Ao exigir que todos adquiram Recurso 1 antes do Recurso 2, o ciclo é quebrado e o fluxo avança.", "Quebrar a espera circular elimina o deadlock."),
        ],
        "nodes": [
            ("n1", "Processo A", "Thread Trabalhadora", 20, 28),
            ("n2", "Recurso 1 (Lock)", "Banco / Arquivo", 76, 28),
            ("n3", "Processo B", "Thread Trabalhadora", 20, 74),
            ("n4", "Recurso 2 (Lock)", "Socket / Memória", 76, 74),
        ],
    },
    {
        "keywords": ["garbage", "coletor", "lixo", "alocacao", "memoria", "leak", "vazamento"],
        "category_slug": "fundamentos",
        "category_name": "Fundamentos de Programação",
        "archetype": "memory_model",
        "complexity": "Mark & Sweep",
        "analogy": "Um bibliotecário que recolhe das mesas apenas os livros que nenhum leitor está usando mais.",
        "core_idea": "O Garbage Collector rastreia objetos alcançáveis a partir das variáveis ativas (raízes) e libera automaticamente os blocos órfãos na Heap.",
        "code": [
            "usuario = {'nome': 'Lia'}   # 0x800 alcançável",
            "temp = {'cache': 999}       # 0x840 criado",
            "temp = None                 # 0x840 perdeu referência!",
            "gc.collect()                # libera 0x840 na Heap",
        ],
        "memory_custom": True,
    },
    {
        "keywords": ["docker", "container", "conteiner", "virtualizacao", "imagem", "kubernetes", "deploy"],
        "category_slug": "arquitetura",
        "category_name": "Arquitetura e Hardware",
        "archetype": "system_flow",
        "complexity": "Isolamento SO",
        "analogy": "Contêineres marítimos padronizados: o mesmo pacote roda igual no notebook e no servidor em nuvem.",
        "core_idea": "Containers empacotam código, bibliotecas e dependências em processos isolados que compartilham o mesmo Kernel do sistema operacional.",
        "code": [
            "FROM python:3.11-slim",
            "COPY . /app",
            "RUN pip install -r requirements.txt",
            "CMD ['uvicorn', 'main:app', '--port', '8000']",
        ],
        "stages": [
            ("Dockerfile e Imagem Imutável", "O código e suas bibliotecas exatas são empacotados em camadas somente-leitura (Imagem).", "Acaba o problema de 'na minha máquina funciona'."),
            ("Isolamento via Namespaces", "O Engine cria um Container leve usando o Kernel do host, isolando rede, arquivos e processos.", "Muito mais leve que subir uma Máquina Virtual inteira."),
            ("Execução Estável em Produção", "Múltiplas réplicas idênticas atendem tráfego com limites controlados de CPU e RAM (cgroups).", "Implantação previsível e escalável em segundos."),
        ],
        "nodes": [
            ("n1", "Imagem Base", "Código + Libs", 18, 32),
            ("n2", "Container Engine", "Namespaces & cgroups", 50, 50),
            ("n3", "Kernel Linux Host", "Compartilhado", 50, 82),
            ("n4", "App em Execução", "Porta isolada :8000", 82, 32),
        ],
    },
    {
        "keywords": ["api", "rest", "graphql", "json", "endpoint", "webhook", "backend", "cliente", "servidor"],
        "category_slug": "redes-e-sistemas",
        "category_name": "Redes, Web e Concorrência",
        "archetype": "system_flow",
        "complexity": "Cliente-Servidor",
        "analogy": "Um garçom (API) que leva seu pedido padronizado até a cozinha (servidor) e traz apenas o prato pronto.",
        "core_idea": "Uma API define um contrato claro de mensagens (rotas, verbos e JSON) para que sistemas independentes conversem sem conhecer detalhes internos um do outro.",
        "code": [
            "@app.post('/api/pedidos')",
            "def criar_pedido(dados: PedidoInput):",
            "     validar(dados)",
            "     return {'status': 201, 'id': 42}",
        ],
        "stages": [
            ("Contrato de Entrada", "O cliente monta uma requisição estruturada com verbo HTTP e corpo JSON válido.", "Front-end não acessa o banco diretamente."),
            ("Validação e Regra de Negócio", "O endpoint recebe os dados, verifica permissões/tipos e consulta a camada de persistência.", "Segurança e validação ficam centralizadas no servidor."),
            ("Resposta Padronizada JSON", "O servidor responde com código de status semântico (200/201/400) e dados limpos para a interface.", "Qualquer app web ou mobile consome o mesmo contrato."),
        ],
        "nodes": [
            ("n1", "Interface React", "Cliente Consumidor", 18, 50),
            ("n2", "Contrato da API", "Validação + Rotas", 50, 32),
            ("n3", "Camada de Dados", "Persistência", 82, 50),
            ("n4", "Resposta JSON", "Status 200/201", 50, 74),
        ],
    },
    {
        "keywords": ["git", "branch", "merge", "commit", "versionamento", "pull request"],
        "category_slug": "fundamentos",
        "category_name": "Fundamentos de Programação",
        "archetype": "call_stack_tree",
        "complexity": "Grafo Acíclico (DAG)",
        "analogy": "Linhas do tempo paralelas onde você testa uma ideia nova sem estragar o documento principal.",
        "core_idea": "No Git, cada commit é um retrato imutável apontando para o commit pai; branches são apenas etiquetas leves móveis sobre esses commits.",
        "code": [
            "git checkout -b nova-tela   # cria ramificação",
            "git commit -m 'Adiciona UI' # avança ponteiro",
            "git checkout main           # volta à linha base",
            "git merge nova-tela         # une históricos",
        ],
        "git_custom": True,
    },
]


def generate_custom_visual_topic(
    concept: str,
    preferred_archetype: VisualArchetype | None = None,
    difficulty: DifficultyLevel = "Iniciante",
) -> TopicDetail:
    clean_title = concept.strip()
    norm = unicodedata.normalize("NFKD", clean_title).encode("ascii", "ignore").decode("ascii").lower()
    slug = f"visual-{slugify(clean_title)}"

    matched_tpl = None
    for tpl in CONCEPT_TEMPLATES:
        if any(kw in norm for kw in tpl["keywords"]):
            matched_tpl = tpl
            break

    # Determine archetype if user explicitly picked one or from semantic match
    if preferred_archetype:
        archetype = preferred_archetype
    elif matched_tpl:
        archetype = matched_tpl["archetype"]
    elif any(w in norm for w in ["vetor", "array", "busca", "ordena", "lista", "indice", "sort"]):
        archetype = "array_pointers"
    elif any(w in norm for w in ["memoria", "variave", "ponteiro", "pilha", "fila", "hash", "cache", "heap", "stack"]):
        archetype = "memory_model"
    elif any(w in norm for w in ["arvore", "recurs", "hierarquia", "dom", "ast", "fibonacci", "grafo"]):
        archetype = "call_stack_tree"
    elif any(w in norm for w in ["sql", "tabela", "banco", "join", "chave", "relacional"]):
        archetype = "relational_join"
    elif any(w in norm for w in ["bit", "binario", "porta", "boole", "logica", "xor", "and"]):
        archetype = "logic_gates"
    else:
        archetype = "system_flow"

    # Specialized custom builders for rich accuracy
    if matched_tpl and matched_tpl.get("memory_custom") and archetype == "memory_model":
        steps = [
            VisualStep(
                step_index=0,
                title="1. Objetos Alocados com Referências Ativas",
                explanation=f"Em '{clean_title}', variáveis na Stack apontam para blocos recém-criados na Heap (0x800 e 0x840).",
                takeaway="Enquanto houver ao menos uma seta apontando para o objeto, ele permanece vivo.",
                code_line=1,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Raízes na Stack",
                    "right_title": "Blocos na Heap",
                    "left_slots": [
                        {"id": "r1", "address": "0x100", "label": "usuario", "value": "ref → 0x800", "state": "active", "ref_target": "h1"},
                        {"id": "r2", "address": "0x108", "label": "temp", "value": "ref → 0x840", "state": "active", "ref_target": "h2"},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x800", "label": "Alcançável", "value": "{nome: 'Lia'}", "state": "active"},
                        {"id": "h2", "address": "0x840", "label": "Alcançável", "value": "{cache: 999}", "state": "default"},
                    ],
                    "banner": "Fase inicial: ambos os objetos possuem referência ativa",
                },
            ),
            VisualStep(
                step_index=1,
                title="2. Fase Mark: Identificando Objetos Órfãos",
                explanation="Quando 'temp = None', a seta para 0x840 desaparece. O coletor marca 0x800 como alcançável e detecta 0x840 isolado.",
                takeaway="Objeto sem referência é inacessível pelo programa: tornou-se lixo de memória.",
                code_line=3,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Raízes na Stack",
                    "right_title": "Marcação na Heap (Mark)",
                    "left_slots": [
                        {"id": "r1", "address": "0x100", "label": "usuario", "value": "ref → 0x800", "state": "active", "ref_target": "h1"},
                        {"id": "r2", "address": "0x108", "label": "temp", "value": "None", "state": "mutated", "ref_target": None},
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x800", "label": "Marcado VIVO ✓", "value": "{nome: 'Lia'}", "state": "active"},
                        {"id": "h2", "address": "0x840", "label": "Órfão (Sem seta)", "value": "{cache: 999}", "state": "collision"},
                    ],
                    "banner": "0x840 perdeu todas as referências → candidato à coleta",
                },
            ),
            VisualStep(
                step_index=2,
                title="3. Fase Sweep: Memória Reivindicada",
                explanation="O coletor varre (Sweep) os blocos não marcados, devolvendo o endereço 0x840 como espaço livre para novos objetos.",
                takeaway="Automação que previne vazamentos sem exigir free() manual.",
                code_line=4,
                payload={
                    "layout_mode": "stack_heap",
                    "left_title": "Raízes na Stack",
                    "right_title": "Heap Limpa (Sweep)",
                    "left_slots": [
                        {"id": "r1", "address": "0x100", "label": "usuario", "value": "ref → 0x800", "state": "default", "ref_target": "h1"}
                    ],
                    "right_slots": [
                        {"id": "h1", "address": "0x800", "label": "Mantido", "value": "{nome: 'Lia'}", "state": "default"},
                        {"id": "h2", "address": "0x840", "label": "Espaço Livre", "value": "[Memória Liberada]", "state": "mutated"},
                    ],
                    "banner": "Bloco 0x840 reciclado com segurança ✓",
                },
            ),
        ]
        return TopicDetail(
            slug=slug,
            title=clean_title,
            category_slug="fundamentos",
            category_name="Fundamentos de Programação",
            difficulty=difficulty,
            read_minutes=3,
            one_liner=matched_tpl["core_idea"],
            archetype="memory_model",
            step_count=len(steps),
            complexity_tag=matched_tpl["complexity"],
            is_custom=True,
            core_idea=matched_tpl["core_idea"],
            real_world_analogy=matched_tpl["analogy"],
            when_to_use=[
                "Entender por que objetos grandes presos em listas globais causam vazamento de memória",
                "Visualizar a diferença entre variáveis na Stack e objetos recicláveis na Heap",
            ],
            code_language="python",
            code_lines=matched_tpl["code"],
            parameters=[],
            active_params={},
            steps=steps,
        )

    if matched_tpl and matched_tpl.get("git_custom") and archetype == "call_stack_tree":
        steps = [
            VisualStep(
                step_index=0,
                title="1. Criando Ramificação Isolada (Branch)",
                explanation="Partindo do commit C1 na 'main', criamos a branch 'nova-tela' apontando para o mesmo retrato base.",
                takeaway="Criar uma branch não duplica pastas: apenas cria um novo ponteiro leve.",
                code_line=1,
                payload={
                    "nodes": [
                        {"id": "c1", "label": "Commit C1", "sublabel": "main / base", "x": 28, "y": 24, "state": "visited"},
                        {"id": "c2", "label": "Commit C2", "sublabel": "nova-tela", "x": 66, "y": 52, "state": "active"},
                    ],
                    "edges": [{"source": "c1", "target": "c2", "label": "branch", "active": True}],
                    "stack_frames": [
                        {"label": "main → C1", "detail": "Estável em produção", "active": False},
                        {"label": "HEAD → nova-tela (C2)", "detail": "Novo commit isolado", "active": True},
                    ],
                    "banner": "Trabalho isolado avança em 'nova-tela' sem afetar 'main'",
                },
            ),
            VisualStep(
                step_index=1,
                title="2. Unificando Históricos com Merge",
                explanation="Ao validar o recurso, o comando 'git merge' cria o Commit C3 unindo as alterações de 'nova-tela' de volta à 'main'.",
                takeaway="O histórico completo é preservado de forma rastreável e reversível.",
                code_line=4,
                payload={
                    "nodes": [
                        {"id": "c1", "label": "Commit C1", "sublabel": " ancestral comum", "x": 24, "y": 22, "state": "visited"},
                        {"id": "c2", "label": "Commit C2", "sublabel": "nova-tela", "x": 66, "y": 48, "state": "visited"},
                        {"id": "c3", "label": "Merge C3", "sublabel": "main atualizada", "x": 46, "y": 80, "state": "found"},
                    ],
                    "edges": [
                        {"source": "c1", "target": "c2", "label": "feature", "active": True},
                        {"source": "c1", "target": "c3", "label": "base", "active": True},
                        {"source": "c2", "target": "c3", "label": "merge", "active": True},
                    ],
                    "stack_frames": [
                        {"label": "HEAD → main (C3)", "detail": "Históricos unificados ✓", "active": True}
                    ],
                    "banner": "Merge concluído → main agora incorpora todas as mudanças!",
                },
            ),
        ]
        return TopicDetail(
            slug=slug,
            title=clean_title,
            category_slug="fundamentos",
            category_name="Fundamentos de Programação",
            difficulty=difficulty,
            read_minutes=3,
            one_liner=matched_tpl["core_idea"],
            archetype="call_stack_tree",
            step_count=len(steps),
            complexity_tag=matched_tpl["complexity"],
            is_custom=True,
            core_idea=matched_tpl["core_idea"],
            real_world_analogy=matched_tpl["analogy"],
            when_to_use=[
                "Desenvolver recursos em paralelo na equipe sem quebrar a versão principal",
                "Reverter ou auditar exatamente quando cada mudança entrou no projeto",
            ],
            code_language="bash",
            code_lines=matched_tpl["code"],
            parameters=[],
            active_params={},
            steps=steps,
        )

    # Archetype-driven synthesis for any arbitrary topic!
    if archetype == "array_pointers":
        _, steps = simulate_binary_search({"array": "8, 16, 24, 32, 40, 48", "target": 32})
        steps[0].explanation = f"Visualizando '{clean_title}' sobre uma estrutura indexada: organizamos os elementos em células contíguas para acompanhar ponteiros de posição."
        code_lines = [
            f"# Modelo visual indexado: {clean_title}",
            "inicio, fim = 0, len(dados) - 1",
            "while inicio <= fim:",
            "    meio = (inicio + fim) // 2",
            "    if dados[meio] == alvo: return meio",
        ]
    elif archetype == "memory_model":
        _, steps = simulate_pointers_references({"mode": "reference"})
        steps[0].explanation = f"Aplicando o modelo de memória a '{clean_title}': separamos identificadores rápidos na Stack dos dados estruturados na Heap."
        code_lines = [
            f"# Mapa de memória para: {clean_title}",
            "origem = criar_recurso([10, 20])",
            "referencia = origem  # aponta para o mesmo bloco",
            "atualizar(referencia, 99)",
        ]
    elif archetype == "call_stack_tree":
        _, steps = simulate_recursion({"n": 3})
        steps[0].explanation = f"Decompondo '{clean_title}' em árvore hierárquica: cada nível resolve uma parte menor e devolve o resultado ao nível pai."
        code_lines = [
            f"def resolver(nivel):  # {clean_title}",
            "    if nivel == 1: return 1",
            "    parcial = resolver(nivel - 1)",
            "    return nivel * parcial",
        ]
    elif archetype == "logic_gates":
        _, steps = simulate_logic_gates({"gate": "XOR", "input_a": "1", "input_b": "0", "decimal_value": 42})
        steps[0].explanation = f"Representando '{clean_title}' no nível de sinais binários (0 e 1) e avaliação booleana direta."
        code_lines = [
            f"# Lógica binária aplicada: {clean_title}",
            "entrada_a, entrada_b = 1, 0",
            "saida = entrada_a ^ entrada_b  # avaliação direta",
        ]
    elif archetype == "relational_join":
        _, steps = simulate_sql_join({"join_type": "LEFT JOIN"})
        steps[0].explanation = f"Modelando '{clean_title}' como relação entre conjuntos de registros conectados por chaves explícitas."
        code_lines = [
            f"-- Relação estruturada: {clean_title}",
            "SELECT u.nome, p.item",
            "FROM origem u LEFT JOIN destino p ON u.id = p.origem_id;",
        ]
    else:
        # Rich system_flow synthesis tailored to matched_tpl or custom CS concept
        if matched_tpl and "nodes" in matched_tpl:
            raw_nodes = matched_tpl["nodes"]
            stages = matched_tpl["stages"]
            code_lines = matched_tpl["code"]
            core_idea = matched_tpl["core_idea"]
            analogy = matched_tpl["analogy"]
            cat_slug = matched_tpl["category_slug"]
            cat_name = matched_tpl["category_name"]
            comp_tag = matched_tpl["complexity"]
        else:
            words = [w.capitalize() for w in re.split(r"\s+(?:vs|e|com|para|em|de)\s+|\s+", clean_title) if len(w) > 2]
            subject_a = words[0] if words else clean_title[:18]
            subject_b = words[1] if len(words) > 1 else "Motor de Regra"
            raw_nodes = [
                ("n1", f"Entrada ({subject_a})", "Dados Iniciais", 18, 50),
                ("n2", f"Núcleo: {clean_title[:22]}", "Transformação", 50, 30),
                ("n3", f"Estado ({subject_b})", "Memória / Regra", 50, 74),
                ("n4", "Saída Verificada", "Resultado Final", 84, 50),
            ]
            stages = [
                (
                    f"1. Entrada e Contexto de {clean_title}",
                    f"Todo conceito como '{clean_title}' começa recebendo um estado inicial bem definido antes de qualquer transformação.",
                    "Entender o formato da entrada evita ambiguidade no processamento.",
                ),
                (
                    f"2. Mecanismo Interno em Ação",
                    f"O núcleo de '{clean_title}' aplica sua regra principal consultando e atualizando o estado intermediário passo a passo.",
                    "Cada transição altera apenas o necessário de forma previsível.",
                ),
                (
                    f"3. Estado Final Consolidado",
                    f"Após validar as invariantes de '{clean_title}', o resultado é entregue pronto para o restante do sistema.",
                    "Entrada clara → Regra determinística → Saída previsível.",
                ),
            ]
            code_lines = [
                f"# Fluxo conceitual direto: {clean_title}",
                "estado = inicializar_contexto(entrada)",
                "resultado = aplicar_mecanismo(estado)",
                "return validar_saida(resultado)",
            ]
            core_idea = f"Explicação visual direta de {clean_title}, decompondo entrada, transformação interna de estado e resultado observável."
            analogy = f"Pense em '{clean_title}' como uma estação de montagem transparente onde você vê a peça entrar, ser transformada e sair pronta."
            cat_slug = "arquitetura"
            cat_name = "Arquitetura e Hardware"
            comp_tag = "Fluxo Visual"

        steps = [
            VisualStep(
                step_index=0,
                title=stages[0][0],
                explanation=stages[0][1],
                takeaway=stages[0][2],
                code_line=1,
                payload={
                    "nodes": [
                        {"id": raw_nodes[0][0], "label": raw_nodes[0][1], "role": raw_nodes[0][2], "state_text": "Ativo", "x": raw_nodes[0][3], "y": raw_nodes[0][4], "status": "active"},
                        {"id": raw_nodes[1][0], "label": raw_nodes[1][1], "role": raw_nodes[1][2], "state_text": "Recebendo", "x": raw_nodes[1][3], "y": raw_nodes[1][4], "status": "active"},
                        {"id": raw_nodes[2][0], "label": raw_nodes[2][1], "role": raw_nodes[2][2], "state_text": "Aguardando", "x": raw_nodes[2][3], "y": raw_nodes[2][4], "status": "idle"},
                        {"id": raw_nodes[3][0], "label": raw_nodes[3][1], "role": raw_nodes[3][2], "state_text": "Pendente", "x": raw_nodes[3][3], "y": raw_nodes[3][4], "status": "idle"},
                    ],
                    "edges": [
                        {"source": raw_nodes[0][0], "target": raw_nodes[1][0], "label": "1. aciona", "active": True, "packet": "dados"},
                        {"source": raw_nodes[1][0], "target": raw_nodes[2][0], "label": "2. estado", "active": False, "packet": None},
                        {"source": raw_nodes[2][0], "target": raw_nodes[3][0], "label": "3. entrega", "active": False, "packet": None},
                    ],
                    "banner": f"Etapa 1: Entrada iniciada em {clean_title}",
                },
            ),
            VisualStep(
                step_index=1,
                title=stages[1][0],
                explanation=stages[1][1],
                takeaway=stages[1][2],
                code_line=3,
                payload={
                    "nodes": [
                        {"id": raw_nodes[0][0], "label": raw_nodes[0][1], "role": raw_nodes[0][2], "state_text": "Enviado", "x": raw_nodes[0][3], "y": raw_nodes[0][4], "status": "done"},
                        {"id": raw_nodes[1][0], "label": raw_nodes[1][1], "role": raw_nodes[1][2], "state_text": "Processando", "x": raw_nodes[1][3], "y": raw_nodes[1][4], "status": "active"},
                        {"id": raw_nodes[2][0], "label": raw_nodes[2][1], "role": raw_nodes[2][2], "state_text": "Sincronizando", "x": raw_nodes[2][3], "y": raw_nodes[2][4], "status": "active"},
                        {"id": raw_nodes[3][0], "label": raw_nodes[3][1], "role": raw_nodes[3][2], "state_text": "Preparando", "x": raw_nodes[3][3], "y": raw_nodes[3][4], "status": "idle"},
                    ],
                    "edges": [
                        {"source": raw_nodes[0][0], "target": raw_nodes[1][0], "label": "1. aciona", "active": False, "packet": None},
                        {"source": raw_nodes[1][0], "target": raw_nodes[2][0], "label": "2. opera", "active": True, "packet": "estado"},
                        {"source": raw_nodes[2][0], "target": raw_nodes[3][0], "label": "3. entrega", "active": False, "packet": None},
                    ],
                    "banner": f"Etapa 2: Transformação central de {clean_title}",
                },
            ),
            VisualStep(
                step_index=2,
                title=stages[2][0],
                explanation=stages[2][1],
                takeaway=stages[2][2],
                code_line=4,
                payload={
                    "nodes": [
                        {"id": raw_nodes[0][0], "label": raw_nodes[0][1], "role": raw_nodes[0][2], "state_text": "Concluído", "x": raw_nodes[0][3], "y": raw_nodes[0][4], "status": "done"},
                        {"id": raw_nodes[1][0], "label": raw_nodes[1][1], "role": raw_nodes[1][2], "state_text": "Concluído", "x": raw_nodes[1][3], "y": raw_nodes[1][4], "status": "done"},
                        {"id": raw_nodes[2][0], "label": raw_nodes[2][1], "role": raw_nodes[2][2], "state_text": "Validado ✓", "x": raw_nodes[2][3], "y": raw_nodes[2][4], "status": "done"},
                        {"id": raw_nodes[3][0], "label": raw_nodes[3][1], "role": raw_nodes[3][2], "state_text": "Pronto ✓", "x": raw_nodes[3][3], "y": raw_nodes[3][4], "status": "active"},
                    ],
                    "edges": [
                        {"source": raw_nodes[0][0], "target": raw_nodes[1][0], "label": "1. aciona", "active": False, "packet": None},
                        {"source": raw_nodes[1][0], "target": raw_nodes[2][0], "label": "2. opera", "active": False, "packet": None},
                        {"source": raw_nodes[2][0], "target": raw_nodes[3][0], "label": "3. resultado", "active": True, "packet": "concluído"},
                    ],
                    "banner": f"Etapa 3: Fluxo completo de {clean_title} finalizado ✓",
                },
            ),
        ]

        return TopicDetail(
            slug=slug,
            title=clean_title,
            category_slug=cat_slug,
            category_name=cat_name,
            difficulty=difficulty,
            read_minutes=3,
            one_liner=core_idea,
            archetype="system_flow",
            step_count=len(steps),
            complexity_tag=comp_tag,
            is_custom=True,
            core_idea=core_idea,
            real_world_analogy=analogy,
            when_to_use=[
                f"Compreender rapidamente como '{clean_title}' transforma entradas em resultados",
                "Revisar o modelo mental sem precisar decorar parágrafos longos de teoria",
            ],
            code_language="python",
            code_lines=code_lines,
            parameters=[],
            active_params={},
            steps=steps,
        )

    # Return non-system_flow custom topic
    return TopicDetail(
        slug=slug,
        title=clean_title,
        category_slug=matched_tpl["category_slug"] if matched_tpl else "algoritmos",
        category_name=matched_tpl["category_name"] if matched_tpl else "Algoritmos e Complexidade",
        difficulty=difficulty,
        read_minutes=3,
        one_liner=f"Visualização passo a passo do funcionamento interno de {clean_title}.",
        archetype=archetype,
        step_count=len(steps),
        complexity_tag="Visual Interativo",
        is_custom=True,
        core_idea=f"Modelo visual construído para enxergar cada mudança de estado em {clean_title}, sem abstrações invisíveis.",
        real_world_analogy=f"Enxergar {clean_title} quadro a quadro é como ver as engrenagens de um relógio através de um mostrador transparente.",
        when_to_use=[
            f"Quando quiser visualizar na prática como {clean_title} manipula dados passo a passo",
            "Para fixar a intuição visual antes de escrever código",
        ],
        code_language="python",
        code_lines=code_lines,
        parameters=[],
        active_params={},
        steps=steps,
    )
