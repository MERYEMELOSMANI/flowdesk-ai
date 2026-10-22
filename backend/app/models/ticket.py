from typing import Optional, Literal
from pydantic import BaseModel, Field

TicketPriority = Literal["P1", "P2", "P3", "P4"]
TicketStatus = Literal["Unassigned", "Assigned", "In Progress", "Resolved"]

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Ticket title/subject")
    description: str = Field(..., min_length=5, description="Full ticket issue description")
    category: Optional[str] = Field(default=None, description="Support category (auto-classified if omitted)")
    priority: Optional[TicketPriority] = Field(default=None, description="P1, P2, P3, or P4 (auto-recommended if omitted)")
    estimated_hours: float = Field(default=2.0, gt=0, le=24, allow_inf_nan=False, description="Estimated work hours to resolve")
    sla_deadline_hours: float = Field(default=8.0, gt=0, allow_inf_nan=False, description="SLA resolution deadline in hours")

class Ticket(TicketCreate):
    id: str = Field(..., description="Unique ticket identifier, e.g. TCK-101")
    category: str
    priority: TicketPriority
    status: TicketStatus = Field(default="Unassigned")
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    ml_confidence: Optional[float] = None
    is_low_confidence: bool = False
    priority_reason: Optional[str] = None
    created_at: str
