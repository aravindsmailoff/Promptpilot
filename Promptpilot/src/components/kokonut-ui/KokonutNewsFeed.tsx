"use client";

import React from "react";
import { Newspaper, ExternalLink, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { KokonutCard } from "./KokonutCard";

export interface KokonutNewsItem {
  id?: string;
  headline: string;
  company?: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  retrievalTimestamp?: string;
  summary: string;
  verificationStatus?: string;
  businessImplication: string;
  impactType?: "Opportunity" | "Threat" | string;
}

interface KokonutNewsFeedProps {
  news: KokonutNewsItem[];
}

export function KokonutNewsFeed({ news }: KokonutNewsFeedProps) {
  if (!news || news.length === 0) {
    return (
      <div className="p-8 text-center border border-white/[0.08] rounded-3xl bg-[#121214]/90 space-y-1 font-sans">
        <p className="text-neutral-300 font-medium text-sm">No competitor news recorded in current cycle.</p>
        <p className="text-neutral-500 text-xs">The 120s worker is actively polling technology publications and company blogs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
            <Newspaper className="h-4 w-4 text-[#0a84ff]" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm tracking-tight">Market Intelligence & Competitor Signals</h4>
            <p className="text-neutral-400 text-xs">Verified developments ingested from authoritative technology and business news sources.</p>
          </div>
        </div>
        <span className="text-xs font-mono text-neutral-300 bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.08]">
          {news.length} Signals Captured
        </span>
      </div>

      <div className="space-y-3">
        {news.map((item, idx) => {
          const isOpportunity = (item.impactType || "").toLowerCase() === "opportunity";
          return (
            <div
              key={idx}
              className="p-5 bg-[#121214]/90 border border-white/[0.08] hover:border-white/[0.16] rounded-3xl transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-neutral-200 border border-white/[0.08]">
                    {item.company || "Sector Signal"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      isOpportunity
                        ? "bg-[#30d158]/12 border-[#30d158]/25 text-[#30d158]"
                        : "bg-[#ff453a]/12 border-[#ff453a]/25 text-[#ff453a]"
                    }`}
                  >
                    {item.impactType || "Market Shift"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                  <span>
                    Pub:{" "}
                    <strong className="text-neutral-300 font-normal">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Recent"}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Source: <strong className="text-neutral-300 font-normal">{item.publisher}</strong>
                  </span>
                </div>
              </div>

              <h5 className="text-white font-medium text-sm leading-snug hover:text-[#0a84ff] transition-colors">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                  {item.headline}
                  <ExternalLink className="h-3 w-3 text-neutral-500" />
                </a>
              </h5>

              <p className="text-neutral-400 text-xs leading-relaxed">{item.summary}</p>

              <div className="pt-3 border-t border-white/[0.06] flex items-start gap-2 text-xs">
                <span className="text-[#0a84ff] font-medium flex-shrink-0">Strategic Impact:</span>
                <span className="text-neutral-300">{item.businessImplication}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
