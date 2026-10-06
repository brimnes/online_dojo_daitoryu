'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { C, F } from '@/lib/utils';

const CSS = `
.rte-content .ProseMirror { outline: none; min-height: var(--rte-min); padding: 12px 14px; font-family: ${F.serif}; font-size: 17px; line-height: 1.7; color: ${C.ink2}; }
.rte-content .ProseMirror p { margin: 0 0 0.9em; }
.rte-content .ProseMirror h2 { font-size: 26px; font-weight: 400; margin: 1.1em 0 0.4em; color: ${C.ink}; line-height: 1.2; }
.rte-content .ProseMirror h3 { font-family: ${F.mono}; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; margin: 1em 0 0.3em; color: ${C.muted}; font-weight: 400; }
.rte-content .ProseMirror li p { margin: 0 0 0.3em; }
.rte-content .ProseMirror ul, .rte-content .ProseMirror ol { padding-left: 24px; margin: 0 0 0.9em; }
.rte-content .ProseMirror blockquote { border-left: 3px solid ${C.accent}; padding-left: 14px; margin: 0.9em 0; color: ${C.muted}; font-style: italic; }
.rte-content .ProseMirror a { color: ${C.accent}; text-decoration: underline; }
.rte-content .ProseMirror img { max-width: 100%; height: auto; display: block; margin: 1em 0; }
.rte-content .ProseMirror img.ProseMirror-selectednode { outline: 2px solid ${C.accent}; }
.rte-content .ProseMirror hr { border: none; border-top: 1px solid ${C.border}; margin: 1.5em 0; }
`;

function ToolBtn({ active, disabled, onClick, title, children, style }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        minWidth: 30, height: 30, padding: '0 8px',
        border: `1px solid ${active ? C.accent : 'transparent'}`,
        background: active ? C.accentSoft : 'transparent',
        color: disabled ? C.border : C.ink,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: F.sys, fontSize: 13, lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 20, background: C.border, margin: '0 4px', alignSelf: 'center' }} />;
}

export default function RichTextEditor({ value, onChange, minHeight = 220, breaks = false }) {
  const [source, setSource] = useState(false);
  const lastEmitted = useRef(value || '');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: false }),
      Image,
      Markdown.configure({ html: true, breaks, tightLists: true, bulletListMarker: '-', linkify: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown();
      lastEmitted.current = md;
      onChange?.(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if ((value || '') !== lastEmitted.current) {
      lastEmitted.current = value || '';
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Адрес ссылки (пусто — убрать ссылку)', prev);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  };

  const toggleSource = () => {
    if (source && editor) {
      lastEmitted.current = value || '';
      editor.commands.setContent(value || '', false);
    }
    setSource((s) => !s);
  };

  const c = editor?.chain().focus();
  const is = (name, attrs) => !!editor?.isActive(name, attrs);

  return (
    <div className="rte-content" style={{ border: `1px solid ${C.border}`, background: C.white, '--rte-min': `${minHeight}px` }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {!source && editor && (
          <>
            <ToolBtn title="Жирный" active={is('bold')} onClick={() => c.toggleBold().run()} style={{ fontWeight: 700 }}>B</ToolBtn>
            <ToolBtn title="Курсив" active={is('italic')} onClick={() => c.toggleItalic().run()} style={{ fontStyle: 'italic', fontFamily: F.serif }}>I</ToolBtn>
            <ToolBtn title="Подчёркнутый" active={is('underline')} onClick={() => c.toggleUnderline().run()} style={{ textDecoration: 'underline' }}>U</ToolBtn>
            <ToolBtn title="Зачёркнутый" active={is('strike')} onClick={() => c.toggleStrike().run()} style={{ textDecoration: 'line-through' }}>S</ToolBtn>
            <Sep />
            <ToolBtn title="Заголовок" active={is('heading', { level: 2 })} onClick={() => c.toggleHeading({ level: 2 }).run()}>Заголовок</ToolBtn>
            <ToolBtn title="Подзаголовок" active={is('heading', { level: 3 })} onClick={() => c.toggleHeading({ level: 3 }).run()}>Подзаголовок</ToolBtn>
            <ToolBtn title="Обычный текст" active={is('paragraph')} onClick={() => c.setParagraph().run()}>Текст</ToolBtn>
            <Sep />
            <ToolBtn title="Маркированный список" active={is('bulletList')} onClick={() => c.toggleBulletList().run()}>• Список</ToolBtn>
            <ToolBtn title="Нумерованный список" active={is('orderedList')} onClick={() => c.toggleOrderedList().run()}>1. Список</ToolBtn>
            <ToolBtn title="Цитата" active={is('blockquote')} onClick={() => c.toggleBlockquote().run()}>“ Цитата</ToolBtn>
            <Sep />
            <ToolBtn title="Ссылка" active={is('link')} onClick={setLink}>Ссылка</ToolBtn>
            <ToolBtn title="Разделитель" onClick={() => c.setHorizontalRule().run()}>—</ToolBtn>
            <Sep />
            <ToolBtn title="Отменить" disabled={!editor.can().undo()} onClick={() => c.undo().run()}>↶</ToolBtn>
            <ToolBtn title="Повторить" disabled={!editor.can().redo()} onClick={() => c.redo().run()}>↷</ToolBtn>
          </>
        )}
        <ToolBtn
          title="Показать исходный Markdown"
          active={source}
          onClick={toggleSource}
          style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 11 }}
        >
          {source ? '← Редактор' : 'Исходник'}
        </ToolBtn>
      </div>

      <div style={{ display: source ? 'none' : 'block' }}>
        <EditorContent editor={editor} />
      </div>

      {source && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          spellCheck={false}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box', minHeight,
            border: 'none', outline: 'none', resize: 'vertical', padding: '12px 14px',
            fontFamily: F.mono, fontSize: 13, lineHeight: 1.6, color: C.ink, background: C.white,
          }}
        />
      )}
    </div>
  );
}
