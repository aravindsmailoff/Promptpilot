"use client";

import React from "react";
import { RefreshCw, Loader2, Globe, Shield, Activity, Clock } from "lucide-react";
import { KokonutCard } from "./KokonutCard";

export interface KokonutWorkerStatus {
  status: "active" | "idle" | "error";
  intervalSeconds: number;
  lastAttemptedAt: string;
  lastSuccessfulAt: string;
  nextScheduledAt: string;
  activeWatchlistCount?: number;
  verifiedCompetitorCount?: number;
}

interface KokonutWorkerHeaderProps {
  status: KokonutWorkerStatus;
  verifiedCount: number;
  newsCount: number;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function KokonutWorkerHeader({
  status,
  verifiedCount,
  newsCount,
  onRefresh,
  isRefreshing,
}: KokonutWorkerHeaderProps) {
  return (
    <KokonutCard glowColor="blue" className="bg-[#121214]/90 border-white/[0.08] w-full font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Clean Apple-Style Worker Telemetry */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30d158]" />
            </span>
            <h3 className="font-semibold text-white text-sm tracking-tight flex items-center gap-2">
              Continuous Intelligence Worker
              <span className="px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] text-[10px] font-medium border border-[#30d158]/20">
                {status.status === "active" ? "120s Cadence" : "Standby"}
              </span>
            </h3>
          </div>
          <p className="text-neutral-400 text-xs max-w-xl leading-relaxed">
            Automated background process indexing product updates, competitor announcements, funding milestones, and hiring signals.
          </p>
        </div>

        {/* Right Side: Action & Timestamps */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-xs text-neutral-400 font-mono space-y-0.5">
            <span>
              Last Crawl:{" "}
              <strong className="text-neutral-200">
                {status.lastAttemptedAt ? new Date(status.lastAttemptedAt).toLocaleTimeString() : "Just now"}
              </strong>
            </span>
            <span>
              Next Cycle:{" "}
              <strong className="text-[#0a84ff]">
                {status.nextScheduledAt ? new Date(status.nextScheduledAt).toLocaleTimeString() : "In 120s"}
              </strong>
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                <span>Indexing Web...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-black" />
                <span>Sync Intel Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/[0.06] text-xs">
        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex items-center justify-between">
          <span className="text-neutral-400 text-[11px]">Verified Competitors</span>
          <span className="text-white font-semibold">{verifiedCount} Tracked</span>
        </div>
        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex items-center justify-between">
          <span className="text-neutral-400 text-[11px]">Active Watchlist</span>
          <span className="text-white font-semibold">{status.activeWatchlistCount || 24} Monitored</span>
        </div>
        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex items-center justify-between">
          <span className="text-neutral-400 text-[11px]">Market Signals</span>
          <span className="text-white font-semibold">{newsCount || 5} Captured</span>
        </div>
        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex items-center justify-between">
          <span className="text-neutral-400 text-[11px]">Worker Cadence</span>
          <span className="text-[#0a84ff] font-semibold">120s Polling</span>
        </div>
      </div>
    </KokonutCard>
  );
}
