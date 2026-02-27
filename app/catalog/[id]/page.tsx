import { getCatalogById } from "@/actions/catalog";
import { getSession } from "@/actions/catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaBookOpen, FaFilePdf, FaPlus, FaPen } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toggleLike, addComment } from "@/actions/social";
import { revalidatePath } from "next/cache";
import CatalogManagement from "@/components/CatalogManagement";
import ChapterMainActions from "@/components/ChapterMainActions";
import CommentList from "@/components/CommentList";
import SaveToReadingList from "@/components/SaveToReadingList";
import ShareButton from "@/components/ShareButton";
import { checkIfInReadingList } from "@/actions/reading-list";

// Server Actions Wrappers
async function likeCatalog(id: string) {
    "use server";
    await toggleLike(id);
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const catalog = await getCatalogById(id);
    const session = await getSession();

    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({ where: { email: session.user.email } })
        : null;

    if (!catalog) notFound();

    const isSaved = await checkIfInReadingList(catalog.id);

    // @ts-ignore
    const isAuthor = session?.user?.email === catalog?.author?.email;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden relative shadow-md">
                    {catalog.coverImage ? (
                        <img src={catalog.coverImage} alt={catalog.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                            <FaBookOpen className="h-20 w-20" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full mb-2">
                                {catalog.category || "General"}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{catalog.title}</h1>
                            <p className="text-gray-500 text-sm mt-1">by {catalog.author.name}</p>
                        </div>
                        {/* Social Actions */}
                        <div className="flex items-center gap-6">
                            {/* Like Button */}
                            <form action={likeCatalog.bind(null, catalog.id)}>
                                <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition">
                                    <span className="text-2xl">♥</span>
                                    <span className="text-xs">{catalog._count?.likes || 0}</span>
                                </button>
                            </form>

                            {/* Save Button */}
                            {currentUser && (
                                <SaveToReadingList
                                    catalogId={catalog.id}
                                    initialIsSaved={isSaved}
                                />
                            )}

                            {/* Share Button */}
                            <ShareButton title={catalog.title} catalogId={catalog.id} />
                        </div>
                    </div>

                    <div className="prose prose-indigo text-gray-600">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-1 mb-2">Synopsis</h3>
                        <p>{catalog.description || "No synopsis available."}</p>
                    </div>

                    {isAuthor && (
                        <div className="pt-4 flex justify-between items-center gap-3">
                            <Link href={`/catalog/${catalog.id}/chapter/create`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center text-sm font-semibold shadow-sm">
                                <FaPlus className="mr-2" /> Add Chapter
                            </Link>

                            {/* Management Component */}
                            <CatalogManagement catalog={catalog as any} />
                        </div>
                    )}
                </div>
            </div>

            {/* Chapters */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapters</h2>
                {catalog.chapters.length === 0 ? (
                    <p className="text-gray-500 italic">No chapters yet.</p>
                ) : (
                    <div className="space-y-3">
                        {catalog.chapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className="p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition flex justify-between items-center group"
                            >
                                <Link
                                    href={`/catalog/${catalog.id}/chapter/${chapter.id}`}
                                    className="flex items-center space-x-3 flex-1"
                                >
                                    {chapter.pdfUrl ? <FaFilePdf className="text-red-500" /> : <FaBookOpen className="text-indigo-500" />}
                                    <span className="font-medium text-gray-700 group-hover:text-indigo-700">{chapter.title}</span>
                                </Link>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(chapter.createdAt), { addSuffix: true })}
                                    </span>
                                    <ChapterMainActions
                                        chapter={chapter as any}
                                        catalogId={catalog.id}
                                        isAuthor={isAuthor}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Comments */}
            <CommentList
                comments={catalog.comments || []}
                catalogId={catalog.id}
                isCatalogOwner={isAuthor}
                currentUserId={currentUser?.id}
                totalComments={catalog._count?.comments || 0}
            />

        </div>
    );
}
