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
export class PayloadAdapter extends CmsPort {
  private readonly logger = new Logger(PayloadAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('PAYLOAD_URL', 'http://localhost:5030');
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getContent(type: string, id: string): Promise<CmsContent> {
    const { data } = await this.client.get(`/${type}/${id}`);
    return this.mapContent(data);
  }

  async listContent(type: string, query: CmsContentQuery): Promise<CmsContentList> {
    const params: Record<string, unknown> = {
      page: query.page || 1,
      limit: query.pageSize || 20,
    };
    if (query.status) params['where[status][equals]'] = query.status;
    if (query.search) params['where[title][like]'] = query.search;

    const { data } = await this.client.get(`/${type}`, { params });
    return {
      data: (data.docs || []).map((doc: Record<string, unknown>) => this.mapContent(doc)),
      total: data.totalDocs || 0,
      page: data.page || 1,
      pageSize: data.limit || 20,
    };
  }

  async createContent(type: string, dto: CreateContentDto): Promise<CmsContent> {
    const { data } = await this.client.post(`/${type}`, dto);
    return this.mapContent(data.doc || data);
  }

  async publishContent(type: string, id: string): Promise<void> {
    await this.client.patch(`/${type}/${id}`, { _status: 'published' });
  }

  async deleteContent(type: string, id: string): Promise<void> {
    await this.client.delete(`/${type}/${id}`);
  }

  private mapContent(raw: Record<string, unknown>): CmsContent {
    return {
      id: String(raw.id),
      type: String(raw.collection || ''),
      title: String(raw.title || ''),
      slug: String(raw.slug || ''),
      body: (raw.content || raw.body || {}) as Record<string, unknown>,
      status: (raw._status as CmsContent['status']) || (raw.status as CmsContent['status']) || 'draft',
      publishedAt: raw.publishedAt as string | undefined,
      createdAt: String(raw.createdAt || ''),
      updatedAt: String(raw.updatedAt || ''),
    };
  }
}

