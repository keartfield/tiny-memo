export type ViewMode = 'list-memo' | 'folder-list-memo'

export type Theme = 'light' | 'dark'

export interface ResizeHandlerProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}

export interface SidebarDimensions {
  folderSidebarWidth: number
  memoListWidth: number
}