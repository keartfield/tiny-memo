import { build } from 'esbuild'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const buildElectron = async () => {
  const entryPoints = [
    join(__dirname, 'main.ts'),
    join(__dirname, 'preload.ts')
  ]
  
  await build({
    entryPoints,
    bundle: true,
    platform: 'node',
    target: 'node16',
    external: ['electron', '@prisma/client', '.prisma/client'],
    outdir: join(__dirname, '../dist-electron'),
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    sourcemap: process.env.NODE_ENV === 'development',
  })
}

buildElectron().catch(console.error)