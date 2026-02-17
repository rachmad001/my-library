"use client";

import { createCatalog } from "@/actions/catalog";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateCatalogPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    async function clientAction(formData: FormData) {
        const res = await createCatalog(formData);
        if (res?.error) {
            setError(res.error);
        } else {
            router.push("/dashboard");
        }
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Catalog</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

            <form action={clientAction} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        name="title"
                        type="text"
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="e.g. My Awesome Comic"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="What is this catalog about?"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                    <input
                        name="coverImage"
                        type="file"
                        accept="image/*"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional. Upload a cover image for your catalog.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        name="category"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    >
                        <option value="General">General</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Technology">Technology</option>
                        <option value="Comics">Comics</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <input
                        id="isPublic"
                        name="isPublic"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                        Make Public (Visible to everyone)
                    </label>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition shadow-sm"
                    >
                        Create Catalog
                    </button>
                </div>
            </form>
        </div>
    );
}
