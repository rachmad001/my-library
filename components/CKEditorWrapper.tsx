'use client';

import { useState, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Font,
    List,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    Image,
    ImageUpload,
    ImageToolbar,
    ImageCaption,
    ImageStyle,
    ImageResize,
    Link,
    Alignment,
    BlockQuote,
    Heading,
    MediaEmbed,
    GeneralHtmlSupport,
    SourceEditing,
    ShowBlocks
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { uploadEditorImage, uploadEditorVideo } from '@/actions/chapter';

// Custom Upload Adapter for Images
class MyUploadAdapter {
    loader: any;

    constructor(loader: any) {
        this.loader = loader;
    }

    upload() {
        return this.loader.file
            .then((file: File) => new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append('image', file);

                uploadEditorImage(formData)
                    .then(response => {
                        if (response.error) {
                            reject(response.error);
                        } else {
                            resolve({
                                default: response.url
                            });
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            }));
    }

    abort() {
        // Reject the promise if needed
    }
}

function MyCustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new MyUploadAdapter(loader);
    };
}

interface CKEditorWrapperProps {
    value: string;
    onChange: (data: string) => void;
    placeholder?: string;
}

export default function CKEditorWrapper({ value, onChange, placeholder }: CKEditorWrapperProps) {
    const editorRef = useRef<any>(null);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        setIsLayoutReady(true);
    }, []);

    // Custom Video Upload Handler
    const handleVideoUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('video', file);

            try {
                // Determine a placeholder or loading state?
                // For simplicity, we wait for upload then insert.
                // TODO: Add loading indicator
                const response = await uploadEditorVideo(formData);
                if (response.success && response.url && editorRef.current) {
                    const editor = editorRef.current;
                    const videoHtml = `<p><video controls src="${response.url}" width="100%"></video></p><p>&nbsp;</p>`;

                    const viewFragment = editor.data.processor.toView(videoHtml);
                    const modelFragment = editor.data.toModel(viewFragment);

                    editor.model.change((writer: any) => {
                        editor.model.insertContent(modelFragment);
                    });
                } else {
                    alert('Video upload failed: ' + (response.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Video upload error:', error);
                alert('Video upload error');
            }
        };
        input.click();
    };

    if (!isLayoutReady) return <div className="p-4 border rounded h-[500px] flex items-center justify-center">Loading Editor...</div>;

    return (
        <div className="ckeditor-wrapper text-black">
            <style jsx global>{`
                .ck-editor__editable_inline {
                    min-height: 500px;
                }
                .ck.ck-powered-by {
                    display: none;
                }
                /* Restore heading styles */
                .ck-content h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 0.6em;
                }
                .ck-content h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }
                .ck-content h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-bottom: 0.4em;
                }
                .ck-content h4 {
                    font-size: 1em;
                    font-weight: bold;
                    margin-bottom: 0.3em;
                }
                /* Restore list styles that Tailwind preflight might strip */
                .ck-content ul {
                    list-style-type: disc;
                    list-style-position: outside;
                    padding-left: 1.5em;
                }
                .ck-content ol {
                    list-style-type: decimal;
                    list-style-position: outside;
                    padding-left: 1.5em;
                }
                /* Reduce spacing */
                .ck-content p {
                    margin-bottom: 0.5em; /* Add a small gap between paragraphs */
                }
                .ck-content ul, 
                .ck-content ol {
                    margin-top: 0;
                    margin-bottom: 0.5em; 
                }
            `}</style>

            {/* Custom Toolbar Actions outside CKEditor for simplicity, or we could register a UI button inside */}
            <div className="mb-2 flex gap-2">
                <button
                    onClick={handleVideoUpload}
                    className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 text-sm flex items-center gap-1"
                    type="button"
                >
                    <span>🎥 Upload Video (Direct)</span>
                </button>
            </div>

            <CKEditor
                editor={ClassicEditor}
                data={value}
                onReady={(editor) => {
                    editorRef.current = editor;
                    // Register custom button for video if we wanted it inside the toolbar... 
                    // But simpler to keep outside for now to avoid complex UI registration code.
                }}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    onChange(data);
                }}
                config={{
                    licenseKey: 'GPL', // Required for Open Source version
                    placeholder: placeholder,
                    extraPlugins: [MyCustomUploadAdapterPlugin],
                    plugins: [
                        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
                        Font, List, Table, TableToolbar, TableProperties, TableCellProperties,
                        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize,
                        Link, Alignment, BlockQuote, Heading,
                        MediaEmbed, GeneralHtmlSupport, SourceEditing, ShowBlocks
                    ],
                    toolbar: {
                        items: [
                            'undo', 'redo',
                            '|',
                            'heading',
                            '|',
                            'bold', 'italic', 'underline', 'strikethrough',
                            '|',
                            'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
                            '|',
                            'bulletedList', 'numberedList',
                            '|',
                            'alignment',
                            '|',
                            'link', 'insertImage', 'mediaEmbed', 'insertTable', 'blockQuote',
                            '|',
                            'sourceEditing', 'showBlocks'
                        ],
                        shouldNotGroupWhenFull: true
                    },
                    table: {
                        contentToolbar: [
                            'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'
                        ]
                    },
                    image: {
                        toolbar: [
                            'imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side'
                        ]
                    },
                    htmlSupport: {
                        allow: [
                            {
                                name: /.*/,
                                attributes: true,
                                classes: true,
                                styles: true
                            }
                        ]
                    }
                }}
            />
        </div>
    );
}
