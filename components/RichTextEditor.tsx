'use client';

import dynamic from 'next/dynamic';

// Dynamically import the CKEditor wrapper to avoid SSR issues with CKEditor 5
const CKEditorWrapper = dynamic(() => import('./CKEditorWrapper'), {
    ssr: false,
    loading: () => (
        <div className="bg-white rounded-md border border-gray-300 h-[500px] flex items-center justify-center text-gray-400">
            Loading Editor...
        </div>
    )
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor(props: RichTextEditorProps) {
    return <CKEditorWrapper {...props} />;
}
