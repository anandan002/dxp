export interface IntegrationRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export interface IntegrationResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export interface IntegrationConfig {
  name: string;
  baseUrl: string;
  authType: 'basic' | 'bearer' | 'apikey' | 'oauth2';
}

export abstract class IntegrationPort {
  abstract call(integration: string, request: IntegrationRequest): Promise<IntegrationResponse>;
  abstract listIntegrations(): Promise<IntegrationConfig[]>;
}
