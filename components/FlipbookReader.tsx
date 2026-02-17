"use client";

import React, { useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import Quill and table styles to ensure public rendering matches editor
import 'react-quill-new/dist/quill.core.css';
import 'quill-table-better/dist/quill-table-better.css';

// Set worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface FlipbookReaderProps {
    type: "text" | "pdf";
    content?: { id: string; content: string; pageNumber: number }[]; // For text
    pdfUrl?: string | null;
}

export default function FlipbookReader({ type, content, pdfUrl }: FlipbookReaderProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [width, setWidth] = useState(400);
    const [height, setHeight] = useState(600);
    const book = React.useRef(null);

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setWidth(window.innerWidth - 40);
                setHeight((window.innerWidth - 40) * 1.414);
            } else {
                setWidth(400);
                setHeight(600);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    return (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-800 min-h-screen">
            <div className="relative">
                {/* @ts-ignore - Library types might be finicky */}
                {type === "pdf" && pdfUrl ? (
                    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} className="flex justify-center">
                        {numPages > 0 && (
                            // @ts-ignore
                            <HTMLFlipBook
                                width={width}
                                height={height}
                                showCover={true}
                                ref={book}
                                className="shadow-2xl"
                                maxShadowOpacity={0.5}
                                mobileScrollSupport={true}
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <div key={`page_${index + 1}`} className="bg-white p-0 overflow-hidden shadow-inner">
                                        <div className="w-full h-full relative">
                                            <PdfPage
                                                pageNumber={index + 1}
                                                width={width}
                                                height={height}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                            <span className="absolute bottom-2 right-2 text-xs text-gray-400">{index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </HTMLFlipBook>
                        )}
                    </Document>
                ) : (
                    // @ts-ignore
                    <HTMLFlipBook
                        width={width}
                        height={height}
                        showCover={true}
                        ref={book}
                        className="shadow-2xl"
                        maxShadowOpacity={0.5}
                        mobileScrollSupport={true}
                        flippingTime={1000}
                        usePortrait={false}
                    >
                        {content?.map((page) => (
                            <div key={page.id} className="bg-white p-8 shadow-inner border-r border-gray-100 prose prose-indigo overflow-y-auto">
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 ql-editor-view" dangerouslySetInnerHTML={{ __html: page.content }} />
                                    <span className="text-center text-xs text-gray-400 mt-4">{page.pageNumber}</span>
                                </div>
                            </div>
                        ))}
                    </HTMLFlipBook>
                )}
            </div>

            <p className="text-white mt-8 text-sm opacity-50">
                {type === "pdf" ? `PDF Mode (${numPages} pages)` : "Text Mode"} • Drag page corners to flip
            </p>

            <style jsx global>{`
                .ql-editor-view {
                    word-wrap: break-word;
                    word-break: break-word;
                }
                .ql-editor-view iframe, 
                .ql-editor-view video {
                    max-width: 100%;
                    display: block;
                    margin: 1rem auto;
                }
                .ql-editor-view table {
                    border-collapse: collapse;
                    width: 100%;
                    border: 1px solid #ddd;
                }
                .ql-editor-view table td,
                .ql-editor-view table th {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
                .ql-editor-view img {
                    max-width: 100%;
                    height: auto;
                }
                .ql-video {
                    width: 100%;
                    aspect-ratio: 16/9;
                }
            `}</style>
        </div>
    );
}
