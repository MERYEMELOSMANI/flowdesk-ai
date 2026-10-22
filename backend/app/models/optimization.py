from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.ticket import Ticket
from app.models.employee import SupportAgent

class OptimizationRequest(BaseModel):
    tickets: Optional[List[Ticket]] = None
    agents: Optional[List[SupportAgent]] = None
    weight_unassigned_p1: int = Field(default=2000, description="Penalty for leaving P1 unassigned")
    weight_unassigned_p2: int = Field(default=1000, description="Penalty for leaving P2 unassigned")
    weight_unassigned_p3: int = Field(default=400, description="Penalty for leaving P3 unassigned")
    weight_unassigned_p4: int = Field(default=100, description="Penalty for leaving P4 unassigned")
    weight_sla_risk: int = Field(default=80, description="Penalty multiplier for high SLA risk")
    weight_workload_balance: int = Field(default=25, description="Penalty for variance/peak workload among agents")

class AssignmentDecision(BaseModel):
    ticket_id: str
    ticket_title: str
    ticket_priority: str
    ticket_category: str
    estimated_hours: float
    agent_id: str
    agent_name: str
    reason: str

class UnassignedExplanation(BaseModel):
    ticket_id: str
    ticket_title: str
    ticket_priority: str
    ticket_category: str
    estimated_hours: float
    reason: str

class AgentWorkloadSummary(BaseModel):
    agent_id: str
    agent_name: str
    availability: str
    assigned_count: int
    assigned_hours: float
    max_workload_hours: float
    utilization_pct: float
    is_overloaded: bool

class BaselineComparison(BaseModel):
    baseline_algorithm: str = "Round-Robin / First-Available Heuristic"
    optimizer_assigned_count: int
    baseline_assigned_count: int
    optimizer_unassigned_p1_p2: int
    baseline_unassigned_p1_p2: int
    sla_breach_risk_reduction_pct: float
    workload_variance_reduction_pct: float
    explanation: str

class OptimizationResponse(BaseModel):
    status: str = Field(..., description="'OPTIMAL', 'FEASIBLE', or 'INFEASIBLE'")
    total_assigned_tickets: int
    total_unassigned_tickets: int
    assignments: List[AssignmentDecision]
    backlog: List[UnassignedExplanation]
    agent_workload_summaries: List[AgentWorkloadSummary]
    baseline_comparison: BaselineComparison
    objective_value: float
    solver_time_ms: float
    objective_explanation: List[str]
