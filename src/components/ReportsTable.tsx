"use client";

import { Fragment, useMemo, useState } from "react";
import { RunResult } from "@/app/api/github-reports/typing";

type ReportsTableProps = {
  reports: RunResult[];
  onSelectReport?: (reportId: number) => void;
};

type ReportGroup = {
  key: string;
  latest: RunResult;
  previous: RunResult[];
};

type StatusVariant = {
  badge: string;
  text: string;
};

const PILL_BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-semibold transition-colors";

const statusStyles: Record<string, StatusVariant> = {
  pass: {
    badge: `${PILL_BASE_CLASSES} border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-200`,
    text: "text-green-600 dark:text-green-300",
  },
  approved: {
    badge: `${PILL_BASE_CLASSES} border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-200`,
    text: "text-green-600 dark:text-green-300",
  },
  merge: {
    badge: `${PILL_BASE_CLASSES} border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-200`,
    text: "text-green-600 dark:text-green-300",
  },
  pending: {
    badge: `${PILL_BASE_CLASSES} border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/30 dark:text-yellow-200`,
    text: "text-yellow-600 dark:text-yellow-300",
  },
  review: {
    badge: `${PILL_BASE_CLASSES} border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/30 dark:text-yellow-200`,
    text: "text-yellow-600 dark:text-yellow-300",
  },
  fail: {
    badge: `${PILL_BASE_CLASSES} border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200`,
    text: "text-red-600 dark:text-red-300",
  },
  rejected: {
    badge: `${PILL_BASE_CLASSES} border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200`,
    text: "text-red-600 dark:text-red-300",
  },
  unknown: {
    badge: `${PILL_BASE_CLASSES} border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-200`,
    text: "text-gray-500 dark:text-gray-300",
  },
};

const PASS_RATE_THRESHOLDS = {
  success: 80,
  warning: 60,
};

function getStatusVariant(status?: string): StatusVariant {
  if (!status) return statusStyles.unknown;
  const normalized = status.toLowerCase();
  return statusStyles[normalized] ?? statusStyles.unknown;
}

function getPassRateBadge(passRate: number | undefined): string {
  if (passRate === undefined || Number.isNaN(passRate)) {
    return `${PILL_BASE_CLASSES} border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-200`;
  }

  if (passRate >= PASS_RATE_THRESHOLDS.success) {
    return `${PILL_BASE_CLASSES} border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-200`;
  }

  if (passRate >= PASS_RATE_THRESHOLDS.warning) {
    return `${PILL_BASE_CLASSES} border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/30 dark:text-yellow-200`;
  }

  return `${PILL_BASE_CLASSES} border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200`;
}

function parsePassRate(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace("%", "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatPercentage(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value.toFixed(1)}%`;
}

export function ReportsTable({ reports, onSelectReport }: ReportsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (groupKey: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const groupedReports = useMemo<ReportGroup[]>(() => {
    if (!reports?.length) {
      return [];
    }

    const groups = new Map<string, RunResult[]>();

    for (const report of reports) {
      const repositoryKey = `${report.GITHUB_REPO_OWNER_NAME ?? ""}/${report.GITHUB_REPOSITORY ?? ""}`;
      const headBranch = report.GITHUB_HEAD_BRANCH ?? "no-head";
      const baseBranch = report.GITHUB_BASE_BRANCH ?? "no-base";
      const prNumber = report.GITHUB_PR_NUMBER ?? "no-pr";
      const key = [repositoryKey, headBranch, baseBranch, prNumber].join("::");

      const existing = groups.get(key);
      if (existing) {
        existing.push(report);
      } else {
        groups.set(key, [report]);
      }
    }

    const result = Array.from(groups.entries()).map<ReportGroup>(
      ([key, entries]) => {
        const sorted = [...entries].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        return {
          key,
          latest: sorted[0],
          previous: sorted.slice(1),
        };
      }
    );

    result.sort(
      (a, b) =>
        new Date(b.latest.created_at).getTime() -
        new Date(a.latest.created_at).getTime()
    );

    return result;
  }, [reports]);

  if (!groupedReports.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No reports found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by running your first checksum analysis.
          </p>
        </div>
      </div>
    );
  }

  const renderRunColumns = (
    run: RunResult,
    options: { isNested?: boolean } = {}
  ) => {
    const { isNested } = options;
    const analysis = run.ANALYSIS_JSON;
    const summary = analysis?.summary_stats;
    const passRateValue = parsePassRate(summary?.pass_rate);
    const coveragePercent = analysis?.coverage?.code_coverage_percent;
    const coverageChangedLines =
      analysis?.coverage?.changed_lines ?? "No diff data";
    const statusVariant = getStatusVariant(analysis?.recommendation?.status);
    const repositoryLabel = isNested
      ? `${run.GITHUB_REPOSITORY} · Attempt #${run.GITHUB_RUN_ATTEMPT}`
      : run.GITHUB_REPOSITORY;

    return (
      <>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {repositoryLabel}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {run.GITHUB_REPO_OWNER_NAME}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 dark:text-white">
              Head: {run.GITHUB_HEAD_BRANCH}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Base: {run.GITHUB_BASE_BRANCH || "—"}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-900 dark:text-white">
            Attempt #{run.GITHUB_RUN_ATTEMPT}
          </div>
          {run.GITHUB_PR_NUMBER ? (
            <a
              href={run.GITHUB_PR_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              PR #{run.GITHUB_PR_NUMBER}
            </a>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              No PR
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={getPassRateBadge(passRateValue)}>
            {summary?.pass_rate ?? "N/A"}
          </span>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {summary?.total_tests ?? 0} tests
          </p>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
          {formatPercentage(coveragePercent)}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {coverageChangedLines}
          </p>
        </td>
        <td className="px-4 py-3">
          <span className={statusVariant.badge}>
            {analysis?.recommendation?.status ?? "Unknown"}
          </span>
          {analysis?.recommendation?.reason && !isNested ? (
            <p className={`mt-1 text-xs ${statusVariant.text}`}>
              {analysis.recommendation.reason}
            </p>
          ) : null}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {new Date(run.created_at).toLocaleString()}
        </td>
      </>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                <span className="sr-only">Toggle details</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Repository
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Branches
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Run
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Pass Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Coverage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {groupedReports.map((group) => {
              const report = group.latest;
              const isExpanded = expandedRows.has(group.key);
              const hasPrevious = group.previous.length > 0;

              return (
                <Fragment key={group.key}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onSelectReport?.(report.id)}
                  >
                    <td className="px-4 py-3">
                      {hasPrevious ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleRow(group.key);
                          }}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? "Collapse previous runs"
                              : "Expand to view previous runs"
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                        >
                          <svg
                            className={`h-4 w-4 transform transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L11.586 10 6.293 4.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center text-gray-300 dark:text-gray-600">
                          —
                        </span>
                      )}
                    </td>
                    {renderRunColumns(report)}
                  </tr>
                  {isExpanded && hasPrevious
                    ? group.previous.map((run) => (
                        <tr
                          key={run.id}
                          className="bg-gray-50/60 dark:bg-gray-900/60"
                          onClick={() => onSelectReport?.(run.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center text-gray-400 dark:text-gray-500">
                              →
                            </span>
                          </td>
                          {renderRunColumns(run, { isNested: true })}
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

