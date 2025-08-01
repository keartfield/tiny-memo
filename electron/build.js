import { build } from 'esbuild'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const buildElectron = async () => {
  await build({
    entryPoints: [
      join(__dirname, 'main.ts'),
      join(__dirname, 'preload.ts')
    ],
    bundle: true,
    platform: 'node',
    target: 'node16',
    external: ['electron', '@prisma/client'],
    outdir: join(__dirname, '../dist-electron'),
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    sourcemap: process.env.NODE_ENV === 'development',
  })
}

buildElectron().catch(console.error)