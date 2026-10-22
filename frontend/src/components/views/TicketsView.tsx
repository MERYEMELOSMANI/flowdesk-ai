"use client";

import React, { useState } from "react";
import {
  Ticket,
  TicketPriority,
  ClassificationResult,
  createTicket,
  patchTicket,
  deleteTicket,
  uploadTicketsCsv,
  predictTicket
} from "@/lib/api";
import {
  Plus,
  Upload,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  X,
  FileText
} from "lucide-react";

interface TicketsViewProps {
  tickets: Ticket[];
  onRefresh: () => Promise<void>;
}

const CATEGORIES = [
  "Technical Support",
  "Billing",
  "Account Management",
  "Service Request",
  "General Inquiry",
];

const PRIORITIES: TicketPriority[] = ["P1", "P2", "P3", "P4"];

export const TicketsView: React.FC<TicketsViewProps> = ({ tickets, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [onlyLowConfidence, setOnlyLowConfidence] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ticket Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formPriority, setFormPriority] = useState<TicketPriority>("P3");
  const [formHours, setFormHours] = useState<number>(2.0);
  const [formSla, setFormSla] = useState<number>(8.0);
  const [mlPreview, setMlPreview] = useState<ClassificationResult | null>(null);
  const [, setIsPredicting] = useState(false);

  // CSV File Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  // Real-time ML Prediction trigger on title / description blur or button
  const handleLivePredict = async () => {
    if (!formTitle.trim() && !formDescription.trim()) return;
    setIsPredicting(true);
    try {
      const res = await predictTicket(formTitle, formDescription || formTitle);
      setMlPreview(res);
      if (!formCategory) {
        setFormCategory(res.predicted_category);
      }
      setFormPriority(res.recommended_priority as TicketPriority);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await createTicket({
        title: formTitle.trim(),
        description: formDescription.trim() || formTitle.trim(),
        category: formCategory || undefined,
        priority: formPriority,
        estimated_hours: Number(formHours),
        sla_deadline_hours: Number(formSla),
      });
      setIsCreateOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormCategory("");
      setMlPreview(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      await patchTicket(ticketId, { priority: newPriority });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm(`Are you sure you want to delete ${ticketId}?`)) return;
    try {
      await deleteTicket(ticketId);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsSubmitting(true);
    setCsvMessage(null);
    try {
      const res = await uploadTicketsCsv(csvFile);
      setCsvMessage(`Successfully imported ${res.imported_count} tickets into inbox.`);
      setCsvFile(null);
      await onRefresh();
      setTimeout(() => {
        setIsCsvOpen(false);
        setCsvMessage(null);
      }, 1500);
    } catch {
      setCsvMessage("Error importing CSV. Ensure valid columns: title, description, category, priority.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesPriority = selectedPriority === "ALL" || t.priority === selectedPriority;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    const matchesLowConf = !onlyLowConfidence || t.is_low_confidence;
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesLowConf;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0e172a] border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Ticket Inbox</h1>
          <p className="text-xs text-slate-400 mt-1">
            Intake stream with Scikit-learn TF-IDF categorization, confidence scoring, and manual priority override.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 border border-cyan-400/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tickets by title, description, or TCK-ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map((pri) => (
              <option key={pri} value={pri}>
                {pri}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Unassigned">Unassigned</option>
            <option value="Assigned">Assigned</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Low Confidence Toggle */}
          <button
            onClick={() => setOnlyLowConfidence(!onlyLowConfidence)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              onlyLowConfidence
                ? "bg-amber-950/80 border-amber-600 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Confidence Only</span>
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Category (ML Inference)</th>
                <th className="py-3 px-4">Priority Override</th>
                <th className="py-3 px-4">Est. Hours</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Assignment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold">{t.id}</span>
                        {t.is_low_confidence && (
                          <span
                            title="Flagged by ML: Low probability confidence score (< 45%). Requires manual supervisor review."
                            className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 text-[10px] font-bold flex items-center gap-1 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Review Needed</span>
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-200 mt-0.5 line-clamp-1">{t.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 font-medium text-slate-200 w-fit">
                          {t.category}
                        </span>
                        {t.ml_confidence !== undefined && t.ml_confidence !== null && (
                          <span className="text-[10px] text-slate-500 mt-1 font-mono">
                            Confidence: {(t.ml_confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={t.priority}
                        onChange={(e) => handlePriorityChange(t.id, e.target.value as TicketPriority)}
                        className={`text-xs font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${
                          t.priority === "P1"
                            ? "bg-rose-950/60 text-rose-300 border-rose-800/80"
                            : t.priority === "P2"
                            ? "bg-amber-950/60 text-amber-300 border-amber-800/80"
                            : t.priority === "P3"
                            ? "bg-blue-950/60 text-blue-300 border-blue-800/80"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      {t.estimated_hours}h
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.sla_deadline_hours <= 2.0
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : t.sla_deadline_hours <= 6.0
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {t.sla_deadline_hours}h
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.status === "Assigned" && t.assigned_agent_name ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="font-medium text-slate-200">{t.assigned_agent_name}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
                          In Backlog
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete ticket"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Ticket Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Intake New Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ticket Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postgres replica replication lag spike"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onBlur={handleLivePredict}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Issue Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed symptoms, error codes, and impact..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  onBlur={handleLivePredict}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* AI Prediction Box */}
              {mlPreview && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      AI Prediction Preview
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Confidence: {(mlPreview.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Predicted Category:</span>
                    <strong className="text-white">{mlPreview.predicted_category}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Priority Reason:</span> {mlPreview.priority_reason}
                  </div>
                  {mlPreview.is_low_confidence && (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 pt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low confidence flagged for manual review.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">(Auto-classify with ML)</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Est. Hours (0.5 - 24h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={formHours}
                    onChange={(e) => setFormHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SLA Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="72"
                    value={formSla}
                    onChange={(e) => setFormSla(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Import Tickets from CSV</h3>
              </div>
              <button
                onClick={() => setIsCsvOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <p className="text-xs text-slate-400">
                Upload a CSV file containing support tickets. Missing categories and priorities will be automatically inferred by our machine learning model.
              </p>

              <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-center">
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-900 file:text-cyan-200 hover:file:bg-cyan-800 cursor-pointer"
                />
              </div>

              {csvMessage && (
                <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300">
                  {csvMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCsvOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Importing..." : "Upload & Parse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
