"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaBook, FaUser, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <FaBook className="h-8 w-8 text-indigo-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">E-Library</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {session ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 mr-2">Hi, {session.user?.name}</span>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors"
                                        title="Sign Out"
                                    >
                                        <FaSignOutAlt />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex space-x-2">
                                <Link
                                    href="/api/auth/signin"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                                >
                                    <FaSignInAlt className="mr-1" /> Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
