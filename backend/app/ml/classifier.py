import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from app.ml.dataset import SYNTHETIC_DATA, CATEGORIES

class ClassMetrics(BaseModel):
    category: str
    precision: float
    recall: float
    f1_score: float
    support: int

class ModelEvaluationReport(BaseModel):
    model_architecture: str = "TF-IDF Vectorizer + Multinomial Logistic Regression"
    total_samples: int
    train_samples: int
    test_samples: int
    accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    per_class_metrics: List[ClassMetrics]
    confusion_matrix: List[List[int]]
    class_labels: List[str]
    disclaimer: str = (
        "Notice: This model was trained and evaluated on synthetic demonstration support tickets. "
        "Reported metrics evaluate in-sample synthetic test split performance and do not establish production-certified accuracy."
    )

class ClassificationResult(BaseModel):
    predicted_category: str
    confidence_score: float
    is_low_confidence: bool
    recommended_priority: str
    priority_reason: str
    probabilities: Dict[str, float]

class TicketClassifierEngine:
    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self.evaluation_report: Optional[ModelEvaluationReport] = None
        self.is_trained: bool = False
        # Train on startup
        self.train_and_evaluate()

    def train_and_evaluate(self) -> ModelEvaluationReport:
        texts = [f"{title} {desc}" for title, desc, cat in SYNTHETIC_DATA]
        labels = [cat for title, desc, cat in SYNTHETIC_DATA]

        # Stratified train/test split (80% train, 20% test) with fixed random seed
        X_train, X_test, y_train, y_test = train_test_split(
            texts,
            labels,
            test_size=0.20,
            random_state=42,
            stratify=labels
        )

        # Build Scikit-Learn TF-IDF + Logistic Regression pipeline
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=800,
                sublinear_tf=True
            )),
            ("clf", LogisticRegression(
                C=1.5,
                max_iter=500,
                solver="lbfgs"
            ))
        ])

        self.pipeline.fit(X_train, y_train)
        y_pred = self.pipeline.predict(X_test)

        # Compute actual scikit-learn metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec, rec, f1, _ = precision_recall_fscore_support(
            y_test,
            y_pred,
            average="macro",
            zero_division=0
        )
        per_prec, per_rec, per_f1, per_sup = precision_recall_fscore_support(
            y_test,
            y_pred,
            labels=CATEGORIES,
            zero_division=0
        )
        cm = confusion_matrix(y_test, y_pred, labels=CATEGORIES).tolist()

        per_class_list = [
            ClassMetrics(
                category=CATEGORIES[i],
                precision=round(float(per_prec[i]), 3),
                recall=round(float(per_rec[i]), 3),
                f1_score=round(float(per_f1[i]), 3),
                support=int(per_sup[i])
            )
            for i in range(len(CATEGORIES))
        ]

        self.evaluation_report = ModelEvaluationReport(
            total_samples=len(SYNTHETIC_DATA),
            train_samples=len(X_train),
            test_samples=len(X_test),
            accuracy=round(acc, 3),
            macro_precision=round(float(prec), 3),
            macro_recall=round(float(rec), 3),
            macro_f1=round(float(f1), 3),
            per_class_metrics=per_class_list,
            confusion_matrix=cm,
            class_labels=CATEGORIES
        )
        self.is_trained = True
        return self.evaluation_report

    def predict(self, title: str, description: str) -> ClassificationResult:
        if not self.is_trained or not self.pipeline:
            self.train_and_evaluate()

        combined_text = f"{title} {description}".strip()
        if not combined_text:
            return ClassificationResult(
                predicted_category="General Inquiry",
                confidence_score=0.20,
                is_low_confidence=True,
                recommended_priority="P4",
                priority_reason="Empty ticket text; defaulted to low priority inquiry.",
                probabilities={cat: 0.20 for cat in CATEGORIES}
            )

        # Get probabilities from model
        proba = self.pipeline.predict_proba([combined_text])[0]
        classes = self.pipeline.classes_
        prob_dict = {
            str(cls): round(float(proba[idx]), 3)
            for idx, cls in enumerate(classes)
        }

        # Predict top category
        top_idx = proba.argmax()
        pred_cat = str(classes[top_idx])
        top_conf = round(float(proba[top_idx]), 3)

        # Threshold check: low confidence if < 0.45 (for 5-class multi-class distribution)
        is_low = top_conf < 0.45

        # Transparent priority recommendation rules
        rec_priority, priority_reason = self._recommend_priority(combined_text, pred_cat, top_conf)

        return ClassificationResult(
            predicted_category=pred_cat,
            confidence_score=top_conf,
            is_low_confidence=is_low,
            recommended_priority=rec_priority,
            priority_reason=priority_reason,
            probabilities=prob_dict
        )

    def _recommend_priority(self, text: str, category: str, confidence: float) -> (str, str):
        lower = text.lower()

        # P1 Critical patterns
        p1_keywords = ["outage", "production down", "compromised", "stolen", "zero-day", "data leak", "freeze", "crashloop", "504", "fatal", "disaster"]
        if any(re.search(r"\b" + re.escape(w) + r"\b", lower) for w in p1_keywords):
            return "P1", "Critical keyword detected affecting system availability or enterprise security."

        # P2 High patterns
        p2_keywords = ["error", "timeout", "duplicate charge", "unauthorized", "locked out", "wire transfer", "cannot access", "failed", "unresponsive", "past due"]
        if any(re.search(r"\b" + re.escape(w) + r"\b", lower) for w in p2_keywords):
            return "P2", "High operational friction or financial discrepancy keyword detected."

        # P3 Medium patterns
        if category in ("Service Request", "Account Management", "Technical Support"):
            return "P3", f"Standard business request under {category} category workflow."

        # P4 Low patterns
        return "P4", f"General or informational request under {category}."

classifier_engine = TicketClassifierEngine()
