"use client";

import { createChapter } from "@/actions/chapter";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaFilePdf, FaFont } from "react-icons/fa";

import { use } from "react";

export default function CreateChapterPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [error, setError] = useState("");
    const [type, setType] = useState<"text" | "pdf">("text");

    async function clientAction(formData: FormData) {
        formData.append("type", type);
        const res = await createChapter(id, formData);
        if (res?.error) {
            setError(res.error);
        } else {
            router.push(`/catalog/${id}`);
        }
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Add New Chapter</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

            <div className="flex gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setType("text")}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${type === "text"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-200 text-gray-600"
                        }`}
                >
                    <FaFont className="text-2xl" />
                    <span className="font-medium">Text Content</span>
                </button>
                <button
                    type="button"
                    onClick={() => setType("pdf")}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${type === "pdf"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-200 text-gray-600"
                        }`}
                >
                    <FaFilePdf className="text-2xl" />
                    <span className="font-medium">PDF Upload</span>
                </button>
            </div>

            <form action={clientAction} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
                    <input
                        name="title"
                        type="text"
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="Chapter 1: The Beginning"
                    />
                </div>

                {type === "pdf" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
                        <input
                            name="file"
                            type="file"
                            accept=".pdf"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a PDF file. Pages will be converted for the flipbook reader.</p>
                    </div>
                )}

                {type === "text" && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                        You will be able to write and edit pages after creating the chapter.
                    </p>
                )}

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition shadow-sm"
                    >
                        Create Chapter
                    </button>
                </div>
            </form>
        </div>
    );
}
