"use client";

import { useState } from "react";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    HomeIcon,
    DocumentTextIcon,
    CogIcon,
    Bars3Icon,
    XMarkIcon
} from "@heroicons/react/24/outline";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Reports", href: "/reports", icon: DocumentTextIcon },
    { name: "Settings", href: "/settings", icon: CogIcon },
];

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { isSignedIn, isLoaded, user } = useUser();
    const pathname = usePathname();

    return (
        <div
            className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 ${isExpanded ? "w-64" : "w-16"
                }`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    {isExpanded && (
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Checksum
                        </h1>
                    )}
                    <div className="flex items-center">
                        {isExpanded && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Image src='https://framerusercontent.com/images/t5ppdW3uAiIcbmKEY0LePQLk.png' alt='Checksum' width={24} height={24} />
                            </button>
                        )}
                        {!isExpanded && (
                            <Image src='https://framerusercontent.com/images/t5ppdW3uAiIcbmKEY0LePQLk.png' alt='Checksum' width={24} height={24} />

                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => {
                        // Dashboard is active if we're on dashboard or root path
                        const isActive = item.name === "Dashboard"
                            ? (pathname === "/dashboard" || pathname === "/")
                            : pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                        : isExpanded
                                            ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                            >
                                <item.icon
                                    className={`flex-shrink-0 h-5 w-5 ${isExpanded ? "mr-3" : "mx-auto"
                                        }`}
                                />
                                {isExpanded && (
                                    <span className="truncate">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {!isLoaded ? (
                        <div className="flex items-center">
                            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-8"></div>
                            {isExpanded && (
                                <div className="ml-3 animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-20"></div>
                            )}
                        </div>
                    ) : isSignedIn ? (
                        <div className="flex items-center">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "h-8 w-8"
                                    }
                                }}
                            />
                            {isExpanded && (
                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                                    {user?.fullName
                                    }
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-500">?</span>
                            </div>
                            {isExpanded && (
                                <SignInButton mode="modal">
                                    <button className="ml-3 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Sign In
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
