import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IntegrationPort, IntegrationRequest, IntegrationResponse, IntegrationConfig } from '../ports/integration.port';

@Injectable()
export class RestAdapter extends IntegrationPort {
  private readonly logger = new Logger(RestAdapter.name);
  private readonly integrations: Map<string, IntegrationConfig> = new Map();

  constructor(private config: ConfigService) {
    super();
    // In production: load from database or config service
    // For now, integrations are registered via env vars
    const configJson = this.config.get<string>('INTEGRATIONS_CONFIG', '[]');
    try {
      const configs: IntegrationConfig[] = JSON.parse(configJson);
      configs.forEach((c) => this.integrations.set(c.name, c));
    } catch {
      this.logger.warn('No integrations configured');
    }
  }

  async call(integrationName: string, request: IntegrationRequest): Promise<IntegrationResponse> {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      throw new NotFoundException(`Integration "${integrationName}" not found`);
    }

    this.logger.log(`Calling ${integrationName}: ${request.method} ${request.path}`);

    const response = await axios({
      method: request.method,
      url: `${integration.baseUrl}${request.path}`,
      headers: request.headers,
      data: request.body,
      params: request.queryParams,
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string>,
    };
  }

  async listIntegrations(): Promise<IntegrationConfig[]> {
    return Array.from(this.integrations.values());
  }
}
