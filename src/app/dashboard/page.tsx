"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const [hasOpenedSignIn, setHasOpenedSignIn] = useState(false);

  const shouldFetchMetrics = Boolean(isLoaded && isSignedIn);
  const { metrics, loading, error } = useDashboardMetrics(shouldFetchMetrics);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !hasOpenedSignIn) {
      openSignIn({
        redirectUrl: "/dashboard",
        afterSignInUrl: "/dashboard",
      });
      setHasOpenedSignIn(true);
    }

    if (isLoaded && isSignedIn && hasOpenedSignIn) {
      setHasOpenedSignIn(false);
    }
  }, [hasOpenedSignIn, isLoaded, isSignedIn, openSignIn]);

  const handleOpenSignIn = () => {
    openSignIn({
      redirectUrl: "/dashboard",
      afterSignInUrl: "/dashboard",
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
                Please sign in with your Clerk account to access the dashboard.
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 ml-16">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.firstName || 'User'}! Here's your overview.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Unique Repos
              </h3>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">Error loading data</p>
              ) : (
                <p className="text-3xl font-bold text-blue-600">{metrics?.totalUniqueRepos || 0}</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Runs
              </h3>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">Error loading data</p>
              ) : (
                <p className="text-3xl font-bold text-green-600">{metrics?.totalRuns || 0}</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Unique PRs
              </h3>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">Error loading data</p>
              ) : (
                <p className="text-3xl font-bold text-purple-600">{metrics?.totalUniquePRs || 0}</p>
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent activity to display
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
