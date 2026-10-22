"""
SQLite Database service for FlowDesk AI.
Manages persistent storage for tickets, support agents, and optimization execution results.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.models.ticket import Ticket
from app.models.employee import SupportAgent
from app.models.optimization import OptimizationResponse
from app.services.demo_data import get_demo_tickets, get_demo_agents

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "flowdesk.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        estimated_hours REAL NOT NULL,
        sla_deadline_hours REAL NOT NULL,
        status TEXT NOT NULL,
        assigned_agent_id TEXT,
        assigned_agent_name TEXT,
        ml_confidence REAL DEFAULT 0.0,
        is_low_confidence INTEGER DEFAULT 0,
        priority_reason TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        skills TEXT NOT NULL,
        availability TEXT NOT NULL,
        max_workload_hours REAL NOT NULL,
        current_assigned_hours REAL DEFAULT 0.0,
        remaining_capacity_hours REAL DEFAULT 8.0,
        assigned_ticket_ids TEXT DEFAULT '[]'
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        response_json TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

    # If DB is empty, auto-seed with demo data
    tickets = get_all_tickets()
    if not tickets:
        reset_demo_database()

def reset_demo_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM tickets")
    cursor.execute("DELETE FROM agents")
    cursor.execute("DELETE FROM optimizations")

    demo_agents = get_demo_agents()
    for a in demo_agents:
        cursor.execute("""
        INSERT INTO agents (
            id, name, role, skills, availability, max_workload_hours,
            current_assigned_hours, remaining_capacity_hours, assigned_ticket_ids
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            a.id, a.name, a.role,
            json.dumps(a.skills), a.availability, a.max_workload_hours,
            a.current_assigned_hours, a.remaining_capacity_hours,
            json.dumps(a.assigned_ticket_ids)
        ))

    demo_tickets = get_demo_tickets()
    for t in demo_tickets:
        cursor.execute("""
        INSERT INTO tickets (
            id, title, description, category, priority, estimated_hours,
            sla_deadline_hours, status, assigned_agent_id, assigned_agent_name,
            ml_confidence, is_low_confidence, priority_reason, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t.id, t.title, t.description, t.category, t.priority,
            t.estimated_hours, t.sla_deadline_hours, t.status,
            t.assigned_agent_id, t.assigned_agent_name,
            t.ml_confidence, 1 if t.is_low_confidence else 0,
            t.priority_reason, t.created_at
        ))

    conn.commit()
    conn.close()

# ----------------- Ticket Operations -----------------

def get_all_tickets() -> List[Ticket]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    tickets = []
    for r in rows:
        tickets.append(Ticket(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            category=r["category"],
            priority=r["priority"],
            estimated_hours=float(r["estimated_hours"]),
            sla_deadline_hours=float(r["sla_deadline_hours"]),
            status=r["status"],
            assigned_agent_id=r["assigned_agent_id"],
            assigned_agent_name=r["assigned_agent_name"],
            ml_confidence=float(r["ml_confidence"]) if r["ml_confidence"] is not None else None,
            is_low_confidence=bool(r["is_low_confidence"]),
            priority_reason=r["priority_reason"],
            created_at=r["created_at"]
        ))
    return tickets

def get_ticket_by_id(ticket_id: str) -> Optional[Ticket]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return Ticket(
        id=r["id"],
        title=r["title"],
        description=r["description"],
        category=r["category"],
        priority=r["priority"],
        estimated_hours=float(r["estimated_hours"]),
        sla_deadline_hours=float(r["sla_deadline_hours"]),
        status=r["status"],
        assigned_agent_id=r["assigned_agent_id"],
        assigned_agent_name=r["assigned_agent_name"],
        ml_confidence=float(r["ml_confidence"]) if r["ml_confidence"] is not None else None,
        is_low_confidence=bool(r["is_low_confidence"]),
        priority_reason=r["priority_reason"],
        created_at=r["created_at"]
    )

def insert_ticket(ticket: Ticket) -> Ticket:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tickets (
        id, title, description, category, priority, estimated_hours,
        sla_deadline_hours, status, assigned_agent_id, assigned_agent_name,
        ml_confidence, is_low_confidence, priority_reason, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket.id, ticket.title, ticket.description, ticket.category,
        ticket.priority, ticket.estimated_hours, ticket.sla_deadline_hours,
        ticket.status, ticket.assigned_agent_id, ticket.assigned_agent_name,
        ticket.ml_confidence, 1 if ticket.is_low_confidence else 0,
        ticket.priority_reason, ticket.created_at
    ))
    conn.commit()
    conn.close()
    return ticket

def update_ticket(ticket_id: str, updates: Dict[str, Any]) -> Optional[Ticket]:
    conn = get_db_connection()
    cursor = conn.cursor()

    set_clauses = []
    params = []
    allowed = (
        "title", "description", "category", "priority", "estimated_hours",
        "sla_deadline_hours", "status", "assigned_agent_id", "assigned_agent_name",
        "ml_confidence", "is_low_confidence", "priority_reason"
    )
    for k, v in updates.items():
        if k in allowed:
            set_clauses.append(f"{k} = ?")
            if k == "is_low_confidence":
                params.append(1 if v else 0)
            else:
                params.append(v)

    if not set_clauses:
        conn.close()
        return get_ticket_by_id(ticket_id)

    params.append(ticket_id)
    query = f"UPDATE tickets SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()
    return get_ticket_by_id(ticket_id)

def delete_ticket(ticket_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
    rows = cursor.rowcount
    conn.commit()
    conn.close()
    return rows > 0

# ----------------- Agent Operations -----------------

def get_all_agents() -> List[SupportAgent]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agents ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    agents = []
    for r in rows:
        skills = json.loads(r["skills"]) if r["skills"] else []
        assign_ids = json.loads(r["assigned_ticket_ids"]) if r["assigned_ticket_ids"] else []
        agents.append(SupportAgent(
            id=r["id"],
            name=r["name"],
            role=r["role"],
            skills=skills,
            availability=r["availability"],
            max_workload_hours=float(r["max_workload_hours"]),
            current_assigned_hours=float(r["current_assigned_hours"] or 0.0),
            remaining_capacity_hours=float(r["remaining_capacity_hours"] or 0.0),
            assigned_ticket_ids=assign_ids
        ))
    return agents

def get_agent_by_id(agent_id: str) -> Optional[SupportAgent]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    skills = json.loads(r["skills"]) if r["skills"] else []
    assign_ids = json.loads(r["assigned_ticket_ids"]) if r["assigned_ticket_ids"] else []
    return SupportAgent(
        id=r["id"],
        name=r["name"],
        role=r["role"],
        skills=skills,
        availability=r["availability"],
        max_workload_hours=float(r["max_workload_hours"]),
        current_assigned_hours=float(r["current_assigned_hours"] or 0.0),
        remaining_capacity_hours=float(r["remaining_capacity_hours"] or 0.0),
        assigned_ticket_ids=assign_ids
    )

def insert_agent(agent: SupportAgent) -> SupportAgent:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO agents (
        id, name, role, skills, availability, max_workload_hours,
        current_assigned_hours, remaining_capacity_hours, assigned_ticket_ids
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        agent.id, agent.name, agent.role,
        json.dumps(agent.skills), agent.availability, agent.max_workload_hours,
        agent.current_assigned_hours, agent.remaining_capacity_hours,
        json.dumps(agent.assigned_ticket_ids)
    ))
    conn.commit()
    conn.close()
    return agent

def update_agent(agent_id: str, updates: Dict[str, Any]) -> Optional[SupportAgent]:
    conn = get_db_connection()
    cursor = conn.cursor()

    set_clauses = []
    params = []
    for k, v in updates.items():
        if k in ("name", "role", "availability", "max_workload_hours", "current_assigned_hours", "remaining_capacity_hours"):
            set_clauses.append(f"{k} = ?")
            params.append(v)
        elif k in ("skills", "assigned_ticket_ids"):
            set_clauses.append(f"{k} = ?")
            params.append(json.dumps(v))

    if not set_clauses:
        conn.close()
        return get_agent_by_id(agent_id)

    params.append(agent_id)
    query = f"UPDATE agents SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()
    return get_agent_by_id(agent_id)

# ----------------- Optimization Persistence -----------------

def save_optimization_run(response: OptimizationResponse):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO optimizations (timestamp, response_json)
    VALUES (?, ?)
    """, (now_str, response.model_dump_json()))

    # Build agent workload and ticket assignments mapping
    assigned_ticket_agent_map = {a.ticket_id: (a.agent_id, a.agent_name) for a in response.assignments}
    
    # Map agent id -> (assigned_hours, list of ticket_ids)
    agent_workloads: Dict[str, Dict[str, Any]] = {}
    for w in response.agent_workload_summaries:
        agent_workloads[w.agent_id] = {
            "assigned_hours": w.assigned_hours,
            "max_hours": w.max_workload_hours,
            "remaining": max(0.0, round(w.max_workload_hours - w.assigned_hours, 1)),
            "ticket_ids": []
        }

    for a in response.assignments:
        if a.agent_id in agent_workloads:
            agent_workloads[a.agent_id]["ticket_ids"].append(a.ticket_id)

    # Update tickets
    for t_id, (a_id, a_name) in assigned_ticket_agent_map.items():
        cursor.execute("""
        UPDATE tickets
        SET status = 'Assigned', assigned_agent_id = ?, assigned_agent_name = ?
        WHERE id = ?
        """, (a_id, a_name, t_id))

    for b in response.backlog:
        cursor.execute("""
        UPDATE tickets
        SET status = 'Unassigned', assigned_agent_id = NULL, assigned_agent_name = NULL
        WHERE id = ?
        """, (b.ticket_id,))

    # Update agents
    for a_id, w in agent_workloads.items():
        cursor.execute("""
        UPDATE agents
        SET current_assigned_hours = ?, remaining_capacity_hours = ?, assigned_ticket_ids = ?
        WHERE id = ?
        """, (
            w["assigned_hours"],
            w["remaining"],
            json.dumps(w["ticket_ids"]),
            a_id
        ))

    conn.commit()
    conn.close()

def get_latest_optimization_run() -> Optional[OptimizationResponse]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT response_json FROM optimizations ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = json.loads(row["response_json"])
    return OptimizationResponse(**data)
