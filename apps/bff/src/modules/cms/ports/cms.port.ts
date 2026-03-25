// CMS Port — the contract that all CMS adapters must implement.
// Consumers inject CmsPort and never know which adapter is active.

export interface CmsContent {
  id: string;
  type: string;
  title: string;
  slug: string;
  body: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsContentQuery {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CmsContentList {
  data: CmsContent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContentDto {
  type: string;
  title: string;
  slug?: string;
  body: Record<string, unknown>;
}

export abstract class CmsPort {
  abstract getContent(type: string, id: string): Promise<CmsContent>;
  abstract listContent(type: string, query: CmsContentQuery): Promise<CmsContentList>;
  abstract createContent(type: string, data: CreateContentDto): Promise<CmsContent>;
  abstract publishContent(type: string, id: string): Promise<void>;
  abstract deleteContent(type: string, id: string): Promise<void>;
}
