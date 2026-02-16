"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/catalog";
import { revalidatePath } from "next/cache";

export async function toggleLike(catalogId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_catalogId: {
                userId: user.id,
                catalogId,
            },
        },
    });

    if (existingLike) {
        await prisma.like.delete({ where: { id: existingLike.id } });
    } else {
        await prisma.like.create({
            data: {
                userId: user.id,
                catalogId,
            },
        });
    }

    revalidatePath(`/catalog/${catalogId}`);
    return { success: true };
}

export async function addComment(catalogId: string, content: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                userId: user.id,
                catalogId,
            },
        });
        revalidatePath(`/catalog/${catalogId}`);
        return { success: true, comment };
    } catch (error) {
        return { error: "Failed to post comment" };
    }
}
