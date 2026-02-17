'use client';

import { FaPen, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { deleteChapter } from '@/actions/chapter';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import ChapterEditButton from './ChapterEditButton';
import Link from 'next/link';

interface Chapter {
    id: string;
    title: string;
    pdfUrl: string | null;
}

interface ChapterMainActionsProps {
    chapter: Chapter;
    catalogId: string;
    isAuthor: boolean;
}

export default function ChapterMainActions({ chapter, catalogId, isAuthor }: ChapterMainActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (!isAuthor) return null;

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Chapter?',
            text: `Remove "${chapter.title}" permanently?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        startTransition(async () => {
            const res = await deleteChapter(chapter.id, catalogId);
            if (res.error) {
                Swal.fire('Error', res.error, 'error');
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Chapter removed successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
                router.refresh();
            }
        });
    };

    return (
        <div className="flex gap-1">
            {/* If PDF: Show Detail Edit (Title/File) */}
            {chapter.pdfUrl ? (
                <ChapterEditButton
                    chapter={chapter as any}
                    catalogId={catalogId}
                />
            ) : (
                <>
                    {/* If Text: Show Content Editor + Delete */}
                    <Link
                        href={`/catalog/${catalogId}/chapter/${chapter.id}/edit`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        title="Edit Content"
                    >
                        <FaPen className="text-sm scale-75 opacity-70" />
                    </Link>
                </>
            )}
        </div>
    );
}
