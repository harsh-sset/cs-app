"use client";

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useGitHubReportById } from "@/hooks/useGitHubData";
import { RunResult } from "@/app/api/github-reports/typing";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ReportDetailsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { data, isLoading, error } = useGitHubReportById(parseInt(reportId));
  const report = data?.data;
  const [expandedTests, setExpandedTests] = useState<number[]>([]);

  const toggleTest = (testId: number) => {
    setExpandedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-16">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-16">
          <div className="p-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Error loading report: {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-16">
          <div className="p-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Report not found
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analysis = report.ANALYSIS_JSON;
  const tests = analysis?.tests || [];
  const markdownContent = report.MARKDOWN_RES || '';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 ml-16">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.back()}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Reports
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Report Details
                </h1>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Repository:</span> {report.GITHUB_REPOSITORY} | 
                  <span className="font-medium ml-2">Branch:</span> {report.GITHUB_HEAD_BRANCH} | 
                  <span className="font-medium ml-2">Run:</span> #{report.GITHUB_RUN_ATTEMPT}
                </div>
              </div>
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-5 gap-8 h-[calc(100vh-200px)]">
            {/* Left Section - Test Details (60%) */}
            <div className="col-span-3 flex flex-col">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Run Details
                  </h2>
                </div>
                
                {/* Summary Card */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                  
                  {/* Test Summary Stats */}
                  <div className=" grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tests.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {tests.filter(test => test.result === 'PASS').length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {tests.filter(test => test.result !== 'PASS').length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-357px)]">
                  {tests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No tests found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tests.map((test, index) => (
                        <div
                          key={test.id || index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <button
                            onClick={() => toggleTest(test.id || index)}
                            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                test.result === 'PASS' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {test.result}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {test.name}
                              </span>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedTests.includes(test.id || index) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {expandedTests.includes(test.id || index) && (
                            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="pt-4 space-y-3">
                                <div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{test.category}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Objective:</span>
                                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{test.objective}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Impact:</span>
                                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{test.impact}</p>
                                </div>
                                {test.function_tested && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Function Tested:</span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{test.function_tested}</p>
                                  </div>
                                )}
                                {
                                    test.input?.url && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Input:</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{test.input.url}</p>
                                        </div>
                                    )
                                }
                                {test.expected_behavior && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Behavior:</span>
                                    <div className="mt-1 space-y-1">
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        <span className="font-medium">Current:</span> {test.expected_behavior.current}
                                      </p>
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        <span className="font-medium">After Fix:</span> {test.expected_behavior.after_fix}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Markdown Comments (40%) */}
            <div className="col-span-2 flex flex-col">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Analysis Report
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 mb-6 max-h-[calc(100vh-300px)]">
                  {markdownContent ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{markdownContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No analysis report available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
