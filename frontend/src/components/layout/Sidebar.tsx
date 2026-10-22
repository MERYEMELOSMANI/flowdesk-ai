"use client";

import React from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Cpu,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";

export type TabType = "overview" | "tickets" | "agents" | "optimization" | "ml";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  ticketCount: number;
  backlogCount: number;
  agentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  ticketCount,
  backlogCount,
  agentCount,
}) => {
  const navItems = [
    {
      id: "overview" as TabType,
      label: "Executive Dashboard",
      sublabel: "KPIs, SLAs & Baselines",
      icon: LayoutDashboard,
    },
    {
      id: "tickets" as TabType,
      label: "Ticket Inbox",
      sublabel: "Intake, ML & Priority",
      icon: Inbox,
      badge: ticketCount,
    },
    {
      id: "agents" as TabType,
      label: "Agent Roster",
      sublabel: "Skills & Capacity",
      icon: Users,
      badge: agentCount,
    },
    {
      id: "optimization" as TabType,
      label: "OR-Tools Solver",
      sublabel: "CP-SAT Assignments",
      icon: Cpu,
      badge: backlogCount > 0 ? `${backlogCount} queue` : undefined,
      badgeColor: "rose",
    },
    {
      id: "ml" as TabType,
      label: "ML Classifier",
      sublabel: "Metrics & Confusion Matrix",
      icon: BrainCircuit,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0b1120] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Operations Platform
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-950/70 to-blue-950/50 text-cyan-300 border border-cyan-800/60 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-slate-800/60 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold leading-tight truncate">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight truncate">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor === "rose"
                          ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                          : isActive
                          ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Engine Specs Box */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mathematical Engines</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Solver:</span>
              <span className="font-mono text-cyan-400 font-medium">OR-Tools CP-SAT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Model:</span>
              <span className="font-mono text-slate-300">TF-IDF + LogReg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Data Store:</span>
              <span className="font-mono text-slate-300">SQLite Local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">FlowDesk AI v1.0.0</p>
        <p>Zero external paid APIs required.</p>
        <p className="text-slate-600">Pure Local Discrete Integer Optimization</p>
      </div>
    </aside>
  );
};
