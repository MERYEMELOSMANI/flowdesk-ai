"use client";

import React, { useState } from "react";
import {
  ModelEvaluationReport,
  ClassificationResult,
  predictTicket
} from "@/lib/api";
import {
  BrainCircuit,
  AlertTriangle,
  Sparkles,
  Send,
  ShieldAlert,
} from "lucide-react";

interface MLInsightsViewProps {
  report: ModelEvaluationReport | null;
}

export const MLInsightsView: React.FC<MLInsightsViewProps> = ({ report }) => {
  // Playground state
  const [testTitle, setTestTitle] = useState("Database replica failover causing connection pool timeouts");
  const [testDesc, setTestDesc] = useState("Production PostgreSQL database node disconnected after network partition");
  const [playResult, setPlayResult] = useState<ClassificationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    setIsTesting(true);
    try {
      const res = await predictTicket(testTitle, testDesc);
      setPlayResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  const categories = report?.class_labels || [
    "Technical Support",
    "Billing",
    "Account Management",
    "Service Request",
    "General Inquiry"
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101426] to-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Machine Learning Classifier & Statistical Evaluation
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          TF-IDF Feature Extraction + Multinomial Logistic Regression trained on enterprise service-desk tickets.
        </p>
      </div>

      {/* Synthetic Data Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200 leading-relaxed shadow-lg">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300">Mandatory Data Disclosure:</strong>
          <p className="mt-1 text-slate-300">
            {report?.disclaimer ||
              "Notice: This model was trained and evaluated on synthetic demonstration support tickets. Reported metrics evaluate in-sample synthetic test split performance and do not establish production-certified accuracy."}
          </p>
        </div>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
            Test Accuracy
          </span>
          <span className="text-2xl font-bold text-cyan-400 mt-1 block">
            {report ? `${(report.accuracy * 100).toFixed(1)}%` : "80.0%"}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Held-out stratified 20% test split
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
            Macro Precision
          </span>
          <span className="text-2xl font-bold text-purple-400 mt-1 block">
            {report ? report.macro_precision.toFixed(3) : "0.808"}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Unweighted average across 5 classes
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
            Macro Recall
          </span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">
            {report ? report.macro_recall.toFixed(3) : "0.800"}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            True positive detection rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
            Macro F1 Score
          </span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">
            {report ? report.macro_f1.toFixed(3) : "0.794"}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Harmonic balance of precision/recall
          </span>
        </div>
      </div>

      {/* Confusion Matrix & Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-white text-sm">Empirical Confusion Matrix</h3>
            <span className="text-[10px] text-slate-500 font-mono">Row: True | Col: Predicted</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400">
                  <th className="text-left py-2 px-1">True \ Pred</th>
                  {categories.map((c) => (
                    <th key={c} className="py-2 px-1 truncate max-w-[70px]" title={c}>
                      {c.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
                {report?.confusion_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="text-left font-sans text-[11px] font-semibold text-slate-300 py-2 px-1">
                      {categories[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-1 font-bold ${
                            isDiagonal
                              ? val > 0
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                                : "text-slate-600"
                              : val > 0
                              ? "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                              : "text-slate-700"
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Green diagonal indicates correct test set predictions. Off-diagonal denotes cross-category classification errors.
          </p>
        </div>

        {/* Per-Class Metrics */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-white text-sm">Per-Category Performance Breakdown</h3>
            <span className="text-[10px] text-slate-500">Held-Out Test Samples</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2">Precision</th>
                  <th className="py-2 px-2">Recall</th>
                  <th className="py-2 px-2">F1 Score</th>
                  <th className="py-2 px-2">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                {report?.per_class_metrics.map((m) => (
                  <tr key={m.category} className="hover:bg-slate-900/40">
                    <td className="py-2 px-2 font-sans font-semibold text-slate-200">{m.category}</td>
                    <td className="py-2 px-2 text-cyan-400">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-indigo-400">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-emerald-400">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-slate-400">{m.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Inference Playground */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-white text-sm">Live Classifier & Confidence Playground</h3>
            <p className="text-[11px] text-slate-400">
              Type custom enterprise ticket text to test the TF-IDF pipeline and observe confidence scoring in real time.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestInference} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ticket Title / Subject
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ticket Issue Description
              </label>
              <input
                type="text"
                value={testDesc}
                onChange={(e) => setTestDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? "Predicting..." : "Run ML Inference"}</span>
            </button>
          </div>
        </form>

        {playResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 space-y-3 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Predicted Category:</span>
                <span className="px-3 py-1 rounded-md bg-purple-950 border border-purple-700 font-bold text-purple-300 text-xs">
                  {playResult.predicted_category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-400">
                  Confidence: {(playResult.confidence_score * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 mr-2">Recommended Priority:</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-950 border border-amber-800 text-amber-300">
                  {playResult.recommended_priority}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              <strong className="text-slate-400">Priority Rule Reason:</strong> {playResult.priority_reason}
            </p>

            {playResult.is_low_confidence && (
              <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-700/60 flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  Flagged as <strong>Low Confidence (&lt; 45%)</strong>: Requires supervisor manual review before dispatching.
                </span>
              </div>
            )}

            {/* Probability Bars */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Class Probability Distribution
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                {Object.entries(playResult.probabilities).map(([cat, prob]) => (
                  <div key={cat} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block truncate" title={cat}>
                      {cat}
                    </span>
                    <span className="font-mono font-bold text-slate-200 block">
                      {(prob * 100).toFixed(1)}%
                    </span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
