"""
Operations Research Optimization API routes for FlowDesk AI.
Executes Google OR-Tools CP-SAT discrete constraint optimization,
returns mathematical assignment plans, unassigned backlog diagnostics, and baseline comparisons.
"""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.optimization import OptimizationRequest, OptimizationResponse
from app.services import db
from app.services.optimizer import run_ticket_assignment_optimization

router = APIRouter(prefix="/optimization", tags=["Operations Research"])

@router.post("/run", response_model=OptimizationResponse)
def run_optimization(request_params: Optional[OptimizationRequest] = None):
    """
    Executes Google OR-Tools CP-SAT discrete mathematical optimization.
    Hard constraints:
      1. At most one agent per ticket
      2. Strict category skill match required
      3. Agent must have 'Available' status
      4. Sum of assigned ticket hours <= agent max workload capacity
    Objective:
      Minimizes weighted combination of unassigned critical tickets (P1/P2 penalty),
      SLA urgency deadline risks, and team peak workload variance.
    """
    tickets = db.get_all_tickets()
    agents = db.get_all_agents()

    res = run_ticket_assignment_optimization(
        tickets=tickets,
        agents=agents,
        request_params=request_params
    )

    # Persist the run and automatically update tickets & agents state
    db.save_optimization_run(res)

    return res

@router.get("/latest", response_model=Optional[OptimizationResponse])
def get_latest_optimization():
    """
    Retrieves the most recent CP-SAT optimization plan from persistence.
    """
    return db.get_latest_optimization_run()
