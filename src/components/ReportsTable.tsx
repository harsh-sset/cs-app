"use client";

import { Fragment, useMemo, useState } from "react";
import { RunResult, Test } from "@/app/api/github-reports/typing";

type ReportsTableProps = {
  reports: RunResult[];
  onSelectReport?: (reportId: number) => void;
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

function getFailingTests(tests: Test[]): Test[] {
  return tests.filter((test) => test.result.toUpperCase() !== "PASS");
}

export function ReportsTable({ reports, onSelectReport }: ReportsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (reportId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const items = useMemo(() => reports ?? [], [reports]);

  if (!items.length) {
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
            {items.map((report) => {
              const analysis = report.ANALYSIS_JSON;
              const summary = analysis?.summary_stats;
              const passRateValue = parsePassRate(summary?.pass_rate);
              const coveragePercent = analysis?.coverage?.code_coverage_percent;
              const coverageChangedLines =
                analysis?.coverage?.changed_lines ?? "No diff data";
              const statusVariant = getStatusVariant(
                analysis?.recommendation?.status
              );
              const failingTests = analysis?.tests
                ? getFailingTests(analysis.tests)
                : [];
              const isExpanded = expandedRows.has(report.id);
              const metadata = analysis?.metadata;
              const jobUrl = metadata?.job_url;
              const filesChanged =
                metadata?.files_changed !== undefined
                  ? metadata.files_changed.toString()
                  : undefined;

              return (
                <Fragment key={report.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onSelectReport?.(report.id)}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleRow(report.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? "Collapse report details"
                            : "Expand report details"
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.GITHUB_REPOSITORY}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {report.GITHUB_REPO_OWNER_NAME}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white">
                          Head: {report.GITHUB_HEAD_BRANCH}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Base: {report.GITHUB_BASE_BRANCH || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">
                        Attempt #{report.GITHUB_RUN_ATTEMPT}
                      </div>
                      {report.GITHUB_PR_NUMBER ? (
                        <a
                          href={report.GITHUB_PR_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          PR #{report.GITHUB_PR_NUMBER}
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
                      {analysis?.recommendation?.reason && (
                        <p
                          className={`mt-1 text-xs ${statusVariant.text}`}
                        >
                          {analysis.recommendation.reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="bg-gray-50/60 dark:bg-gray-900/60">
                      <td colSpan={8} className="px-6 py-5">
                        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                          <section className="space-y-4">
                            <header>
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                Summary
                              </h3>
                            </header>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Total Tests
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                  {summary?.total_tests ?? "—"}
                                </p>
                              </div>
                              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Critical Bugs
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                  {summary?.critical_bugs_found ?? 0}
                                </p>
                              </div>
                              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Positive Improvements
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                  {summary?.positive_improvements ?? 0}
                                </p>
                              </div>
                            </div>
                            {failingTests.length ? (
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Failing Tests
                                </h4>
                                <div className="mt-2 space-y-2">
                                  {failingTests.slice(0, 4).map((test) => (
                                    <div
                                      key={`${report.id}-${test.id}`}
                                      className="rounded-md border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200"
                                    >
                                      <p className="font-semibold">
                                        {test.name}
                                      </p>
                                      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                        {test.objective}
                                      </p>
                                    </div>
                                  ))}
                                  {failingTests.length > 4 ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      +{failingTests.length - 4} more failing{" "}
                                      {failingTests.length - 4 === 1
                                        ? "test"
                                        : "tests"}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-900/30 dark:text-green-200">
                                All tests passed in this run.
                              </div>
                            )}
                          </section>

                          <section className="space-y-4">
                            <header>
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                Metadata
                              </h3>
                            </header>
                            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                              <DetailRow
                                label="Workflow Run"
                                value={`#${report.GITHUB_RUN_NUMBER}`}
                              />
                              <DetailRow
                                label="Updated"
                                value={new Date(
                                  report.updated_at
                                ).toLocaleString()}
                              />
                              <DetailRow
                                label="Feature"
                                value={metadata?.feature ?? "Not specified"}
                              />
                              <DetailRow
                                label="Files Changed"
                                value={filesChanged ?? "Unknown"}
                              />
                              {jobUrl ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Job URL
                                  </span>
                                  <a
                                    href={jobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="truncate text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    {jobUrl}
                                  </a>
                                </div>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                View the full analysis for complete details.
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onSelectReport?.(report.id);
                                }}
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                              >
                                Open Report
                              </button>
                            </div>
                          </section>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

