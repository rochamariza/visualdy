from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.catalog import catalog_repo
from backend.models import (
    CategorySummary,
    GenerateVisualRequest,
    ReorderStudyRequest,
    SimulateRequest,
    ToggleStudyRequest,
    TopicDetail,
    TopicSummary,
    UpdateStudyItemRequest,
)
from backend.visual_engine import generate_custom_visual_topic

app = FastAPI(
    title="Visualdy API",
    description="Motor de explicações visuais interativas para computação e programação.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "engine": "fastapi-python"}


@app.get("/api/categories", response_model=list[CategorySummary])
def get_categories() -> list[CategorySummary]:
    return catalog_repo.list_categories()


@app.get("/api/categories/{category_slug}")
def get_category_detail(category_slug: str) -> dict:
    categories = catalog_repo.list_categories()
    matched = next((c for c in categories if c.slug == category_slug), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    topics = catalog_repo.list_topics(category_slug=category_slug)
    return {
        "category": matched.model_dump(),
        "topics": [t.model_dump() for t in topics],
    }


@app.get("/api/topics", response_model=list[TopicSummary])
def get_topics(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> list[TopicSummary]:
    return catalog_repo.list_topics(category_slug=category, query=q)


@app.get("/api/topics/{topic_slug}", response_model=TopicDetail)
def get_topic(topic_slug: str) -> TopicDetail:
    detail = catalog_repo.build_topic_detail(topic_slug)
    if not detail:
        raise HTTPException(status_code=404, detail="Assunto não encontrado.")
    return detail


@app.post("/api/topics/{topic_slug}/simulate", response_model=TopicDetail)
def simulate_topic(topic_slug: str, body: SimulateRequest) -> TopicDetail:
    detail = catalog_repo.build_topic_detail(topic_slug, override_params=body.params)
    if not detail:
        raise HTTPException(status_code=404, detail="Assunto não encontrado para simulação.")
    return detail


@app.post("/api/visual-engine/generate", response_model=TopicDetail)
def create_visual_explanation(body: GenerateVisualRequest) -> TopicDetail:
    concept = body.concept.strip()
    if len(concept) < 2:
        raise HTTPException(status_code=422, detail="Informe um assunto válido com pelo menos 2 caracteres.")
    generated = generate_custom_visual_topic(
        concept=concept,
        preferred_archetype=body.preferred_archetype,
        difficulty=body.difficulty,
    )
    if body.save_to_catalog:
        catalog_repo.save_custom_topic(generated, add_to_study=body.add_to_study_plan)
    return generated


@app.get("/api/study-plan")
def get_study_plan() -> dict:
    items = catalog_repo.get_study_plan_enriched()
    completed_count = sum(1 for item in items if item["completed"])
    return {
        "items": items,
        "total": len(items),
        "completed_count": completed_count,
    }


@app.post("/api/study-plan/toggle")
def toggle_study_plan(body: ToggleStudyRequest) -> dict:
    try:
        return catalog_repo.toggle_study_topic(body.topic_slug)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.patch("/api/study-plan/{topic_slug}")
def patch_study_plan_item(topic_slug: str, body: UpdateStudyItemRequest) -> dict:
    try:
        return catalog_repo.update_study_item(
            topic_slug=topic_slug,
            completed=body.completed,
            last_step_viewed=body.last_step_viewed,
            notes=body.notes,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.put("/api/study-plan/reorder")
def put_study_plan_order(body: ReorderStudyRequest) -> dict:
    return catalog_repo.reorder_study_plan(body.ordered_slugs)


# Servir Frontend SPA automaticamente se a pasta dist existir (para deploys FastAPI standalone)
import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.isdir(_DIST_DIR):
    _assets_dir = os.path.join(_DIST_DIR, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="static_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Endpoint da API não encontrado")
        candidate_file = os.path.join(_DIST_DIR, full_path)
        if full_path and os.path.isfile(candidate_file):
            return FileResponse(candidate_file)
        index_path = os.path.join(_DIST_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        return {"status": "ok", "message": "Visualdy API ativa"}

