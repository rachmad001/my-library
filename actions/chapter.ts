"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/catalog";
import { revalidatePath } from "next/cache";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function createChapter(catalogId: string, formData: FormData) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const title = formData.get("title") as string;
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "pdf" | "text";

    if (!title) return { error: "Title is required" };

    let pdfUrl = null;

    if (type === "pdf" && file) {
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create unique filename
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
            const uploadDir = join(process.cwd(), "public", "uploads");

            // Ensure directory exists (node 10+ handles recursive mkdir)
            await require("fs/promises").mkdir(uploadDir, { recursive: true });

            await writeFile(join(uploadDir, filename), buffer);
            pdfUrl = `/uploads/${filename}`;
        } catch (e) {
            console.error(e);
            return { error: "File upload failed" };
        }
    }

    try {
        const chapter = await prisma.chapter.create({
            data: {
                title,
                catalogId,
                pdfUrl,
            },
        });

        // If text type, maybe create initial empty page?
        if (!pdfUrl) {
            await prisma.page.create({
                data: {
                    chapterId: chapter.id,
                    pageNumber: 1,
                    content: "<h1>Start writing here...</h1>"
                }
            })
        }

        revalidatePath(`/catalog/${catalogId}`);
        return { success: true, chapter };
    } catch (error) {
        return { error: "Failed to create chapter" };
    }
}

export async function updateChapterPdf(chapterId: string, pdfUrl: string) {
    // In a real app, you'd verify ownership here
    try {
        await prisma.chapter.update({
            where: { id: chapterId },
            data: { pdfUrl },
        });
        return { success: true };
    } catch (e) {
        return { error: "Failed to update PDF" };
    }
}

export async function savePageContent(chapterId: string, pageNumber: number, content: string) {
    // Check ownership

    try {
        // Upsert page
        await prisma.page.upsert({
            where: {
                chapterId_pageNumber: {
                    chapterId,
                    pageNumber,
                },
            },
            update: { content },
            create: {
                chapterId,
                pageNumber,
                content,
            },
        });
        return { success: true };
    } catch (error) {
        return { error: "Failed to save page" };
    }
}

export async function deleteChapter(chapterId: string, catalogId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    // Ownership check would ideally happen here

    try {
        await prisma.chapter.delete({
            where: { id: chapterId },
        });
        revalidatePath(`/catalog/${catalogId}`);
        return { success: true };
    } catch (e) {
        return { error: "Failed to delete chapter" };
    }
}

export async function deletePage(chapterId: string, pageId: string) {
    // Ownership check

    try {
        await prisma.page.delete({
            where: { id: pageId },
        });

        // Re-index remaining pages
        const pages = await prisma.page.findMany({
            where: { chapterId },
            orderBy: { pageNumber: 'asc' }
        });

        for (let i = 0; i < pages.length; i++) {
            await prisma.page.update({
                where: { id: pages[i].id },
                data: { pageNumber: i + 1 }
            });
        }

        return { success: true };
    } catch (e) {
        return { error: "Failed to delete page" };
    }
}

export async function updateChapterTitle(chapterId: string, title: string) {
    if (!title) return { error: "Title is required" };

    try {
        await prisma.chapter.update({
            where: { id: chapterId },
            data: { title },
        });
        return { success: true };
    } catch (e) {
        return { error: "Failed to update title" };
    }
}

export async function updateChapter(id: string, formData: FormData) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const title = formData.get("title") as string;
    const file = formData.get("file") as File | null;
    const catalogId = formData.get("catalogId") as string;

    if (!title) return { error: "Title is required" };

    const chapter = await prisma.chapter.findUnique({
        where: { id },
    });

    if (!chapter) return { error: "Chapter not found" };

    let pdfUrl = chapter.pdfUrl;

    if (file && file.size > 0 && file.type === "application/pdf") {
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
            const uploadDir = join(process.cwd(), "public", "uploads");

            await mkdir(uploadDir, { recursive: true });
            await writeFile(join(uploadDir, filename), buffer);
            pdfUrl = `/uploads/${filename}`;
        } catch (e) {
            console.error(e);
            return { error: "File upload failed" };
        }
    }

    try {
        await prisma.chapter.update({
            where: { id },
            data: {
                title,
                pdfUrl,
            },
        });
        if (catalogId) revalidatePath(`/catalog/${catalogId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update chapter" };
    }
}

export async function uploadEditorImage(formData: FormData) {
    const file = formData.get("image") as File;
    if (!file) return { error: "No image provided" };

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `editor-${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const uploadDir = join(process.cwd(), "public", "uploads", "editor");

        await mkdir(uploadDir, { recursive: true });

        await writeFile(join(uploadDir, filename), buffer);
        const url = `/uploads/editor/${filename}`;

        return { success: true, url };
    } catch (e) {
        console.error(e);
        return { error: "Image upload failed" };
    }
}

export async function uploadEditorVideo(formData: FormData) {
    const file = formData.get("video") as File;
    if (!file) return { error: "No video provided" };

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `video-${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const uploadDir = join(process.cwd(), "public", "uploads", "editor");

        await mkdir(uploadDir, { recursive: true });

        await writeFile(join(uploadDir, filename), buffer);
        const url = `/uploads/editor/${filename}`;

        return { success: true, url };
    } catch (e) {
        console.error(e);
        return { error: "Video upload failed" };
    }
}

export async function getChapterPages(chapterId: string) {
    return await prisma.page.findMany({
        where: { chapterId },
        orderBy: { pageNumber: 'asc' }
    });
}

export async function reorderChapters(catalogId: string, chapterIds: string[]) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    try {
        // Simple sequential update
        for (let i = 0; i < chapterIds.length; i++) {
            await prisma.chapter.update({
                where: { id: chapterIds[i] },
                data: { chapterNumber: i + 1 }
            });
        }
        revalidatePath(`/catalog/${catalogId}`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to reorder chapters" };
    }
}
