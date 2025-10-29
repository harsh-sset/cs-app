"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Show sign-in prompt if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Image src='https://framerusercontent.com/images/t5ppdW3uAiIcbmKEY0LePQLk.png' alt='Checksum' width={32} height={32} />
            Welcome to Checksum
              </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to continue
            </p>
          </div>
          <SignInButton mode="modal">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  );
}
