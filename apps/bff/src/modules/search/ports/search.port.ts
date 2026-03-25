export interface SearchQuery {
  table: string;
  term: string;
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T = Record<string, unknown>> {
  hits: { id: string; score: number; source: T }[];
  total: number;
  page: number;
  pageSize: number;
}

export abstract class SearchPort {
  abstract search<T = Record<string, unknown>>(query: SearchQuery): Promise<SearchResult<T>>;
  abstract suggest(table: string, term: string, limit?: number): Promise<string[]>;
}
