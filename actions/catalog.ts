"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function getSession() {
    return await getServerSession(authOptions);
}

export async function createCatalog(formData: FormData) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const isPublic = formData.get("isPublic") === "on";
    const coverImageFile = formData.get("coverImage") as File | null;

    // Basic validation
    if (!title) return { error: "Title is required" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return { error: "User not found" };

    let coverImageUrl = null;

    if (coverImageFile && coverImageFile.size > 0) {
        try {
            const bytes = await coverImageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create unique filename
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `cover-${uniqueSuffix}-${coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
            const uploadDir = join(process.cwd(), "public", "uploads", "covers");

            // Ensure directory exists
            await mkdir(uploadDir, { recursive: true });

            await writeFile(join(uploadDir, filename), buffer);
            coverImageUrl = `/uploads/covers/${filename}`;
        } catch (e) {
            console.error(e);
            return { error: "File upload failed" };
        }
    }

    try {
        const catalog = await prisma.catalog.create({
            data: {
                title,
                description,
                category,
                isPublic,
                coverImage: coverImageUrl,
                authorId: user.id,
            },
        });
        revalidatePath("/dashboard");
        return { success: true, catalog };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create catalog" };
    }
}

export async function getMyCatalogs() {
    const session = await getSession();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return [];

    return await prisma.catalog.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { chapters: true, likes: true } } },
    });
}

export async function getPublicCatalogs() {
    return await prisma.catalog.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        include: {
            author: { select: { name: true, image: true } },
            _count: { select: { chapters: true, likes: true } }
        },
    });
}

export async function getCatalogById(id: string) {
    return await prisma.catalog.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true, image: true, email: true } },
            chapters: {
                orderBy: [
                    { chapterNumber: "asc" },
                    { createdAt: "asc" }
                ]
            },
            comments: {
                where: { parentId: null }, // Only top-level comments initially
                orderBy: [
                    { isPinned: "desc" },
                    { createdAt: "desc" }
                ],
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    replies: {
                        orderBy: { createdAt: "asc" },
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                            _count: { select: { likes: true, dislikes: true } }
                        }
                    },
                    _count: { select: { likes: true, dislikes: true } }
                }
            },
            _count: { select: { likes: true, comments: true } }
        },
    });
}

export async function updateCatalog(id: string, formData: FormData) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const isPublic = formData.get("isPublic") === "on";
    const coverImageFile = formData.get("coverImage") as File | null;

    const catalog = await prisma.catalog.findUnique({
        where: { id },
        include: { author: true }
    });

    if (!catalog) return { error: "Catalog not found" };
    if (catalog.author.email !== session.user.email) return { error: "Unauthorized" };

    let coverImageUrl = catalog.coverImage;

    if (coverImageFile && coverImageFile.size > 0) {
        try {
            const bytes = await coverImageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const filename = `cover-${uniqueSuffix}-${coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
            const uploadDir = join(process.cwd(), "public", "uploads", "covers");

            await mkdir(uploadDir, { recursive: true });
            await writeFile(join(uploadDir, filename), buffer);
            coverImageUrl = `/uploads/covers/${filename}`;
        } catch (e) {
            console.error(e);
            return { error: "File upload failed" };
        }
    }

    try {
        await prisma.catalog.update({
            where: { id },
            data: {
                title: title || catalog.title,
                description,
                category,
                isPublic,
                coverImage: coverImageUrl,
            },
        });
        revalidatePath(`/catalog/${id}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update catalog" };
    }
}

export async function deleteCatalog(id: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const catalog = await prisma.catalog.findUnique({
        where: { id },
        include: { author: true }
    });

    if (!catalog) return { error: "Catalog not found" };
    if (catalog.author.email !== session.user.email) return { error: "Unauthorized" };

    try {
        await prisma.catalog.delete({
            where: { id },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete catalog" };
    }
}
