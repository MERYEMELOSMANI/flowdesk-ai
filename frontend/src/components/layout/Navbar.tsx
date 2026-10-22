"useContent";
"use client";

import React from "react";
import { Sparkles, Database, RefreshCw } from "lucide-react";

interface NavbarProps {
  onLoadDemo: () => Promise<void>;
  onResetDemo: () => Promise<void>;
  isLoading: boolean;
  totalTickets: number;
  assignedCount: number;
  backlogCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  onResetDemo,
  isLoading,
  totalTickets,
  assignedCount,
  backlogCount,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0b1120]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">FlowDesk</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase tracking-wider">
              AI Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Intelligent Service-Desk & OR-Tools Assignment Optimizer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">OR-Tools CP-SAT + ML Active</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {totalTickets} Tickets ({assignedCount} assigned, {backlogCount} backlog)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadDemo}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 border border-cyan-400/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Load Demo Scenario</span>
          </button>

          <button
            onClick={onResetDemo}
            disabled={isLoading}
            title="Reset to clean unassigned state"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
