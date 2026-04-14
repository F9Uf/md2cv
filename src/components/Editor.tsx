import { useEffect, useRef } from 'react'
import { EditorView, lineNumbers, drawSelection, highlightActiveLine, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export default function Editor({ value, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  // Flag to detect internal (user-typed) changes vs external prop changes
  const isInternalChange = useRef(false)

  // Mount CodeMirror once
  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      oneDark,
      markdown({ codeLanguages: languages }),
      EditorView.lineWrapping,
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalChange.current = true
          onChange(update.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ]

    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g., file load) into the editor
  useEffect(() => {
    if (!viewRef.current) return

    if (isInternalChange.current) {
      // Change originated from user typing — skip to avoid cursor-jumping
      isInternalChange.current = false
      return
    }

    const currentDoc = viewRef.current.state.doc.toString()
    if (currentDoc !== value) {
      viewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      })
    }
  }, [value])

  return <div ref={containerRef} className="h-full w-full bg-[#282c34]" />
}
