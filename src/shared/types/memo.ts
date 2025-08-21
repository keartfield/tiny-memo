export interface Memo {
  id: string
  content: string
  folderId: string | null
  folder?: Folder | null
  createdAt: Date
  updatedAt: Date
}

export interface MemoCreateInput {
  content: string
  folderId: string | null
}

export interface MemoUpdateInput {
  content?: string
  folderId?: string | null
}

export interface MemoSearchResult extends Memo {
  folder?: Folder | null
}

export interface Folder {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    memos: number
  }
}

export interface FolderCreateInput {
  name: string
  order?: number
}

export interface FolderUpdateInput {
  name?: string
  order?: number
}