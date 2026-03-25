import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchPort, SearchQuery, SearchResult } from '../ports/search.port';

@Injectable()
export class PostgresFtsAdapter extends SearchPort {
  private readonly logger = new Logger(PostgresFtsAdapter.name);

  constructor(private config: ConfigService) {
    super();
  }

  async search<T = Record<string, unknown>>(query: SearchQuery): Promise<SearchResult<T>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    this.logger.debug(`FTS search: table=${query.table} term="${query.term}"`);

    // In production: execute against PostgreSQL using tsvector/tsquery
    // SELECT *, ts_rank(search_vector, plainto_tsquery($1)) AS score
    // FROM ${table} WHERE search_vector @@ plainto_tsquery($1)
    // ORDER BY score DESC LIMIT $2 OFFSET $3

    return { hits: [], total: 0, page, pageSize };
  }

  async suggest(table: string, term: string, limit = 5): Promise<string[]> {
    this.logger.debug(`FTS suggest: table=${table} term="${term}"`);
    // SELECT DISTINCT title FROM ${table} WHERE title ILIKE $1 LIMIT $2
    return [];
  }
}
