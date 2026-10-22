"use client";

import React, { useState } from "react";
import {
  SupportAgent,
  AgentAvailability,
  patchAgent
} from "@/lib/api";
import {
  Briefcase,
  Zap
} from "lucide-react";

interface AgentsViewProps {
  agents: SupportAgent[];
  onRefresh: () => Promise<void>;
  onRunOptimization: () => Promise<void>;
  isOptimizing: boolean;
}

const AVAILABILITY_OPTIONS: { label: string; value: AgentAvailability; color: string }[] = [
  { label: "Available", value: "Available", color: "bg-emerald-950 text-emerald-300 border-emerald-700" },
  { label: "Busy (Unavailable)", value: "Busy", color: "bg-rose-950 text-rose-300 border-rose-700" },
  { label: "Away", value: "Away", color: "bg-amber-950 text-amber-300 border-amber-700" },
  { label: "Offline", value: "Offline", color: "bg-slate-900 text-slate-400 border-slate-700" },
];

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  onRefresh,
  onRunOptimization,
  isOptimizing,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAvailabilityToggle = async (agentId: string, newAvailability: AgentAvailability) => {
    setUpdatingId(agentId);
    try {
      await patchAgent(agentId, { availability: newAvailability });
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCapacityChange = async (agentId: string, newMaxHours: number) => {
    setUpdatingId(agentId);
    try {
      await patchAgent(agentId, { max_workload_hours: newMaxHours });
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0e172a] border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Support Agent Operations & Capacity</h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate operational constraints: toggle agent availability, adjust capacity limits, and observe the optimizer adapt.
          </p>
        </div>

        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
          <span>{isOptimizing ? "Solving..." : "Re-Optimize Schedule"}</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const utilPct = agent.max_workload_hours > 0
            ? Math.min(100, Math.round((agent.current_assigned_hours / agent.max_workload_hours) * 100))
            : 0;

          const isOverloaded = agent.current_assigned_hours > agent.max_workload_hours;
          const isBusyOrOffline = agent.availability !== "Available";

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between ${
                isBusyOrOffline
                  ? "bg-slate-950/70 border-slate-800/80 opacity-80"
                  : "bg-[#0f172a] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-4">
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-sm shadow-inner">
                      {agent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                        <span className="font-mono text-[10px] text-slate-500">{agent.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        <span>{agent.role}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Availability Selector (Interactive Simulation Control) */}
                <div className="pt-2 border-t border-slate-800/60">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Availability Status (Interactive Toggle)
                  </label>
                  <select
                    value={agent.availability}
                    disabled={updatingId === agent.id}
                    onChange={(e) => handleAvailabilityToggle(agent.id, e.target.value as AgentAvailability)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills Tags */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Supported Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Capacity Slider (Interactive Simulation Control) */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Workload Limit
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      {agent.max_workload_hours}h max
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="0.5"
                    value={agent.max_workload_hours}
                    onChange={(e) => handleCapacityChange(agent.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2.0h</span>
                    <span>8.0h</span>
                    <span>14.0h</span>
                  </div>
                </div>

                {/* Workload Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Allocated Hours:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {agent.current_assigned_hours.toFixed(1)}h / {agent.max_workload_hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOverloaded
                          ? "bg-rose-500"
                          : utilPct > 80
                          ? "bg-amber-400"
                          : "bg-cyan-400"
                      }`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Utilization: {utilPct}%</span>
                    <span>Remaining: {agent.remaining_capacity_hours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>

              {/* Current Assignments Pill Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Assignments:</span>
                <span className="font-semibold text-slate-200">
                  {agent.assigned_ticket_ids.length > 0 ? (
                    <span className="font-mono text-cyan-400">
                      {agent.assigned_ticket_ids.length} tickets ({agent.assigned_ticket_ids.slice(0, 3).join(", ")})
                    </span>
                  ) : (
                    <span className="text-slate-500">None assigned</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
