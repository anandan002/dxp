import type { EntityBase, PaginatedResponse } from './common';

export interface CmsContent extends EntityBase {
  type: string;
  title: string;
  slug: string;
  body: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
}

export interface CmsContentQuery {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type CmsContentList = PaginatedResponse<CmsContent>;

export interface CreateCmsContentDto {
  type: string;
  title: string;
  slug?: string;
  body: Record<string, unknown>;
}
