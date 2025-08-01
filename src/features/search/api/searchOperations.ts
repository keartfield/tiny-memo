import { Memo, filterMemosByQuery } from '../../../entities/memo'

export interface SearchOperationsInterface {
  searchMemos: (query: string, memos: Memo[]) => Memo[]
  validateSearchQuery: (query: string) => boolean
}

export class SearchOperations implements SearchOperationsInterface {
  searchMemos(query: string, memos: Memo[]): Memo[] {
    return filterMemosByQuery(memos, query)
  }

  validateSearchQuery(query: string): boolean {
    return query.trim().length >= 1
  }
}

export const searchOperations = new SearchOperations()