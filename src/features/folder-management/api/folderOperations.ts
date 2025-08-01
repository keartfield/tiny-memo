import { folderApi, isValidFolderName } from '../../../entities/folder'

export interface FolderOperationsInterface {
  validateFolderName: (name: string) => boolean
  createFolder: (name: string) => Promise<void>
  reorderFolders: (folderIds: string[]) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
}

export class FolderOperations implements FolderOperationsInterface {
  validateFolderName(name: string): boolean {
    return isValidFolderName(name)
  }

  async createFolder(name: string): Promise<void> {
    if (!this.validateFolderName(name)) {
      throw new Error('Invalid folder name')
    }
    await folderApi.create(name)
  }

  async reorderFolders(folderIds: string[]): Promise<void> {
    await folderApi.reorderFolders(folderIds)
  }

  async deleteFolder(id: string): Promise<void> {
    await folderApi.delete(id)
  }
}

export const folderOperations = new FolderOperations()