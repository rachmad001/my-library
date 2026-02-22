"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FaReply, FaTrash, FaThumbtack, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import {
    deleteComment,
    togglePinComment,
    toggleCommentLike,
    toggleCommentDislike
} from "@/actions/social";
import CommentForm from "./CommentForm";
import Swal from "sweetalert2";

interface CommentItemProps {
    comment: any; // Type according to Prisma include
    catalogId: string;
    isCatalogOwner: boolean;
    currentUserId?: string;
    depth?: number;
}

export default function CommentItem({
    comment,
    catalogId,
    isCatalogOwner,
    currentUserId,
    depth = 0
}: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCommentAuthor = comment.userId === currentUserId;
    const canDelete = isCatalogOwner || isCommentAuthor;
    const canPin = isCatalogOwner && depth === 0; // Only top level comments can be pinned

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Delete Comment?",
            text: "Are you sure you want to delete this comment? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5", // indigo-600
            cancelButtonColor: "#ef4444", // red-500
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            setIsDeleting(true);
            const response = await deleteComment(comment.id);
            if (response.success) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Your comment has been deleted.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire("Error", response.error || "Failed to delete comment", "error");
            }
            setIsDeleting(false);
        }
    };

    const handlePin = async () => {
        await togglePinComment(comment.id);
    };

    const handleLike = async () => {
        await toggleCommentLike(comment.id);
    };

    const handleDislike = async () => {
        await toggleCommentDislike(comment.id);
    };

    return (
        <div className={`group ${depth > 0 ? "ml-8 mt-4 border-l-2 border-gray-100 pl-4" : "border-b border-gray-50 pb-6 last:border-0"}`}>
            <div className={`flex gap-3 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 shadow-sm">
                    {comment.user.image ? (
                        <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-indigo-50 text-indigo-300">
                            {comment.user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                            {comment.user.name}
                        </span>
                        {comment.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <FaThumbtack size={10} /> Pinned
                            </span>
                        )}
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                        {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleLike}
                                className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                            >
                                <FaThumbsUp size={14} />
                                <span className="text-xs">{comment._count?.likes || 0}</span>
                            </button>
                            <button
                                onClick={handleDislike}
                                className="hover:text-red-600 transition-colors flex items-center gap-1"
                            >
                                <FaThumbsDown size={14} />
                                <span className="text-xs">{comment._count?.dislikes || 0}</span>
                            </button>
                        </div>

                        {currentUserId && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1.5 text-xs font-medium hover:text-indigo-600 transition-colors"
                            >
                                <FaReply size={12} /> {isReplying ? "Cancel" : "Reply"}
                            </button>
                        )}

                        {canPin && (
                            <button
                                onClick={handlePin}
                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.isPinned ? "text-indigo-600" : "hover:text-indigo-600"}`}
                            >
                                <FaThumbtack size={12} /> {comment.isPinned ? "Unpin" : "Pin"}
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1.5 text-xs font-medium hover:text-red-500 transition-colors"
                            >
                                <FaTrash size={12} /> Delete
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <CommentForm
                                catalogId={catalogId}
                                parentId={comment.id}
                                placeholder={`Replying to ${comment.user.name}...`}
                                autoFocus
                                onSuccess={() => setIsReplying(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Render Replies Recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-1">
                    {comment.replies.map((reply: any) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            catalogId={catalogId}
                            isCatalogOwner={isCatalogOwner}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
