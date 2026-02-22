"use client";

import { useState } from "react";
import { addComment } from "@/actions/social";

interface CommentFormProps {
    catalogId: string;
    parentId?: string;
    onSuccess?: () => void;
    autoFocus?: boolean;
    placeholder?: string;
}

export default function CommentForm({
    catalogId,
    parentId,
    onSuccess,
    autoFocus = false,
    placeholder = "Leave a comment..."
}: CommentFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await addComment(catalogId, content, parentId);
            if (result.success) {
                setContent("");
                if (onSuccess) onSuccess();
            } else {
                alert(result.error || "Failed to post comment");
            }
        } catch (error) {
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={parentId ? 2 : 3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm resize-none transition-all duration-200"
                placeholder={placeholder}
                required
                autoFocus={autoFocus}
            />
            <div className="flex justify-end mt-2 gap-2">
                <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {isSubmitting ? "Posting..." : parentId ? "Reply" : "Post Comment"}
                </button>
            </div>
        </form>
    );
}
