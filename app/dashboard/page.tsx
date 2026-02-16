import Link from "next/link";
import { getMyCatalogs } from "@/actions/catalog";
import CatalogCard from "@/components/CatalogCard";
import { FaPlus } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const catalogs = await getMyCatalogs();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">My Catalogs</h1>
                <Link
                    href="/dashboard/create"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition"
                >
                    <FaPlus />
                    <span>Create Catalog</span>
                </Link>
            </div>

            {catalogs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">You haven't created any catalogs yet.</p>
                    <Link
                        href="/dashboard/create"
                        className="text-indigo-600 font-medium hover:text-indigo-500"
                    >
                        Start your first catalog
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catalogs.map((catalog) => (
                        <CatalogCard key={catalog.id} catalog={catalog} />
                    ))}
                </div>
            )}
        </div>
    );
}
