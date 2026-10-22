from typing import List, Literal, Optional
from pydantic import BaseModel, Field

AgentAvailability = Literal["Available", "Busy", "Away", "Offline"]

class SupportAgentCreate(BaseModel):
    name: str = Field(..., description="Agent full name")
    role: str = Field(..., description="Role/Specialization, e.g. Senior Tech Lead, Billing Specialist")
    skills: List[str] = Field(..., min_length=1, description="List of supported ticket categories")
    availability: AgentAvailability = Field(default="Available")
    max_workload_hours: float = Field(default=8.0, gt=0, le=40, description="Maximum total workload capacity in hours")

class SupportAgent(SupportAgentCreate):
    id: str = Field(..., description="Unique agent identifier, e.g. AGT-01")
    current_assigned_hours: float = 0.0
    remaining_capacity_hours: float = 8.0
    assigned_ticket_ids: List[str] = Field(default_factory=list)
