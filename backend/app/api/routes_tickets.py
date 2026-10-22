"""
Ticket Management API routes for FlowDesk AI.
Supports ticket inbox querying, manual ticket creation with ML inference,
CSV batch import, priority/status overrides, and deletion.
"""

import io
import csv
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field, ValidationError

from app.models.ticket import Ticket, TicketCreate, TicketPriority, TicketStatus
from app.services import db
from app.api.routes_ml import classifier_engine

router = APIRouter(prefix="/tickets", tags=["Tickets"])

class TicketPatchRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3)
    description: Optional[str] = Field(default=None, min_length=5)
    category: Optional[str] = None
    priority: Optional[TicketPriority] = None
    estimated_hours: Optional[float] = Field(default=None, gt=0, le=24, allow_inf_nan=False)
    sla_deadline_hours: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)
    status: Optional[TicketStatus] = None
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None

@router.get("", response_model=List[Ticket])
def list_tickets(status: Optional[str] = None, category: Optional[str] = None, priority: Optional[str] = None):
    """
    Retrieve all tickets from SQLite inbox with optional status/category filtering.
    """
    tickets = db.get_all_tickets()
    if status:
        tickets = [t for t in tickets if t.status.lower() == status.lower()]
    if category:
        tickets = [t for t in tickets if t.category.lower() == category.lower()]
    if priority:
        tickets = [t for t in tickets if t.priority.lower() == priority.lower()]
    return tickets

@router.get("/{ticket_id}", response_model=Ticket)
def get_ticket(ticket_id: str):
    ticket = db.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket

@router.post("", response_model=Ticket)
def create_ticket(req: TicketCreate):
    """
    Creates a ticket. If category or priority are omitted or requested to auto-classify,
    uses the Scikit-learn TF-IDF + Logistic Regression model to classify and suggest priority.
    """
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Generate sequential unique ticket ID
    existing = db.get_all_tickets()
    max_num = 1000
    for t in existing:
        if t.id.startswith("TCK-"):
            try:
                num = int(t.id.split("-")[1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    new_id = f"TCK-{max_num + 1}"

    # ML classification if not provided or to record confidence
    ml_res = classifier_engine.predict(title=req.title, description=req.description)
    category = req.category if req.category else ml_res.predicted_category
    priority = req.priority if req.priority else ml_res.recommended_priority

    ticket = Ticket(
        id=new_id,
        title=req.title,
        description=req.description,
        category=category,
        priority=priority,
        estimated_hours=req.estimated_hours,
        sla_deadline_hours=req.sla_deadline_hours,
        status="Unassigned",
        assigned_agent_id=None,
        assigned_agent_name=None,
        ml_confidence=ml_res.confidence_score,
        is_low_confidence=ml_res.is_low_confidence,
        priority_reason=ml_res.priority_reason,
        created_at=now_str
    )

    created = db.insert_ticket(ticket)
    return created

@router.patch("/{ticket_id}", response_model=Ticket)
def patch_ticket(ticket_id: str, updates: TicketPatchRequest):
    """
    Allows user to override priority, category, status, or assignment.
    """
    existing = db.get_ticket_by_id(ticket_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    updated = db.update_ticket(ticket_id, update_dict)
    return updated

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: str):
    success = db.delete_ticket(ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return {"message": f"Ticket {ticket_id} deleted successfully"}

@router.post("/import-csv", response_model=Dict[str, Any])
async def import_tickets_csv(file: UploadFile = File(...)):
    """
    Imports tickets from CSV. Automatically infers missing categories and priorities with ML.
    """
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    created_tickets = []
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    existing = db.get_all_tickets()
    max_num = 1000
    for t in existing:
        if t.id.startswith("TCK-"):
            try:
                num = int(t.id.split("-")[1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass

    for row_number, row in enumerate(reader, start=2):
        # Flexible key matching
        title = row.get("title") or row.get("Title") or row.get("subject") or row.get("Subject") or ""
        desc = row.get("description") or row.get("Description") or row.get("body") or row.get("Body") or title
        if not title.strip():
            continue

        cat = row.get("category") or row.get("Category")
        pri = row.get("priority") or row.get("Priority")
        try:
            validated = TicketCreate(
                title=title.strip(), description=desc.strip(),
                estimated_hours=row.get("estimated_hours") or row.get("Estimated Hours") or row.get("hours") or 2.0,
                sla_deadline_hours=row.get("sla_deadline_hours") or row.get("SLA Deadline") or row.get("deadline") or 8.0,
            )
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid CSV row {row_number}: {exc}") from exc
        est_hrs = validated.estimated_hours
        sla_hrs = validated.sla_deadline_hours

        ml_res = classifier_engine.predict(title=title, description=desc)
        final_cat = cat if cat and cat.strip() else ml_res.predicted_category
        final_pri = pri.strip() if pri and pri.strip() in ("P1", "P2", "P3", "P4") else ml_res.recommended_priority

        max_num += 1
        t_id = f"TCK-{max_num}"

        t = Ticket(
            id=t_id,
            title=title.strip(),
            description=desc.strip(),
            category=final_cat,
            priority=final_pri,
            estimated_hours=est_hrs,
            sla_deadline_hours=sla_hrs,
            status="Unassigned",
            assigned_agent_id=None,
            assigned_agent_name=None,
            ml_confidence=ml_res.confidence_score,
            is_low_confidence=ml_res.is_low_confidence,
            priority_reason=ml_res.priority_reason,
            created_at=now_str
        )
        created_tickets.append(t)

    # Validate the entire CSV before writing any rows.
    for ticket in created_tickets:
        db.insert_ticket(ticket)

    return {
        "imported_count": len(created_tickets),
        "tickets": created_tickets
    }
