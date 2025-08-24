import { describe, it, expect } from 'vitest'
import { getMemoTitle, getMemoPreview, isMemoEmpty, memoMatchesQuery, compareMemosByDate } from './memo'
import type { Memo } from './types'

const createMockMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: '1',
  content: '# Test Title\n\nThis is test content',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  folderId: null,
  ...overrides
})

describe('getMemoTitle', () => {
  it('見出し記法からタイトルを抽出する', () => {
    const memo = createMockMemo({
      content: '# メインタイトル\n\nこれは内容です'
    })
    
    expect(getMemoTitle(memo)).toBe('メインタイトル')
  })

  it('複数の#記号からタイトルを抽出する', () => {
    const memo = createMockMemo({
      content: '### サブタイトル\n\n内容'
    })
    
    expect(getMemoTitle(memo)).toBe('サブタイトル')
  })

  it('見出し記法がない場合、最初の行をタイトルとする', () => {
    const memo = createMockMemo({
      content: '普通のテキスト\n\n内容が続きます'
    })
    
    expect(getMemoTitle(memo)).toBe('普通のテキスト')
  })

  it('空のコンテンツの場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: ''
    })
    
    expect(getMemoTitle(memo)).toBe('')
  })

  it('空白のみのコンテンツの場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: '   \n  \n  '
    })
    
    expect(getMemoTitle(memo)).toBe('')
  })

  it('最初の行が空の場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: '\n\n実際の内容'
    })
    
    expect(getMemoTitle(memo)).toBe('')
  })

  it('見出し記法のみの場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: '###\n\n内容'
    })
    
    expect(getMemoTitle(memo)).toBe('')
  })
})

describe('getMemoPreview', () => {
  it('タイトル行以降の内容をプレビューとして返す', () => {
    const memo = createMockMemo({
      content: '# タイトル\n\n最初の段落\n2番目の段落\n3番目の段落'
    })
    
    expect(getMemoPreview(memo)).toBe('最初の段落\n2番目の段落')
  })

  it('指定された行数分のプレビューを返す', () => {
    const memo = createMockMemo({
      content: '# タイトル\n\n1行目\n2行目\n3行目\n4行目\n5行目'
    })
    
    expect(getMemoPreview(memo, 2)).toBe('1行目')
  })

  it('空のコンテンツの場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: ''
    })
    
    expect(getMemoPreview(memo)).toBe('')
  })

  it('タイトルのみの場合、空文字を返す', () => {
    const memo = createMockMemo({
      content: '# タイトルのみ'
    })
    
    expect(getMemoPreview(memo)).toBe('')
  })

  it('前後の空白を削除する', () => {
    const memo = createMockMemo({
      content: '# タイトル\n\n  プレビュー内容  \n  '
    })
    
    expect(getMemoPreview(memo)).toBe('プレビュー内容')
  })
})

describe('isMemoEmpty', () => {
  it('空のコンテンツの場合、trueを返す', () => {
    const memo = createMockMemo({
      content: ''
    })
    
    expect(isMemoEmpty(memo)).toBe(true)
  })

  it('空白のみのコンテンツの場合、trueを返す', () => {
    const memo = createMockMemo({
      content: '   \n  \t  \n  '
    })
    
    expect(isMemoEmpty(memo)).toBe(true)
  })

  it('内容があるメモの場合、falseを返す', () => {
    const memo = createMockMemo({
      content: '# タイトル\n\n内容があります'
    })
    
    expect(isMemoEmpty(memo)).toBe(false)
  })

  it('見出しのみのメモの場合、falseを返す', () => {
    const memo = createMockMemo({
      content: '# タイトルのみ'
    })
    
    expect(isMemoEmpty(memo)).toBe(false)
  })
})

describe('memoMatchesQuery', () => {
  const memo = createMockMemo({
    content: '# Reactのフック\n\nuseStateの使い方について説明します'
  })

  it('タイトルにクエリが含まれる場合、trueを返す', () => {
    expect(memoMatchesQuery(memo, 'react')).toBe(true)
    expect(memoMatchesQuery(memo, 'React')).toBe(true)
    expect(memoMatchesQuery(memo, 'フック')).toBe(true)
  })

  it('内容にクエリが含まれる場合、trueを返す', () => {
    expect(memoMatchesQuery(memo, 'useState')).toBe(true)
    expect(memoMatchesQuery(memo, '使い方')).toBe(true)
    expect(memoMatchesQuery(memo, '説明')).toBe(true)
  })

  it('クエリが含まれない場合、falseを返す', () => {
    expect(memoMatchesQuery(memo, 'Vue')).toBe(false)
    expect(memoMatchesQuery(memo, 'Angular')).toBe(false)
  })

  it('空のクエリの場合、trueを返す', () => {
    expect(memoMatchesQuery(memo, '')).toBe(true)
    expect(memoMatchesQuery(memo, '   ')).toBe(true)
  })

  it('大文字小文字を区別しない', () => {
    expect(memoMatchesQuery(memo, 'USESTATE')).toBe(true)
    expect(memoMatchesQuery(memo, 'usestate')).toBe(true)
  })

  it('部分一致で検索する', () => {
    expect(memoMatchesQuery(memo, 'use')).toBe(true)
    expect(memoMatchesQuery(memo, 'State')).toBe(true)
  })
})

describe('compareMemosByDate', () => {
  it('更新日が新しいメモが先に来る（降順）', () => {
    const olderMemo = createMockMemo({
      id: '1',
      updatedAt: new Date('2024-01-01')
    })
    
    const newerMemo = createMockMemo({
      id: '2',
      updatedAt: new Date('2024-01-02')
    })
    
    expect(compareMemosByDate(olderMemo, newerMemo)).toBeGreaterThan(0)
    expect(compareMemosByDate(newerMemo, olderMemo)).toBeLessThan(0)
  })

  it('同じ更新日の場合、0を返す', () => {
    const memo1 = createMockMemo({
      id: '1',
      updatedAt: new Date('2024-01-01')
    })
    
    const memo2 = createMockMemo({
      id: '2',
      updatedAt: new Date('2024-01-01')
    })
    
    expect(compareMemosByDate(memo1, memo2)).toBe(0)
  })

  it('メモ配列のソートが正しく動作する', () => {
    const memos = [
      createMockMemo({ id: '1', updatedAt: new Date('2024-01-01') }),
      createMockMemo({ id: '2', updatedAt: new Date('2024-01-03') }),
      createMockMemo({ id: '3', updatedAt: new Date('2024-01-02') })
    ]
    
    const sortedMemos = memos.sort(compareMemosByDate)
    
    expect(sortedMemos[0].id).toBe('2') // 2024-01-03
    expect(sortedMemos[1].id).toBe('3') // 2024-01-02
    expect(sortedMemos[2].id).toBe('1') // 2024-01-01
  })

  it('日付文字列も正しく比較する', () => {
    const memo1 = createMockMemo({
      id: '1',
      updatedAt: new Date('2024-12-31T23:59:59.999Z')
    })
    
    const memo2 = createMockMemo({
      id: '2',
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    })
    
    expect(compareMemosByDate(memo1, memo2)).toBeLessThan(0) // memo1が新しいので負の値
  })
})
