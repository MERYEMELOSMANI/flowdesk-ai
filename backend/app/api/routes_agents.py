"""
Support Agent Management API routes for FlowDesk AI.
Enables listing agents, updating availability, adjusting capacity, and editing skills.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.employee import SupportAgent, SupportAgentCreate, AgentAvailability
from app.services import db

router = APIRouter(prefix="/agents", tags=["Support Agents"])

class AgentPatchRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    availability: Optional[AgentAvailability] = None
    max_workload_hours: Optional[float] = Field(default=None, gt=0, le=40)

@router.get("", response_model=List[SupportAgent])
def list_agents():
    """
    Returns all support agents with current allocations and remaining capacities.
    """
    return db.get_all_agents()

@router.get("/{agent_id}", response_model=SupportAgent)
def get_agent(agent_id: str):
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    return agent

@router.post("", response_model=SupportAgent)
def create_agent(req: SupportAgentCreate):
    existing = db.get_all_agents()
    new_num = len(existing) + 101
    new_id = f"AGT-{new_num}"

    agent = SupportAgent(
        id=new_id,
        name=req.name,
        role=req.role,
        skills=req.skills,
        availability=req.availability,
        max_workload_hours=req.max_workload_hours,
        current_assigned_hours=0.0,
        remaining_capacity_hours=req.max_workload_hours,
        assigned_ticket_ids=[]
    )
    return db.insert_agent(agent)

@router.patch("/{agent_id}", response_model=SupportAgent)
def patch_agent(agent_id: str, updates: AgentPatchRequest):
    """
    Interactive Simulation endpoint:
    Allows user to toggle availability ('Available', 'Busy', 'Away', 'Offline')
    or adjust max workload capacity in real-time.
    """
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    # Recalculate remaining capacity if max_workload_hours changed
    if "max_workload_hours" in update_dict:
        new_max = update_dict["max_workload_hours"]
        update_dict["remaining_capacity_hours"] = max(0.0, round(new_max - agent.current_assigned_hours, 1))

    updated = db.update_agent(agent_id, update_dict)
    return updated
