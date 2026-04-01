// FhirClient — Injectable service wrapping fetch calls to a FHIR R4 server.
// All payer-domain adapters share this single client for consistent auth,
// error handling, and base-URL configuration.

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FhirBundle<T = unknown> {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  link?: { relation: string; url: string }[];
  entry?: { resource: T; fullUrl?: string }[];
}

@Injectable()
export class FhirClient {
  private readonly logger = new Logger(FhirClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('FHIR_BASE_URL', 'http://localhost:8090/fhir');
  }

  // ── CRUD operations ──────────────────────────────────────────────

  async read<T = unknown>(resourceType: string, id: string): Promise<T> {
    return this.request<T>('GET', `/${resourceType}/${id}`);
  }

  async search<T = unknown>(
    resourceType: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<FhirBundle<T>> {
    const allParams = { _total: 'accurate', ...params };
    const qs = '?' + new URLSearchParams(
      Object.entries(allParams).map(([k, v]) => [k, String(v)]),
    ).toString();
    return this.request<FhirBundle<T>>('GET', `/${resourceType}${qs}`);
  }

  async create<T = unknown>(resourceType: string, body: unknown): Promise<T> {
    return this.request<T>('POST', `/${resourceType}`, body);
  }

  async update<T = unknown>(resourceType: string, id: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', `/${resourceType}/${id}`, body);
  }

  async transaction<T = unknown>(bundle: unknown): Promise<T> {
    return this.request<T>('POST', '', bundle);
  }

  // ── Internal ─────────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
    };

    const token = this.config.get<string>('FHIR_AUTH_TOKEN');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`FHIR ${method} ${path} → ${res.status}: ${text}`);
        throw new HttpException(
          {
            code: 'FHIR_ERROR',
            message: `FHIR server returned ${res.status}`,
            detail: text,
          },
          this.mapFhirStatus(res.status),
        );
      }

      // 204 No Content
      if (res.status === 204) return undefined as T;

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`FHIR ${method} ${path} failed: ${err}`);
      throw new HttpException(
        { code: 'FHIR_UNREACHABLE', message: 'Unable to reach FHIR server' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private mapFhirStatus(status: number): number {
    if (status === 404) return HttpStatus.NOT_FOUND;
    if (status === 401 || status === 403) return HttpStatus.FORBIDDEN;
    if (status === 422) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (status >= 500) return HttpStatus.BAD_GATEWAY;
    return HttpStatus.BAD_REQUEST;
  }
}
