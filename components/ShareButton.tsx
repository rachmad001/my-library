"use client";

import { FaShareAlt, FaLink, FaWhatsapp, FaTwitter } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface ShareButtonProps {
    title: string;
    catalogId: string;
}

export default function ShareButton({ title, catalogId }: ShareButtonProps) {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/catalog/${catalogId}` : "";
    const shareText = `Check out this catalog: ${title}`;

    const handleShare = async () => {
        const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

        await MySwal.fire({
            title: "Share Catalog",
            html: (
                <div className="flex flex-col gap-3 py-4">
                    {canNativeShare && (
                        <button
                            onClick={async () => {
                                MySwal.close();
                                try {
                                    await navigator.share({
                                        title: title,
                                        text: shareText,
                                        url: shareUrl,
                                    });
                                } catch (err) {
                                    if ((err as Error).name !== "AbortError") console.error(err);
                                }
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition text-sm font-semibold"
                        >
                            <FaShareAlt className="text-gray-400" /> Share via System...
                        </button>
                    )}

                    <button
                        onClick={async () => {
                            MySwal.close();
                            try {
                                await navigator.clipboard.writeText(shareUrl);
                                Swal.fire({
                                    title: "Copied!",
                                    text: "Link copied to clipboard.",
                                    icon: "success",
                                    timer: 1500,
                                    showConfirmButton: false,
                                    toast: true,
                                    position: "bottom-end"
                                });
                            } catch (err) {
                                Swal.fire("Error", "Failed to copy link", "error");
                            }
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition text-sm font-semibold"
                    >
                        <FaLink className="text-gray-400" /> Copy Catalog Link
                    </button>

                    <button
                        onClick={() => {
                            MySwal.close();
                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-100 hover:bg-green-50 hover:text-green-600 transition text-sm font-semibold"
                    >
                        <FaWhatsapp className="text-green-500" /> Share to WhatsApp
                    </button>

                    <button
                        onClick={() => {
                            MySwal.close();
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:text-blue-600 transition text-sm font-semibold"
                    >
                        <FaTwitter className="text-blue-400" /> Share to Twitter / X
                    </button>
                </div>
            ),
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                container: 'share-popup-container',
                popup: 'rounded-2xl shadow-2xl',
            }
        });
    };

    return (
        <button
            onClick={handleShare}
            className="flex flex-col items-center text-gray-400 hover:text-indigo-600 transition"
            title="Share Catalog"
        >
            <span className="text-2xl">
                <FaShareAlt />
            </span>
            <span className="text-[10px] mt-0.5 font-medium uppercase tracking-wider">Share</span>
        </button>
    );
}
