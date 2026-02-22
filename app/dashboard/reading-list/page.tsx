import { getReadingList, getGroups } from "@/actions/reading-list";
import Link from "next/link";
import { FaBook } from "react-icons/fa";
import ReadingListManager from "@/components/ReadingListManager";

export default async function ReadingListPage() {
    const readingList = await getReadingList();
    const groups = await getGroups();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Reading List</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Find all your saved catalogs here. You have {readingList.length} items.
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-semibold flex items-center"
                >
                    Back to Dashboard
                </Link>
            </div>

            {readingList.length === 0 && groups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBook size={32} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Your list is empty</h2>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        Explore the library and save catalogs you want to read later.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-block mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Explore Library
                    </Link>
                </div>
            ) : (
                <ReadingListManager initialItems={readingList} initialGroups={groups} />
            )}
        </div>
    );
}
