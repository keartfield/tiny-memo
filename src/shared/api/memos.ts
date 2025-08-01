import { Memo, MemoCreateInput, MemoUpdateInput } from '../types'

export const memosApi = {
  async getAll(): Promise<Memo[]> {
    return window.electronAPI.memos.getAll()
  },

  async getByFolder(folderId: string | null): Promise<Memo[]> {
    return window.electronAPI.memos.getByFolder(folderId)
  },

  async create(input: MemoCreateInput): Promise<Memo> {
    return window.electronAPI.memos.create(input)
  },

  async update(id: string, input: MemoUpdateInput): Promise<Memo> {
    return window.electronAPI.memos.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return window.electronAPI.memos.delete(id)
  }
}