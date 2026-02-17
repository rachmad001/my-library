'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaArrowUp, FaArrowDown, FaGripLines, FaSave, FaTimes, FaCamera, FaPen } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { updateCatalog, deleteCatalog } from '@/actions/catalog';
import { reorderChapters, updateChapterTitle, deleteChapter, updateChapter } from '@/actions/chapter';
const MySwal = withReactContent(Swal);
import ChapterEditButton from "@/components/ChapterEditButton";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Chapter {
    id: string;
    title: string;
    chapterNumber: number;
    pdfUrl: string | null;
}

interface Catalog {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    coverImage: string | null;
    isPublic: boolean;
    chapters: Chapter[];
}

interface CatalogManagementProps {
    catalog: Catalog;
}

// Sortable Item Component
function SortableChapterItem({ chapter, onMoveUp, onMoveDown, onTitleChange, onDelete, isFirst, isLast }: {
    chapter: Chapter;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onTitleChange: (newTitle: string) => void;
    onDelete: () => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: chapter.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm mb-2"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-2">
                <FaGripLines />
            </div>

            <button
                onClick={(e) => { e.preventDefault(); onDelete(); }}
                title="Delete Chapter"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition focus:outline-none"
            >
                <FaTrash fontSize={12} />
            </button>

            <input
                value={chapter.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="flex-1 font-medium text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm"
                placeholder="Chapter Title"
            />

            <div className="flex gap-1 items-center">
                <button
                    onClick={(e) => { e.preventDefault(); onMoveUp(); }}
                    disabled={isFirst}
                    title="Move Up"
                    className={`p-2 rounded-md ${isFirst ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <FaArrowUp fontSize={12} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); onMoveDown(); }}
                    disabled={isLast}
                    title="Move Down"
                    className={`p-2 rounded-md ${isLast ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <FaArrowDown fontSize={12} />
                </button>
            </div>
        </div>
    );
}

export default function CatalogManagement({ catalog }: CatalogManagementProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Catalog state
    const [title, setTitle] = useState(catalog.title);
    const [description, setDescription] = useState(catalog.description || '');
    const [category, setCategory] = useState(catalog.category || '');
    const [isPublic, setIsPublic] = useState(catalog.isPublic);
    const [previewImage, setPreviewImage] = useState(catalog.coverImage);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Chapters state for reordering
    const [chapters, setChapters] = useState(catalog.chapters);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setChapters((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const moveChapter = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= chapters.length) return;

        const newChapters = [...chapters];
        const temp = newChapters[index];
        newChapters[index] = newChapters[newIndex];
        newChapters[newIndex] = temp;
        setChapters(newChapters);
    };

    const handleTitleChange = (id: string, newTitle: string) => {
        setChapters(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    };

    const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
        const result = await Swal.fire({
            title: 'Delete Chapter?',
            text: `Remove "${chapterTitle}" permanently?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        startTransition(async () => {
            const res = await deleteChapter(chapterId, catalog.id);
            if (res.error) {
                Swal.fire('Error', res.error, 'error');
            } else {
                setChapters(prev => prev.filter(c => c.id !== chapterId));
            }
        });
    };

    const handleAdvancedEdit = async (chapter: Chapter) => {
        const { value: formValues } = await MySwal.fire({
            title: 'Edit Chapter',
            html: (
                <div className="text-left space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                        <input
                            id="swal-title"
                            className="swal2-input w-full m-0"
                            defaultValue={chapter.title}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">PDF File (optional)</label>
                        <input
                            id="swal-file"
                            type="file"
                            accept="application/pdf"
                            className="swal2-file w-full m-0"
                        />
                        <p className="text-xs text-gray-400 mt-1">Leave empty to keep current file.</p>
                    </div>
                </div>
            ),
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Update Chapter',
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
                formData.append('catalogId', catalog.id);

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
                    // Update local state is complex because PDF might change
                    // best to refresh or find a way to update the specific chapter in list if it matters
                    // for now, let's just update the title locally
                    setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, title: formValues.title } : c));
                    router.refresh();
                }
            });
        }
    };

    const handleSave = async () => {
        startTransition(async () => {
            // 1. Save Catalog Info
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('isPublic', isPublic ? 'on' : 'off');
            if (coverFile) formData.append('coverImage', coverFile);

            const res = await updateCatalog(catalog.id, formData);
            if (res.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: res.error,
                    confirmButtonColor: '#4f46e5',
                });
                return;
            }

            // 2. Save Chapter Order & Titles
            const chapterOrderRes = await reorderChapters(catalog.id, chapters.map(c => c.id));
            if (chapterOrderRes.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Sync Failed',
                    text: chapterOrderRes.error,
                    confirmButtonColor: '#4f46e5',
                });
                return;
            }

            // 3. Save Chapter Titles (if changed)
            for (const chapter of chapters) {
                const originalChapter = catalog.chapters.find(c => c.id === chapter.id);
                if (originalChapter && originalChapter.title !== chapter.title) {
                    const titleRes = await updateChapterTitle(chapter.id, chapter.title);
                    if (titleRes.error) {
                        console.error(`Failed to update title for ${chapter.title}:`, titleRes.error);
                    }
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Catalog updated successfully.',
                timer: 1500,
                showConfirmButton: false,
            });

            setIsEditing(false);
            router.refresh();
        });
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Catalog?',
            text: "All chapters and progress will be permanently lost!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        startTransition(async () => {
            const res = await deleteCatalog(catalog.id);
            if (res.error) {
                Swal.fire('Error', res.error, 'error');
            } else {
                router.push('/dashboard');
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isEditing) {
        return (
            <div className="flex justify-end">
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-indigo-600 text-sm font-medium transition flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-md hover:border-indigo-200"
                >
                    Management Mode
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Catalog</h2>
                        <p className="text-gray-500 text-sm">Update your catalog details and organize chapters.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <FaTimes fontSize={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Left Side: Catalog Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                                <div className="relative group w-48 aspect-[2/3] mx-auto overflow-hidden rounded-xl shadow-md border-2 border-dashed border-gray-200 hover:border-indigo-400 transition">
                                    {previewImage ? (
                                        <img src={previewImage} className="w-full h-full object-cover transition group-hover:opacity-75" alt="Preview" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <FaCamera fontSize={32} />
                                            <span className="text-xs mt-2 text-center px-4">Click to upload cover</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white pointer-events-none">
                                        <FaCamera />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Synopsis</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={5}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black transition"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isPublic" className="text-sm text-gray-700 font-medium">Public Catalog</label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition text-xs font-semibold flex items-center gap-2 border border-transparent hover:border-red-100"
                                >
                                    <FaTrash /> Delete Entire Catalog
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Chapter Reordering */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-4 flex justify-between">
                                Reorder Chapters
                                <span className="text-xs text-gray-400 font-normal">Drag or use arrows</span>
                            </label>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[400px]">
                                {chapters.length === 0 ? (
                                    <p className="text-center text-gray-400 mt-10 text-sm">No chapters to reorder.</p>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={chapters.map(c => c.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {chapters.map((chapter, index) => (
                                                <SortableChapterItem
                                                    key={chapter.id}
                                                    chapter={chapter}
                                                    onMoveUp={() => moveChapter(index, 'up')}
                                                    onMoveDown={() => moveChapter(index, 'down')}
                                                    onTitleChange={(title) => handleTitleChange(chapter.id, title)}
                                                    onDelete={() => handleDeleteChapter(chapter.id, chapter.title)}
                                                    isFirst={index === 0}
                                                    isLast={index === chapters.length - 1}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-3">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition text-sm font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg transition text-sm font-semibold flex items-center gap-2 shadow-indigo-200 shadow-lg disabled:opacity-50"
                    >
                        {isPending ? 'Saving...' : <><FaSave /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
