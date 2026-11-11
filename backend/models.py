from typing import Any, Literal, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

    def Field(default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            return default_factory()
        return default

    class BaseModel:
        def __init__(self, **kwargs: Any) -> None:
            # Set default class annotations if not in kwargs
            for k, val in self.__class__.__dict__.items():
                if not k.startswith("_") and not callable(val):
                    setattr(self, k, val)
            for k, v in kwargs.items():
                setattr(self, k, v)

        def model_dump(self) -> dict[str, Any]:
            res: dict[str, Any] = {}
            for k, v in self.__dict__.items():
                if k.startswith("_"):
                    continue
                if isinstance(v, BaseModel):
                    res[k] = v.model_dump()
                elif isinstance(v, list):
                    res[k] = [item.model_dump() if isinstance(item, BaseModel) else item for item in v]
                elif isinstance(v, dict):
                    res[k] = {
                        dk: dv.model_dump() if isinstance(dv, BaseModel) else dv
                        for dk, dv in v.items()
                    }
                else:
                    res[k] = v
            return res

        @classmethod
        def model_validate(cls, data: Any) -> Any:
            if isinstance(data, cls):
                return data
            if isinstance(data, dict):
                return cls(**data)
            return data


VisualArchetype = Literal[
    "array_pointers",
    "memory_model",
    "call_stack_tree",
    "system_flow",
    "logic_gates",
    "relational_join",
]

DifficultyLevel = Literal["Iniciante", "Intermediário", "Avançado"]


class ParameterOption(BaseModel):
    label: str
    value: str


class ParameterControl(BaseModel):
    key: str
    label: str
    control_type: Literal["select", "number", "text"]
    default_value: str | int
    options: Optional[list[ParameterOption]] = None
    min_val: Optional[int] = None
    max_val: Optional[int] = None
    helper: str = ""


class VisualStep(BaseModel):
    step_index: int
    title: str
    explanation: str
    takeaway: str
    code_line: int = 1
    payload: dict[str, Any]


class CategorySummary(BaseModel):
    slug: str
    name: str
    short_description: str
    mental_model: str
    topic_count: int = 0
    order: int = 1


class TopicSummary(BaseModel):
    slug: str
    title: str
    category_slug: str
    category_name: str
    difficulty: DifficultyLevel
    read_minutes: int
    one_liner: str
    archetype: VisualArchetype
    step_count: int
    complexity_tag: str
    is_custom: bool = False


class TopicDetail(TopicSummary):
    core_idea: str
    real_world_analogy: str
    when_to_use: list[str]
    code_language: str
    code_lines: list[str]
    parameters: list[ParameterControl]
    active_params: dict[str, Any]
    steps: list[VisualStep]


class SimulateRequest(BaseModel):
    params: dict[str, Any] = Field(default_factory=dict)


class GenerateVisualRequest(BaseModel):
    concept: str = Field(default="", min_length=2, max_length=120)
    preferred_archetype: Optional[VisualArchetype] = None
    difficulty: DifficultyLevel = "Iniciante"
    save_to_catalog: bool = True
    add_to_study_plan: bool = True


class StudyPlanItem(BaseModel):
    topic_slug: str
    added_at: str
    completed: bool = False
    last_step_viewed: int = 0
    notes: str = ""
    priority: int = 1


class ToggleStudyRequest(BaseModel):
    topic_slug: str


class UpdateStudyItemRequest(BaseModel):
    completed: Optional[bool] = None
    last_step_viewed: Optional[int] = None
    notes: Optional[str] = None


class ReorderStudyRequest(BaseModel):
    ordered_slugs: list[str]
