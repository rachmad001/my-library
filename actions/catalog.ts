"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

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

    // Basic validation
    if (!title) return { error: "Title is required" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return { error: "User not found" };

    try {
        const catalog = await prisma.catalog.create({
            data: {
                title,
                description,
                category,
                isPublic,
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
            author: { select: { name: true, image: true } },
            chapters: { orderBy: { createdAt: "asc" } },
            _count: { select: { likes: true, comments: true } }
        },
    });
}
