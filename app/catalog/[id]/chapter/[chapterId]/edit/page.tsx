"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    getChapterPages,
    savePageContent,
    updateChapterTitle,
    deletePage,
    deleteChapter
} from "@/actions/chapter";
import { getCatalogById } from "@/actions/catalog";
import dynamic from "next/dynamic";
import { FaTrash, FaPlus, FaSave, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
    ssr: false,
    loading: () => <div className="h-[500px] bg-gray-50 flex items-center justify-center border border-dashed rounded-md text-gray-400">Loading Editor...</div>
});

export default function EditChapterPage({ params }: { params: Promise<{ id: string, chapterId: string }> }) {
    const router = useRouter();
    const { id: catalogId, chapterId } = use(params);

    const [title, setTitle] = useState("");
    const [pages, setPages] = useState<{ id: string, content: string, pageNumber: number }[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const catalog = await getCatalogById(catalogId);
            const chapter = catalog?.chapters.find(c => c.id === chapterId);
            if (!chapter) {
                router.push(`/catalog/${catalogId}`);
                return;
            }
            setTitle(chapter.title);

            const chapterPages = await getChapterPages(chapterId);
            setPages(chapterPages);
            setLoading(false);
        } catch (err) {
            setError("Failed to load data");
            setLoading(false);
        }
    }, [catalogId, chapterId, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTitle = async () => {
        const res = await updateChapterTitle(chapterId, title);
        if (res.success) {
            setSuccess("Title updated");
            setTimeout(() => setSuccess(""), 3000);
        } else {
            setError(res.error || "Failed to update title");
        }
    };

    const handleSavePageContent = async () => {
        setSaving(true);
        const currentPage = pages[currentPageIndex];
        const res = await savePageContent(chapterId, currentPage.pageNumber, currentPage.content);
        setSaving(false);
        if (res.success) {
            setSuccess("Page saved");
            setTimeout(() => setSuccess(""), 3000);
        } else {
            setError(res.error || "Failed to save page");
        }
    };

    const handleAddPage = async () => {
        const nextNumber = pages.length + 1;
        const res = await savePageContent(chapterId, nextNumber, "<h1>New Page</h1>");
        if (res.success) {
            const updatedPages = await getChapterPages(chapterId);
            setPages(updatedPages);
            setCurrentPageIndex(updatedPages.length - 1);
        }
    };

    const handleDeletePage = async () => {
        if (pages.length <= 1) {
            alert("A chapter must have at least one page.");
            return;
        }
        if (!confirm("Are you sure you want to delete this page?")) return;

        const pageId = pages[currentPageIndex].id;
        const res = await deletePage(chapterId, pageId);
        if (res.success) {
            const updatedPages = await getChapterPages(chapterId);
            setPages(updatedPages);
            setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
        }
    };

    const handleDeleteChapter = async () => {
        if (!confirm("Are you sure you want to delete this entire chapter? This action cannot be undone.")) return;
        const res = await deleteChapter(chapterId, catalogId);
        if (res.success) {
            router.push(`/catalog/${catalogId}`);
        } else {
            setError(res.error || "Failed to delete chapter");
        }
    };

    if (loading) return <div className="flex justify-center py-20">Loading...</div>;

    const currentPage = pages[currentPageIndex];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/catalog/${catalogId}`)} className="text-gray-500 hover:text-indigo-600 transition">
                        <FaTimes className="text-xl" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Edit Chapter</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDeleteChapter} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm transition flex items-center">
                        <FaTrash className="mr-2" /> Delete Chapter
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md animate-pulse">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-md">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Page List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-700">Pages</h2>
                            <button onClick={handleAddPage} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition">
                                <FaPlus />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {pages.map((p, index) => (
                                <button
                                    key={p.id}
                                    onClick={() => setCurrentPageIndex(index)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${index === currentPageIndex
                                        ? "bg-indigo-600 text-white"
                                        : "hover:bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    Page {p.pageNumber}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main: Content Editor */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Chapter Title</label>
                            <div className="flex gap-2">
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-indigo-500 text-black"
                                />
                                <button onClick={handleSaveTitle} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition text-sm">
                                    Update Title
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-800">Page {currentPage?.pageNumber} Content</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleDeletePage} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition" title="Delete Page">
                                        <FaTrash />
                                    </button>
                                    <button
                                        onClick={handleSavePageContent}
                                        disabled={saving}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition flex items-center text-sm"
                                    >
                                        <FaSave className="mr-2" /> {saving ? "Saving..." : "Save Page"}
                                    </button>
                                </div>
                            </div>

                            <RichTextEditor
                                value={currentPage?.content || ""}
                                onChange={(content) => {
                                    const newPages = [...pages];
                                    newPages[currentPageIndex].content = content;
                                    setPages(newPages);
                                }}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <button
                                disabled={currentPageIndex === 0}
                                onClick={() => setCurrentPageIndex(prev => prev - 1)}
                                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                            >
                                <FaChevronLeft /> Previous Page
                            </button>
                            <span className="text-sm text-gray-400">Page {currentPageIndex + 1} of {pages.length}</span>
                            <button
                                disabled={currentPageIndex === pages.length - 1}
                                onClick={() => setCurrentPageIndex(prev => prev + 1)}
                                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                            >
                                Next Page <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
