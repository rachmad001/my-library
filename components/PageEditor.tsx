"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { savePageContent } from "@/actions/chapter";
import { useRouter } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import { FaSave, FaPlus } from "react-icons/fa";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface PageEditorProps {
    chapterId: string;
    pages: { id: string; content: string; pageNumber: number }[];
}

export default function PageEditor({ chapterId, pages }: PageEditorProps) {
    const router = useRouter();
    const [activePage, setActivePage] = useState(pages[0] || { pageNumber: 1, content: "" });
    const [content, setContent] = useState(activePage.content);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await savePageContent(chapterId, activePage.pageNumber, content);
        setSaving(false);
        router.refresh();
    };

    const handlePageChange = (pageNum: number) => {
        // Should verify if saved?
        const page = pages.find(p => p.pageNumber === pageNum) || { pageNumber: pageNum, content: "" };
        setActivePage(page as any);
        setContent(page.content);
    };

    const handleAddPage = () => {
        const newPageNum = (pages[pages.length - 1]?.pageNumber || 0) + 1;
        handlePageChange(newPageNum);
    };

    return (
        <div className="max-w-4xl mx-auto flex gap-6 h-[80vh]">
            {/* Sidebar: Page List */}
            <div className="w-64 bg-white border border-gray-200 rounded-lg flex flex-col">
                <div className="p-4 border-b border-gray-100 font-bold text-gray-700">Pages</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => handlePageChange(page.pageNumber)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm ${activePage.pageNumber === page.pageNumber ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            Page {page.pageNumber}
                        </button>
                    ))}
                    <button
                        onClick={handleAddPage}
                        className="w-full flex items-center justify-center gap-2 p-2 mt-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                        <FaPlus size={12} /> Add Page
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Editing Page {activePage.pageNumber}</h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        <FaSave /> {saving ? "Saving..." : "Save Page"}
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                    <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        className="h-[calc(100%-3rem)] mb-12"
                    />
                </div>
            </div>
        </div>
    );
}
