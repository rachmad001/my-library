"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/catalog";
import { revalidatePath } from "next/cache";

import { writeFile } from "fs/promises";
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

export async function getChapterPages(chapterId: string) {
    return await prisma.page.findMany({
        where: { chapterId },
        orderBy: { pageNumber: 'asc' }
    });
}
