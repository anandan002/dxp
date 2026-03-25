export interface SearchQuery {
  index: string;
  term: string;
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  sort?: { field: string; order: 'asc' | 'desc' }[];
}

export interface SearchResult<T = Record<string, unknown>> {
  hits: SearchHit<T>[];
  total: number;
  took: number;
  page: number;
  pageSize: number;
}

export interface SearchHit<T = Record<string, unknown>> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

export interface IndexDocumentDto {
  index: string;
  id: string;
  document: Record<string, unknown>;
}
