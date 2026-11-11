import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from backend.models import (
    CategorySummary,
    ParameterControl,
    ParameterOption,
    StudyPlanItem,
    TopicDetail,
    TopicSummary,
)
from backend.visual_engine import (
    simulate_bfs_graph,
    simulate_binary_search,
    simulate_bst,
    simulate_control_flow,
    simulate_cpu_cycle,
    simulate_event_loop,
    simulate_hash_table,
    simulate_http_flow,
    simulate_logic_gates,
    simulate_pointers_references,
    simulate_recursion,
    simulate_sorting,
    simulate_sql_join,
    simulate_stack_queue,
    simulate_two_pointers,
    simulate_variables_memory,
)

STORE_PATH = Path(__file__).parent / ".runtime_store.json"

CATEGORIES_RAW: list[dict[str, Any]] = [
    {
        "slug": "fundamentos",
        "name": "Fundamentos de Programação",
        "short_description": "Variáveis, memória RAM, controle de fluxo, ponteiros e pilha de chamadas sem caixas-pretas.",
        "mental_model": "Gavetas endereçadas, desvios de rota e quadros empilhados",
        "order": 1,
    },
    {
        "slug": "estruturas-de-dados",
        "name": "Estruturas de Dados",
        "short_description": "Como organizar dados para inserir, buscar e remover com eficiência previsível.",
        "mental_model": "Pilhas, filas, tabelas de índices, árvores e redes conectadas",
        "order": 2,
    },
    {
        "slug": "algoritmos",
        "name": "Algoritmos e Complexidade",
        "short_description": "Estratégias visuais para buscar, ordenar e cortar trabalho desnecessário.",
        "mental_model": "Ponteiros móveis que reduzem o espaço de busca passo a passo",
        "order": 3,
    },
    {
        "slug": "arquitetura",
        "name": "Arquitetura e Hardware",
        "short_description": "Do sinal elétrico binário às portas lógicas e ao ciclo interno do processador.",
        "mental_model": "Chaves 0/1 alimentando registradores e a unidade lógica",
        "order": 4,
    },
    {
        "slug": "redes-e-sistemas",
        "name": "Redes, Web e Concorrência",
        "short_description": "O caminho real de uma requisição na internet e como sistemas não travam esperando I/O.",
        "mental_model": "Pacotes viajando entre nós e filas coordenadas por eventos",
        "order": 5,
    },
    {
        "slug": "bancos-de-dados",
        "name": "Bancos de Dados",
        "short_description": "Relações entre tabelas, chaves estrangeiras e cruzamentos SQL enxergados como conjuntos.",
        "mental_model": "Tabelas conectadas por chaves que formam visões combinadas",
        "order": 6,
    },
]

SimulatorFn = Callable[[dict[str, Any]], tuple[dict[str, Any], list[Any]]]

TOPIC_BLUEPRINTS: dict[str, dict[str, Any]] = {
    "variaveis-e-memoria": {
        "title": "Variáveis, Tipos e Memória RAM",
        "category_slug": "fundamentos",
        "difficulty": "Iniciante",
        "read_minutes": 3,
        "one_liner": "Enxergue variáveis como etiquetas para endereços reais na memória RAM.",
        "archetype": "memory_model",
        "complexity_tag": "Acesso O(1)",
        "core_idea": "Declarar uma variável reserva bytes em um endereço numérico da RAM. Ler ou reatribuir consulta ou sobrescreve esse endereço.",
        "real_world_analogy": "Um armário de academia numerado (0x100) com uma etiqueta colada na porta ('pontos').",
        "when_to_use": [
            "Guardar estado temporário de cálculos e entradas do usuário",
            "Compreender por que tipos ocupam tamanhos diferentes na memória",
        ],
        "code_language": "python",
        "code_lines": [
            "pontos = 10            # aloca 0x100",
            "bonus = 25             # aloca 0x104",
            "pontos = pontos + bonus # atualiza 0x100",
        ],
        "parameters": [
            ParameterControl(key="initial_score", label="Valor inicial (pontos)", control_type="number", default_value=10, min_val=0, max_val=200, helper="Valor gravado em 0x100"),
            ParameterControl(key="bonus", label="Valor somado (bônus)", control_type="number", default_value=25, min_val=1, max_val=200, helper="Valor gravado em 0x104"),
        ],
        "simulator": simulate_variables_memory,
    },
    "condicionais-e-lacos": {
        "title": "Controle de Fluxo: Condicionais e Laços",
        "category_slug": "fundamentos",
        "difficulty": "Iniciante",
        "read_minutes": 3,
        "one_liner": "Veja exatamente quando um laço repete o bloco e quando ele decide sair.",
        "archetype": "system_flow",
        "complexity_tag": "O(n) iterações",
        "core_idea": "Um laço combina uma condição booleana e uma atualização de estado: enquanto a condição for verdadeira, o fluxo retorna ao topo.",
        "real_world_analogy": "Uma catraca de pista de corrida que conta voltas e abre a saída ao atingir a meta.",
        "when_to_use": [
            "Processar coleções de itens sem duplicar linhas de código",
            "Evitar loops infinitos garantindo que a variável avance rumo à condição de parada",
        ],
        "code_language": "python",
        "code_lines": [
            "i = 0",
            "while i < limite:",
            "    executar_bloco(i)",
            "    i += 1",
            "seguir_programa()",
        ],
        "parameters": [
            ParameterControl(key="limit", label="Número de repetições", control_type="number", default_value=3, min_val=1, max_val=4, helper="Quantidade de voltas antes de sair"),
        ],
        "simulator": simulate_control_flow,
    },
    "ponteiros-e-referencias": {
        "title": "Ponteiros: Valor vs Referência",
        "category_slug": "fundamentos",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Por que alterar uma lista em uma variável às vezes muda outra variável sem querer?",
        "archetype": "memory_model",
        "complexity_tag": "Stack → Heap",
        "core_idea": "Objetos mutáveis ficam na Heap; variáveis guardam apenas o endereço (referência). Copiar a variável copia a seta, a menos que você clone o objeto.",
        "real_world_analogy": "Enviar o link editável de um documento compartilhado (referência) vs enviar um PDF baixado (cópia).",
        "when_to_use": [
            "Prevenir bugs de mutação acidental em React, Python e JavaScript",
            "Passar estruturas grandes para funções sem gastar memória duplicando tudo",
        ],
        "code_language": "python",
        "code_lines": [
            "lista_a = [10, 20]",
            "lista_b = lista_a          # ou lista_a.copy()",
            "lista_b.append(99)         # quem foi alterado?",
        ],
        "parameters": [
            ParameterControl(
                key="mode",
                label="Modo de atribuição",
                control_type="select",
                default_value="reference",
                options=[
                    ParameterOption(label="Referência compartilhada (lista_b = lista_a)", value="reference"),
                    ParameterOption(label="Cópia independente (lista_b = lista_a.copy())", value="copy"),
                ],
                helper="Compare o efeito na Heap",
            )
        ],
        "simulator": simulate_pointers_references,
    },
    "recursao-pilha-chamadas": {
        "title": "Recursão e Pilha de Chamadas",
        "category_slug": "fundamentos",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Acompanhe cada chamada empilhando na memória até bater no caso base e voltar resolvendo.",
        "archetype": "call_stack_tree",
        "complexity_tag": "Tempo O(n) · Espaço O(n)",
        "core_idea": "Toda função recursiva reduz o problema rumo a um caso base simples; a Call Stack lembra onde cada chamada parou.",
        "real_world_analogy": "Bonecas russas Matrioskas: você abre uma por uma até chegar na menor, depois fecha todas de volta.",
        "when_to_use": [
            "Percorrer pastas, árvores DOM, JSON aninhado e algoritmos dividir-para-conquistar",
            "Substituir pilhas manuais complexas por código declarativo curto",
        ],
        "code_language": "python",
        "code_lines": [
            "def fat(n):",
            "    if n == 1: return 1",
            "    parcial = fat(n - 1)",
            "    return n * parcial",
        ],
        "parameters": [
            ParameterControl(key="n", label="Calcular fatorial de n", control_type="number", default_value=4, min_val=2, max_val=5, helper="Altura da Call Stack (2 a 5)"),
        ],
        "simulator": simulate_recursion,
    },
    "pilha-e-fila": {
        "title": "Pilha (LIFO) vs Fila (FIFO)",
        "category_slug": "estruturas-de-dados",
        "difficulty": "Iniciante",
        "read_minutes": 3,
        "one_liner": "Mesmos elementos inseridos, ordens opostas de saída: compare topo da pilha vs frente da fila.",
        "archetype": "memory_model",
        "complexity_tag": "Push / Pop O(1)",
        "core_idea": "A Pilha retira sempre o item mais recente (LIFO), ideal para desfazer ações. A Fila retira o mais antigo (FIFO), ideal para processamento justo.",
        "real_world_analogy": "Uma pilha de pratos na pia (sai o de cima) comparada à fila da padaria (sai quem chegou primeiro).",
        "when_to_use": [
            "Pilha: botão Desfazer (Ctrl+Z), histórico de navegação e Call Stack",
            "Fila: processamento de pedidos, impressoras e Busca em Largura (BFS)",
        ],
        "code_language": "python",
        "code_lines": [
            "# Entrada A, B, C",
            "pilha = ['A', 'B', 'C']; fila = deque(['A', 'B', 'C'])",
            "# Inserir novo item",
            "pilha.append(novo); fila.append(novo)",
            "# Remover próximo",
            "pilha.pop()        # vs fila.popleft()",
        ],
        "parameters": [
            ParameterControl(key="new_item", label="Novo item para inserir", control_type="text", default_value="Tarefa D", helper="Nome curto do elemento"),
        ],
        "simulator": simulate_stack_queue,
    },
    "tabela-hash": {
        "title": "Tabela Hash e Colisões",
        "category_slug": "estruturas-de-dados",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Descubra como dicionários encontram chaves em tempo O(1) e o que ocorre quando duas chaves caem no mesmo lugar.",
        "archetype": "memory_model",
        "complexity_tag": "Busca média O(1)",
        "core_idea": "Uma função hash transforma qualquer chave em um índice numérico de vetor. Se duas chaves gerarem o mesmo índice, usamos encadeamento no bucket.",
        "real_world_analogy": "Fichário alfabético por inicial do nome: você abre direto na letra certa em vez de ler todas as fichas.",
        "when_to_use": [
            "Dicionários Python (dict), objetos/Map em JS e caches em memória",
            "Contagem de frequência, deduplicação rápida e índices de busca",
        ],
        "code_language": "python",
        "code_lines": [
            "def salvar(chave, valor):",
            "    soma = sum(ord(c) for c in chave)",
            "    indice = soma % 4",
            "    buckets[indice].append((chave, valor))",
        ],
        "parameters": [
            ParameterControl(key="key", label="Chave para inserir", control_type="text", default_value="bia", helper="Teste 'bia' (livre) ou 'mia' / 'teo' (colisão)"),
        ],
        "simulator": simulate_hash_table,
    },
    "arvore-binaria-busca": {
        "title": "Árvore Binária de Busca (BST)",
        "category_slug": "estruturas-de-dados",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Menores à esquerda, maiores à direita: elimine metade da árvore a cada decisão.",
        "archetype": "call_stack_tree",
        "complexity_tag": "Busca O(log n)",
        "core_idea": "Cada nó funciona como uma placa de trânsito: valores menores descem à esquerda e valores maiores descem à direita.",
        "real_world_analogy": "Jogo de adivinhar número com dicas 'é maior' ou 'é menor' a cada palpite.",
        "when_to_use": [
            "Manter dados dinamicamente ordenados permitindo inserção e busca rápidas",
            "Base conceitual para índices B-Tree usados em bancos de dados",
        ],
        "code_language": "python",
        "code_lines": [
            "def buscar(no, alvo):",
            "    if not no: return None",
            "    if alvo == no.valor: return no",
            "    if alvo < no.valor:",
            "        return buscar(no.esq, alvo)",
            "    return buscar(no.dir, alvo)",
        ],
        "parameters": [
            ParameterControl(key="target", label="Valor procurado", control_type="number", default_value=27, min_val=1, max_val=60, helper="Tente 27, 15 (existem) ou 24 (ausente)"),
        ],
        "simulator": simulate_bst,
    },
    "grafos-busca-largura": {
        "title": "Grafos e Busca em Largura (BFS)",
        "category_slug": "estruturas-de-dados",
        "difficulty": "Avançado",
        "read_minutes": 5,
        "one_liner": "Explore conexões em ondas concêntricas para achar o menor número de saltos entre dois pontos.",
        "archetype": "system_flow",
        "complexity_tag": "O(V + E)",
        "core_idea": "Um grafo modela conexões livres (redes sociais, mapas, rotas). A BFS visita todos os vizinhos a 1 salto antes dos vizinhos a 2 saltos.",
        "real_world_analogy": "Uma gota caindo na água: a onda alcança primeiro as pedras mais próximas do centro.",
        "when_to_use": [
            "Encontrar menor rota em mapas sem peso ou graus de conexão em redes",
            "Rastreadores web (crawlers) e verificação de conectividade",
        ],
        "code_language": "python",
        "code_lines": [
            "fila = deque([('A', ['A'])])",
            "while fila:",
            "    atual, rota = fila.popleft()",
            "    if atual == destino: return rota",
            "    for vizinho in grafo[atual]:",
            "        fila.append((vizinho, rota + [vizinho]))",
        ],
        "parameters": [
            ParameterControl(
                key="goal",
                label="Nó de destino",
                control_type="select",
                default_value="E",
                options=[
                    ParameterOption(label="Destino Nó E (2 saltos)", value="E"),
                    ParameterOption(label="Destino Nó D (2 saltos via B)", value="D"),
                    ParameterOption(label="Destino Nó C (1 salto direto)", value="C"),
                ],
                helper="Escolha o nó final da busca",
            )
        ],
        "simulator": simulate_bfs_graph,
    },
    "busca-binaria": {
        "title": "Busca Binária",
        "category_slug": "algoritmos",
        "difficulty": "Iniciante",
        "read_minutes": 3,
        "one_liner": "Divida o vetor ordenado ao meio repetidamente para achar qualquer item em poucos cliques.",
        "archetype": "array_pointers",
        "complexity_tag": "Tempo O(log n)",
        "core_idea": "Olhando exatamente o elemento central de um vetor ordenado, sabemos com certeza em qual metade o alvo só pode estar.",
        "real_world_analogy": "Abrir um dicionário físico no meio e descartar metade das páginas de uma só vez.",
        "when_to_use": [
            "Sempre que a coleção já estiver ordenada e houver muitas consultas",
            "Em 1 milhão de itens ordenados, acha qualquer valor em no máximo 20 comparações",
        ],
        "code_language": "python",
        "code_lines": [
            "def busca_binaria(vetor, alvo):",
            "    inicio, fim = 0, len(vetor) - 1",
            "    while inicio <= fim:",
            "        meio = (inicio + fim) // 2",
            "        if vetor[meio] == alvo: return meio",
            "        if vetor[meio] < alvo:",
            "            inicio = meio + 1",
            "        else:",
            "            fim = meio - 1",
            "    return -1",
        ],
        "parameters": [
            ParameterControl(key="array", label="Vetor (números separados por vírgula)", control_type="text", default_value="4, 9, 14, 19, 25, 31, 42", helper="Ordenado automaticamente"),
            ParameterControl(key="target", label="Alvo da busca", control_type="number", default_value=25, min_val=-50, max_val=500, helper="Experimente 25, 4 ou 20"),
        ],
        "simulator": simulate_binary_search,
    },
    "ordenacao-vetores": {
        "title": "Algoritmos de Ordenação por Trocas",
        "category_slug": "algoritmos",
        "difficulty": "Iniciante",
        "read_minutes": 4,
        "one_liner": "Veja como comparações locais entre vizinhos transformam caos em ordem crescente.",
        "archetype": "array_pointers",
        "complexity_tag": "Comparação O(n²)",
        "core_idea": "Comparando elementos adjacentes e invertendo pares fora de ordem, os maiores valores migram progressivamente para o final.",
        "real_world_analogy": "Organizar cartas de baralho na mão trocando cartas vizinhas até formar sequência.",
        "when_to_use": [
            "Entender a mecânica fundamental de comparação, troca (swap) e invariante de ordenação",
            "Detectar rapidamente listas que já estão quase ordenadas",
        ],
        "code_language": "python",
        "code_lines": [
            "for i in range(n - 1):",
            "    for j in range(n - 1 - i):",
            "        if vetor[j] > vetor[j + 1]:",
            "            vetor[j], vetor[j + 1] = vetor[j + 1], vetor[j]",
            "# Vetor ordenado!",
        ],
        "parameters": [
            ParameterControl(key="array", label="Valores para ordenar", control_type="text", default_value="28, 12, 35, 9, 19", helper="Até 6 números separados por vírgula"),
        ],
        "simulator": simulate_sorting,
    },
    "dois-ponteiros-janela": {
        "title": "Técnica de Dois Ponteiros",
        "category_slug": "algoritmos",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Dois indicadores convergindo das pontas resolvem em O(n) o que dois laços levariam O(n²).",
        "archetype": "array_pointers",
        "complexity_tag": "Tempo O(n) · Espaço O(1)",
        "core_idea": "Em um vetor ordenado, aproximar ponteiros das extremidades permite ajustar uma soma para cima ou para baixo sem testar combinações inúteis.",
        "real_world_analogy": "Duas pessoas ajustando o foco de uma lente girando anéis opostos até a imagem ficar nítida.",
        "when_to_use": [
            "Encontrar pares com soma específica, verificar palíndromos e remover duplicatas in-place",
            "Otimizar algoritmos quadráticos lentos para tempo linear",
        ],
        "code_language": "python",
        "code_lines": [
            "esq, dir = 0, len(vetor) - 1",
            "while esq < dir:",
            "    soma = vetor[esq] + vetor[dir]",
            "    if soma == alvo: return (esq, dir)",
            "    if soma < alvo:",
            "        esq += 1",
            "    else:",
            "        dir -= 1",
            "return None",
        ],
        "parameters": [
            ParameterControl(key="array", label="Vetor ordenado", control_type="text", default_value="2, 5, 8, 11, 14, 19", helper="Números separados por vírgula"),
            ParameterControl(key="target", label="Soma desejada", control_type="number", default_value=19, min_val=1, max_val=200, helper="Tente 19 (5+14) ou 100 (sem par)"),
        ],
        "simulator": simulate_two_pointers,
    },
    "binario-e-portas-logicas": {
        "title": "Sistema Binário e Portas Lógicas",
        "category_slug": "arquitetura",
        "difficulty": "Iniciante",
        "read_minutes": 4,
        "one_liner": "Mude chaves 0 e 1 ao vivo para ver como portas lógicas e bytes constroem toda a computação.",
        "archetype": "logic_gates",
        "complexity_tag": "Base 2 · Booleana",
        "core_idea": "Transistores funcionam como interruptores microscópicos. Portas lógicas combinam esses bits para tomar decisões e somar números.",
        "real_world_analogy": "Dois interruptores em série (AND: ambos ligados acendem a lâmpada) ou em paralelo (OR: qualquer um acende).",
        "when_to_use": [
            "Compreender operadores booleanos (&&, ||, ^), máscaras de bits e permissões",
            "Entender por que 1 byte (8 bits) armazena valores de 0 a 255",
        ],
        "code_language": "python",
        "code_lines": [
            "entrada_a, entrada_b = 1, 1",
            "# Porta lógica avalia os sinais",
            "saida = entrada_a & entrada_b",
            "# Conversão decimal em 8 bits",
            "byte_str = format(numero, '08b')",
        ],
        "parameters": [
            ParameterControl(
                key="gate",
                label="Porta Lógica",
                control_type="select",
                default_value="AND",
                options=[
                    ParameterOption(label="AND (E lógico)", value="AND"),
                    ParameterOption(label="OR (OU lógico)", value="OR"),
                    ParameterOption(label="XOR (OU exclusivo)", value="XOR"),
                    ParameterOption(label="NAND (NÃO-E)", value="NAND"),
                ],
                helper="Troque o circuito lógico",
            ),
            ParameterControl(
                key="input_a",
                label="Sinal Entrada A",
                control_type="select",
                default_value="1",
                options=[ParameterOption(label="1 (Ligado)", value="1"), ParameterOption(label="0 (Desligado)", value="0")],
            ),
            ParameterControl(
                key="input_b",
                label="Sinal Entrada B",
                control_type="select",
                default_value="1",
                options=[ParameterOption(label="1 (Ligado)", value="1"), ParameterOption(label="0 (Desligado)", value="0")],
            ),
            ParameterControl(key="decimal_value", label="Número Decimal (0 a 255)", control_type="number", default_value=42, min_val=0, max_val=255, helper="Veja a decomposição em 8 bits"),
        ],
        "simulator": simulate_logic_gates,
    },
    "ciclo-cpu": {
        "title": "Ciclo da CPU: Busca, Decodifica e Executa",
        "category_slug": "arquitetura",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Acompanhe uma instrução saindo da RAM, sendo traduzida pela Unidade de Controle e calculada na ULA.",
        "archetype": "system_flow",
        "complexity_tag": "Fetch · Decode · Execute",
        "core_idea": "O processador executa programas repetindo três passos incessantes: buscar a instrução apontada pelo PC, decodificar o comando e operar nos registradores.",
        "real_world_analogy": "Um chef lendo a próxima linha da receita (Fetch), separando os ingredientes da bancada (Decode) e misturando na panela (Execute).",
        "when_to_use": [
            "Entender a diferença de velocidade entre Registradores, Cache e Memória RAM",
            "Visualizar o que realmente acontece quando seu código compilado roda no chip",
        ],
        "code_language": "asm",
        "code_lines": [
            "FETCH   IR <- RAM[PC]      ; lê instrução",
            "DECODE  OP, R1, R2 <- IR   ; prepara registradores",
            "EXECUTE R1 <- ULA(R1, R2)  ; grava resultado",
        ],
        "parameters": [
            ParameterControl(
                key="operation",
                label="Instrução da CPU",
                control_type="select",
                default_value="ADD",
                options=[
                    ParameterOption(label="ADD R1, R2 (Somar 12 + 5)", value="ADD"),
                    ParameterOption(label="SUB R1, R2 (Subtrair 12 - 5)", value="SUB"),
                    ParameterOption(label="MUL R1, R2 (Multiplicar 12 × 5)", value="MUL"),
                ],
                helper="Operação enviada para a ULA",
            )
        ],
        "simulator": simulate_cpu_cycle,
    },
    "http-dns-tcp": {
        "title": "Requisição Web: DNS, TCP e HTTP",
        "category_slug": "redes-e-sistemas",
        "difficulty": "Iniciante",
        "read_minutes": 4,
        "one_liner": "O que acontece nos milissegundos entre digitar uma URL e ver a página pronta na tela?",
        "archetype": "system_flow",
        "complexity_tag": "Camadas de Rede",
        "core_idea": "Uma visita web resolve o nome via DNS, abre um canal confiável via TCP e troca mensagens HTTP passando por caches de borda até o servidor.",
        "real_world_analogy": "Procurar o endereço de uma loja no catálogo (DNS), ligar confirmando que atendem (TCP) e fazer o pedido do produto (HTTP).",
        "when_to_use": [
            "Diagnosticar lentidão de rede, erros 404/500 e comportamento de cache CDN",
            "Conectar aplicações Front-end React a APIs Back-end FastAPI",
        ],
        "code_language": "http",
        "code_lines": [
            "# 1. DNS: visualdy.dev -> 104.21.8.9",
            "GET /assuntos HTTP/1.1",
            "Host: visualdy.dev",
            "# Resposta via Cache HIT (12ms) ou...",
            "# Resposta via Origem FastAPI 200 OK",
        ],
        "parameters": [
            ParameterControl(
                key="cache",
                label="Cenário na CDN / Cache",
                control_type="select",
                default_value="miss",
                options=[
                    ParameterOption(label="Cache MISS (Vai até o servidor de origem)", value="miss"),
                    ParameterOption(label="Cache HIT (Respondido direto na borda)", value="hit"),
                ],
                helper="Compare o caminho dos pacotes",
            )
        ],
        "simulator": simulate_http_flow,
    },
    "event-loop-assincrono": {
        "title": "Event Loop e Programação Assíncrona",
        "category_slug": "redes-e-sistemas",
        "difficulty": "Avançado",
        "read_minutes": 5,
        "one_liner": "Como uma única thread atende milhares de tarefas de rede e timers sem congelar a interface?",
        "archetype": "system_flow",
        "complexity_tag": "Não-bloqueante",
        "core_idea": "Operações lentas de I/O são delegadas ao sistema; quando terminam, entram em uma fila e o Event Loop as move para a Call Stack assim que ela esvazia.",
        "real_world_analogy": "Um barista que coloca o leite para vaporizar e já atende o próximo cliente em vez de ficar olhando a máquina parado.",
        "when_to_use": [
            "Dominar async/await tanto em TypeScript/React quanto no Python FastAPI",
            "Evitar travamentos de interface durante chamadas de API",
        ],
        "code_language": "javascript",
        "code_lines": [
            "console.log('Início');",
            "fetch('/api').then(aoReceberDados);",
            "// callback roda quando a Stack esvaziar",
            "console.log('Segue livre!');",
        ],
        "parameters": [
            ParameterControl(
                key="task_type",
                label="Tipo de tarefa assíncrona",
                control_type="select",
                default_value="fetch",
                options=[
                    ParameterOption(label="Requisição de Rede fetch('/api')", value="fetch"),
                    ParameterOption(label="Temporizador setTimeout(100ms)", value="timer"),
                ],
            )
        ],
        "simulator": simulate_event_loop,
    },
    "sql-joins-relacional": {
        "title": "Banco Relacional e SQL JOINs",
        "category_slug": "bancos-de-dados",
        "difficulty": "Intermediário",
        "read_minutes": 4,
        "one_liner": "Alterne entre INNER, LEFT, RIGHT e FULL JOIN vendo exatamente quais linhas casam e onde surge NULL.",
        "archetype": "relational_join",
        "complexity_tag": "Álgebra Relacional",
        "core_idea": "JOINs conectam linhas de duas tabelas comparando chaves (PK = FK). O tipo do JOIN decide se registros sem par são descartados ou mantidos com NULL.",
        "real_world_analogy": "Cruzar a lista de alunos matriculados com a lista de entregas de prova para ver quem entregou e quem faltou.",
        "when_to_use": [
            "Consultar relatórios combinando Usuários, Pedidos e Produtos sem duplicar colunas",
            "Escolher LEFT JOIN quando você não pode perder registros que ainda não têm itens filhos",
        ],
        "code_language": "sql",
        "code_lines": [
            "SELECT u.nome, p.descricao",
            "FROM Usuarios u JOIN Pedidos p",
            "  ON u.id = p.user_id;",
        ],
        "parameters": [
            ParameterControl(
                key="join_type",
                label="Tipo de SQL JOIN",
                control_type="select",
                default_value="INNER JOIN",
                options=[
                    ParameterOption(label="INNER JOIN (Apenas pares casados)", value="INNER JOIN"),
                    ParameterOption(label="LEFT JOIN (Todos da esquerda + NULL)", value="LEFT JOIN"),
                    ParameterOption(label="RIGHT JOIN (Todos da direita + NULL)", value="RIGHT JOIN"),
                    ParameterOption(label="FULL JOIN (União completa)", value="FULL JOIN"),
                ],
                helper="Veja a tabela resultante mudar na hora",
            )
        ],
        "simulator": simulate_sql_join,
    },
}


class CatalogRepository:
    def __init__(self) -> None:
        self.custom_topics: dict[str, TopicDetail] = {}
        self.study_plan: dict[str, StudyPlanItem] = {}
        self._load_store()

    def _default_seed_study_plan(self) -> dict[str, StudyPlanItem]:
        now = datetime.now(timezone.utc).isoformat()
        seeds = ["variaveis-e-memoria", "busca-binaria", "pilha-e-fila"]
        return {
            slug: StudyPlanItem(
                topic_slug=slug,
                added_at=now,
                completed=(slug == "variaveis-e-memoria"),
                last_step_viewed=2 if slug == "variaveis-e-memoria" else 0,
                priority=idx + 1,
            )
            for idx, slug in enumerate(seeds)
        }

    def _load_store(self) -> None:
        if STORE_PATH.exists():
            try:
                raw = json.loads(STORE_PATH.read_text(encoding="utf-8"))
                for slug, td in raw.get("custom_topics", {}).items():
                    self.custom_topics[slug] = TopicDetail.model_validate(td)
                for slug, sp in raw.get("study_plan", {}).items():
                    self.study_plan[slug] = StudyPlanItem.model_validate(sp)
                return
            except Exception:
                pass
        self.study_plan = self._default_seed_study_plan()
        self._save_store()

    def _save_store(self) -> None:
        try:
            payload = {
                "custom_topics": {k: v.model_dump() for k, v in self.custom_topics.items()},
                "study_plan": {k: v.model_dump() for k, v in self.study_plan.items()},
            }
            STORE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _category_map(self) -> dict[str, dict[str, Any]]:
        return {c["slug"]: c for c in CATEGORIES_RAW}

    def build_topic_detail(self, slug: str, override_params: dict[str, Any] | None = None) -> TopicDetail | None:
        if slug in self.custom_topics:
            return self.custom_topics[slug]
        bp = TOPIC_BLUEPRINTS.get(slug)
        if not bp:
            return None

        cat_map = self._category_map()
        cat_name = cat_map[bp["category_slug"]]["name"]
        default_params = {p.key: p.default_value for p in bp["parameters"]}
        merged_params = {**default_params, **(override_params or {})}
        active_params, steps = bp["simulator"](merged_params)

        return TopicDetail(
            slug=slug,
            title=bp["title"],
            category_slug=bp["category_slug"],
            category_name=cat_name,
            difficulty=bp["difficulty"],
            read_minutes=bp["read_minutes"],
            one_liner=bp["one_liner"],
            archetype=bp["archetype"],
            step_count=len(steps),
            complexity_tag=bp["complexity_tag"],
            is_custom=False,
            core_idea=bp["core_idea"],
            real_world_analogy=bp["real_world_analogy"],
            when_to_use=bp["when_to_use"],
            code_language=bp["code_language"],
            code_lines=bp["code_lines"],
            parameters=bp["parameters"],
            active_params=active_params,
            steps=steps,
        )

    def list_topics(self, category_slug: str | None = None, query: str | None = None) -> list[TopicSummary]:
        items: list[TopicSummary] = []
        for slug in TOPIC_BLUEPRINTS:
            detail = self.build_topic_detail(slug)
            if detail:
                items.append(TopicSummary.model_validate(detail.model_dump()))
        for detail in self.custom_topics.values():
            items.append(TopicSummary.model_validate(detail.model_dump()))

        if category_slug:
            items = [t for t in items if t.category_slug == category_slug]
        if query and query.strip():
            q = query.strip().lower()
            items = [
                t
                for t in items
                if q in t.title.lower()
                or q in t.one_liner.lower()
                or q in t.category_name.lower()
                or q in t.complexity_tag.lower()
            ]
        return items

    def list_categories(self) -> list[CategorySummary]:
        all_topics = self.list_topics()
        counts: dict[str, int] = {}
        for t in all_topics:
            counts[t.category_slug] = counts.get(t.category_slug, 0) + 1
        result = []
        for c in sorted(CATEGORIES_RAW, key=lambda x: x["order"]):
            result.append(
                CategorySummary(
                    slug=c["slug"],
                    name=c["name"],
                    short_description=c["short_description"],
                    mental_model=c["mental_model"],
                    topic_count=counts.get(c["slug"], 0),
                    order=c["order"],
                )
            )
        return result

    def save_custom_topic(self, detail: TopicDetail, add_to_study: bool = True) -> TopicDetail:
        self.custom_topics[detail.slug] = detail
        if add_to_study and detail.slug not in self.study_plan:
            self.study_plan[detail.slug] = StudyPlanItem(
                topic_slug=detail.slug,
                added_at=datetime.now(timezone.utc).isoformat(),
                completed=False,
                last_step_viewed=0,
                priority=len(self.study_plan) + 1,
            )
        self._save_store()
        return detail

    def get_study_plan_enriched(self) -> list[dict[str, Any]]:
        ordered = sorted(self.study_plan.values(), key=lambda x: x.priority)
        enriched = []
        for item in ordered:
            detail = self.build_topic_detail(item.topic_slug)
            if detail:
                summary = TopicSummary.model_validate(detail.model_dump())
                enriched.append({**item.model_dump(), "topic": summary.model_dump()})
        return enriched

    def toggle_study_topic(self, topic_slug: str) -> dict[str, Any]:
        if topic_slug in self.study_plan:
            del self.study_plan[topic_slug]
            # Re-index priorities
            for idx, item in enumerate(sorted(self.study_plan.values(), key=lambda x: x.priority)):
                item.priority = idx + 1
            self._save_store()
            return {"selected": False, "topic_slug": topic_slug, "items": self.get_study_plan_enriched()}

        detail = self.build_topic_detail(topic_slug)
        if not detail:
            raise KeyError(f"Assunto '{topic_slug}' não encontrado.")

        self.study_plan[topic_slug] = StudyPlanItem(
            topic_slug=topic_slug,
            added_at=datetime.now(timezone.utc).isoformat(),
            completed=False,
            last_step_viewed=0,
            priority=len(self.study_plan) + 1,
        )
        self._save_store()
        return {"selected": True, "topic_slug": topic_slug, "items": self.get_study_plan_enriched()}

    def update_study_item(
        self,
        topic_slug: str,
        completed: bool | None = None,
        last_step_viewed: int | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        if topic_slug not in self.study_plan:
            detail = self.build_topic_detail(topic_slug)
            if not detail:
                raise KeyError(f"Assunto '{topic_slug}' não encontrado.")
            self.study_plan[topic_slug] = StudyPlanItem(
                topic_slug=topic_slug,
                added_at=datetime.now(timezone.utc).isoformat(),
                priority=len(self.study_plan) + 1,
            )

        item = self.study_plan[topic_slug]
        if completed is not None:
            item.completed = completed
        if last_step_viewed is not None:
            item.last_step_viewed = max(0, last_step_viewed)
        if notes is not None:
            item.notes = notes[:300]
        self._save_store()
        return {"items": self.get_study_plan_enriched()}

    def reorder_study_plan(self, ordered_slugs: list[str]) -> dict[str, Any]:
        rank = 1
        for slug in ordered_slugs:
            if slug in self.study_plan:
                self.study_plan[slug].priority = rank
                rank += 1
        for slug, item in self.study_plan.items():
            if slug not in ordered_slugs:
                item.priority = rank
                rank += 1
        self._save_store()
        return {"items": self.get_study_plan_enriched()}


catalog_repo = CatalogRepository()
