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

export async function addComment(catalogId: string, content: string, parentId?: string) {
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
                parentId: parentId || null,
            },
        });
        revalidatePath(`/catalog/${catalogId}`);
        return { success: true, comment };
    } catch (error) {
        console.error(error);
        return { error: "Failed to post comment" };
    }
}

export async function deleteComment(commentId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { catalog: true }
    });

    if (!comment) return { error: "Comment not found" };

    // Authorized if owner of catalog OR author of comment
    const isOwner = comment.catalog.authorId === user.id;
    const isAuthor = comment.userId === user.id;

    if (!isOwner && !isAuthor) return { error: "Unauthorized" };

    try {
        await prisma.comment.delete({ where: { id: commentId } });
        revalidatePath(`/catalog/${comment.catalogId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete comment" };
    }
}

export async function togglePinComment(commentId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { catalog: true }
    });

    if (!comment) return { error: "Comment not found" };
    if (comment.catalog.authorId !== user.id) return { error: "Unauthorized" };

    try {
        await prisma.comment.update({
            where: { id: commentId },
            data: { isPinned: !comment.isPinned }
        });
        revalidatePath(`/catalog/${comment.catalogId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to toggle pin" };
    }
}

export async function toggleCommentLike(commentId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { error: "Comment not found" };

    try {
        const existingLike = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId: user.id, commentId } }
        });

        if (existingLike) {
            await prisma.commentLike.delete({ where: { id: existingLike.id } });
        } else {
            // Remove dislike if exists
            await prisma.commentDislike.deleteMany({
                where: { userId: user.id, commentId }
            });
            await prisma.commentLike.create({
                data: { userId: user.id, commentId }
            });
        }
        revalidatePath(`/catalog/${comment.catalogId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to toggle like" };
    }
}

export async function toggleCommentDislike(commentId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { error: "Comment not found" };

    try {
        const existingDislike = await prisma.commentDislike.findUnique({
            where: { userId_commentId: { userId: user.id, commentId } }
        });

        if (existingDislike) {
            await prisma.commentDislike.delete({ where: { id: existingDislike.id } });
        } else {
            // Remove like if exists
            await prisma.commentLike.deleteMany({
                where: { userId: user.id, commentId }
            });
            await prisma.commentDislike.create({
                data: { userId: user.id, commentId }
            });
        }
        revalidatePath(`/catalog/${comment.catalogId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to toggle dislike" };
    }
}
