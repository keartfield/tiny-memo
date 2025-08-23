import type { Folder } from '../../folder/model/types'

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