"use client";

import { useState } from "react";
import Link from "next/link";
import { FaBook, FaTrash, FaEye, FaEdit, FaFolder, FaFolderOpen, FaPlus } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { updateGroup, deleteGroup, createGroup } from "@/actions/reading-list";
import Swal from "sweetalert2";

interface ReadingListManagerProps {
    initialItems: any[];
    initialGroups: any[];
}

export default function ReadingListManager({ initialItems, initialGroups }: ReadingListManagerProps) {
    const [items, setItems] = useState(initialItems);
    const [groups, setGroups] = useState(initialGroups);

    // Group items by groupId
    const groupedItems: Record<string, any[]> = {
        "ungrouped": items.filter(item => !item.groupId)
    };

    groups.forEach(group => {
        groupedItems[group.id] = items.filter(item => item.groupId === group.id);
    });

    const handleRenameGroup = async (groupId: string, currentName: string) => {
        const { value: newName } = await Swal.fire({
            title: "Rename Group",
            input: "text",
            inputValue: currentName,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return "Name cannot be empty!";
            }
        });

        if (newName && newName !== currentName) {
            const result = await updateGroup(groupId, newName);
            if (result.success) {
                setGroups(groups.map(g => g.id === groupId ? { ...g, name: newName } : g));
                Swal.fire("Success", "Group renamed", "success");
            } else {
                Swal.fire("Error", result.error || "Failed to rename group", "error");
            }
        }
    };

    const handleDeleteGroup = async (groupId: string, name: string) => {
        const result = await Swal.fire({
            title: `Delete group "${name}"?`,
            text: "The catalogs inside will remain in your list but will be ungrouped.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it"
        });

        if (result.isConfirmed) {
            const deleteResult = await deleteGroup(groupId);
            if (deleteResult.success) {
                setGroups(groups.filter(g => g.id !== groupId));
                setItems(items.map(item => item.groupId === groupId ? { ...item, groupId: null, group: null } : item));
                Swal.fire("Deleted!", "Group has been deleted.", "success");
            } else {
                Swal.fire("Error", "Failed to delete group", "error");
            }
        }
    };

    const handleCreateGroup = async () => {
        const { value: name } = await Swal.fire({
            title: "New Group",
            input: "text",
            inputPlaceholder: "Enter group name",
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return "Name is required!";
            }
        });

        if (name) {
            const result = await createGroup(name);
            if (result.success) {
                setGroups([...groups, result.group].sort((a, b) => a.name.localeCompare(b.name)));
                Swal.fire("Created!", `Group "${name}" created.`, "success");
            } else {
                Swal.fire("Error", result.error || "Failed to create group", "error");
            }
        }
    };

    const renderCatalogCard = (item: any) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex group hover:shadow-md transition-shadow duration-300">
            {/* Cover */}
            <div className="w-1/3 aspect-[2/3] bg-gray-200 relative overflow-hidden">
                {item.catalog.coverImage ? (
                    <img
                        src={item.catalog.coverImage}
                        alt={item.catalog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-200">
                        <FaBook size={40} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {item.catalog.category || "General"}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight text-base mb-1 group-hover:text-indigo-600 transition-colors">
                        {item.catalog.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-2">
                        by {item.catalog.author.name}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400 italic">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                    <Link
                        href={`/catalog/${item.catalogId}`}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                    >
                        <FaEye size={12} /> View
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Group Management Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 font-semibold">
                    <FaFolder size={20} className="text-indigo-500" />
                    <span>Manage Groups</span>
                </div>
                <button
                    onClick={handleCreateGroup}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition text-xs font-bold flex items-center gap-2"
                >
                    <FaPlus size={10} /> New Group
                </button>
            </div>

            {/* Render Groups */}
            {groups.map(group => (
                <div key={group.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                <FaFolderOpen size={16} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                            <span className="text-sm text-gray-400 font-medium">
                                ({groupedItems[group.id]?.length || 0})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleRenameGroup(group.id, group.name)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="Rename Group"
                            >
                                <FaEdit size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Group"
                            >
                                <FaTrash size={16} />
                            </button>
                        </div>
                    </div>

                    {groupedItems[group.id]?.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-4">No catalogs in this group.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groupedItems[group.id].map(renderCatalogCard)}
                        </div>
                    )}
                </div>
            ))}

            {/* Render Ungrouped */}
            <div className="space-y-4">
                <div className="flex items-center border-b border-gray-200 pb-2">
                    <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">
                        <FaBook size={16} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 ml-3">Ungrouped Catalogs</h2>
                    <span className="text-sm text-gray-400 font-medium ml-3">
                        ({groupedItems["ungrouped"]?.length || 0})
                    </span>
                </div>

                {groupedItems["ungrouped"]?.length === 0 ? (
                    groups.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 italic">Everything is organized!</p>
                        </div>
                    ) : null
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedItems["ungrouped"].map(renderCatalogCard)}
                    </div>
                )}
            </div>
        </div>
    );
}
