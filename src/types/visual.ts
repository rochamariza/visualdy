export type VisualArchetype =
  | 'array_pointers'
  | 'memory_model'
  | 'call_stack_tree'
  | 'system_flow'
  | 'logic_gates'
  | 'relational_join';

export type DifficultyLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface ParameterOption {
  label: string;
  value: string;
}

export interface ParameterControl {
  key: string;
  label: string;
  control_type: 'select' | 'number' | 'text';
  default_value: string | number;
  options?: ParameterOption[] | null;
  min_val?: number | null;
  max_val?: number | null;
  helper: string;
}

export interface ArrayCell {
  index: number;
  value: number | string;
  state: 'default' | 'active' | 'comparing' | 'found' | 'eliminated' | 'sorted';
}

export interface ArrayPointer {
  label: string;
  index: number;
  tone: 'primary' | 'amber' | 'emerald';
}

export interface ArrayPointersPayload {
  cells: ArrayCell[];
  pointers: ArrayPointer[];
  banner: string;
  metrics: { label: string; value: string }[];
}

export interface MemorySlot {
  id: string;
  address: string;
  label: string;
  value: string;
  state: 'default' | 'active' | 'mutated' | 'removed' | 'collision';
  ref_target?: string | null;
}

export interface MemoryModelPayload {
  layout_mode: 'stack_heap' | 'lifo_fifo' | 'hash_buckets';
  left_title: string;
  right_title: string;
  left_slots: MemorySlot[];
  right_slots: MemorySlot[];
  banner: string;
}

export interface TreeNodeItem {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  state: 'default' | 'active' | 'visited' | 'found' | 'returning';
}

export interface TreeEdgeItem {
  source: string;
  target: string;
  label: string;
  active: boolean;
}

export interface StackFrameItem {
  label: string;
  detail: string;
  active: boolean;
}

export interface CallStackTreePayload {
  nodes: TreeNodeItem[];
  edges: TreeEdgeItem[];
  stack_frames: StackFrameItem[];
  banner: string;
}

export interface SystemNodeItem {
  id: string;
  label: string;
  role: string;
  state_text: string;
  x: number;
  y: number;
  status: 'idle' | 'active' | 'done' | 'warning';
}

export interface SystemEdgeItem {
  source: string;
  target: string;
  label: string;
  active: boolean;
  packet?: string | null;
}

export interface SystemFlowPayload {
  nodes: SystemNodeItem[];
  edges: SystemEdgeItem[];
  banner: string;
}

export interface TruthRow {
  a: number;
  b: number;
  out: number;
  active: boolean;
}

export interface LogicGatesPayload {
  gate: 'AND' | 'OR' | 'XOR' | 'NAND';
  input_a: number;
  input_b: number;
  output: number;
  decimal_value: number;
  bits: number[];
  truth_table: TruthRow[];
  banner: string;
}

export interface JoinTableRow {
  id: number;
  key: string;
  label: string;
  matched: boolean;
  included: boolean;
}

export interface JoinLink {
  left_index: number;
  right_index: number;
  active: boolean;
}

export interface JoinResultRow {
  left_val: string;
  key_val: string;
  right_val: string;
  has_null: boolean;
}

export interface RelationalJoinPayload {
  join_type: 'INNER JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' | 'FULL JOIN';
  left_table_name: string;
  right_table_name: string;
  left_rows: JoinTableRow[];
  right_rows: JoinTableRow[];
  links: JoinLink[];
  result_rows: JoinResultRow[];
  banner: string;
}

export interface VisualStep {
  step_index: number;
  title: string;
  explanation: string;
  takeaway: string;
  code_line: number;
  payload: Record<string, unknown>;
}

export interface CategorySummary {
  slug: string;
  name: string;
  short_description: string;
  mental_model: string;
  topic_count: number;
  order: number;
}

export interface TopicSummary {
  slug: string;
  title: string;
  category_slug: string;
  category_name: string;
  difficulty: DifficultyLevel;
  read_minutes: number;
  one_liner: string;
  archetype: VisualArchetype;
  step_count: number;
  complexity_tag: string;
  is_custom: boolean;
}

export interface TopicDetail extends TopicSummary {
  core_idea: string;
  real_world_analogy: string;
  when_to_use: string[];
  code_language: string;
  code_lines: string[];
  parameters: ParameterControl[];
  active_params: Record<string, string | number>;
  steps: VisualStep[];
}

export interface StudyPlanEntry {
  topic_slug: string;
  added_at: string;
  completed: boolean;
  last_step_viewed: number;
  notes: string;
  priority: number;
  topic: TopicSummary;
}

export interface StudyPlanResponse {
  items: StudyPlanEntry[];
  total: number;
  completed_count: number;
}
