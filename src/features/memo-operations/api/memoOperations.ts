import { memoApi, isMemoEmpty } from '../../../entities/memo'

export interface MemoOperationsInterface {
  validateMemoContent: (content: string) => boolean
  createMemo: (content: string, folderId: string | null) => Promise<void>
  updateMemo: (id: string, content: string) => Promise<void>
  updateMemoFolder: (id: string, folderId: string | null) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
}

export class MemoOperations implements MemoOperationsInterface {
  validateMemoContent(content: string): boolean {
    return content.trim().length > 0
  }

  async createMemo(content: string, folderId: string | null): Promise<void> {
    if (!this.validateMemoContent(content)) {
      throw new Error('Memo content cannot be empty')
    }
    await memoApi.create({ content, folderId })
  }

  async updateMemo(id: string, content: string): Promise<void> {
    await memoApi.update(id, { content })
  }

  async updateMemoFolder(id: string, folderId: string | null): Promise<void> {
    await memoApi.update(id, { folderId })
  }

  async deleteMemo(id: string): Promise<void> {
    await memoApi.delete(id)
  }
}

export const memoOperations = new MemoOperations()