import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, Link2Off, Undo, Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { useCallback } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Escribe aquí...', emptyEditorClass: 'is-editor-empty' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL del enlace', prev ?? 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={cn('rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
        <Toggle
          size="sm" pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrita"
        >
          <Bold className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm" pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Cursiva"
        >
          <Italic className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle
          size="sm" pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Título"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm" pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Subtítulo"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle
          size="sm" pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Lista"
        >
          <List className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm" pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Lista numerada"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle
          size="sm" pressed={editor.isActive('link')}
          onPressedChange={setLink}
          aria-label="Insertar enlace"
        >
          <Link2 className="h-3.5 w-3.5" />
        </Toggle>
        {editor.isActive('link') && (
          <Toggle
            size="sm" pressed={false}
            onPressedChange={() => editor.chain().focus().unsetLink().run()}
            aria-label="Quitar enlace"
          >
            <Link2Off className="h-3.5 w-3.5" />
          </Toggle>
        )}

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle
          size="sm" pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Deshacer"
        >
          <Undo className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm" pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Rehacer"
        >
          <Redo className="h-3.5 w-3.5" />
        </Toggle>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
