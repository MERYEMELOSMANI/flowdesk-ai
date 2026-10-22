"""
Automated unit tests for FlowDesk AI Operations Research CP-SAT Optimizer.
Validates hard constraint enforcement, skill matching, capacity limits, and backlog explanations.
"""

import pytest
from app.models.ticket import Ticket
from app.models.employee import SupportAgent
from app.services.optimizer import run_ticket_assignment_optimization, diagnose_unassigned_ticket

@pytest.fixture
def sample_agents():
    return [
        SupportAgent(
            id="AGT-1",
            name="Alice",
            role="Tech Support Specialist",
            skills=["Technical Support"],
            availability="Available",
            max_workload_hours=4.0
        ),
        SupportAgent(
            id="AGT-2",
            name="Bob",
            role="Billing Specialist",
            skills=["Billing"],
            availability="Available",
            max_workload_hours=5.0
        ),
        SupportAgent(
            id="AGT-3",
            name="Charlie",
            role="Unavailable Senior Tech",
            skills=["Technical Support", "Service Request"],
            availability="Busy",  # Not Available
            max_workload_hours=8.0
        )
    ]

def test_hard_constraint_skill_matching(sample_agents):
    tickets = [
        Ticket(
            id="T-1",
            title="Database lock issue",
            description="DB lock",
            category="Technical Support",
            priority="P1",
            estimated_hours=2.0,
            sla_deadline_hours=2.0,
            created_at="2026-10-22 10:00:00"
        ),
        Ticket(
            id="T-2",
            title="Invoice credit memo request",
            description="Invoice dispute",
            category="Billing",
            priority="P2",
            estimated_hours=3.0,
            sla_deadline_hours=4.0,
            created_at="2026-10-22 10:00:00"
        )
    ]

    res = run_ticket_assignment_optimization(tickets, sample_agents)
    assert res.status in ("OPTIMAL", "FEASIBLE")
    assert res.total_assigned_tickets == 2

    assign_map = {a.ticket_id: a.agent_id for a in res.assignments}
    # T-1 (Tech) must go to Alice (AGT-1) who has Technical Support skill
    assert assign_map["T-1"] == "AGT-1"
    # T-2 (Billing) must go to Bob (AGT-2) who has Billing skill
    assert assign_map["T-2"] == "AGT-2"

def test_hard_constraint_availability_never_violated(sample_agents):
    # Ticket requires "Service Request" - only Charlie has it, but Charlie is Busy!
    ticket_sr = Ticket(
        id="T-SR",
        title="Provision sandbox AWS server",
        description="Need sandbox AWS instance",
        category="Service Request",
        priority="P1",
        estimated_hours=2.0,
        sla_deadline_hours=2.0,
        created_at="2026-10-22 10:00:00"
    )

    res = run_ticket_assignment_optimization([ticket_sr], sample_agents)
    # Must NOT assign to Charlie because Charlie is Busy
    assert res.total_assigned_tickets == 0
    assert res.total_unassigned_tickets == 1
    assert "Availability Constraint" in res.backlog[0].reason

def test_hard_constraint_capacity_limit_never_exceeded(sample_agents):
    # Alice has max_workload_hours = 4.0
    # Two tickets for Technical Support: 3.0h and 2.5h (total 5.5h > 4.0h)
    tickets = [
        Ticket(
            id="T-BIG1",
            title="Prod outage P1",
            description="Outage",
            category="Technical Support",
            priority="P1",
            estimated_hours=3.0,
            sla_deadline_hours=1.0,
            created_at="2026-10-22 10:00:00"
        ),
        Ticket(
            id="T-BIG2",
            title="Non-critical bug P4",
            description="Bug report",
            category="Technical Support",
            priority="P4",
            estimated_hours=2.5,
            sla_deadline_hours=24.0,
            created_at="2026-10-22 10:00:00"
        )
    ]

    res = run_ticket_assignment_optimization(tickets, sample_agents)
    # Alice can only take one ticket without exceeding 4.0h.
    # Optimizer must assign the P1 ticket and leave P4 in backlog!
    assert res.total_assigned_tickets == 1
    assert res.total_unassigned_tickets == 1
    assert res.assignments[0].ticket_id == "T-BIG1"
    assert res.backlog[0].ticket_id == "T-BIG2"
    assert "Capacity Limit" in res.backlog[0].reason

def test_skill_gap_diagnosis(sample_agents):
    # No agent has "General Inquiry"
    ticket_gi = Ticket(
        id="T-GI",
        title="Holiday schedule inquiry",
        description="Holiday schedule",
        category="General Inquiry",
        priority="P4",
        estimated_hours=1.0,
        sla_deadline_hours=48.0,
        created_at="2026-10-22 10:00:00"
    )
    res = run_ticket_assignment_optimization([ticket_gi], sample_agents)
    assert res.total_unassigned_tickets == 1
    assert "Skill Gap" in res.backlog[0].reason
