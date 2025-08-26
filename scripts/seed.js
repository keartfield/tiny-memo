import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Electronアプリと同じデータベースパスを使用
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');
const databaseUrl = `file:${dbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log('🌱 初期データの作成を開始します...');
  try {
    // データベースに接続
    await prisma.$connect();
 
    // JSONファイルを読み込み
    const seedDataPath = join(__dirname, 'seed-data.json');
    const seedData = JSON.parse(readFileSync(seedDataPath, 'utf-8'));

    // 既存のデータをクリア
    console.log('🗑️  既存のデータをクリアしています...');
    await prisma.memo.deleteMany();
    await prisma.folder.deleteMany();

    // フォルダとメモを作成
    for (const folderData of seedData.folders) {
      console.log(`📁 フォルダ「${folderData.name}」を作成中...`);
      
      const folder = await prisma.folder.create({
        data: {
          name: folderData.name,
          order: folderData.order,
        },
      });

      // フォルダ内のメモを作成
      for (const memoData of folderData.memos) {
        console.log(`  📝 メモを作成中...`);
        await prisma.memo.create({
          data: {
            content: memoData.content,
            folderId: folder.id,
          },
        });
      }
    }

    console.log('✅ 初期データの作成が完了しました！');
    
    // 作成されたデータの確認
    const folderCount = await prisma.folder.count();
    const memoCount = await prisma.memo.count();
    
    console.log(`📊 作成されたデータ:`);
    console.log(`  - フォルダ: ${folderCount}件`);
    console.log(`  - メモ: ${memoCount}件`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
