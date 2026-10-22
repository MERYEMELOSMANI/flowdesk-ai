/**
 * FlowDesk AI - Typed API Client and Data Interfaces
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export type TicketPriority = "P1" | "P2" | "P3" | "P4";
export type TicketStatus = "Unassigned" | "Assigned" | "In Progress" | "Resolved";
export type AgentAvailability = "Available" | "Busy" | "Away" | "Offline";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  estimated_hours: number;
  sla_deadline_hours: number;
  status: TicketStatus;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  ml_confidence?: number | null;
  is_low_confidence: boolean;
  priority_reason?: string | null;
  created_at: string;
}

export interface TicketCreatePayload {
  title: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
  estimated_hours: number;
  sla_deadline_hours: number;
}

export interface SupportAgent {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: AgentAvailability;
  max_workload_hours: number;
  current_assigned_hours: number;
  remaining_capacity_hours: number;
  assigned_ticket_ids: string[];
}

export interface AssignmentDecision {
  ticket_id: string;
  ticket_title: string;
  ticket_priority: string;
  ticket_category: string;
  estimated_hours: number;
  agent_id: string;
  agent_name: string;
  reason: string;
}

export interface UnassignedExplanation {
  ticket_id: string;
  ticket_title: string;
  ticket_priority: string;
  ticket_category: string;
  estimated_hours: number;
  reason: string;
}

export interface AgentWorkloadSummary {
  agent_id: string;
  agent_name: string;
  availability: string;
  assigned_count: number;
  assigned_hours: number;
  max_workload_hours: number;
  utilization_pct: number;
  is_overloaded: boolean;
}

export interface BaselineComparison {
  baseline_algorithm: string;
  optimizer_assigned_count: number;
  baseline_assigned_count: number;
  optimizer_unassigned_p1_p2: number;
  baseline_unassigned_p1_p2: number;
  sla_breach_risk_reduction_pct: number;
  workload_variance_reduction_pct: number;
  explanation: string;
}

export interface OptimizationResponse {
  status: string;
  total_assigned_tickets: number;
  total_unassigned_tickets: number;
  assignments: AssignmentDecision[];
  backlog: UnassignedExplanation[];
  agent_workload_summaries: AgentWorkloadSummary[];
  baseline_comparison: BaselineComparison;
  objective_value: number;
  solver_time_ms: number;
  objective_explanation: string[];
}

export interface ClassMetrics {
  category: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ModelEvaluationReport {
  model_architecture: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  per_class_metrics: ClassMetrics[];
  confusion_matrix: number[][];
  class_labels: string[];
  disclaimer: string;
}

export interface ClassificationResult {
  predicted_category: string;
  confidence_score: number;
  is_low_confidence: boolean;
  recommended_priority: string;
  priority_reason: string;
  probabilities: Record<string, number>;
}

// ----------------- API Request Helpers -----------------

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE}/tickets`);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function createTicket(payload: TicketCreatePayload): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create ticket");
  return res.json();
}

export async function patchTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update ticket ${id}`);
  return res.json();
}

export async function deleteTicket(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete ticket ${id}`);
}

export async function uploadTicketsCsv(file: File): Promise<{ imported_count: number; tickets: Ticket[] }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/tickets/import-csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to import CSV");
  return res.json();
}

export async function fetchAgents(): Promise<SupportAgent[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function patchAgent(id: string, updates: Partial<SupportAgent>): Promise<SupportAgent> {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update agent ${id}`);
  return res.json();
}

export async function runOptimization(params?: {
  weight_unassigned_p1?: number;
  weight_unassigned_p2?: number;
  weight_unassigned_p3?: number;
  weight_unassigned_p4?: number;
  weight_sla_risk?: number;
  weight_workload_balance?: number;
}): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/optimization/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error("Failed to run optimization");
  return res.json();
}

export async function fetchLatestOptimization(): Promise<OptimizationResponse | null> {
  const res = await fetch(`${API_BASE}/optimization/latest`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch latest optimization");
  return res.json();
}

export async function fetchModelEvaluation(): Promise<ModelEvaluationReport> {
  const res = await fetch(`${API_BASE}/ml/evaluation`);
  if (!res.ok) throw new Error("Failed to fetch model evaluation");
  return res.json();
}

export async function predictTicket(title: string, description: string): Promise<ClassificationResult> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error("Failed to run ML prediction");
  return res.json();
}

export async function loadDemoScenario(): Promise<{ message: string; ticket_count: number; agent_count: number; initial_optimization_status: string; initial_assigned_count: number; initial_backlog_count: number }> {
  const res = await fetch(`${API_BASE}/demo/load`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to load demo scenario");
  return res.json();
}

export async function resetDemoData(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset demo data");
  return res.json();
}
