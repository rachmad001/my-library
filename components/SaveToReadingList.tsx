"use client";

import { useState } from "react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { toggleReadingList, getGroups, createGroup } from "@/actions/reading-list";
import Swal from "sweetalert2";

interface SaveToReadingListProps {
    catalogId: string;
    initialIsSaved: boolean;
}

export default function SaveToReadingList({ catalogId, initialIsSaved }: SaveToReadingListProps) {
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (isSaved) {
            // If already saved, just unsave it directly
            setIsLoading(true);
            try {
                const result = await toggleReadingList(catalogId);
                if (result.success) {
                    setIsSaved(false);
                    Swal.fire({
                        title: "Removed!",
                        text: "Catalog removed from your reading list.",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: "bottom-end"
                    });
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // If not saved, show group selection
        setIsLoading(true);
        try {
            const groups = await getGroups();

            const groupOptions: Record<string, string> = {
                "none": "No Group (General)"
            };
            groups.forEach((g: any) => {
                groupOptions[g.id] = g.name;
            });
            groupOptions["new"] = "+ Create New Group...";

            const { value: groupId } = await Swal.fire({
                title: "Save to Reading List",
                input: "select",
                inputOptions: groupOptions,
                inputPlaceholder: "Select a group",
                showCancelButton: true,
                confirmButtonText: "Save",
                confirmButtonColor: "#4f46e5",
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        resolve(null);
                    });
                }
            });

            if (groupId) {
                let finalGroupId = groupId === "none" ? undefined : groupId;

                if (groupId === "new") {
                    const { value: newGroupName } = await Swal.fire({
                        title: "Create New Group",
                        input: "text",
                        inputPlaceholder: "Enter group name",
                        showCancelButton: true,
                        inputValidator: (value) => {
                            if (!value) return "You need to write something!";
                        }
                    });

                    if (newGroupName) {
                        const createResult = await createGroup(newGroupName);
                        if (createResult.success) {
                            finalGroupId = createResult.group.id;
                        } else {
                            Swal.fire("Error", createResult.error || "Failed to create group", "error");
                            return;
                        }
                    } else {
                        return; // Cancelled new group creation
                    }
                }

                const result = await toggleReadingList(catalogId, finalGroupId);
                if (result.success) {
                    setIsSaved(true);
                    Swal.fire({
                        title: "Saved!",
                        text: "Catalog added to your reading list.",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: "bottom-end"
                    });
                } else {
                    Swal.fire("Error", result.error || "Failed to update reading list", "error");
                }
            }
        } catch (error) {
            Swal.fire("Error", "An unexpected error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex flex-col items-center transition-colors ${isSaved ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600"
                }`}
            title={isSaved ? "Remove from Reading List" : "Save to Reading List"}
        >
            <span className="text-2xl">
                {isSaved ? <FaBookmark /> : <FaRegBookmark />}
            </span>
            <span className="text-[10px] mt-0.5 font-medium uppercase tracking-wider">
                {isSaved ? "Saved" : "Save"}
            </span>
        </button>
    );
}
