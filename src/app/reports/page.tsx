"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ReportsTable } from "@/components/ReportsTable";
import { useGitHubReports } from "@/hooks/useGitHubData";
import { RunResult } from "@/app/api/github-reports/typing";

export default function ReportsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [hasOpenedSignIn, setHasOpenedSignIn] = useState(false);

  const shouldFetchReports = Boolean(isLoaded && isSignedIn);

  const { data: reports, isLoading, error } = useGitHubReports({
    enabled: shouldFetchReports,
  });

  const handleReportClick = (reportId: number) => {
    router.push(`/reports/${reportId}`);
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn && !hasOpenedSignIn) {
      openSignIn({
        redirectUrl: "/reports",
        afterSignInUrl: "/reports",
      });
      setHasOpenedSignIn(true);
    }

    if (isLoaded && isSignedIn && hasOpenedSignIn) {
      setHasOpenedSignIn(false);
    }
  }, [hasOpenedSignIn, isLoaded, isSignedIn, openSignIn]);

  const handleOpenSignIn = () => {
    openSignIn({
      redirectUrl: "/reports",
      afterSignInUrl: "/reports",
    });
  };

  if (!isLoaded) {
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

  if (!isSignedIn) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-16">
          <div className="p-8 flex items-center justify-center h-full">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Sign in required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please sign in with your Clerk account to view reports.
              </p>
              <button
                onClick={handleOpenSignIn}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-16">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and analyze your checksum reports and statistics.
              </p>
            </div>
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and analyze your checksum reports and statistics.
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Error loading reports: {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 ml-16">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and analyze your checksum reports and statistics.
            </p>
          </div>

          <ReportsTable
            reports={(reports?.data as RunResult[]) ?? []}
            onSelectReport={handleReportClick}
          />
        </div>
      </div>
    </div>
  );
}
