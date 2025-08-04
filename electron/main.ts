import { app, BrowserWindow, Menu, ipcMain, shell, nativeImage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import { PrismaClient } from '@prisma/client'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow
let prisma: PrismaClient
let imagesDir: string

const createWindow = () => {
  const windowOptions: any = {
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
  }

  // Set icon in development
  if (isDev) {
    try {
      const iconPath = join(process.cwd(), 'assets/icons/icon_dark_80_padded.png')
      console.log('Development icon path:', iconPath)
      windowOptions.icon = iconPath
    } catch (error) {
      console.log('Icon not found in development, using default')
    }
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  // Set dock icon for development
  if (isDev && process.platform === 'darwin') {
    try {
      const iconPath = join(process.cwd(), 'assets/icons/icon_dark_80_padded.png')
      const icon = nativeImage.createFromPath(iconPath)
      app.dock.setIcon(icon)
      console.log('Development dock icon set successfully')
    } catch (error) {
      console.log('Failed to set development dock icon:', error)
    }
  }
  // Setup user data directory structure
  const userDataPath = app.getPath('userData')
  const dbPath = isDev 
    ? join(process.cwd(), 'prisma', 'dev.db')
    : join(userDataPath, 'memo.db')
  imagesDir = join(userDataPath, 'images')
  
  // Set DATABASE_URL environment variable
  process.env.DATABASE_URL = `file:${dbPath}`
  console.log('Database path:', dbPath)
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  
  // Initialize Prisma client
  try {
    console.log('Initializing Prisma client...')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    })
    
    await prisma.$connect()
    console.log('Prisma connected successfully')
    
    // Enable foreign keys
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`
    
    // Create tables using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "folders" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "memos" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "folderId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "memos_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `
    
    console.log('Database tables initialized with Prisma')
    
    // Test query
    const folderCount = await prisma.folder.count()
    console.log('Database working correctly. Folder count:', folderCount)
  } catch (error) {
    console.error('Failed to initialize Prisma:', error)
    throw error
  }
  
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
      label: 'tiny memo',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
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
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Setup image handling (common to both Prisma and SQLite3)
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
  
  // Handle external link opening
  ipcMain.on('open-external', (_, url: string) => {
    shell.openExternal(url)
  })
})

app.on('window-all-closed', () => {
  prisma?.$disconnect()
  app.quit()
})
