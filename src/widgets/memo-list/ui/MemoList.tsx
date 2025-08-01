import React, { useRef, useEffect } from 'react'
import { Memo, getMemoTitle } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'
import './MemoList.css'

interface MemoListProps {
  memos: Memo[]
  selectedMemo: Memo | null
  onMemoSelect: (memo: Memo) => void
  onMemoCreate: (content: string) => void
  onMemoDelete: (id: string) => void
  onMemoFolderUpdate: (id: string, folderId: string | null) => void
  selectedFolder: Folder | null
  isSearching: boolean
}

const MemoList: React.FC<MemoListProps> = ({
  memos,
  selectedMemo,
  onMemoSelect,
  onMemoCreate,
  onMemoDelete,
  selectedFolder,
  isSearching
}) => {
  const memoItemsRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const memoItemsElement = memoItemsRef.current
    if (!memoItemsElement) return

    const handleScroll = () => {
      // スクロール開始時にスクロールバーを表示
      memoItemsElement.classList.add('scrolling')

      // 既存のタイマーをクリア
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 1秒後にスクロールバーを非表示
      scrollTimeoutRef.current = setTimeout(() => {
        memoItemsElement.classList.remove('scrolling')
      }, 1000)
    }

    memoItemsElement.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      memoItemsElement.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const formatDate = (date: Date) => {
    const now = new Date()
    const memoDate = new Date(date)
    const diffInMs = now.getTime() - memoDate.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return memoDate.toLocaleDateString()
    }
  }

  const getPreviewText = (content: string) => {
    return content
      .replace(/^#+ /, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim()
  }

  const handleCreateMemo = () => {
    const content = ''
    onMemoCreate(content)
  }

  const handleDragStart = (e: React.DragEvent, memo: Memo) => {
    e.dataTransfer.setData('text/plain', memo.id)
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: memo.id,
      title: getMemoTitle(memo),
      folderId: memo.folderId
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const getHeaderTitle = () => {
    if (isSearching) {
      return 'Search Results'
    }
    return selectedFolder ? selectedFolder.name : 'All Notes'
  }

  return (
    <div className="memo-list">
      <div className="memo-list-header">
        <span className="memo-list-title">{getHeaderTitle()}</span>
        <button
          className="memo-add-btn"
          onClick={handleCreateMemo}
          title="New Memo"
        >
          +
        </button>
      </div>

      <div className="memo-items" ref={memoItemsRef}>
        {memos.length === 0 ? (
          <div className="empty-state">
            <p>Nothing here (yet)</p>
            {!isSearching && (
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#ccc' }}>
                Press + to begin
              </p>
            )}
          </div>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.id}
              className={`memo-item ${selectedMemo?.id === memo.id ? 'selected' : ''}`}
              onClick={() => onMemoSelect(memo)}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, memo)}
            >
              <div className="memo-title">{getMemoTitle(memo)}</div>
              <div className="memo-preview">
                {getPreviewText(memo.content)}
              </div>
              <div className="memo-meta">
                <span className="memo-date">
                  {formatDate(memo.updatedAt)}
                </span>
                <button
                  className="memo-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete memo "${getMemoTitle(memo)}"?`)) {
                      onMemoDelete(memo.id)
                    }
                  }}
                  title="Delete Memo"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MemoList
