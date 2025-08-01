import { Folder } from '../types'

export const foldersApi = {
  async getAll(): Promise<Folder[]> {
    return window.electronAPI.folders.getAll()
  },

  async create(name: string): Promise<Folder> {
    return window.electronAPI.folders.create(name)
  },

  async update(id: string, name: string): Promise<Folder> {
    return window.electronAPI.folders.update(id, name)
  },

  async updateOrder(id: string, order: number): Promise<Folder> {
    return window.electronAPI.folders.updateOrder(id, order)
  },

  async reorderFolders(folderIds: string[]): Promise<void> {
    return window.electronAPI.folders.reorderFolders(folderIds)
  },

  async delete(id: string): Promise<void> {
    return window.electronAPI.folders.delete(id)
  }
}