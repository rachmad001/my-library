"use client";

import React, { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css';
import { uploadEditorImage, uploadEditorVideo } from '@/actions/chapter';

const uploadImages = uploadEditorImage;
const uploadVideos = uploadEditorVideo;

let VideoBlot: any;

// Register custom formats and modules
if (typeof window !== 'undefined' && Quill) {
    const BlockEmbed = Quill.import('blots/block/embed') as any;

    VideoBlot = class extends BlockEmbed {
        static blotName = 'video';
        static tagName = 'div';
        static className = 'ql-video-wrapper';

        static create(url: string) {
            let node = super.create();
            const isEmbed = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
            if (isEmbed) {
                let iframe = document.createElement('iframe');
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('src', url);
                iframe.setAttribute('width', '100%');
                iframe.setAttribute('height', '315');
                node.appendChild(iframe);
            } else {
                let video = document.createElement('video');
                video.setAttribute('src', url);
                video.setAttribute('controls', 'true');
                video.setAttribute('width', '100%');
                video.style.maxHeight = '400px';
                node.appendChild(video);
            }
            node.setAttribute('data-url', url);
            return node;
        }

        static value(node: HTMLElement) {
            return node.getAttribute('data-url');
        }
    }

    // Register the better table module
    Quill.register({ 'modules/table-better': QuillTableBetter }, true);
    // Explicitly register the table blots
    if ((QuillTableBetter as any).register) {
        (QuillTableBetter as any).register();
    }

    // Register the Video blot
    Quill.register(VideoBlot, true);

    // @ts-ignore
    window.Quill = Quill;
    const ResizeModule = require('quill-resize-module').default || require('quill-resize-module');
    Quill.register({ 'modules/resize': ResizeModule }, true);
}

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const quillRef = useRef<ReactQuill>(null);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);

                const res = await uploadEditorImage(formData);
                if (res.success && res.url) {
                    const quill = quillRef.current?.getEditor();
                    if (quill) {
                        const range = quill.getSelection();
                        if (range) {
                            quill.insertEmbed(range.index, 'image', res.url);
                        }
                    }
                } else {
                    alert(res.error || "Failed to upload image");
                }
            }
        };
    };

    const videoHandler = () => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const choice = confirm("Press OK to Upload Video, or Cancel to enter a Video URL (YouTube/Direct Link).");

        if (choice) {
            // Upload Video
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'video/*');
            input.click();

            input.onchange = async () => {
                const file = input.files?.[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('video', file);

                    const res = await uploadEditorVideo(formData);
                    if (res.success && res.url) {
                        const range = quill.getSelection();
                        if (range) {
                            quill.insertEmbed(range.index, 'video', res.url);
                        }
                    } else {
                        alert(res.error || "Failed to upload video");
                    }
                }
            };
        } else {
            // URL Video
            const url = prompt("Enter Video URL (YouTube link or Direct Link to video file):");
            if (url) {
                const range = quill.getSelection();
                if (range) {
                    quill.insertEmbed(range.index, 'video', url);
                }
            }
        }
    };

    const modules = useMemo(() => {
        // Debugging logs (Run once on init)
        if (typeof window !== 'undefined' && Quill) {
            console.log('QuillTableBetter Init:', QuillTableBetter);

            // Unregister standard table blot to avoid conflict
            if (Quill.imports['formats/table']) {
                console.log('Unregistering conflicting formats/table');
                delete Quill.imports['formats/table'];
            }

            // Override TableTemporary to use 'caption' instead of 'temporary'
            // This prevents the browser from "fostering" the invalid <temporary> tag out of the table
            const TableTemporary = Quill.imports['formats/table-temporary'];
            if (TableTemporary) {
                console.log('Overriding TableTemporary with CustomCaptionTemporary');
                class CustomCaptionTemporary extends (TableTemporary as any) {
                    static tagName = 'caption';
                    static className = 'ql-table-better-temporary';
                }
                Quill.register(CustomCaptionTemporary, true);
            }

            console.log('Registry table-container:', Quill.imports['formats/table-container']);
            console.log('Registry table-row:', Quill.imports['formats/table-row']);
            console.log('Registry table:', Quill.imports['formats/table']);
        }

        return {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                    ['link', 'image', 'video'],
                    ['clean'],
                    ['table-better'], // Back to explicit table-better key
                ],
                handlers: {
                    image: imageHandler,
                    video: videoHandler,
                    'table-better': function () {
                        // @ts-ignore
                        this.quill.getModule('table-better').insertTable(3, 3);
                    }
                }
            },
            table: false, // Explicitly disable native table
            'table-better': {
                language: 'en_US',
                menus: ['column', 'row', 'merge', 'table', 'cell'],
                toolbarTable: true
            },
            resize: {
                showSize: true
            },
            clipboard: {
                matchers: [
                    ['div.ql-video-wrapper', (node: any, delta: any) => {
                        const url = node.getAttribute('data-url');
                        if (url) {
                            const Delta = Quill.import('delta');
                            return new Delta().insert({ video: url });
                        }
                        return delta;
                    }]
                ]
            },
            keyboard: {
                bindings: QuillTableBetter.keyboardBindings
            }
        };
    }, []); // Empty dependency array to prevent re-initialization

    const lastEmittedValue = useRef<string>("");

    // Prime the content with table IDs if they are missing
    const processedValue = useMemo(() => {
        if (!value || typeof window === 'undefined') return value;
        // If the incoming value matches what we last sent out, don't re-prime or change anything
        if (value === lastEmittedValue.current) return value;

        let changed = false;
        let newValue = value; // No longer strip temporary tags, they are now captions

        // Use Regex to inject IDs if missing (avoiding DOMParser)
        newValue = newValue.replace(/<table([^>]*)>/g, (match, attributes) => {
            if (attributes.includes('data-table-better-id') || attributes.includes('data-table-id')) {
                return match;
            }

            const now = Date.now();
            const random = Math.random().toString(36).slice(2, 9);
            const id = `table-${now}-${random}`;

            // Add both IDs for redundancy
            // Ensure we don't accidentally break existing attributes (simple append)
            const newAttributes = `${attributes} data-table-better-id="${id}" data-table-id="${id}"`;
            changed = true;
            return `<table${newAttributes}>`;
        });

        return changed ? newValue : value;
    }, [value]);

    const handleOnChange = (content: string) => {
        if (content === lastEmittedValue.current) return;
        lastEmittedValue.current = content;
        onChange(content);
    };

    // Runtime Inspection of Quill Instance
    React.useEffect(() => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            console.log('--- Runtime Inspection ---');
            try {
                const tableModule = quill.getModule('table-better');
                console.log('Quill Instance Module (table-better):', tableModule ? 'Loaded' : 'Missing', tableModule);
            } catch (e) {
                console.log('Quill Instance Module (table-better): Error accessing', e);
            }

            // Check if the registry on the instance knows about table-cell
            // Note: quill.scroll.registry might differ from global Quill.imports in some bundler setups
            try {
                // @ts-ignore
                const isRegistered = quill.scroll.query('table-cell');
                console.log('Quill Instance Query (table-cell):', isRegistered ? 'Found' : 'Missing', isRegistered);
            } catch (e) {
                console.log('Quill Instance Query (table-cell): Error', e);
            }

            // Log Descendants
            try {
                // @ts-ignore
                const TableContainer = Quill.imports['formats/table-container'];
                const tables = quill.scroll.descendants(TableContainer, 0, quill.getLength());
                console.log('Active TableContainers:', tables.length, tables);
            } catch (e) {
                console.log('Error listing descendants:', e);
            }
            console.log('--------------------------');
        }
    }, [processedValue]);

    // Log Processed Value
    React.useEffect(() => {
        console.log('Processed Value passed to ReactQuill:', processedValue);
    }, [processedValue]);

    return (
        <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={processedValue}
                onChange={handleOnChange}
                modules={modules}
                placeholder={placeholder || "Write your content here..."}
                className="prose max-w-none text-black h-full"
            />
            <style jsx global>{`
                .ql-container {
                    font-size: 16px;
                    min-height: 500px;
                }
                .ql-editor {
                    min-height: 500px;
                }
                /* Custom table-better styles to ensure visibility */
                .ql-table-better-menu {
                    z-index: 1000;
                }
                /* Resize handles styling */
                .ql-resize-handle {
                    border: 1px solid #4f46e5 !important;
                    background-color: #fff !important;
                }
                .ql-video-wrapper {
                    margin: 10px 0;
                    background: #f8fafc;
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
            `}</style>
        </div>
    );
}
