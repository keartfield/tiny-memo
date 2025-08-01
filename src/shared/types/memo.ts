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

export interface SearchResult extends Memo {
  folder?: Folder | null
}

export interface Folder {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    memos: number
  }
}