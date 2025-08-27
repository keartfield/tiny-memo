import { useState, useCallback } from 'react'

export type EditorMode = 'edit' | 'edit-preview' | 'preview'

interface UseEditorModeReturn {
  editorMode: EditorMode
  setEditorMode: (mode: EditorMode) => void
  toggleEditorMode: () => void
  editorWidth: number
  setEditorWidth: (width: number | ((prevWidth: number) => number)) => void
}

export const useEditorMode = (initialMode: EditorMode = 'edit-preview'): UseEditorModeReturn => {
  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode)
  const [editorWidth, setEditorWidth] = useState(50) // Percentage width of editor

  const toggleEditorMode = useCallback(() => {
    setEditorMode(current => {
      switch (current) {
        case 'edit':
          return 'edit-preview'
        case 'edit-preview':
          return 'preview'
        case 'preview':
          return 'edit'
        default:
          return 'edit-preview'
      }
    })
  }, [])

  return {
    editorMode,
    setEditorMode,
    toggleEditorMode,
    editorWidth,
    setEditorWidth
  }
}