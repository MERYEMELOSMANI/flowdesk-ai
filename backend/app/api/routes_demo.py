"""
Demonstration Management API routes for FlowDesk AI.
Enables loading the enterprise demonstration scenario, clearing data, and resetting state.
"""

from fastapi import APIRouter
from typing import Dict, Any

from app.services import db
from app.services.optimizer import run_ticket_assignment_optimization

router = APIRouter(prefix="/demo", tags=["Demo Management"])

@router.post("/load", response_model=Dict[str, Any])
def load_demo_scenario():
    """
    Resets the database with 24 realistic enterprise tickets and 6 support agents.
    Tariq Al-Mansoor starts in 'Busy' status to demonstrate an overloaded capacity bottleneck.
    """
    db.reset_demo_database()
    tickets = db.get_all_tickets()
    agents = db.get_all_agents()

    # Run initial optimization so the demonstrator is immediately interactive
    opt_res = run_ticket_assignment_optimization(tickets, agents)
    db.save_optimization_run(opt_res)

    return {
        "message": "Demo scenario loaded successfully with 24 tickets and 6 agents.",
        "ticket_count": len(tickets),
        "agent_count": len(agents),
        "initial_optimization_status": opt_res.status,
        "initial_assigned_count": opt_res.total_assigned_tickets,
        "initial_backlog_count": opt_res.total_unassigned_tickets
    }

@router.post("/reset", response_model=Dict[str, Any])
def reset_to_clean_state():
    """
    Clears all assignments, leaving tickets unassigned for a clean optimization run.
    """
    db.reset_demo_database()
    return {"message": "State reset to unassigned demo tickets."}
