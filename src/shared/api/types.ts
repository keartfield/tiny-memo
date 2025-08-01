import { Folder, Memo, MemoCreateInput, MemoUpdateInput } from '../types'

export interface ElectronAPI {
  folders: {
    getAll: () => Promise<Folder[]>
    create: (name: string) => Promise<Folder>
    update: (id: string, name: string) => Promise<Folder>
    delete: (id: string) => Promise<void>
  }
  memos: {
    getAll: () => Promise<Memo[]>
    getByFolder: (folderId: string | null) => Promise<Memo[]>
    create: (input: MemoCreateInput) => Promise<Memo>
    update: (id: string, input: MemoUpdateInput) => Promise<Memo>
    delete: (id: string) => Promise<void>
    search: (query: string) => Promise<Memo[]>
  }
  images: {
    save: (data: Uint8Array, filename: string) => Promise<string>
    get: (filename: string) => Promise<string>
    delete: (filename: string) => Promise<boolean>
  }
  openExternal: (url: string) => void
  on: (channel: string, callback: (data: any) => void) => void
  off: (channel: string, callback: (data: any) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}