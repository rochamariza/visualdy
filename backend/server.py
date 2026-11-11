"""Servidor HTTP do Visualdy em Python.

Executa FastAPI + Uvicorn se disponíveis no ambiente.
Caso contrário, executa servidor HTTP da biblioteca padrão do Python com exatamente
as mesmas rotas da API e o mesmo motor de explicação visual, garantindo 100% de estabilidade.
"""
import json
import os
import socket
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

PORT = int(os.environ.get("FASTAPI_PORT", "5050"))


def is_port_in_use(port: int) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.4)
            return s.connect_ex(("127.0.0.1", port)) == 0
    except Exception:
        return False


def run_fastapi() -> bool:
    try:
        import uvicorn
        from backend.main import app
        print(f"[Visualdy Backend] Iniciando FastAPI na porta {PORT}...", flush=True)
        uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
        return True
    except (ImportError, ModuleNotFoundError) as err:
        print(f"[Visualdy Backend] FastAPI/uvicorn não disponível ({err}). Usando motor HTTP nativo...", flush=True)
        return False
    except OSError as err:
        if err.errno == 98:  # Address already in use
            print(f"[Visualdy Backend] Porta {PORT} já em uso por processo existente.", flush=True)
            return True
        raise


def run_stdlib_server() -> None:
    from backend.catalog import catalog_repo
    from backend.visual_engine import generate_custom_visual_topic

    class VisualdyHandler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: object) -> None:
            # Silenciar logs para não poluir
            return

        def _send_json(self, status: int, data: object) -> None:
            raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
            self.end_headers()
            self.wfile.write(raw)

        def do_OPTIONS(self) -> None:
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
            self.end_headers()

        def _read_body(self) -> dict:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0:
                return {}
            raw = self.rfile.read(length).decode("utf-8")
            try:
                return json.loads(raw) if raw else {}
            except Exception:
                return {}

        def do_GET(self) -> None:
            parsed = urlparse(self.path)
            path = parsed.path
            qs = parse_qs(parsed.query)

            if path == "/api/health":
                self._send_json(200, {"status": "ok", "engine": "fastapi-python-visualdy"})
                return

            if path == "/api/categories":
                cats = [c.model_dump() if hasattr(c, "model_dump") else c for c in catalog_repo.list_categories()]
                self._send_json(200, cats)
                return

            if path.startswith("/api/categories/"):
                slug = path.split("/api/categories/", 1)[1].strip("/")
                cats = catalog_repo.list_categories()
                matched = next((c for c in cats if c.slug == slug), None)
                if not matched:
                    self._send_json(404, {"detail": "Categoria não encontrada."})
                    return
                topics = [t.model_dump() for t in catalog_repo.list_topics(category_slug=slug)]
                self._send_json(200, {"category": matched.model_dump(), "topics": topics})
                return

            if path == "/api/topics":
                cat = qs.get("category", [None])[0]
                q = qs.get("q", [None])[0]
                topics = [t.model_dump() for t in catalog_repo.list_topics(category_slug=cat, query=q)]
                self._send_json(200, topics)
                return

            if path.startswith("/api/topics/"):
                slug = path.split("/api/topics/", 1)[1].strip("/")
                detail = catalog_repo.build_topic_detail(slug)
                if not detail:
                    self._send_json(404, {"detail": "Assunto não encontrado."})
                    return
                self._send_json(200, detail.model_dump())
                return

            if path == "/api/study-plan":
                items = catalog_repo.get_study_plan_enriched()
                completed_count = sum(1 for item in items if item["completed"])
                self._send_json(200, {"items": items, "total": len(items), "completed_count": completed_count})
                return

            self._send_json(404, {"detail": "Rota não encontrada."})

        def do_POST(self) -> None:
            parsed = urlparse(self.path)
            path = parsed.path
            body = self._read_body()

            if path.startswith("/api/topics/") and path.endswith("/simulate"):
                slug = path[len("/api/topics/") : -len("/simulate")].strip("/")
                detail = catalog_repo.build_topic_detail(slug, override_params=body.get("params", {}))
                if not detail:
                    self._send_json(404, {"detail": "Assunto não encontrado."})
                    return
                self._send_json(200, detail.model_dump())
                return

            if path == "/api/visual-engine/generate":
                concept = str(body.get("concept", "")).strip()
                if len(concept) < 2:
                    self._send_json(422, {"detail": "Informe pelo menos 2 caracteres."})
                    return
                created = generate_custom_visual_topic(
                    concept=concept,
                    preferred_archetype=body.get("preferred_archetype"),
                    difficulty=body.get("difficulty", "Iniciante"),
                )
                if body.get("save_to_catalog", True):
                    catalog_repo.save_custom_topic(created, add_to_study=body.get("add_to_study_plan", True))
                self._send_json(200, created.model_dump())
                return

            if path == "/api/study-plan/toggle":
                try:
                    res = catalog_repo.toggle_study_topic(str(body.get("topic_slug", "")))
                    self._send_json(200, res)
                except KeyError as exc:
                    self._send_json(404, {"detail": str(exc)})
                return

            self._send_json(404, {"detail": "Rota não encontrada."})

        def do_PATCH(self) -> None:
            path = urlparse(self.path).path
            body = self._read_body()
            if path.startswith("/api/study-plan/"):
                slug = path.split("/api/study-plan/", 1)[1].strip("/")
                try:
                    res = catalog_repo.update_study_item(
                        topic_slug=slug,
                        completed=body.get("completed"),
                        last_step_viewed=body.get("last_step_viewed"),
                        notes=body.get("notes"),
                    )
                    self._send_json(200, res)
                except KeyError as exc:
                    self._send_json(404, {"detail": str(exc)})
                return
            self._send_json(404, {"detail": "Rota não encontrada."})

        def do_PUT(self) -> None:
            path = urlparse(self.path).path
            body = self._read_body()
            if path == "/api/study-plan/reorder":
                res = catalog_repo.reorder_study_plan(body.get("ordered_slugs", []))
                self._send_json(200, res)
                return
            self._send_json(404, {"detail": "Rota não encontrada."})

    try:
        print(f"[Visualdy Backend] Servidor HTTP padrão ativo em 127.0.0.1:{PORT}", flush=True)
        server = ThreadingHTTPServer(("127.0.0.1", PORT), VisualdyHandler)
        server.serve_forever()
    except OSError as err:
        if err.errno == 98:
            print(f"[Visualdy Backend] Porta {PORT} já em uso por processo existente.", flush=True)
            return
        raise


if __name__ == "__main__":
    if is_port_in_use(PORT):
        print(f"[Visualdy Backend] Porta {PORT} já está ativa e ouvindo.", flush=True)
        sys.exit(0)

    if not run_fastapi():
        run_stdlib_server()
