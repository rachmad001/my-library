"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/catalog";
import { revalidatePath } from "next/cache";

export async function toggleReadingList(catalogId: string, groupId?: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    try {
        const existing = await prisma.readingList.findUnique({
            where: {
                userId_catalogId: {
                    userId: user.id,
                    catalogId,
                },
            },
        });

        if (existing) {
            // If already saved and moving to a group or just toggle off
            if (groupId && existing.groupId !== groupId) {
                await prisma.readingList.update({
                    where: { id: existing.id },
                    data: { groupId }
                });
                revalidatePath(`/catalog/${catalogId}`);
                revalidatePath("/dashboard/reading-list");
                return { success: true, action: "moved" };
            }

            await prisma.readingList.delete({ where: { id: existing.id } });
            revalidatePath(`/catalog/${catalogId}`);
            revalidatePath("/dashboard/reading-list");
            return { success: true, action: "removed" };
        } else {
            await prisma.readingList.create({
                data: {
                    userId: user.id,
                    catalogId,
                    groupId: groupId || null
                },
            });
            revalidatePath(`/catalog/${catalogId}`);
            revalidatePath("/dashboard/reading-list");
            return { success: true, action: "added" };
        }
    } catch (error) {
        console.error(error);
        return { error: "Failed to update reading list" };
    }
}

export async function getReadingList() {
    const session = await getSession();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return [];

    return await prisma.readingList.findMany({
        where: { userId: user.id },
        include: {
            catalog: {
                include: {
                    author: { select: { name: true } },
                    _count: { select: { chapters: true, likes: true } }
                }
            },
            group: true
        },
        orderBy: { createdAt: "desc" },
    });
}

// Group Management Actions
export async function createGroup(name: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    try {
        const group = await prisma.readingListGroup.create({
            data: {
                name,
                userId: user.id
            }
        });
        revalidatePath("/dashboard/reading-list");
        return { success: true, group };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create group. Name might already exist." };
    }
}

export async function getGroups() {
    const session = await getSession();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return [];

    return await prisma.readingListGroup.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" }
    });
}

export async function updateGroup(groupId: string, name: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    try {
        await prisma.readingListGroup.update({
            where: { id: groupId },
            data: { name }
        });
        revalidatePath("/dashboard/reading-list");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update group" };
    }
}

export async function deleteGroup(groupId: string) {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated" };

    try {
        await prisma.readingListGroup.delete({
            where: { id: groupId }
        });
        revalidatePath("/dashboard/reading-list");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete group" };
    }
}

export async function checkIfInReadingList(catalogId: string) {
    const session = await getSession();
    if (!session?.user?.email) return false;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return false;

    const existing = await prisma.readingList.findUnique({
        where: {
            userId_catalogId: {
                userId: user.id,
                catalogId,
            },
        },
    });

    return !!existing;
}
