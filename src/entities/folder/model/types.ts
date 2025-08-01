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