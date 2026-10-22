"use client";

import React, { useState } from "react";
import {
  OptimizationResponse,
  runOptimization
} from "@/lib/api";
import {
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface OptimizationViewProps {
  optimization: OptimizationResponse | null;
  onRefresh: () => Promise<void>;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  optimization,
  onRefresh,
}) => {
  // Solver Tuning Weights
  const [weightP1, setWeightP1] = useState(2000);
  const [weightP2, setWeightP2] = useState(1000);
  const [weightSla, setWeightSla] = useState(80);
  const [weightBalance, setWeightBalance] = useState(25);
  const [isSolving, setIsSolving] = useState(false);

  const handleRunOptimizer = async () => {
    setIsSolving(true);
    try {
      await runOptimization({
        weight_unassigned_p1: weightP1,
        weight_unassigned_p2: weightP2,
        weight_sla_risk: weightSla,
        weight_workload_balance: weightBalance,
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolving(false);
    }
  };

  const workloadChartData = optimization?.agent_workload_summaries.map((w) => ({
    name: w.agent_name.split(" ")[0],
    fullName: w.agent_name,
    assigned: w.assigned_hours,
    capacity: w.max_workload_hours,
    utilization: w.utilization_pct,
    availability: w.availability,
  })) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Solver Header & Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Operations Research — Google OR-Tools CP-SAT Solver
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Discrete integer programming with exact constraint satisfaction and multi-objective penalty minimization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunOptimizer}
              disabled={isSolving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isSolving ? "animate-spin" : ""}`} />
              <span>{isSolving ? "Executing CP-SAT Solver..." : "Optimize Assignments Now"}</span>
            </button>
          </div>
        </div>

        {/* Solver Objectives & Weights Explanation Box */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">P1 Unassigned Penalty</span>
              <span className="font-mono text-rose-400 font-bold">{weightP1}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={weightP1}
              onChange={(e) => setWeightP1(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <p className="text-[10px] text-slate-500">Heavily penalizes leaving critical outages in backlog.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">P2 Unassigned Penalty</span>
              <span className="font-mono text-amber-400 font-bold">{weightP2}</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="100"
              value={weightP2}
              onChange={(e) => setWeightP2(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[10px] text-slate-500">Prevents neglecting high-impact business requests.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">SLA Urgency Weight</span>
              <span className="font-mono text-cyan-400 font-bold">{weightSla}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={weightSla}
              onChange={(e) => setWeightSla(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">Prioritizes tickets nearing SLA breach deadline.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Workload Balance Weight</span>
              <span className="font-mono text-indigo-400 font-bold">{weightBalance}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={weightBalance}
              onChange={(e) => setWeightBalance(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
            <p className="text-[10px] text-slate-500">Minimizes peak load across active support team.</p>
          </div>
        </div>

        {/* Solver Diagnostics Bar */}
        {optimization && (
          <div className="p-3.5 rounded-xl bg-[#0b1120] border border-cyan-900/40 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                Status: {optimization.status}
              </span>
              <span className="text-slate-400">
                Solve Time: <strong className="font-mono text-cyan-400">{optimization.solver_time_ms} ms</strong>
              </span>
              <span className="text-slate-400">
                Objective Value: <strong className="font-mono text-slate-200">{optimization.objective_value.toFixed(0)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{optimization.total_assigned_tickets}</strong> tickets assigned,{" "}
                <strong className="text-rose-400">{optimization.total_unassigned_tickets}</strong> in backlog
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Solver Explanations */}
      {optimization?.objective_explanation && (
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Mathematical Optimization Justification
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {optimization.objective_explanation.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Team Workload Distribution Chart */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Agent Workload Leveling & Capacity Utilization</h3>
            <p className="text-[11px] text-slate-400">Assigned Hours vs. Maximum Workload Bounds</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Hard Constraint: Assigned ≤ Max Capacity
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadChartData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="h" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b1120",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(val, name) => [
                  `${val}h`,
                  name ?? "Workload",
                ]}
              />
              <Bar dataKey="capacity" fill="#1e293b" radius={[4, 4, 0, 0]} name="Capacity Limit" />
              <Bar dataKey="assigned" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Assigned Hours">
                {workloadChartData.map((entry, index) => (
                  <Cell
                    key={`bar-util-${index}`}
                    fill={
                      entry.availability !== "Available"
                        ? "#475569"
                        : entry.utilization > 90
                        ? "#f59e0b"
                        : "#06b6d4"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimized Assignments Plan Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Optimized Assignment Plan ({optimization?.assignments.length || 0} Tickets Assigned)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Binary Variables x[t, a] = 1
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Assigned Agent</th>
                <th className="py-2.5 px-3">Hours</th>
                <th className="py-2.5 px-3">Mathematical Optimization Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optimization?.assignments.map((a) => (
                <tr key={a.ticket_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{a.ticket_id}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.ticket_priority === "P1"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : a.ticket_priority === "P2"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {a.ticket_priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">{a.ticket_category}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{a.agent_name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{a.estimated_hours}h</td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px] leading-relaxed">
                    {a.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned Backlog Queue Table with Granular Diagnostics */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-sm">
              Unassigned Backlog Queue ({optimization?.backlog.length || 0} Tickets Remaining)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Unassigned Flag u[t] = 1
          </span>
        </div>

        {optimization?.backlog.length === 0 ? (
          <p className="text-xs text-emerald-400 py-4 text-center">
            All pending tickets successfully assigned! Zero backlog.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Hours</th>
                  <th className="py-2.5 px-3">Diagnostic Reason for Remaining Unassigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {optimization?.backlog.map((b) => (
                  <tr key={b.ticket_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{b.ticket_id}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                        {b.ticket_priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">{b.ticket_category}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{b.estimated_hours}h</td>
                    <td className="py-2.5 px-3 text-rose-300 text-[11px] font-medium leading-relaxed">
                      {b.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
