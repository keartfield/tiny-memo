import { Memo, MemoCreateInput, MemoUpdateInput } from '../model'

export interface MemoApiInterface {
  getAll(): Promise<Memo[]>
  getByFolder(folderId: string | null): Promise<Memo[]>
  create(input: MemoCreateInput): Promise<Memo>
  update(id: string, input: MemoUpdateInput): Promise<Memo>
  delete(id: string): Promise<void>
}

class MemoApi implements MemoApiInterface {
  async getAll(): Promise<Memo[]> {
    return window.electronAPI.memos.getAll()
  }

  async getByFolder(folderId: string | null): Promise<Memo[]> {
    return window.electronAPI.memos.getByFolder(folderId)
  }

  async create(input: MemoCreateInput): Promise<Memo> {
    return window.electronAPI.memos.create(input)
  }

  async update(id: string, input: MemoUpdateInput): Promise<Memo> {
    return window.electronAPI.memos.update(id, input)
  }

  async delete(id: string): Promise<void> {
    return window.electronAPI.memos.delete(id)
  }
}

export const memoApi = new MemoApi()