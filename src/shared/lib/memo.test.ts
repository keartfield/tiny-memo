import { describe, it, expect } from 'vitest'
import { extractTitle, getMemoTitle, filterMemosByQuery, sortMemosByDate } from './memo'
import { Memo } from '../../entities/memo/model/types'

const mockMemos: Memo[] = [
  {
    id: '1',
    content: '# JavaScript基礎\n\n変数の宣言について学習',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-03'),
    folderId: 'programming'
  },
  {
    id: '2',
    content: '今日の予定\n\n- 買い物\n- 散歩',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    folderId: null
  },
  {
    id: '3',
    content: '',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-01'),
    folderId: null
  },
  {
    id: '4',
    content: '## TypeScript学習メモ\n\n型安全性について',
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04'),
    folderId: 'programming'
  }
]

describe('memo utilities', () => {
  describe('extractTitle', () => {
    it('通常のテキストから最初の行をタイトルとして抽出する', () => {
      const content = 'これはタイトル\nこれは本文です'
      const result = extractTitle(content)
      
      expect(result).toBe('これはタイトル')
    })

    it('Markdownのh1見出しからタイトルを抽出する', () => {
      const content = '# JavaScript基礎\n\n変数の宣言について'
      const result = extractTitle(content)
      
      expect(result).toBe('JavaScript基礎')
    })

    it('Markdownのh2見出しからタイトルを抽出する', () => {
      const content = '## TypeScript学習\n\n型について'
      const result = extractTitle(content)
      
      expect(result).toBe('TypeScript学習')
    })

    it('Markdownのh3見出しからタイトルを抽出する', () => {
      const content = '### React基礎\n\nコンポーネントについて'
      const result = extractTitle(content)
      
      expect(result).toBe('React基礎')
    })

    it('複数のMarkdown見出し記号を処理する', () => {
      const content = '#### 深いレベルの見出し\n\n詳細な説明'
      const result = extractTitle(content)
      
      expect(result).toBe('深いレベルの見出し')
    })

    it('空文字列の場合は"Untitled"を返す', () => {
      const result = extractTitle('')
      
      expect(result).toBe('Untitled')
    })

    it('空白のみの場合は"Untitled"を返す', () => {
      const result = extractTitle('   \n\t  ')
      
      expect(result).toBe('Untitled')
    })

    it('最初の行が空の場合は"Untitled"を返す', () => {
      const content = '\n\n実際の内容'
      const result = extractTitle(content)
      
      expect(result).toBe('Untitled')
    })

    it('最初の行がMarkdown見出し記号のみの場合は"Untitled"を返す', () => {
      const content = '# \n\n本文'
      const result = extractTitle(content)
      
      expect(result).toBe('Untitled')
    })

    it('前後に空白があるタイトルから空白をトリムする', () => {
      const content = '  タイトル  \n本文'
      const result = extractTitle(content)
      
      expect(result).toBe('タイトル')
    })

    it('見出し記号と空白が混在する場合も正しく処理する', () => {
      const content = '##   タイトル   \n本文'
      const result = extractTitle(content)
      
      expect(result).toBe('タイトル')
    })

    it('単一行のメモでもタイトルを抽出する', () => {
      const content = 'シングルラインのメモ'
      const result = extractTitle(content)
      
      expect(result).toBe('シングルラインのメモ')
    })

    it('改行文字が含まれていない場合も正しく処理する', () => {
      const content = '改行なしのメモ'
      const result = extractTitle(content)
      
      expect(result).toBe('改行なしのメモ')
    })

    it('特殊文字を含むタイトルも正しく処理する', () => {
      const content = '# Title@#$%^&*()\n本文'
      const result = extractTitle(content)
      
      expect(result).toBe('Title@#$%^&*()')
    })

    it('数字のみのタイトルも正しく処理する', () => {
      const content = '12345\n本文'
      const result = extractTitle(content)
      
      expect(result).toBe('12345')
    })

    it('日本語と英語が混在するタイトルも正しく処理する', () => {
      const content = 'JavaScript学習メモ\n詳細な内容'
      const result = extractTitle(content)
      
      expect(result).toBe('JavaScript学習メモ')
    })

    it('絵文字を含むタイトルも正しく処理する', () => {
      const content = '📝 メモのタイトル 📚\n本文内容'
      const result = extractTitle(content)
      
      expect(result).toBe('📝 メモのタイトル 📚')
    })
  })

  describe('getMemoTitle', () => {
    it('メモオブジェクトからタイトルを取得する', () => {
      const memo = { content: '# テストタイトル\n本文' }
      const result = getMemoTitle(memo)
      
      expect(result).toBe('テストタイトル')
    })

    it('空のコンテンツを持つメモの場合は"Untitled"を返す', () => {
      const memo = { content: '' }
      const result = getMemoTitle(memo)
      
      expect(result).toBe('Untitled')
    })

    it('複数行のメモから最初の行をタイトルとして取得する', () => {
      const memo = { content: '今日の予定\n- 買い物\n- 散歩' }
      const result = getMemoTitle(memo)
      
      expect(result).toBe('今日の予定')
    })

    it('Markdown見出しを含むメモのタイトルを正しく取得する', () => {
      const memo = { content: '## TypeScript学習\n型について学習' }
      const result = getMemoTitle(memo)
      
      expect(result).toBe('TypeScript学習')
    })
  })

  describe('filterMemosByQuery', () => {
    it('タイトルに検索クエリが含まれるメモをフィルタリングする', () => {
      const result = filterMemosByQuery(mockMemos, 'JavaScript')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('本文に検索クエリが含まれるメモをフィルタリングする', () => {
      const result = filterMemosByQuery(mockMemos, '買い物')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('大文字小文字を区別せずにフィルタリングする', () => {
      const result = filterMemosByQuery(mockMemos, 'javascript')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('複数のメモがマッチする場合、全てを返す', () => {
      const result = filterMemosByQuery(mockMemos, '学習')
      
      expect(result).toHaveLength(2)
      expect(result.some(memo => memo.id === '1')).toBe(true)
      expect(result.some(memo => memo.id === '4')).toBe(true)
    })

    it('空のクエリの場合、全てのメモを返す', () => {
      const result = filterMemosByQuery(mockMemos, '')
      
      expect(result).toEqual(mockMemos)
    })

    it('空白のみのクエリの場合、全てのメモを返す', () => {
      const result = filterMemosByQuery(mockMemos, '   ')
      
      expect(result).toEqual(mockMemos)
    })

    it('マッチしないクエリの場合、空の配列を返す', () => {
      const result = filterMemosByQuery(mockMemos, 'マッチしない文字列')
      
      expect(result).toEqual([])
    })

    it('部分一致でフィルタリングする', () => {
      const result = filterMemosByQuery(mockMemos, 'Type')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })

    it('空の配列でも正常に動作する', () => {
      const result = filterMemosByQuery([], 'test')
      
      expect(result).toEqual([])
    })

    it('特殊文字を含むクエリでも正常に動作する', () => {
      const specialMemos: Memo[] = [
        {
          id: '1',
          content: 'Special@Character\nContent with @',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: null
        }
      ]
      
      const result = filterMemosByQuery(specialMemos, '@')
      
      expect(result).toHaveLength(1)
    })

    it('数字を含むクエリでも正常に動作する', () => {
      const numberedMemos: Memo[] = [
        {
          id: '1',
          content: 'Version 2023\nYear 2023 release',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: null
        }
      ]
      
      const result = filterMemosByQuery(numberedMemos, '2023')
      
      expect(result).toHaveLength(1)
    })

    it('日本語の検索クエリでも正常に動作する', () => {
      const result = filterMemosByQuery(mockMemos, '予定')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('絵文字を含むメモも正しくフィルタリングする', () => {
      const emojiMemos: Memo[] = [
        {
          id: '1',
          content: '📝 メモタイトル\n📚 学習内容',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: null
        }
      ]
      
      const result = filterMemosByQuery(emojiMemos, '📝')
      
      expect(result).toHaveLength(1)
    })
  })

  describe('sortMemosByDate', () => {
    it('更新日の新しい順にソートされる', () => {
      const result = sortMemosByDate(mockMemos)
      
      // updatedAtが新しい順: 4(2023-01-04) > 1(2023-01-03) > 2(2023-01-02) > 3(2023-01-01)
      expect(result[0].id).toBe('4')
      expect(result[1].id).toBe('1')
      expect(result[2].id).toBe('2')
      expect(result[3].id).toBe('3')
    })

    it('元の配列を変更しない', () => {
      const originalMemos = [...mockMemos]
      sortMemosByDate(mockMemos)
      
      expect(mockMemos).toEqual(originalMemos)
    })

    it('空の配列でも正常に動作する', () => {
      const result = sortMemosByDate([])
      
      expect(result).toEqual([])
    })

    it('1つのメモでも正常に動作する', () => {
      const singleMemo = [mockMemos[0]]
      const result = sortMemosByDate(singleMemo)
      
      expect(result).toEqual(singleMemo)
    })

    it('同じ更新日のメモでも正常に動作する', () => {
      const sameDateMemos: Memo[] = [
        {
          id: '1',
          content: 'メモ1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          folderId: null
        },
        {
          id: '2',
          content: 'メモ2',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          folderId: null
        }
      ]
      
      const result = sortMemosByDate(sameDateMemos)
      
      expect(result).toHaveLength(2)
      // 同じ日付の場合、元の順序が保たれるかは実装依存
    })

    it('異なる年月日のメモも正しくソートする', () => {
      const differentYearMemos: Memo[] = [
        {
          id: '1',
          content: 'Old memo',
          createdAt: new Date('2022-12-31'),
          updatedAt: new Date('2022-12-31'),
          folderId: null
        },
        {
          id: '2',
          content: 'New memo',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          folderId: null
        }
      ]
      
      const result = sortMemosByDate(differentYearMemos)
      
      expect(result[0].id).toBe('2') // 2024年のメモが先
      expect(result[1].id).toBe('1') // 2022年のメモが後
    })

    it('時刻の違いも正しく考慮してソートする', () => {
      const timeBasedMemos: Memo[] = [
        {
          id: '1',
          content: 'Morning memo',
          createdAt: new Date('2023-01-01T09:00:00'),
          updatedAt: new Date('2023-01-01T09:00:00'),
          folderId: null
        },
        {
          id: '2',
          content: 'Evening memo',
          createdAt: new Date('2023-01-01T18:00:00'),
          updatedAt: new Date('2023-01-01T18:00:00'),
          folderId: null
        }
      ]
      
      const result = sortMemosByDate(timeBasedMemos)
      
      expect(result[0].id).toBe('2') // 18:00のメモが先
      expect(result[1].id).toBe('1') // 09:00のメモが後
    })
  })

  describe('統合テスト', () => {
    it('フィルタリング後にソートできる', () => {
      const filtered = filterMemosByQuery(mockMemos, '学習')
      const sorted = sortMemosByDate(filtered)
      
      expect(sorted).toHaveLength(2)
      expect(sorted[0].id).toBe('4') // TypeScript学習 (2023-01-04)
      expect(sorted[1].id).toBe('1') // JavaScript基礎 (2023-01-03)
    })

    it('ソート後にフィルタリングできる', () => {
      const sorted = sortMemosByDate(mockMemos)
      const filtered = filterMemosByQuery(sorted, 'JavaScript')
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('1')
    })

    it('タイトル抽出、フィルタリング、ソートの組み合わせが正しく動作する', () => {
      // 新しいメモを追加
      const extendedMemos: Memo[] = [
        ...mockMemos,
        {
          id: '5',
          content: '# JavaScript応用\n\n高度な概念について',
          createdAt: new Date('2023-01-05'),
          updatedAt: new Date('2023-01-05'),
          folderId: 'programming'
        }
      ]
      
      // JavaScriptを含むメモをフィルタリング
      const filtered = filterMemosByQuery(extendedMemos, 'JavaScript')
      
      // 日付順にソート
      const sorted = sortMemosByDate(filtered)
      
      // タイトルを確認
      const titles = sorted.map(memo => getMemoTitle(memo))
      
      expect(sorted).toHaveLength(2)
      expect(titles[0]).toBe('JavaScript応用') // 新しい方
      expect(titles[1]).toBe('JavaScript基礎') // 古い方
    })
  })

  describe('エッジケース', () => {
    it('非常に長いコンテンツからもタイトルを正しく抽出する', () => {
      const longContent = '# 長いタイトル' + 'あ'.repeat(10000) + '\n' + 'い'.repeat(10000)
      const result = extractTitle(longContent)
      
      expect(result).toBe('長いタイトル' + 'あ'.repeat(10000))
    })

    it('非常に大きな配列でも効率的に動作する', () => {
      const largeMemos: Memo[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        content: `メモ ${i}`,
        createdAt: new Date(2023, 0, 1, 0, 0, i), // 秒単位で異なる時刻
        updatedAt: new Date(2023, 0, 1, 0, 0, i),
        folderId: null
      }))
      
      const filtered = filterMemosByQuery(largeMemos, '50')
      expect(filtered.length).toBeGreaterThan(0)
      
      const sorted = sortMemosByDate(largeMemos)
      expect(sorted).toHaveLength(1000)
      expect(sorted[0].id).toBe('999') // 最新のメモ
    })

    it('Unicodeを含むメモも正しく処理する', () => {
      const unicodeMemos: Memo[] = [
        {
          id: '1',
          content: '🌟 特別なメモ 🎉\n🔥 重要な内容',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: null
        }
      ]
      
      const title = getMemoTitle(unicodeMemos[0])
      expect(title).toBe('🌟 特別なメモ 🎉')
      
      const filtered = filterMemosByQuery(unicodeMemos, '🌟')
      expect(filtered).toHaveLength(1)
    })

    it('改行文字の種類が異なっても正しく処理する', () => {
      const windowsLineEndings = 'タイトル\r\n本文内容'
      const macLineEndings = 'タイトル\r本文内容'
      const unixLineEndings = 'タイトル\n本文内容'
      
      expect(extractTitle(windowsLineEndings)).toBe('タイトル')
      expect(extractTitle(macLineEndings)).toBe('タイトル\r本文内容') // \rは分割されない
      expect(extractTitle(unixLineEndings)).toBe('タイトル')
    })
  })
})