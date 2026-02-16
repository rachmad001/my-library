import { prisma } from "@/lib/prisma";
import PageEditor from "@/components/PageEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { getSession } from "@/actions/catalog";

export default async function EditChapterPage({ params }: { params: { id: string; chapterId: string } }) {
    const { id, chapterId } = await params;
    const session = await getSession();

    if (!session?.user?.email) return notFound(); // Should redirect to login ideally

    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
            pages: {
                orderBy: { pageNumber: "asc" },
            },
            catalog: true
        },
    });

    if (!chapter) notFound();

    // Verify ownership
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (chapter.catalog.authorId !== user?.id) return notFound();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <Link href={`/catalog/${id}`} className="flex items-center text-gray-500 hover:text-gray-900 transition">
                    <FaArrowLeft className="mr-2" /> Back to Catalog
                </Link>
                <div className="text-center">
                    <h1 className="font-bold text-lg text-gray-900">Editing: {chapter.title}</h1>
                </div>
                <Link href={`/catalog/${id}/chapter/${chapterId}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Preview
                </Link>
            </header>

            <div className="flex-1 p-6">
                <PageEditor
                    chapterId={chapterId}
                    pages={chapter.pages}
                />
            </div>
        </div>
    );
}
