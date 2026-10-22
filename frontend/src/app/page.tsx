"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, TabType } from "@/components/layout/Sidebar";
import { OverviewView } from "@/components/views/OverviewView";
import { TicketsView } from "@/components/views/TicketsView";
import { AgentsView } from "@/components/views/AgentsView";
import { OptimizationView } from "@/components/views/OptimizationView";
import { MLInsightsView } from "@/components/views/MLInsightsView";
import {
  Ticket,
  SupportAgent,
  OptimizationResponse,
  ModelEvaluationReport,
  fetchTickets,
  fetchAgents,
  fetchLatestOptimization,
  fetchModelEvaluation,
  loadDemoScenario,
  resetDemoData,
  runOptimization
} from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Core Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResponse | null>(null);
  const [mlReport, setMlReport] = useState<ModelEvaluationReport | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAllData = async () => {
    try {
      const [tData, aData, optData, mlData] = await Promise.all([
        fetchTickets(),
        fetchAgents(),
        fetchLatestOptimization(),
        fetchModelEvaluation(),
      ]);
      setTickets(tData);
      setAgents(aData);
      setOptimization(optData);
      setMlReport(mlData);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error refreshing data:");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchTickets(), fetchAgents(), fetchLatestOptimization(), fetchModelEvaluation()])
      .then(([tData, aData, optData, mlData]) => {
        if (!active) return;
        setTickets(tData);
        setAgents(aData);
        setOptimization(optData);
        setMlReport(mlData);
      })
      .catch(() => { if (active) setErrorMessage("Unable to load data. Check that the backend is running, then retry."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      await loadDemoScenario();
      await refreshAllData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error loading demo:");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setIsLoading(true);
    try {
      await resetDemoData();
      await refreshAllData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error resetting demo:");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      const optRes = await runOptimization();
      setOptimization(optRes);
      // Refresh tickets and agents to reflect assignments in other views
      const [tData, aData] = await Promise.all([fetchTickets(), fetchAgents()]);
      setTickets(tData);
      setAgents(aData);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Optimization failed:");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c16] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-sm font-semibold tracking-wide">Initializing FlowDesk AI...</span>
        </div>
      </div>
    );
  }

  const assignedCount = tickets.filter((t) => t.status === "Assigned").length;
  const backlogCount = tickets.filter((t) => t.status === "Unassigned").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#080c16]">
      {/* Top Navbar */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
        isLoading={isLoading}
        totalTickets={tickets.length}
        assignedCount={assignedCount}
        backlogCount={backlogCount}
      />

      {errorMessage && (
        <div role="alert" className="flex items-center justify-between gap-4 bg-rose-950 p-3 text-sm text-rose-200">
          <span>{errorMessage}</span>
          <button onClick={refreshAllData} className="underline">Retry</button>
        </div>
      )}
      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ticketCount={tickets.length}
          backlogCount={backlogCount}
          agentCount={agents.length}
        />

        {/* Dynamic Center View Container */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === "overview" && (
              <OverviewView
                tickets={tickets}
                agents={agents}
                optimization={optimization}
                mlReport={mlReport}
                onNavigateTab={setActiveTab}
                onRunOptimization={handleRunOptimization}
                isOptimizing={isOptimizing}
              />
            )}

            {activeTab === "tickets" && (
              <TicketsView tickets={tickets} onRefresh={refreshAllData} />
            )}

            {activeTab === "agents" && (
              <AgentsView
                agents={agents}
                onRefresh={refreshAllData}
                onRunOptimization={handleRunOptimization}
                isOptimizing={isOptimizing}
              />
            )}

            {activeTab === "optimization" && (
              <OptimizationView optimization={optimization} onRefresh={refreshAllData} />
            )}

            {activeTab === "ml" && <MLInsightsView report={mlReport} />}
          </div>
        </main>
      </div>
    </div>
  );
}
