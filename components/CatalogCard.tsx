import Link from "next/link";
import { FaHeart, FaComment, FaBookOpen } from "react-icons/fa";

interface CatalogCardProps {
    catalog: any; // Type this properly in a real app
}

export default function CatalogCard({ catalog }: CatalogCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="h-48 bg-gray-200 relative">
                {catalog.coverImage ? (
                    <img
                        src={catalog.coverImage}
                        alt={catalog.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                        <FaBookOpen className="h-16 w-16" />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {catalog.category || "Uncategorized"}
                </div>
            </div>
            <div className="p-5">
                <Link href={`/catalog/${catalog.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-indigo-600 transition-colors line-clamp-1">{catalog.title}</h3>
                </Link>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {catalog.description || "No description available."}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-700">{catalog.author?.name || "Unknown Author"}</span>
                    </div>
                    <div className="flex space-x-3">
                        <span className="flex items-center space-x-1">
                            <FaBookOpen className="text-indigo-400" />
                            <span>{catalog._count?.chapters || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <FaHeart className="text-rose-400" />
                            <span>{catalog._count?.likes || 0}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
