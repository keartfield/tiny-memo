import React from 'react'
import { Resizer } from '../../../shared'
import { useApp } from '../../../features'
import { FolderSidebar, MemoList, MemoEditor, SearchBar } from '../../../widgets'
import '../../../shared/ui/styles/index.css'
import './MainPage.css'

const MainPage: React.FC = () => {
  
  const {
    // Theme and view mode
    isDarkMode,
    viewMode,
    handleToggleTheme,
    handleToggleViewMode,
    // Layout dimensions
    folderSidebarWidth,
    memoListWidth,
    handleFolderSidebarResize,
    handleMemoListResize,
    // Folder management
    folders,
    selectedFolder,
    handleFolderSelect,
    handleFolderCreate,
    handleFolderUpdate,
    handleFolderReorder,
    handleFolderDelete,
    // Memo operations
    memos,
    selectedMemo,
    handleMemoSelect,
    handleMemoCreate,
    handleMemoUpdate,
    handleMemoFolderUpdate,
    handleMemoDelete,
    // Search
    searchQuery,
    isSearching,
    handleSearch
  } = useApp()


  return (
    <div className="app">
      <header className="app-header">
        <div className="header-controls">
          <SearchBar onSearch={handleSearch} value={searchQuery} />
          <button 
            className="view-toggle-btn" 
            onClick={handleToggleViewMode}
            title={viewMode === 'folder-list-memo' ? 'List' : 'Folder'}
          >
            {viewMode === 'folder-list-memo' ? '=' : '☰'}
          </button>
          <button 
            className="theme-toggle-btn" 
            onClick={handleToggleTheme}
            title={isDarkMode ? 'Light' : 'Dark'}
          >
            {isDarkMode ? '⚪' : '⚫︎'}
          </button>
        </div>
      </header>
      
      <div className="app-content">
        {viewMode === 'folder-list-memo' && (
          <div 
            className="folder-sidebar" 
            style={{ width: `${folderSidebarWidth}px` }}
          >
            <FolderSidebar
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              onFolderCreate={handleFolderCreate}
              onFolderUpdate={handleFolderUpdate}
              onFolderDelete={handleFolderDelete}
              onFolderReorder={handleFolderReorder}
              onMemoFolderUpdate={handleMemoFolderUpdate}
              isSearching={isSearching}
            />
            <Resizer 
              direction="horizontal" 
              onResize={handleFolderSidebarResize}
            />
          </div>
        )}
        
        <div 
          className="memo-list-container" 
          style={{ 
            width: `${memoListWidth}px`
          }}
        >
          <MemoList
            memos={memos}
            selectedMemo={selectedMemo}
            onMemoSelect={handleMemoSelect}
            onMemoCreate={handleMemoCreate}
            onMemoDelete={handleMemoDelete}
            onMemoFolderUpdate={handleMemoFolderUpdate}
            selectedFolder={selectedFolder}
            isSearching={isSearching}
          />
          <Resizer 
            direction="horizontal" 
            onResize={viewMode === 'list-memo' ? 
              (delta) => handleMemoListResize(delta) :
              handleMemoListResize
            }
          />
        </div>
        
        <div className="memo-editor" style={{ flex: 1 }}>
          <MemoEditor
            memo={selectedMemo}
            folders={folders}
            onMemoUpdate={handleMemoUpdate}
            onMemoFolderUpdate={handleMemoFolderUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default MainPage
