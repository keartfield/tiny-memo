import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import { createHash } from 'crypto'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow
let prisma: PrismaClient
let imagesDir: string

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 300,
    minHeight: 200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  // Initialize Prisma
  prisma = new PrismaClient()
  
  // Setup images directory
  const userDataPath = app.getPath('userData')
  imagesDir = join(userDataPath, 'images')
  
  try {
    await fs.mkdir(imagesDir, { recursive: true })
    console.log('Images directory created at:', imagesDir)
  } catch (error) {
    console.error('Failed to create images directory:', error)
  }
  
  createWindow()
  
  // Set application menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // IPC handlers for database operations
  ipcMain.handle('db:folders:getAll', async () => {
    return await prisma.folder.findMany({
      include: {
        _count: {
          select: { memos: true }
        }
      },
      orderBy: { order: 'asc' }
    })
  })

  ipcMain.handle('db:folders:create', async (_, name: string) => {
    // Get the highest order value and increment by 1
    const lastFolder = await prisma.folder.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const nextOrder = (lastFolder?.order ?? -1) + 1
    
    return await prisma.folder.create({
      data: { name, order: nextOrder }
    })
  })

  ipcMain.handle('db:folders:update', async (_, id: string, name: string) => {
    return await prisma.folder.update({
      where: { id },
      data: { name }
    })
  })

  ipcMain.handle('db:folders:updateOrder', async (_, id: string, order: number) => {
    return await prisma.folder.update({
      where: { id },
      data: { order }
    })
  })

  ipcMain.handle('db:folders:reorderFolders', async (_, folderIds: string[]) => {
    // Update each folder's order based on its position in the array
    await prisma.$transaction(
      folderIds.map((id, index) =>
        prisma.folder.update({
          where: { id },
          data: { order: index }
        })
      )
    )
  })

  ipcMain.handle('db:folders:delete', async (_, id: string) => {
    return await prisma.folder.delete({ where: { id } })
  })

  ipcMain.handle('db:memos:getByFolder', async (_, folderId: string | null) => {
    return await prisma.memo.findMany({
      where: { folderId },
      orderBy: { updatedAt: 'desc' }
    })
  })

  ipcMain.handle('db:memos:getAll', async () => {
    return await prisma.memo.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { folder: true }
    })
  })

  ipcMain.handle('db:memos:create', async (_, data: { content: string; folderId: string | null }) => {
    return await prisma.memo.create({ data })
  })

  ipcMain.handle('db:memos:update', async (_, id: string, data: { content?: string; folderId?: string | null }) => {
    try {
      return await prisma.memo.update({
        where: { id },
        data
      })
    } catch (error) {
      throw error
    }
  })

  ipcMain.handle('db:memos:delete', async (_, id: string) => {
    return await prisma.memo.delete({ where: { id } })
  })

  ipcMain.handle('db:memos:search', async (_, query: string) => {
    console.log('Search query received:', query)
    
    // Manual search instead of database full-text search
    const allMemos = await prisma.memo.findMany({
      include: { folder: true },
      orderBy: { updatedAt: 'desc' }
    })
    
    const manualResults = allMemos.filter(memo =>
      memo.content.toLowerCase().includes(query.toLowerCase())
    )
    console.log('Manual search results count:', manualResults.length)
    
    return manualResults
  })

  // Image handling
  ipcMain.handle('image:save', async (_, data: Uint8Array, filename: string) => {
    try {
      // Convert Uint8Array to Buffer
      const buffer = Buffer.from(data)
      
      // Generate unique filename using hash
      const hash = createHash('md5').update(buffer).digest('hex')
      const ext = filename.split('.').pop() || 'png'
      const uniqueFilename = `${hash}.${ext}`
      const filePath = join(imagesDir, uniqueFilename)
      
      await fs.writeFile(filePath, buffer)
      
      console.log('Image saved:', filePath)
      return uniqueFilename
    } catch (error) {
      console.error('Failed to save image:', error)
      throw error
    }
  })

  ipcMain.handle('image:get', async (_, filename: string) => {
    try {
      const filePath = join(imagesDir, filename)
      const buffer = await fs.readFile(filePath)
      return buffer.toString('base64')
    } catch (error) {
      console.error('Failed to read image:', error)
      throw error
    }
  })

  ipcMain.handle('image:delete', async (_, filename: string) => {
    try {
      const filePath = join(imagesDir, filename)
      await fs.unlink(filePath)
      console.log('Image deleted:', filePath)
      return true
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  })

  // Handle external link opening
  ipcMain.on('open-external', (_, url: string) => {
    shell.openExternal(url)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    prisma?.$disconnect()
    app.quit()
  }
})
