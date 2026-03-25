import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  CmsPort,
  CmsContent,
  CmsContentQuery,
  CmsContentList,
  CreateContentDto,
} from '../ports/cms.port';

@Injectable()
export class StrapiAdapter extends CmsPort {
  private readonly logger = new Logger(StrapiAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('STRAPI_URL', 'http://localhost:1337');
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get<string>('STRAPI_API_TOKEN', '')}`,
      },
    });
  }

  async getContent(type: string, id: string): Promise<CmsContent> {
    const { data } = await this.client.get(`/${type}/${id}`);
    return this.mapContent(data.data);
  }

  async listContent(type: string, query: CmsContentQuery): Promise<CmsContentList> {
    const params: Record<string, unknown> = {
      'pagination[page]': query.page || 1,
      'pagination[pageSize]': query.pageSize || 20,
    };
    if (query.status) params['filters[status][$eq]'] = query.status;
    if (query.search) params['filters[title][$containsi]'] = query.search;

    const { data } = await this.client.get(`/${type}`, { params });
    return {
      data: data.data.map((item: Record<string, unknown>) => this.mapContent(item)),
      total: data.meta?.pagination?.total || 0,
      page: data.meta?.pagination?.page || 1,
      pageSize: data.meta?.pagination?.pageSize || 20,
    };
  }

  async createContent(type: string, dto: CreateContentDto): Promise<CmsContent> {
    const { data } = await this.client.post(`/${type}`, { data: dto });
    return this.mapContent(data.data);
  }

  async publishContent(type: string, id: string): Promise<void> {
    await this.client.put(`/${type}/${id}`, { data: { status: 'published', publishedAt: new Date().toISOString() } });
  }

  async deleteContent(type: string, id: string): Promise<void> {
    await this.client.delete(`/${type}/${id}`);
  }

  private mapContent(raw: Record<string, unknown>): CmsContent {
    const attrs = (raw.attributes || raw) as Record<string, unknown>;
    return {
      id: String(raw.id),
      type: String(attrs.type || ''),
      title: String(attrs.title || ''),
      slug: String(attrs.slug || ''),
      body: (attrs.body as Record<string, unknown>) || {},
      status: (attrs.status as CmsContent['status']) || 'draft',
      publishedAt: attrs.publishedAt as string | undefined,
      createdAt: String(attrs.createdAt || ''),
      updatedAt: String(attrs.updatedAt || ''),
    };
  }
}
