"""
Automated integration tests for FlowDesk AI REST API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.db import init_db

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_ml_evaluation_endpoint(client):
    res = client.get("/api/ml/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data
    assert "confusion_matrix" in data
    assert "disclaimer" in data

def test_ml_predict_endpoint(client):
    res = client.post("/api/ml/predict", json={
        "title": "AWS RDS postgres failover",
        "description": "Database replica instance failover triggered 500 server errors"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_category"] == "Technical Support"
    assert "confidence_score" in data
    assert "recommended_priority" in data

def test_tickets_crud(client):
    # 1. List
    res = client.get("/api/tickets")
    assert res.status_code == 200
    tickets = res.json()
    assert len(tickets) > 0

    # 2. Create with auto-prediction
    res_create = client.post("/api/tickets", json={
        "title": "Need reimbursement for invoice #9921",
        "description": "Double charged on corporate card for Q2 cloud hosting bill",
        "estimated_hours": 2.0,
        "sla_deadline_hours": 6.0
    })
    assert res_create.status_code == 200
    created = res_create.json()
    assert created["category"] == "Billing"
    t_id = created["id"]

    # 3. Patch priority override
    res_patch = client.patch(f"/api/tickets/{t_id}", json={
        "priority": "P1"
    })
    assert res_patch.status_code == 200
    assert res_patch.json()["priority"] == "P1"

    # 4. Clean up
    res_del = client.delete(f"/api/tickets/{t_id}")
    assert res_del.status_code == 200

def test_agents_and_simulation(client):
    res = client.get("/api/agents")
    assert res.status_code == 200
    agents = res.json()
    assert len(agents) >= 6

    # Test toggling Tariq's availability
    agent_id = "AGT-106"
    res_patch = client.patch(f"/api/agents/{agent_id}", json={
        "availability": "Available"
    })
    assert res_patch.status_code == 200
    assert res_patch.json()["availability"] == "Available"

    # Restore to Busy
    client.patch(f"/api/agents/{agent_id}", json={"availability": "Busy"})

def test_optimization_run_endpoint(client):
    res = client.post("/api/optimization/run", json={
        "weight_unassigned_p1": 2000,
        "weight_unassigned_p2": 1000
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("OPTIMAL", "FEASIBLE")
    assert "assignments" in data
    assert "backlog" in data
    assert "baseline_comparison" in data
