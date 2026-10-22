"""
FlowDesk AI - Machine Learning Model Evaluation Script.
Trains and evaluates the Scikit-learn TF-IDF + Logistic Regression ticket classifier.
Prints real accuracy, macro precision, recall, F1, per-class breakdown, and confusion matrix.
"""

from app.ml.classifier import TicketClassifierEngine, CATEGORIES

def main():
    print("=" * 70)
    print("FLOWDESK AI - ML CLASSIFICATION MODEL EVALUATION")
    print("=" * 70)
    print("Notice: Evaluating on synthetic enterprise service-desk demonstration corpus.")
    print("Train / Test split: 80% train (stratified), 20% test (held-out).")
    print("-" * 70)

    engine = TicketClassifierEngine()
    report = engine.evaluation_report

    print(f"Model Architecture : {report.model_architecture}")
    print(f"Total Samples      : {report.total_samples}")
    print(f"Training Samples   : {report.train_samples}")
    print(f"Test Samples       : {report.test_samples}")
    print(f"Test Accuracy      : {report.accuracy:.4f} ({report.accuracy * 100:.1f}%)")
    print(f"Macro Precision    : {report.macro_precision:.4f}")
    print(f"Macro Recall       : {report.macro_recall:.4f}")
    print(f"Macro F1 Score     : {report.macro_f1:.4f}")
    print("\nPER-CLASS METRICS (Held-out Test Split):")
    print(f"{'Category':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 70)
    for m in report.per_class_metrics:
        print(f"{m.category:<22} | {m.precision:<10.3f} | {m.recall:<10.3f} | {m.f1_score:<10.3f} | {m.support:<8}")

    print("\nCONFUSION MATRIX:")
    print("True \\ Pred".ljust(22) + " | " + " | ".join(f"{c[:8]:<8}" for c in CATEGORIES))
    print("-" * 70)
    for i, row in enumerate(report.confusion_matrix):
        row_str = " | ".join(f"{val:<8}" for val in row)
        print(f"{CATEGORIES[i]:<22} | {row_str}")

    print("\n" + "=" * 70)
    print("DISCLAIMER:")
    print(report.disclaimer)
    print("=" * 70)

if __name__ == "__main__":
    main()
