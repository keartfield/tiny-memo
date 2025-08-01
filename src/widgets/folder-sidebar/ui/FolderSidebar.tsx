import React, { useState, useRef, useEffect } from 'react'
import { Folder } from '../../../entities/folder'
import './FolderSidebar.css'

interface FolderSidebarProps {
  folders: Folder[]
  selectedFolder: Folder | null
  onFolderSelect: (folder: Folder | null) => void
  onFolderCreate: (name: string) => void
  onFolderUpdate: (id: string, name: string) => void
  onFolderDelete: (id: string) => void
  onFolderReorder: (folderIds: string[]) => void
  onMemoFolderUpdate: (id: string, folderId: string | null) => void
  isSearching: boolean
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
  onFolderReorder,
  onMemoFolderUpdate,
  isSearching
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)
  const folderListRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const folderListElement = folderListRef.current
    if (!folderListElement) return

    const handleScroll = () => {
      // スクロール開始時にスクロールバーを表示
      folderListElement.classList.add('scrolling')

      // 既存のタイマーをクリア
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 1秒後にスクロールバーを非表示
      scrollTimeoutRef.current = setTimeout(() => {
        folderListElement.classList.remove('scrolling')
      }, 1000)
    }

    folderListElement.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      folderListElement.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateFolder = () => {
    setIsCreating(true)
    setNewFolderName('')
  }


  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim())
      setIsCreating(false)
      setNewFolderName('')
    }
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewFolderName('')
  }

  const handleStartEdit = (folder: Folder) => {
    setEditingFolderId(folder.id)
    setEditFolderName(folder.name)
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFolderId && editFolderName.trim()) {
      onFolderUpdate(editingFolderId, editFolderName.trim())
      setEditingFolderId(null)
      setEditFolderName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingFolderId(null)
    setEditFolderName('')
  }

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // フォルダの並び替えの場合のみ境界線を表示
    if (draggedFolder && folderId && folderId !== 'all-notes' && draggedFolder !== folderId) {
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseY = e.clientY
      const centerY = rect.top + rect.height / 2
      
      setDragOverFolder(folderId)
      setDropPosition(mouseY < centerY ? 'before' : 'after')
    } else if (draggedFolder) {
      // フォルダの並び替えでない場合はクリア
      setDragOverFolder(null)
      setDropPosition(null)
    } else {
      // メモのドロップの場合は従来通り
      setDragOverFolder(folderId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolder(null)
    setDropPosition(null)
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    setDragOverFolder(null)
    setDropPosition(null)
    
    // フォルダの並び替えの場合
    if (draggedFolder && targetFolderId && draggedFolder !== targetFolderId) {
      const draggedIndex = folders.findIndex(f => f.id === draggedFolder)
      const targetIndex = folders.findIndex(f => f.id === targetFolderId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFolders = [...folders]
        const [draggedItem] = newFolders.splice(draggedIndex, 1)
        
        // ドロップ位置に基づいて挿入位置を決定
        let insertIndex = targetIndex
        if (dropPosition === 'after') {
          insertIndex = targetIndex + 1
        }
        // draggedIndexがtargetIndexより小さい場合は調整
        if (draggedIndex < targetIndex) {
          insertIndex = insertIndex - 1
        }
        
        newFolders.splice(insertIndex, 0, draggedItem)
        
        const folderIds = newFolders.map(f => f.id)
        onFolderReorder(folderIds)
      }
      
      setDraggedFolder(null)
      setIsDragging(false)
      return
    }
    
    // メモのフォルダ移動の場合
    try {
      const memoData = e.dataTransfer.getData('application/json')
      if (memoData) {
        const memo = JSON.parse(memoData)
        if (memo.id && memo.folderId !== targetFolderId) {
          onMemoFolderUpdate(memo.id, targetFolderId)
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
    
    setDraggedFolder(null)
    setIsDragging(false)
  }

  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggedFolder(folderId)
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', folderId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFolderDragEnd = () => {
    setDraggedFolder(null)
    setIsDragging(false)
    setDragOverFolder(null)
    setDropPosition(null)
  }

  return (
    <div className="folder-sidebar">
      <div className="folder-sidebar-header">
        <span className="folder-sidebar-title">FOLDERS</span>
        <button
          className="folder-add-btn"
          onClick={handleCreateFolder}
          title="New Folder"
        >
          +
        </button>
      </div>
      
      <div className="folder-list" ref={folderListRef}>
        <div
          className={`folder-item all-notes ${!selectedFolder && !isSearching ? 'selected' : ''} ${
            dragOverFolder === 'all-notes' && !draggedFolder ? 'drag-over' : ''
          } ${
            dragOverFolder === 'all-notes' && draggedFolder && dropPosition === 'before' ? 'drop-before' : ''
          } ${
            dragOverFolder === 'all-notes' && draggedFolder && dropPosition === 'after' ? 'drop-after' : ''
          }`}
          onClick={() => onFolderSelect(null)}
          onDragOver={(e) => handleDragOver(e, 'all-notes')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="folder-info">
            <span className="folder-name">All Notes</span>
          </div>
        </div>

        {isCreating && (
          <div className="folder-item">
            <form onSubmit={handleSubmitCreate} style={{ width: '100%' }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={handleCancelCreate}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: 'var(--text-color)'
                }}
                placeholder="Folder name"
              />
            </form>
          </div>
        )}

        {folders.sort((a, b) => a.order - b.order).map((folder) => (
          <div
            key={folder.id}
            className={`folder-item ${selectedFolder?.id === folder.id ? 'selected' : ''} ${
              dragOverFolder === folder.id && !draggedFolder ? 'drag-over' : ''
            } ${
              dragOverFolder === folder.id && draggedFolder && dropPosition === 'before' ? 'drop-before' : ''
            } ${
              dragOverFolder === folder.id && draggedFolder && dropPosition === 'after' ? 'drop-after' : ''
            } ${draggedFolder === folder.id ? 'dragging' : ''}`}
            onClick={() => editingFolderId !== folder.id && !isDragging && onFolderSelect(folder)}
            draggable={editingFolderId !== folder.id}
            onDragStart={(e) => handleFolderDragStart(e, folder.id)}
            onDragEnd={handleFolderDragEnd}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
          >
            <div className="folder-info">
              {editingFolderId === folder.id ? (
                <form onSubmit={handleSubmitEdit} style={{ width: '100%' }}>
                  <input
                    type="text"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onBlur={handleCancelEdit}
                    autoFocus
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '14px'
                    }}
                  />
                </form>
              ) : (
                <>
                  <span 
                    className="folder-name"
                    onDoubleClick={() => handleStartEdit(folder)}
                    title="Double-click to edit"
                  >
                    {folder.name}
                  </span>
                  <span className="folder-count">
                    {folder._count?.memos || 0}
                  </span>
                </>
              )}
            </div>
            {editingFolderId !== folder.id && (
              <button
                className="folder-delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete folder "${folder.name}"?`)) {
                    onFolderDelete(folder.id)
                  }
                }}
                title="Delete Folder"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FolderSidebar
