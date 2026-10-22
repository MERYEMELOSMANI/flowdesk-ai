"""
Automated unit tests for FlowDesk AI Ticket Classification ML Engine.
"""

import pytest
from app.ml.classifier import TicketClassifierEngine, CATEGORIES

@pytest.fixture(scope="module")
def ml_engine():
    return TicketClassifierEngine()

def test_ml_training_and_metrics(ml_engine):
    report = ml_engine.evaluation_report
    assert report is not None
    assert report.total_samples >= 100
    assert report.train_samples > 0
    assert report.test_samples > 0
    assert 0.0 <= report.accuracy <= 1.0
    assert 0.0 <= report.macro_precision <= 1.0
    assert 0.0 <= report.macro_recall <= 1.0
    assert 0.0 <= report.macro_f1 <= 1.0
    assert len(report.per_class_metrics) == 5
    assert len(report.confusion_matrix) == 5
    assert "synthetic" in report.disclaimer.lower()

def test_ml_prediction_categories(ml_engine):
    # Technical Support query
    res_tech = ml_engine.predict(
        title="PostgreSQL replica crash with WAL segment corruption",
        description="Production database cluster node throwing FATAL startup error 500."
    )
    assert res_tech.predicted_category == "Technical Support"
    assert res_tech.confidence_score > 0.30

    # Billing query
    res_billing = ml_engine.predict(
        title="Duplicate credit card charge on monthly subscription invoice",
        description="Amex was billed twice for $15,000 for Q3 enterprise renewal."
    )
    assert res_billing.predicted_category == "Billing"

    # Account Management query
    res_account = ml_engine.predict(
        title="User locked out of Okta SSO after password reset",
        description="Employee Active Directory credentials locked after failed attempts."
    )
    assert res_account.predicted_category == "Account Management"

def test_low_confidence_flagging(ml_engine):
    # Highly ambiguous text should be flagged with low confidence
    res_ambiguous = ml_engine.predict(
        title="Something strange",
        description="Things might be happening or not."
    )
    assert res_ambiguous.is_low_confidence is True or res_ambiguous.confidence_score < 0.45

def test_priority_recommendation_rules(ml_engine):
    # Production outage / security vulnerability -> P1
    res_p1 = ml_engine.predict(
        title="Production database outage and connection pool crash",
        description="All web servers returning 500 error due to database freeze."
    )
    assert res_p1.recommended_priority in ("P1", "P2")
    assert "critical" in res_p1.priority_reason.lower() or "operational" in res_p1.priority_reason.lower()
