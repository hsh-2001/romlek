'use client';

import { useEffect, type CSSProperties } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Eraser, Hash, Italic, List, ListOrdered, Quote, Strikethrough } from 'lucide-react';

type CaptionEditorLabels = {
  toolbar: string;
  bold: string;
  italic: string;
  strike: string;
  list: string;
  orderedList: string;
  quote: string;
  hashtag: string;
  clearFormatting: string;
};

type CaptionEditorProps = {
  value: string;
  disabled?: boolean;
  placeholder: string;
  rows?: number;
  labels: CaptionEditorLabels;
  onChange: (value: string) => void;
};

const getEditorContent = (value: string) => value || '';

export function CaptionEditor({ value, disabled = false, placeholder, rows = 3, labels, onChange }: CaptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        code: false,
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: getEditorContent(value),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? '' : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentValue = editor.isEmpty ? '' : editor.getHTML();
    if (currentValue !== value) {
      editor.commands.setContent(getEditorContent(value), { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="caption-editor">
      <div className="caption-editor-toolbar" aria-label={labels.toolbar}>
        <button
          type="button"
          className={editor?.isActive('bold') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.bold}
          aria-label={labels.bold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={editor?.isActive('italic') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.italic}
          aria-label={labels.italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={editor?.isActive('strike') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.strike}
          aria-label={labels.strike}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={editor?.isActive('blockquote') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.quote}
          aria-label={labels.quote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={editor?.isActive('bulletList') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.list}
          aria-label={labels.list}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={editor?.isActive('orderedList') ? 'active' : undefined}
          disabled={disabled || !editor}
          title={labels.orderedList}
          aria-label={labels.orderedList}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled || !editor}
          title={labels.hashtag}
          aria-label={labels.hashtag}
          onClick={() => editor?.chain().focus().insertContent('#travel').run()}
        >
          <Hash size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled || !editor}
          title={labels.clearFormatting}
          aria-label={labels.clearFormatting}
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser size={15} aria-hidden="true" />
        </button>
      </div>
      <EditorContent className="caption-editor-content" editor={editor} style={{ '--caption-editor-min-lines': rows } as CSSProperties} />
    </div>
  );
}
