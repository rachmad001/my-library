'use client';

import { FaPen } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { updateChapter } from '@/actions/chapter';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const MySwal = withReactContent(Swal);

interface Chapter {
    id: string;
    title: string;
    pdfUrl: string | null;
}

interface ChapterEditButtonProps {
    chapter: Chapter;
    catalogId: string;
    className?: string;
    onSuccess?: (newTitle: string) => void;
}

export default function ChapterEditButton({ chapter, catalogId, className, onSuccess }: ChapterEditButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleEdit = async () => {
        const { value: formValues } = await MySwal.fire({
            title: '<span class="text-2xl font-bold text-gray-800">Edit Chapter Details</span>',
            html: (
                <div className="text-left space-y-6 pt-6 px-1">
                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-600">
                            Chapter Title
                        </label>
                        <input
                            id="swal-title"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none text-gray-700"
                            defaultValue={chapter.title}
                            placeholder="Enter chapter title..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Update Document (PDF)
                        </label>
                        <div className="relative group">
                            <label htmlFor="swal-file" className="flex flex-col items-center justify-center w-full h-36 px-4 transition bg-white border-2 border-gray-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none group-hover:bg-indigo-50/40">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="w-12 h-12 mb-3 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-indigo-600">Click to replace</span> or drag & drop</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">PDF only • MAX 10MB</p>
                                </div>
                                <input
                                    id="swal-file"
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const label = e.target.parentElement?.querySelector('p.text-sm');
                                            if (label) label.innerHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">Selected</span> ${file.name}`;
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-3 italic flex items-center gap-1.5 px-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            The existing PDF will be preserved if no new file is selected.
                        </p>
                    </div>
                </div>
            ),
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save Update',
            cancelButtonText: 'Keep Current',
            customClass: {
                popup: 'rounded-3xl border-0 shadow-2xl',
                confirmButton: 'bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl transition font-bold shadow-lg shadow-indigo-100 text-sm tracking-wide',
                cancelButton: 'text-gray-400 hover:text-gray-600 font-semibold px-6 text-sm mr-2'
            },
            buttonsStyling: false,
            preConfirm: () => {
                const titleInput = document.getElementById('swal-title') as HTMLInputElement;
                const fileInput = document.getElementById('swal-file') as HTMLInputElement;

                if (!titleInput.value) {
                    Swal.showValidationMessage('Title is required');
                    return false;
                }

                return {
                    title: titleInput.value,
                    file: fileInput.files?.[0] || null
                };
            }
        });

        if (formValues) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('title', formValues.title);
                if (formValues.file) {
                    formData.append('file', formValues.file);
                }
                formData.append('catalogId', catalogId);

                const res = await updateChapter(chapter.id, formData);
                if (res.error) {
                    Swal.fire('Error', res.error, 'error');
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Chapter updated successfully.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    if (onSuccess) onSuccess(formValues.title);
                    router.refresh();
                }
            });
        }
    };

    return (
        <button
            onClick={handleEdit}
            disabled={isPending}
            className={className || "p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition focus:outline-none"}
            title="Edit Chapter Details"
        >
            <FaPen className="text-sm" />
        </button>
    );
}
