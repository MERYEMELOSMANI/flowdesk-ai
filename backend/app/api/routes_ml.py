"""
Machine Learning API routes for FlowDesk AI.
Exposes ticket classification prediction, confidence scoring, and model evaluation metrics.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Optional

from app.ml.classifier import TicketClassifierEngine, ModelEvaluationReport, ClassificationResult

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

# Singleton ML engine
classifier_engine = TicketClassifierEngine()

class PredictRequest(BaseModel):
    title: str = Field(..., min_length=2, description="Ticket title or subject")
    description: str = Field(..., min_length=2, description="Ticket description")

@router.get("/evaluation", response_model=ModelEvaluationReport)
def get_model_evaluation():
    """
    Returns actual evaluated metrics on the held-out stratified test set:
    accuracy, macro precision, macro recall, macro F1, per-class metrics, and confusion matrix.
    """
    if not classifier_engine.is_trained or not classifier_engine.evaluation_report:
        classifier_engine.train_and_evaluate()
    return classifier_engine.evaluation_report

@router.post("/predict", response_model=ClassificationResult)
def predict_ticket(req: PredictRequest):
    """
    Classifies an incoming ticket, assigns a confidence score, flags for manual review if low,
    and recommends an initial priority based on transparent rules.
    """
    return classifier_engine.predict(title=req.title, description=req.description)
