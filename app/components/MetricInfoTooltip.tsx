"use client";

import { Info } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface MetricTooltipContent {
  title: string;
  meaning: string;
  formula: string;
  example?: string;
}

interface MetricInfoTooltipProps {
  content: MetricTooltipContent;
  className?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  direction: "up" | "down";
}

const TOOLTIP_WIDTH = 256; // w-64 = 16rem = 256px
const TOOLTIP_ESTIMATED_HEIGHT = 200;
const MARGIN = 8;

export default function MetricInfoTooltip({ content, className }: MetricInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TooltipPosition>({ top: 0, left: 0, direction: "up" });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Compute fixed position relative to the trigger icon
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    // Decide vertical direction: prefer above, fall back to below
    const spaceAbove = rect.top;
    const spaceBelow = viewportH - rect.bottom;
    const direction: "up" | "down" =
      spaceAbove >= TOOLTIP_ESTIMATED_HEIGHT + MARGIN || spaceAbove > spaceBelow
        ? "up"
        : "down";

    // Vertically position
    const top =
      direction === "up"
        ? rect.top - MARGIN // tooltip bottom aligns near the trigger
        : rect.bottom + MARGIN;

    // Horizontally center on the icon, clamped to viewport
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(MARGIN, Math.min(left, viewportW - TOOLTIP_WIDTH - MARGIN));

    setPos({ top, left, direction });
  }, []);

  const handleOpen = useCallback(() => {
    computePosition();
    setOpen(true);
  }, [computePosition]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Info about ${content.title}`}
        className="flex items-center justify-center h-4 w-4 text-indigo-400 hover:text-indigo-300 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors focus:outline-none"
        onClick={(e) => {
          e.stopPropagation();
          if (open) handleClose();
          else handleOpen();
        }}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[9999] w-64 pointer-events-none",
            "bg-white dark:bg-slate-900",
            "border border-slate-200 dark:border-slate-700",
            "rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 p-4 text-left"
          )}
          style={
            pos.direction === "up"
              ? { bottom: `${window.innerHeight - pos.top}px`, left: `${pos.left}px` }
              : { top: `${pos.top}px`, left: `${pos.left}px` }
          }
        >
          {/* Arrow */}
          {pos.direction === "up" ? (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #e2e8f0",
              }}
            />
          ) : (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-[-5px] w-0 h-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "5px solid #e2e8f0",
              }}
            />
          )}

          {/* Content */}
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
            {content.title}
          </p>

          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-0.5">
                Meaning
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {content.meaning}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-0.5">
                Formula
              </p>
              <code className="block text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md font-mono">
                {content.formula}
              </code>
            </div>

            {content.example && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-0.5">
                  Example
                </p>
                <code className="block text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md font-mono">
                  {content.example}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

// ──────────────────────────────────────────────
// Pre-defined metric tooltip content constants
// ──────────────────────────────────────────────

export const METRIC_TOOLTIPS = {
  weightedActiveLoad: {
    title: "Weighted Active Load",
    meaning: "Current active workload based on client activity levels. Each client contributes a weight based on their status.",
    formula: "Sum of all active client workload weights",
    example: "3 active clients × weights = 5.2",
  },
  pendingAssignments: {
    title: "Pending Assignments",
    meaning: "Clients recommended to this CA by the system but not yet approved by a manager.",
    formula: "Count of PENDING recommendations",
    example: "2 clients awaiting approval = 2",
  },
  effectiveLoad: {
    title: "Effective Load",
    meaning: "Total workload currently considered by the assignment engine — includes both active and pending clients.",
    formula: "Weighted Active Load + Pending Assignments",
    example: "5.2 + 2 = 7.2",
  },
  availableCapacity: {
    title: "Available Capacity",
    meaning: "Remaining workload that can still be assigned to this CA without exceeding their maximum.",
    formula: "Max Capacity − Effective Load",
    example: "10 − 7.2 = 2.8",
  },
  utilizationPercentage: {
    title: "Utilization %",
    meaning: "How much of the CA's maximum capacity is currently being used. High values indicate the CA is near or at capacity.",
    formula: "(Effective Load ÷ Max Capacity) × 100",
    example: "(7.2 ÷ 10) × 100 = 72%",
  },
  productivityAverage: {
    title: "Productivity Average",
    meaning: "Average productivity score over the last 30 days, combining base count and any incentive contributions.",
    formula: "Average(Base Count + Incentives) over 30 days",
    example: "Avg of [12, 15, 11] = 12.7",
  },
  recommendationAccuracy: {
    title: "Recommendation Accuracy",
    meaning: "How often managers accepted the system's CA recommendation without overriding it.",
    formula: "Approved Recommendations ÷ Total Processed",
    example: "8 approved ÷ 10 total = 80%",
  },
  averageUtilization: {
    title: "Average Utilization",
    meaning: "The mean utilization percentage across all active Career Associates, showing overall team capacity health.",
    formula: "Sum of all CA Utilization % ÷ Number of Active CAs",
    example: "(72% + 65% + 88%) ÷ 3 = 75%",
  },
  minCapacity: {
    title: "Min Capacity",
    meaning: "The minimum number of clients a CA should ideally be assigned. CAs below this are prioritized for new assignments.",
    formula: "Configured per CA in Capacity Management",
    example: "Min = 4 means the CA should have at least 4 clients",
  },
  maxCapacity: {
    title: "Max Capacity",
    meaning: "The maximum number of clients a CA can be assigned. The system will not assign new clients beyond this limit.",
    formula: "Configured per CA in Capacity Management",
    example: "Max = 10 means no more than 10 clients",
  },
  deficitToMin: {
    title: "Deficit to Minimum",
    meaning: "How far a CA's current effective load is below their minimum capacity target. CAs with a deficit are Priority 1 for new assignments — the engine fills the highest deficit first.",
    formula: "Min Capacity − Effective Load  (only when Effective Load < Min)",
    example: "Min = 6, Effective Load = 4.5 → Deficit = ↑1.5",
  },
} satisfies Record<string, MetricTooltipContent>;
