"use client";

import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

interface CommentListProps {
    comments: any[];
    catalogId: string;
    isCatalogOwner: boolean;
    currentUserId?: string;
    totalComments: number;
}

export default function CommentList({
    comments,
    catalogId,
    isCatalogOwner,
    currentUserId,
    totalComments
}: CommentListProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                    Comments <span className="text-indigo-600 ml-1">{totalComments}</span>
                </h2>
            </div>

            {currentUserId ? (
                <div className="mb-10 bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Join the discussion</h3>
                    <p className="text-xs text-gray-500 mb-4">Share your thoughts about this catalog.</p>
                    <CommentForm catalogId={catalogId} />
                </div>
            ) : (
                <div className="mb-10 p-6 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <p className="text-indigo-800 text-sm">
                        Please <a href="/api/auth/signin" className="font-bold underline hover:text-indigo-600 transition-colors">sign in</a> to leave a comment.
                    </p>
                </div>
            )}

            <div className="space-y-8">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 italic text-sm">No comments yet. Be the first to say something!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {comments.map((comment) => (
                            <div key={comment.id} className="pt-8 first:pt-0">
                                <CommentItem
                                    comment={comment}
                                    catalogId={catalogId}
                                    isCatalogOwner={isCatalogOwner}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
