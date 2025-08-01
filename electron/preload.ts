import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  folders: {
    getAll: () => Promise<any[]>
    create: (name: string) => Promise<any>
    update: (id: string, name: string) => Promise<any>
    updateOrder: (id: string, order: number) => Promise<any>
    reorderFolders: (folderIds: string[]) => Promise<void>
    delete: (id: string) => Promise<any>
  }
  memos: {
    getAll: () => Promise<any[]>
    getByFolder: (folderId: string | null) => Promise<any[]>
    create: (data: { content: string; folderId: string | null }) => Promise<any>
    update: (id: string, data: { content?: string; folderId?: string | null }) => Promise<any>
    delete: (id: string) => Promise<any>
    search: (query: string) => Promise<any[]>
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

const electronAPI: ElectronAPI = {
  folders: {
    getAll: () => ipcRenderer.invoke('db:folders:getAll'),
    create: (name: string) => ipcRenderer.invoke('db:folders:create', name),
    update: (id: string, name: string) => ipcRenderer.invoke('db:folders:update', id, name),
    updateOrder: (id: string, order: number) => ipcRenderer.invoke('db:folders:updateOrder', id, order),
    reorderFolders: (folderIds: string[]) => ipcRenderer.invoke('db:folders:reorderFolders', folderIds),
    delete: (id: string) => ipcRenderer.invoke('db:folders:delete', id),
  },
  memos: {
    getAll: () => ipcRenderer.invoke('db:memos:getAll'),
    getByFolder: (folderId: string | null) => ipcRenderer.invoke('db:memos:getByFolder', folderId),
    create: (data: { content: string; folderId: string | null }) => ipcRenderer.invoke('db:memos:create', data),
    update: (id: string, data: { content?: string; folderId?: string | null }) => ipcRenderer.invoke('db:memos:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:memos:delete', id),
    search: (query: string) => ipcRenderer.invoke('db:memos:search', query),
  },
  images: {
    save: (data: Uint8Array, filename: string) => ipcRenderer.invoke('image:save', data, filename),
    get: (filename: string) => ipcRenderer.invoke('image:get', filename),
    delete: (filename: string) => ipcRenderer.invoke('image:delete', filename),
  },
  openExternal: (url: string) => {
    ipcRenderer.send('open-external', url)
  },
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_event, data) => callback(data))
  },
  off: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.off(channel, callback)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}