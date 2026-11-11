import unittest
from backend.catalog import CatalogRepository
from backend.visual_engine import (
    generate_custom_visual_topic,
    simulate_binary_search,
    simulate_logic_gates,
    simulate_sql_join,
)


class TestVisualEngine(unittest.TestCase):
    def test_binary_search_finds_existing_element(self) -> None:
        params, steps = simulate_binary_search({"array": "10, 20, 30, 40, 50", "target": 40})
        self.assertEqual(params["target"], 40)
        self.assertGreaterEqual(len(steps), 2)
        self.assertIn("Encontrado", steps[-1].title)

    def test_binary_search_handles_missing_element(self) -> None:
        _, steps = simulate_binary_search({"array": "2, 4, 6, 8", "target": 5})
        self.assertIn("Ausente", steps[-1].title)

    def test_logic_gates_truth_evaluation(self) -> None:
        _, steps = simulate_logic_gates({"gate": "XOR", "input_a": "1", "input_b": "1", "decimal_value": 15})
        self.assertEqual(steps[1].payload["output"], 0)
        self.assertEqual(steps[2].payload["bits"], [0, 0, 0, 0, 1, 1, 1, 1])

    def test_sql_join_row_counts(self) -> None:
        _, inner_steps = simulate_sql_join({"join_type": "INNER JOIN"})
        _, full_steps = simulate_sql_join({"join_type": "FULL JOIN"})
        self.assertEqual(len(inner_steps[-1].payload["result_rows"]), 2)
        self.assertEqual(len(full_steps[-1].payload["result_rows"]), 4)

    def test_custom_visual_generator_creates_valid_blueprint(self) -> None:
        topic = generate_custom_visual_topic("Deadlock entre Processos", difficulty="Intermediário")
        self.assertTrue(topic.slug.startswith("visual-"))
        self.assertEqual(topic.archetype, "system_flow")
        self.assertGreaterEqual(len(topic.steps), 3)

    def test_catalog_lists_all_six_categories(self) -> None:
        repo = CatalogRepository()
        cats = repo.list_categories()
        self.assertEqual(len(cats), 6)
        self.assertTrue(all(c.topic_count >= 1 for c in cats))


if __name__ == "__main__":
    unittest.main()
