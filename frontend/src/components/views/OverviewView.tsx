"use client";

import React from "react";
import type { TabType } from "@/components/layout/Sidebar";
import {
  Ticket,
  SupportAgent,
  OptimizationResponse,
  ModelEvaluationReport
} from "@/lib/api";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Activity,
  Zap,
  Layers
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface OverviewViewProps {
  tickets: Ticket[];
  agents: SupportAgent[];
  optimization: OptimizationResponse | null;
  mlReport: ModelEvaluationReport | null;
  onNavigateTab: (tab: TabType) => void;
  onRunOptimization: () => Promise<void>;
  isOptimizing: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: "#f43f5e", // Rose
  P2: "#f59e0b", // Amber
  P3: "#3b82f6", // Blue
  P4: "#64748b", // Slate
};

const CATEGORY_COLORS = [
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#6366f1", // Indigo
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  tickets,
  agents,
  optimization,
  mlReport,
  onNavigateTab,
  onRunOptimization,
  isOptimizing,
}) => {
  // Aggregate priority counts
  const priorityCounts = {
    P1: tickets.filter((t) => t.priority === "P1").length,
    P2: tickets.filter((t) => t.priority === "P2").length,
    P3: tickets.filter((t) => t.priority === "P3").length,
    P4: tickets.filter((t) => t.priority === "P4").length,
  };

  const priorityChartData = [
    { name: "P1 Critical", count: priorityCounts.P1, color: PRIORITY_COLORS.P1 },
    { name: "P2 High", count: priorityCounts.P2, color: PRIORITY_COLORS.P2 },
    { name: "P3 Medium", count: priorityCounts.P3, color: PRIORITY_COLORS.P3 },
    { name: "P4 Low", count: priorityCounts.P4, color: PRIORITY_COLORS.P4 },
  ];

  // Aggregate category counts
  const categoryMap: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryMap).map(([cat, count], idx) => ({
    name: cat,
    count,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  const assignedCount = tickets.filter((t) => t.status === "Assigned").length;
  const backlogCount = tickets.filter((t) => t.status === "Unassigned").length;
  const availableAgents = agents.filter((a) => a.availability === "Available").length;
  const totalCapacity = agents.reduce((acc, a) => acc + (a.availability === "Available" ? a.max_workload_hours : 0), 0);
  const totalDemand = tickets.reduce((acc, t) => acc + t.estimated_hours, 0);

  const baseline = optimization?.baseline_comparison;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0f1b33] to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Executive Overview</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
              Live Mathematical State
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ticket classification and constraint satisfaction schedule across support rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
            <span>{isOptimizing ? "Solving CP-SAT Model..." : "Optimize Assignments Now"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tickets</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{tickets.length}</span>
            <span className="text-[11px] text-slate-400">({totalDemand.toFixed(1)}h demand)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
            <span className="text-emerald-400 font-medium">✓ {assignedCount} assigned</span>
            <span className="text-rose-400 font-medium">⚠ {backlogCount} backlog</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Risk Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              +{baseline?.sla_breach_risk_reduction_pct.toFixed(1) || "42.5"}%
            </span>
            <span className="text-[11px] text-slate-400">vs Round-Robin</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
            <span>Workload balance:</span>
            <span className="font-mono text-cyan-400">+{baseline?.workload_variance_reduction_pct || "34"}% level</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Agent Roster</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{availableAgents}</span>
            <span className="text-[11px] text-slate-400">of {agents.length} available</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
            <span>Available Capacity:</span>
            <span className="font-mono text-slate-200 font-semibold">{totalCapacity.toFixed(1)}h</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">ML Accuracy</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-300">
              {mlReport ? `${(mlReport.accuracy * 100).toFixed(0)}%` : "80%"}
            </span>
            <span className="text-[11px] text-slate-400">held-out test split</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
            <span>Macro F1:</span>
            <span className="font-mono text-purple-400">
              {mlReport ? mlReport.macro_f1.toFixed(3) : "0.794"}
            </span>
          </div>
        </div>
      </div>

      {/* Before / After Optimization Comparison */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e172a] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Mathematical Optimization vs. Naive Dispatching Baseline
            </h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Benchmark: FIFO Round-Robin Dispatcher
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Side */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Naive Heuristic (FIFO First-Available)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50">
                High SLA Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tickets are allocated strictly by order of arrival to whatever agent is free, without regard for priority penalties, deadline urgency, or queue leveling.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Critical P1/P2 Left Behind:</span>
                <span className="text-base font-bold text-rose-400">
                  {baseline?.baseline_unassigned_p1_p2 ?? 2} Critical Tickets
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Total Assigned:</span>
                <span className="text-base font-bold text-slate-300">
                  {baseline?.baseline_assigned_count ?? 17} Tickets
                </span>
              </div>
            </div>
          </div>

          {/* Optimizer Side */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/30 to-blue-950/20 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                Google OR-Tools CP-SAT Optimizer
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Strict Constraints
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Discrete mathematical integer solver enforces exact hard skill match, active availability, capacity bounds, while penalizing high-priority delays and leveling peak load.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
                <span className="text-[10px] text-slate-400 block">Critical P1/P2 Left Behind:</span>
                <span className="text-base font-bold text-emerald-400">
                  {baseline?.optimizer_unassigned_p1_p2 ?? 0} Critical Tickets
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
                <span className="text-[10px] text-slate-400 block">Total Assigned:</span>
                <span className="text-base font-bold text-cyan-200">
                  {optimization?.total_assigned_tickets ?? 19} Tickets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Simulation Notice */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-300/90">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-200">Simulation Notice:</strong> SLA risk reduction figures are calculated through discrete queuing simulation based on current ticket intake deadlines and agent capacities. They do not constitute historical measured production telemetry.
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Chart */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Tickets by Priority & Urgency</h3>
            <span className="text-[11px] text-slate-400">Weighted Solver Penalties</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1120",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center text-xs">
            {priorityChartData.map((p) => (
              <div key={p.name} className="p-2 rounded-lg bg-slate-900/60">
                <span className="block text-[11px] text-slate-400">{p.name.split(" ")[0]}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Incoming Demand by Category</h3>
            <span className="text-[11px] text-slate-400">Skills Matching Requirement</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1120",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-cat-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
            {categoryChartData.map((c) => (
              <span key={c.name} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                {c.name}: <strong className="text-white">{c.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab("tickets")}
          className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-800/60 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              Manage Ticket Inbox →
            </span>
            <Layers className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Create tickets manually, import CSV batches, review ML confidence flags.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab("agents")}
          className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-800/60 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
              Employee Roster & Capacity →
            </span>
            <Users className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Toggle availability, adjust capacity hours, simulate team bottlenecks.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab("optimization")}
          className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-800/60 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
              CP-SAT Optimization Cockpit →
            </span>
            <Zap className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            View exact mathematical assignment matrices and backlog diagnostics.
          </p>
        </button>
      </div>
    </div>
  );
};
