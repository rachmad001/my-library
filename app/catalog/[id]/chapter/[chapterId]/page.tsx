import { prisma } from "@/lib/prisma";
import FlipbookReader from "@/components/FlipbookReader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default async function ChapterReaderPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
    const { id, chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
            pages: {
                orderBy: { pageNumber: "asc" },
            },
            catalog: {
                select: { title: true }
            }
        },
    });

    if (!chapter) notFound();

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <header className="bg-gray-800 text-white p-4 flex items-center justify-between shadow-md z-10">
                <Link href={`/catalog/${id}`} className="flex items-center text-gray-300 hover:text-white transition">
                    <FaArrowLeft className="mr-2" /> Back to Catalog
                </Link>
                <div className="text-center">
                    <h1 className="font-bold text-lg">{chapter.title}</h1>
                    <p className="text-xs text-gray-400">{chapter.catalog.title}</p>
                </div>
                <div className="w-20"></div> {/* Spacer */}
            </header>

            <div className="flex-1 overflow-hidden">
                <FlipbookReader
                    type={chapter.pdfUrl ? "pdf" : "text"}
                    pdfUrl={chapter.pdfUrl}
                    content={chapter.pages}
                />
            </div>
        </div>
    );
}
